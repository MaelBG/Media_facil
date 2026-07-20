-- ==========================================
-- REFINAMENTO DE SEGURANÇA RLS PARA PERFIS (SEM RECURSÃO VIA FUNCTION)
-- ==========================================

-- 1. Cria a função auxiliar security definer para checar se o usuário é professor
create or replace function public.is_professor(p_user_id uuid)
returns boolean
security definer
set search_path = public, pg_temp
as $$
begin
  return exists (
    select 1 from public.perfis
    where id = p_user_id and tipo = 'professor'
  );
end;
$$ language plpgsql;

-- Revoga a execução pública por segurança, se desejar (opcional, mas recomendado)
revoke execute on function public.is_professor(uuid) from public;
grant execute on function public.is_professor(uuid) to authenticated;

-- 2. Remove as políticas antigas
drop policy if exists "Qualquer pessoa autenticada pode ler perfis" on public.perfis;
drop policy if exists "Usuários podem ver seu próprio perfil" on public.perfis;
drop policy if exists "Professores podem ver perfis de alunos de suas turmas" on public.perfis;
drop policy if exists "Alunos podem ver perfis de professores de suas turmas" on public.perfis;
drop policy if exists "Professores podem ver todos os perfis" on public.perfis;

-- 3. Cria políticas restritas de leitura (Select)
create policy "Usuários podem ver seu próprio perfil"
on public.perfis for select
to authenticated
using (auth.uid() = id);

create policy "Professores podem ver todos os perfis"
on public.perfis for select
to authenticated
using (
  public.is_professor(auth.uid())
);

-- 4. Função para limpar dados de testes E2E com segurança
create or replace function public.clean_test_data()
returns void
security definer
set search_path = public, pg_temp
as $$
begin
  -- 1. Deleta turmas com nome de E2E
  delete from public.turmas
  where nome like 'Turma E2E_%'
     or nome like 'Turma Paulista E2E_%'
     or nome like 'Turma Busca E2E_%'
     or nome like 'Turma Visto E2E_%'
     or nome like '%Editada'
     or nome like '%Editado';

  -- 2. Deleta perfis gerados por testes E2E
  delete from public.perfis
  where email like 'aluno_e2e_%'
     or email like 'aluno_visto_%'
     or email like 'aluno_paulista_%'
     or email like 'ana_maria_%'
     or email like 'carlos_silva_%';

  -- 3. Deleta usuários do auth.users (isso vai propagar via CASCADE para public.perfis)
  delete from auth.users
  where email like 'aluno_e2e_%'
     or email like 'aluno_visto_%'
     or email like 'aluno_paulista_%'
     or email like 'ana_maria_%'
     or email like 'carlos_silva_%';
end;
$$ language plpgsql;

revoke execute on function public.clean_test_data() from public;
grant execute on function public.clean_test_data() to authenticated;
