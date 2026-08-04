/* global process */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variáveis de ambiente do Supabase não encontradas!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  const teacherEmail = "ismaelfilho@professor.com";
  const teacherPassword = "123456";

  console.log(`Autenticando como professor ${teacherEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: teacherEmail,
    password: teacherPassword
  });

  if (authError || !authData?.user) {
    console.error("❌ Falha na autenticação do professor:", authError?.message);
    process.exit(1);
  }

  const teacherId = authData.user.id;
  console.log(`✅ Professor autenticado com sucesso! ID: ${teacherId}`);

  // Garante que existe registro na tabela public.perfis
  let { data: profProfile } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", teacherId)
    .maybeSingle();

  if (!profProfile) {
    console.log("Criando registro do professor na tabela public.perfis...");
    const { error: insErr } = await supabase
      .from("perfis")
      .upsert({
        id: teacherId,
        nome: "Prof. Ismael Filho",
        email: teacherEmail,
        tipo: "professor",
        escola: "Etec de Vila Carrão",
        semestre: "Semestre 2026.1",
        avatar_cor: "bg-primary"
      })
      .select()
      .single();

    if (insErr) {
      console.error("Erro ao criar perfil em public.perfis:", insErr.message);
    } else {
      console.log("Perfil criado na tabela public.perfis com sucesso!");
    }
  }

  // Turmas a serem criadas
  const targetClasses = [
    { nome: "2º Ano E", ano: "2026" },
    { nome: "2º Ano B", ano: "2026" },
    { nome: "3º Ano C", ano: "2026" }
  ];

  for (const c of targetClasses) {
    console.log(`\nVerificando/Criando turma: "${c.nome}"...`);
    
    const { data: existingClass } = await supabase
      .from("turmas")
      .select("*")
      .eq("professor_id", teacherId)
      .eq("nome", c.nome)
      .maybeSingle();

    if (existingClass) {
      console.log(`ℹ️ Turma "${c.nome}" já existe. ID: ${existingClass.id}`);
    } else {
      const { data: newClass, error: createError } = await supabase
        .from("turmas")
        .insert({
          nome: c.nome,
          ano: c.ano,
          professor_id: teacherId,
          pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 }
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ Erro ao criar turma "${c.nome}":`, createError.message);
        continue;
      }

      const classId = newClass.id;
      console.log(`🎉 Turma "${c.nome}" criada no Supabase! ID: ${classId}`);

      // Adiciona 4 semanas padrão para a nova turma
      await supabase
        .from("semanas_turma")
        .upsert([
          { turma_id: classId, semana: 1 },
          { turma_id: classId, semana: 2 },
          { turma_id: classId, semana: 3 },
          { turma_id: classId, semana: 4 }
        ]);
    }
  }

  console.log("\n🚀 Todas as turmas (2º Ano E, 2º Ano B, 3º Ano C) cadastradas e ativas no Supabase!");
}

seed();
