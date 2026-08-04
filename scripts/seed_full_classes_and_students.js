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

// Lista de turmas por disciplina conforme disciplinas ministradas
const TURMAS_CONFIG = [
  // SALA 2E
  { sala: "2E", nome: "2ºE - Redes de Computadores", ano: "2026" },
  { sala: "2E", nome: "2ºE - Lógica e Linguagem de Programação", ano: "2026" },
  
  // SALA 2B
  { sala: "2B", nome: "2ºB - Carreira e Competências", ano: "2026" },
  { sala: "2B", nome: "2ºB - Redes de Computadores", ano: "2026" },

  // SALA 3C
  { sala: "3C", nome: "3ºC - Programação Mobile", ano: "2026" },
  { sala: "3C", nome: "3ºC - Versionamento de Código", ano: "2026" },
  { sala: "3C", nome: "3ºC - Sistemas de Mensageria", ano: "2026" }
];

const ALUNOS_2E = [
  "ABNER HENRIQUE DOS SANTOS",
  "ANA BEATRIZ SANTOS DE MELO",
  "EMILY VITÓRIA GONTIJO",
  "EVERTON GABRIEL ALVES DA SILVA",
  "GABRIEL ALEXANDRE SILVA",
  "GEOVANNA VICTÓRIA VIEIRA DE SOUZA",
  "GUILHERME CASTALDI VALERIO",
  "GUILHERME LESSA DE ALMEIDA",
  "GUILHERME MANOJLOVIC",
  "HEITOR BOAVENTURA MASCENA",
  "HIGOR JUAN FERNANDES OLIVEIRA",
  "JHONNY SOTA FELICIONI",
  "JOAO PEDRO DA SILVA MELO",
  "JOÃO VITOR PALHARI MACIEL",
  "LUCAS DO PRADO CARMO",
  "MATEUS ALBUQUERQUE DA SILVA",
  "MAYKON HENRIQUE DE PAULA PINTO",
  "MIGUEL RICARDO DE OLIVEIRA RODRIGUES",
  "NICOLAS DOS SANTOS PEDROSO",
  "NICOLAS MONTEIRO DOS SANTOS",
  "PEDRO HENRIQUE SARMAZO REBUCCI",
  "RAFAEL FERNANDES GONÇALVES",
  "RAFAEL VINÍCIUS REINA NAVARRO",
  "RODRIGO BELINTANI LOPES",
  "RYAN BISPO DOS SANTOS",
  "SAMUEL DE MOURA JULIO FRANKE",
  "YASMIM SILVA DE SOUSA",
  "YASMIN DE SA FIRMINO"
];

const ALUNOS_2B = [
  "ANA CAROLINE GODOY DE OLIVEIRA",
  "ANA JULIA MENDES FIORAVANTI",
  "ANDRESSA OLIVEIRA PEREIRA",
  "ARTHUR VINICIUS BEZERRA DA SILVA",
  "BETINA RAZZÉ RODRIGUES",
  "CAIO HENRIQUE DA SILVA",
  "DAVI LEONI DOS SANTOS MARQUES",
  "GABRIEL FERNANDO SOUZA POLTRONIERI",
  "GABRIEL VICTOR DA SILVA JACOM",
  "GUILHERME CAMARGO DA SILVA",
  "GUSTAVO HENRIQUE CARDOSO SILVA ROCHA",
  "GUSTAVO JESUS LOUZADA",
  "IGOR BALESTRIN",
  "ISADORA RAMALHO COPELLI",
  "JOAO GABRIEL DE JESUS SANTOS",
  "JOHN GABRIEL DO NASCIMENTO CRUZ",
  "KAUA ARAUJO MENDES",
  "KAUA RIBEIRO DOS SANTOS",
  "KAUAN ARTHUR PIRES DE OLIVEIRA",
  "LARISSA GARCIA SCARELLI",
  "LUIGHI FANTUCCI RITONI",
  "MATHEUS FERREIRA VIEIRA",
  "MIGUEL FRANCISCO DE SOUZA TOLEDO TAVARES",
  "MURILLO SILVA CALIXTO",
  "NATHAN DE LIMA COSTA",
  "NICOLAS EDUARDO CASSEMIRO DE ANDRADE",
  "NICOLLAS GABRIEL FERREIRA DA SILVA",
  "PEDRO HENRIQUE GUIMARAES CARRARO",
  "RAFAELLA CARLIMBANCHI",
  "SAMUEL ESDRAS PATRICIO NASCIMENTO",
  "SARAH ESCARAVAJAL JULIATI",
  "STEPHANY VITORIA DE OLIVEIRA CAMARA",
  "TAINAN COELHO GONÇALVES",
  "VITOR HUGO SANTANA PASSOS",
  "VITORIA ANIELE DE OLIVEIRA FLORENCIO"
];

const ALUNOS_3C = [
  "ANA JÚLIA BANHE DO AMARAL",
  "BRUNO SILVA VIEIRA",
  "CARLOS EDUARDO SANTOS ALMEIDA",
  "CAUÃ GABRIEL DELEGA DELFINO",
  "ELISANDRA REIS COSTA DE ALMEIDA",
  "GABRIEL DA SILVA ARAUJO",
  "GUSTAVO LUÍS DA CUNHA",
  "JOÃO GREGORYO LAURIANO",
  "JOÃO PEDRO ALVES",
  "KAUÃ VENDRAMINI ESCOBAR",
  "LUANA GABRIELA DOS SANTOS",
  "LUÍS GABRIEL DE ARAUJO SILVA",
  "LUÍS GUILHERME PEREIRA CASALI",
  "MARIA EDUARDA ALCANTARA MEDEIROS",
  "MARIANY SOUZA SANTOS",
  "MATEUS GABRIEL OLIVEIRA TOSCHI",
  "MELISSA ISABELI FERREIRA",
  "NAYARA SEVERINO DA COSTA",
  "NICOLAS DE ARAUJO SENA",
  "NYCOLAS GABRIEL CAETANO",
  "RAFAEL FIORE FARIA",
  "RAFAEL MANZILLI MARIANO",
  "RIQUELME NEVES DOMINGUES DA SILVA",
  "SARAH BEATRIZ DOS SANTOS PEREIRA",
  "STEPHANIE KAROLYNE GONÇALVES",
  "THIAGO GONÇALVES DOS SANTOS SILVA",
  "VINÍCIUS SANTIAGO LINS",
  "WELINGTON SAMUEL GONÇALVES SILVA",
  "WELLINGTON DE OLIVEIRA FILHO"
];

function generateSlugEmail(nome, turmaPrefix) {
  const cleanName = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
  const parts = cleanName.split(" ");
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first}.${last}.${turmaPrefix.toLowerCase()}@escola.com`;
}

function generateMatricula(prefix, index) {
  const num = String(index + 1).padStart(2, "0");
  return `${prefix}${num}`;
}

async function runSeed() {
  const teacherEmail = "ismaelfilho@professor.com";
  const teacherPassword = "123456";

  console.log(`🔐 Autenticando como professor ${teacherEmail}...`);
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

  // Configura as 7 turmas específicas por disciplina
  const classMap = {};

  for (const tConfig of TURMAS_CONFIG) {
    console.log(`\n📚 Configurando turma/matéria: "${tConfig.nome}"...`);
    
    let { data: existingClass } = await supabase
      .from("turmas")
      .select("*")
      .eq("professor_id", teacherId)
      .eq("nome", tConfig.nome)
      .maybeSingle();

    if (!existingClass) {
      const { data: newClass, error: createErr } = await supabase
        .from("turmas")
        .insert({
          nome: tConfig.nome,
          ano: tConfig.ano,
          professor_id: teacherId,
          pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 }
        })
        .select()
        .single();

      if (createErr) {
        console.error(`❌ Erro ao criar turma ${tConfig.nome}:`, createErr.message);
        continue;
      }
      existingClass = newClass;
      console.log(`🎉 Turma "${tConfig.nome}" criada no Supabase! ID: ${existingClass.id}`);

      // Cria 4 semanas padrão de vistos
      await supabase
        .from("semanas_turma")
        .upsert([
          { turma_id: existingClass.id, semana: 1 },
          { turma_id: existingClass.id, semana: 2 },
          { turma_id: existingClass.id, semana: 3 },
          { turma_id: existingClass.id, semana: 4 }
        ]);
    } else {
      console.log(`ℹ️ Turma "${tConfig.nome}" ativada. ID: ${existingClass.id}`);
    }

    classMap[tConfig.nome] = existingClass.id;
  }

  // Mapeia alunos por sala
  const alunosBySala = {
    "2E": ALUNOS_2E,
    "2B": ALUNOS_2B,
    "3C": ALUNOS_3C
  };

  for (const sala of ["2E", "2B", "3C"]) {
    const rawAlunos = alunosBySala[sala];
    const turmasDaSalaIds = TURMAS_CONFIG
      .filter(t => t.sala === sala)
      .map(t => classMap[t.nome])
      .filter(Boolean);

    console.log(`\n👥 Cadastrando via RPC ${rawAlunos.length} alunos reais para a SALA ${sala}...`);

    for (let idx = 0; idx < rawAlunos.length; idx++) {
      const nomeAluno = rawAlunos[idx];
      const emailAluno = generateSlugEmail(nomeAluno, sala);
      const matriculaAluno = generateMatricula(sala, idx);

      const { data: userId, error: rpcErr } = await supabase.rpc("bulk_create_student", {
        p_nome: nomeAluno,
        p_email: emailAluno,
        p_matricula: matriculaAluno,
        p_turma_ids: turmasDaSalaIds
      });

      if (rpcErr) {
        console.error(`❌ Erro ao cadastrar aluno ${nomeAluno}:`, rpcErr.message);
      } else {
        console.log(`  ✓ Aluno [${idx + 1}/${rawAlunos.length}]: ${nomeAluno} -> Vinculado (${userId})`);
      }
    }
  }

  console.log("\n✅ CARGA COMPLETA REALIZADA COM ÉXITO NO SUPABASE!");
  console.log("Salas ativas no portal: 2E (2 matérias), 2B (2 matérias), 3C (3 matérias)");
  console.log(`Total de alunos reais vinculados: ${ALUNOS_2E.length + ALUNOS_2B.length + ALUNOS_3C.length}`);
}

runSeed();
