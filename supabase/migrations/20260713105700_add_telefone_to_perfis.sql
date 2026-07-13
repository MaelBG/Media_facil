-- Migração: Adicionar coluna de telefone à tabela de perfis
-- Data: 2026-07-13

-- 1. Modifica a tabela perfis para incluir a nova coluna
alter table public.perfis 
add column if not exists telefone text;

-- 2. Atualiza a função de gatilho para incluir o campo de telefone opcional vindo da metadado do Auth
create or replace function public.handle_new_user()
returns trigger
security definer
as $$
begin
  insert into public.perfis (id, nome, email, tipo, escola, semestre, avatar_cor, matricula, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'tipo', 'aluno'),
    new.raw_user_meta_data->>'escola',
    new.raw_user_meta_data->>'semestre',
    coalesce(new.raw_user_meta_data->>'avatar_cor', 'bg-primary'),
    new.raw_user_meta_data->>'matricula',
    new.raw_user_meta_data->>'telefone'
  );
  return new;
end;
$$ language plpgsql
set search_path = public, pg_temp;
