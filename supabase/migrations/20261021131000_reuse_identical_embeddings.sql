-- Identical material copied into another workspace reuses vectors, but search
-- remains strictly scoped to that presentation's own chunk rows.
create function public.linba_copy_document_index(target_course text,target_generation uuid,target_hash text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare source_course text; total integer;
begin
  perform 1 from public.linba_documents where course_id=target_course and generation_id=target_generation
    and content_hash=target_hash and status='processing' for update;
  if not found then return false; end if;
  select course_id into source_course from public.linba_documents
    where content_hash=target_hash and status='ready' and course_id<>target_course limit 1;
  if source_course is null then return false; end if;
  delete from public.linba_document_chunks where course_id=target_course;
  insert into public.linba_document_chunks(course_id,generation_id,chunk_index,page_number,title,content,embedding)
    select target_course,target_generation,c.chunk_index,c.page_number,c.title,c.content,c.embedding
    from public.linba_document_chunks c join public.linba_documents d on c.course_id=d.course_id and c.generation_id=d.generation_id
    where c.course_id=source_course and d.content_hash=target_hash and d.status='ready';
  get diagnostics total=row_count;
  if total=0 then return false; end if;
  update public.linba_documents set status='ready',chunk_count=total,error_code=null,updated_at=now()
    where course_id=target_course and generation_id=target_generation;
  return true;
end $$;
revoke all on function public.linba_copy_document_index(text,uuid,text) from public,anon,authenticated;
grant execute on function public.linba_copy_document_index(text,uuid,text) to service_role;
