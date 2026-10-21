-- A deleted record must not be resurrected by a stale browser edit.
create or replace function public.linba_mutate_records(operations jsonb)
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
      if coalesce((op->>'expected_version')::bigint,0)>0 then
        perform 1 from public.linba_records r where r.kind=op->>'kind' and r.id=op->>'id'
          and r.version=(op->>'expected_version')::bigint for update;
        if not found then raise exception 'Record changed' using errcode='40001'; end if;
      end if;
      insert into public.linba_records(kind,id,data) values(op->>'kind',op->>'id',op->'data')
      on conflict(kind,id) do update set data=excluded.data, version=linba_records.version+1, updated_at=now()
        where op->>'expected_version' is null or linba_records.version=(op->>'expected_version')::bigint
      returning * into row_value;
      if not found then raise exception 'Record changed' using errcode='40001'; end if;
      return next row_value;
    end if;
  end loop;
end $$;
