-- Application records stay behind the Next.js API. Browser roles have no access.
create extension if not exists vector with schema extensions;

create table public.linba_records (
  kind text not null check (length(kind) between 1 and 64),
  id text not null check (length(id) between 1 and 512),
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id),
  version bigint not null default 1,
  sequence bigint generated always as identity unique,
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);
create index linba_records_kind_sequence on public.linba_records(kind, sequence desc);
create unique index linba_user_email on public.linba_records(lower(data->>'email'))
  where kind='user' and coalesce(data->>'email','') <> '';
create unique index linba_presentation_code on public.linba_records((data->>'code')) where kind='course';
create unique index linba_one_team_per_user on public.linba_records((data->>'userId')) where kind='team-member';
alter table public.linba_records enable row level security;
revoke all on public.linba_records from public, anon, authenticated;
grant all on public.linba_records to service_role;
grant usage, select on sequence public.linba_records_sequence_seq to service_role;

-- Every grouped domain mutation is one database transaction. Version checks
-- prevent concurrent presentation/report edits from silently overwriting data.
create function public.linba_mutate_records(operations jsonb)
returns setof public.linba_records language plpgsql security invoker
set search_path=public as $$
declare op jsonb; affected integer; row_value public.linba_records;
begin
  if jsonb_typeof(operations) <> 'array' or jsonb_array_length(operations) > 5000 then
    raise exception 'Invalid operation batch';
  end if;
  for op in select value from jsonb_array_elements(operations) order by value->>'kind', value->>'id' loop
    if op->'data' = 'null'::jsonb then
      delete from public.linba_records r where r.kind=op->>'kind' and r.id=op->>'id'
        and (op->>'expected_version' is null or r.version=(op->>'expected_version')::bigint);
      get diagnostics affected = row_count;
      if affected=0 and op->>'expected_version' is not null then
        raise exception 'Record changed' using errcode='40001';
      end if;
    else
      insert into public.linba_records(kind,id,data) values(op->>'kind',op->>'id',op->'data')
      on conflict(kind,id) do update set data=excluded.data, version=linba_records.version+1, updated_at=now()
        where op->>'expected_version' is null or linba_records.version=(op->>'expected_version')::bigint
      returning * into row_value;
      if not found then raise exception 'Record changed' using errcode='40001'; end if;
      return next row_value;
    end if;
  end loop;
end $$;
revoke all on function public.linba_mutate_records(jsonb) from public, anon, authenticated;
grant execute on function public.linba_mutate_records(jsonb) to service_role;

create table public.linba_documents (
  course_id text primary key,
  content_hash text not null,
  generation_id uuid not null,
  status text not null check(status in ('queued','processing','ready','error','empty')),
  embedding_model text not null,
  dimensions integer not null check(dimensions=1536),
  parser_version text not null,
  page_count integer not null,
  chunk_count integer not null default 0,
  attempts integer not null default 0,
  error_code text,
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
create table public.linba_document_chunks (
  course_id text not null references public.linba_documents(course_id) on delete cascade,
  generation_id uuid not null,
  chunk_index integer not null,
  page_number integer not null,
  title text not null,
  content text not null check(length(content)>0),
  embedding extensions.vector(1536) not null,
  search_vector tsvector generated always as (to_tsvector('simple'::regconfig, title || ' ' || content)) stored,
  primary key(course_id,chunk_index)
);
create index linba_chunks_vector on public.linba_document_chunks using hnsw(embedding extensions.vector_cosine_ops);
create index linba_chunks_fts on public.linba_document_chunks using gin(search_vector);
create index linba_documents_pending on public.linba_documents(status,updated_at) where status in ('queued','processing','error');
alter table public.linba_documents enable row level security;
alter table public.linba_document_chunks enable row level security;
revoke all on public.linba_documents,public.linba_document_chunks from public,anon,authenticated;
grant all on public.linba_documents,public.linba_document_chunks to service_role;

create function public.linba_publish_document(target_course text, target_generation uuid, chunks jsonb)
returns boolean language plpgsql security invoker set search_path=public,extensions as $$
begin
  perform 1 from public.linba_documents where course_id=target_course and generation_id=target_generation and status='processing' for update;
  if not found then return false; end if;
  delete from public.linba_document_chunks where course_id=target_course;
  insert into public.linba_document_chunks(course_id,generation_id,chunk_index,page_number,title,content,embedding)
    select target_course,target_generation,(c->>'index')::integer,(c->>'page')::integer,c->>'title',c->>'content',(c->>'embedding')::extensions.vector
    from jsonb_array_elements(chunks) c;
  update public.linba_documents set status=case when jsonb_array_length(chunks)=0 then 'empty' else 'ready' end,
    chunk_count=jsonb_array_length(chunks), error_code=null, updated_at=now()
    where course_id=target_course and generation_id=target_generation;
  return true;
end $$;
revoke all on function public.linba_publish_document(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.linba_publish_document(text,uuid,jsonb) to service_role;

create function public.linba_search_document(target_course text, target_hash text, query_text text,
  query_embedding extensions.vector(1536), result_limit integer default 7)
returns table(page_number integer,title text,content text,score double precision)
language sql stable security invoker set search_path=public,extensions as $$
  with available as (
    select c.* from public.linba_document_chunks c join public.linba_documents d using(course_id)
    where c.course_id=target_course and d.content_hash=target_hash and d.status='ready' and c.generation_id=d.generation_id
  ), semantic as (
    select a.chunk_index,row_number() over(order by a.embedding <=> query_embedding) as rank,
      1-(a.embedding <=> query_embedding) as similarity
    from available a order by a.embedding <=> query_embedding limit 30
  ), keyword as (
    select a.chunk_index,row_number() over(order by ts_rank_cd(a.search_vector,websearch_to_tsquery('simple',query_text)) desc) as rank
    from available a where a.search_vector @@ websearch_to_tsquery('simple',query_text) limit 30
  ), combined as (
    select a.*,coalesce(1.0/(60+s.rank),0)+coalesce(1.0/(60+k.rank),0) as rank_score
    from available a left join semantic s using(chunk_index) left join keyword k using(chunk_index)
    where k.rank is not null or s.similarity >= 0.2
  )
  select a.page_number,a.title,a.content,a.rank_score::double precision from combined a
  order by a.rank_score desc,a.page_number,a.chunk_index limit greatest(1,least(result_limit,20));
$$;
revoke all on function public.linba_search_document(text,text,text,extensions.vector,integer) from public,anon,authenticated;
grant execute on function public.linba_search_document(text,text,text,extensions.vector,integer) to service_role;

insert into storage.buckets(id,name,public,file_size_limit)
values('linba-presentations','linba-presentations',false,31457280)
on conflict(id) do nothing;
-- No browser Storage policies: the existing API checks membership/team/display
-- permissions before streaming an object with its server credential.
