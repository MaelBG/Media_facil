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

async function setup() {
  const email = "ismaelfilho@professor.com";
  const password = "123456";

  console.log(`Verificando/Criando usuário real para ${email}...`);

  // Tenta autenticar
  const { data: signInData } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInData?.user) {
    console.log("✅ Conta já cadastrada e ativa no Supabase Auth! User ID:", signInData.user.id);
    return;
  }

  console.log("Cadastrando nova conta de professor no Supabase Auth...");
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome: "Prof. Ismael Filho",
        tipo: "professor",
        escola: "Etec de Vila Carrão",
        semestre: "Semestre 2026.1",
        avatar_cor: "bg-primary"
      }
    }
  });

  if (signUpError) {
    console.error("❌ Erro no cadastro Supabase Auth:", signUpError.message);
  } else {
    console.log("🎉 Usuário criado com sucesso no Supabase Auth!");
    console.log("ID:", signUpData.user?.id);
  }
}

setup();
