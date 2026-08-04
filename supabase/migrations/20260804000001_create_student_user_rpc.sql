-- Migration: Função RPC para cadastro em lote de alunos sem limitação de taxa de API Auth

create or replace function public.bulk_create_student(
  p_nome text,
  p_email text,
  p_matricula text,
  p_turma_ids uuid[]
) returns uuid
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  v_user_id uuid;
  v_turma_id uuid;
begin
  -- Busca se já existe em auth.users por email
  select id into v_user_id from auth.users where email = p_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_user_meta_data, role, aud, created_at, updated_at
    )
    values (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt('123456', gen_salt('bf')),
      now(),
      jsonb_build_object('nome', p_nome, 'tipo', 'aluno', 'matricula', p_matricula),
      'authenticated',
      'authenticated',
      now(),
      now()
    );
  end if;

  -- Garante registro na tabela public.perfis
  insert into public.perfis (id, nome, email, tipo, matricula, avatar_cor)
  values (v_user_id, p_nome, p_email, 'aluno', p_matricula, 'bg-primary')
  on conflict (id) do update set 
    nome = excluded.nome,
    matricula = excluded.matricula;

  -- Vincula a todas as turmas informadas
  if p_turma_ids is not null then
    foreach v_turma_id in array p_turma_ids loop
      insert into public.turma_alunos (turma_id, aluno_id)
      values (v_turma_id, v_user_id)
      on conflict (turma_id, aluno_id) do nothing;
    end loop;
  end if;

  return v_user_id;
end;
$$ language plpgsql;

grant execute on function public.bulk_create_student(text, text, text, uuid[]) to authenticated;
