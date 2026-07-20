-- ==========================================
-- REFINAMENTO DE SEGURANÇA RLS PARA PERFIS
-- ==========================================

-- 1. Remove a política antiga e insegura
drop policy if exists "Qualquer pessoa autenticada pode ler perfis" on public.perfis;

-- 2. Cria políticas restritas de leitura (Select)
create policy "Usuários podem ver seu próprio perfil"
on public.perfis for select
to authenticated
using (auth.uid() = id);

create policy "Professores podem ver perfis de alunos de suas turmas"
on public.perfis for select
to authenticated
using (
  id in (
    select ta.aluno_id from public.turma_alunos ta
    join public.turmas t on ta.turma_id = t.id
    where t.professor_id = auth.uid()
  )
);

create policy "Alunos podem ver perfis de professores de suas turmas"
on public.perfis for select
to authenticated
using (
  id in (
    select t.professor_id from public.turma_alunos ta
    join public.turmas t on ta.turma_id = t.id
    where ta.aluno_id = auth.uid()
  )
);
