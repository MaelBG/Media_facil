-- Migration: Hardening na política de UPDATE de perfis para impedir alteração do tipo (aluno -> professor)

drop policy if exists "Usuários podem atualizar seus próprios perfis" on public.perfis;

create policy "Usuários podem atualizar seus próprios perfis"
on public.perfis for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and tipo = (select p.tipo from public.perfis p where p.id = auth.uid())
);
