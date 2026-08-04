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

  console.log(`Buscando perfil do professor: ${teacherEmail}...`);
  const { data: profProfiles, error: profError } = await supabase
    .from("perfis")
    .select("*")
    .eq("email", teacherEmail);

  if (profError || !profProfiles || profProfiles.length === 0) {
    console.error("❌ Perfil do professor não encontrado na tabela public.perfis!", profError?.message);
    process.exit(1);
  }

  const profProfile = profProfiles[0];

  const teacherId = profProfile.id;
  console.log(`✅ Professor encontrado! ID: ${teacherId}`);

  const targetClasses = [
    { nome: "2º Ano E", ano: "2026" },
    { nome: "2º Ano B", ano: "2026" },
    { nome: "3º Ano C", ano: "2026" }
  ];

  for (const c of targetClasses) {
    console.log(`\nVerificando/Criando turma: "${c.nome}"...`);
    
    // Verifica se já existe
    const { data: existingClass } = await supabase
      .from("turmas")
      .select("*")
      .eq("professor_id", teacherId)
      .eq("nome", c.nome)
      .maybeSingle();

    let classId;
    if (existingClass) {
      console.log(`ℹ️ Turma "${c.nome}" já existe. ID: ${existingClass.id}`);
      classId = existingClass.id;
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

      classId = newClass.id;
      console.log(`🎉 Turma "${c.nome}" criada com sucesso! ID: ${classId}`);

      // Adiciona 4 semanas padrão para a nova turma
      await supabase
        .from("semanas_turma")
        .insert([
          { turma_id: classId, semana: 1 },
          { turma_id: classId, semana: 2 },
          { turma_id: classId, semana: 3 },
          { turma_id: classId, semana: 4 }
        ]);
    }
  }

  console.log("\n🚀 Todas as turmas (2E, 2B, 3C) foram configuradas para o seu perfil no Supabase!");
}

seed();
