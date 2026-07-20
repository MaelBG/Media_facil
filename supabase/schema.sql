-- ==========================================
-- SCRIPT DE SCHEMA PARA SUPABASE
-- ==========================================

-- Habilita UUID se não estiver habilitado
create extension if not exists "uuid-ossp";

-- 1. TABELA DE PERFIS (Estende auth.users)
create table public.perfis (
    id uuid primary key references auth.users on delete cascade,
    nome text not null,
    email text not null unique,
    tipo text not null check (tipo in ('professor', 'aluno')),
    escola text,
    semestre text,
    avatar_cor text default 'bg-primary',
    matricula text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS (Row Level Security) em perfis
alter table public.perfis enable row level security;

-- 2. TABELA DE TURMAS
create table public.turmas (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    ano text not null,
    professor_id uuid not null references public.perfis(id) on delete cascade,
    pesos jsonb not null default '{"provas": 50, "prova_paulista": 20, "atividades": 15, "vistos": 15}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.turmas enable row level security;

-- 3. TABELA DE JUNÇÃO: TURMA_ALUNOS (Muitos para Muitos)
create table public.turma_alunos (
    turma_id uuid not null references public.turmas(id) on delete cascade,
    aluno_id uuid not null references public.perfis(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (turma_id, aluno_id)
);

alter table public.turma_alunos enable row level security;

-- 4. TABELA DE ATIVIDADES
create table public.atividades (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    tipo text not null check (tipo in ('atividade', 'prova', 'prova_paulista')),
    valor_maximo numeric not null default 10,
    turma_id uuid not null references public.turmas(id) on delete cascade,
    data_entrega date not null default current_date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.atividades enable row level security;

-- 5. TABELA DE NOTAS
create table public.notas (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid not null references public.perfis(id) on delete cascade,
    atividade_id uuid not null references public.atividades(id) on delete cascade,
    valor_obtido numeric check (valor_obtido >= 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (aluno_id, atividade_id)
);

alter table public.notas enable row level security;

-- 6. TABELA DE SEMANAS_TURMA
create table public.semanas_turma (
    turma_id uuid not null references public.turmas(id) on delete cascade,
    semana integer not null check (semana > 0),
    primary key (turma_id, semana)
);

alter table public.semanas_turma enable row level security;

-- 7. TABELA DE VISTOS_SEMANAIS
create table public.vistos_semanais (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid not null references public.perfis(id) on delete cascade,
    turma_id uuid not null references public.turmas(id) on delete cascade,
    semana integer not null check (semana > 0),
    status boolean not null default false,
    unique (aluno_id, turma_id, semana)
);

alter table public.vistos_semanais enable row level security;


-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ==========================================

-- FUNÇÃO AUXILIAR PARA RLS (SECURITY DEFINER PARA EVITAR RECURSÃO)
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

revoke execute on function public.is_professor(uuid) from public;
grant execute on function public.is_professor(uuid) to authenticated;

-- POLÍTICAS PARA PERFIS
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

create policy "Usuários podem atualizar seus próprios perfis"
on public.perfis for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Professores podem inserir perfis de alunos"
on public.perfis for insert
to authenticated
with check (
  public.is_professor(auth.uid())
);

-- POLÍTICAS PARA TURMAS
create policy "Professores podem gerenciar suas turmas"
on public.turmas for all
to authenticated
using (professor_id = auth.uid())
with check (professor_id = auth.uid());

create policy "Alunos podem ver turmas em que estão matriculados"
on public.turmas for select
to authenticated
using (
  id in (
    select turma_id from public.turma_alunos where aluno_id = auth.uid()
  )
);

-- POLÍTICAS PARA TURMA_ALUNOS
create policy "Professores podem gerenciar alunos de suas turmas"
on public.turma_alunos for all
to authenticated
using (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
)
with check (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
);

create policy "Alunos podem ver suas matrículas"
on public.turma_alunos for select
to authenticated
using (aluno_id = auth.uid());

-- POLÍTICAS PARA ATIVIDADES
create policy "Professores podem gerenciar atividades de suas turmas"
on public.atividades for all
to authenticated
using (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
)
with check (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
);

create policy "Alunos podem visualizar atividades de suas turmas"
on public.atividades for select
to authenticated
using (
  turma_id in (
    select turma_id from public.turma_alunos where aluno_id = auth.uid()
  )
);

-- POLÍTICAS PARA NOTAS
create policy "Professores podem gerenciar notas"
on public.notas for all
to authenticated
using (
  atividade_id in (
    select a.id from public.atividades a
    join public.turmas t on a.turma_id = t.id
    where t.professor_id = auth.uid()
  )
)
with check (
  atividade_id in (
    select a.id from public.atividades a
    join public.turmas t on a.turma_id = t.id
    where t.professor_id = auth.uid()
  )
);

create policy "Alunos podem visualizar suas próprias notas"
on public.notas for select
to authenticated
using (aluno_id = auth.uid());

-- POLÍTICAS PARA SEMANAS_TURMA
create policy "Professores podem gerenciar semanas"
on public.semanas_turma for all
to authenticated
using (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
)
with check (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
);

create policy "Alunos podem visualizar semanas"
on public.semanas_turma for select
to authenticated
using (
  turma_id in (
    select turma_id from public.turma_alunos where aluno_id = auth.uid()
  )
);

-- POLÍTICAS PARA VISTOS_SEMANAIS
create policy "Professores podem gerenciar vistos"
on public.vistos_semanais for all
to authenticated
using (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
)
with check (
  turma_id in (
    select id from public.turmas where professor_id = auth.uid()
  )
);

create policy "Alunos podem ver seus próprios vistos"
on public.vistos_semanais for select
to authenticated
using (aluno_id = auth.uid());


-- ==========================================
-- TRIGGERS E FUNÇÕES DE INTEGRAÇÃO COM AUTH
-- ==========================================

-- Função para lidar com novos usuários via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
security definer
as $$
begin
  insert into public.perfis (id, nome, email, tipo, escola, semestre, avatar_cor, matricula)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'tipo', 'aluno'),
    new.raw_user_meta_data->>'escola',
    new.raw_user_meta_data->>'semestre',
    coalesce(new.raw_user_meta_data->>'avatar_cor', 'bg-primary'),
    new.raw_user_meta_data->>'matricula'
  );
  return new;
end;
$$ language plpgsql
set search_path = public, pg_temp;

-- Trigger para criar perfil automaticamente após signup no Auth
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Revoga a execução pública da função de trigger para segurança
revoke execute on function public.handle_new_user() from public;

-- Função para limpar dados de testes E2E com segurança
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
