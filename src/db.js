// Serviço de Banco de Dados local/Supabase para Média Fácil
// Suporta modo híbrido: usa Supabase se chaves estiverem configuradas no .env,
// caso contrário, faz o fallback inteligente para o localStorage simulado.

import { supabase } from "./supabaseClient";
import { createClient } from "@supabase/supabase-js";

const isSupabaseConfigured = !!(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY && 
  import.meta.env.VITE_SUPABASE_URL !== "https://seu-projeto.supabase.co"
);

console.log(
  isSupabaseConfigured 
    ? "🔌 Média Fácil: Conectado ao Supabase com sucesso!" 
    : "💾 Média Fácil: Executando em modo de simulação local (localStorage)."
);

// Cliente auxiliar sem persistência de sessão para o professor cadastrar alunos sem deslogar
const tempSupabase = isSupabaseConfigured
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
  : null;

// ==========================================
// 1. BANCO DE DADOS LOCAL (FALLBACK SIMULADO)
// ==========================================

const SEED_DATA = {
  perfis: [
    { id: "prof-1", nome: "Prof. Ismael", email: "professor@escola.com", tipo: "professor", senha: "123", escola: "Etec de Vila Carrão", semestre: "Semestre 2026.1", avatar_cor: "bg-primary" },
    { id: "alu-1", nome: "Ana Silva", email: "ana@escola.com", tipo: "aluno", senha: "123", turma_id: "turma-1", turma_ids: ["turma-1", "turma-2"], matricula: "DS3A01" },
    { id: "alu-2", nome: "Bruno Santos", email: "bruno@escola.com", tipo: "aluno", senha: "123", turma_id: "turma-1", turma_ids: ["turma-1", "turma-2"], matricula: "DS3A02" },
    { id: "alu-3", nome: "Carla Oliveira", email: "carla@escola.com", tipo: "aluno", senha: "123", turma_id: "turma-1", turma_ids: ["turma-1", "turma-2"], matricula: "DS3A03" },
    { id: "alu-4", nome: "Diego Lima", email: "diego@escola.com", tipo: "aluno", senha: "123", turma_id: "turma-2", turma_ids: ["turma-2"], matricula: "INF201" },
    { id: "alu-5", nome: "Elena Souza", email: "elena@escola.com", tipo: "aluno", senha: "123", turma_id: "turma-2", turma_ids: ["turma-2"], matricula: "INF202" }
  ],
  turmas: [
    { id: "turma-1", nome: "3º Ano - Desenvolvimento de Sistemas", ano: "2026", professor_id: "prof-1" },
    { id: "turma-2", nome: "2º Ano - Informática para Internet", ano: "2026", professor_id: "prof-1" }
  ],
  atividades: [
    { id: "at-1", titulo: "Atividade 1: Estrutura React Native", tipo: "atividade", valor_maximo: 10, turma_id: "turma-1", data_entrega: "2026-05-15" },
    { id: "at-3", titulo: "Prova Bimestral 1", tipo: "prova", valor_maximo: 10, turma_id: "turma-1", data_entrega: "2026-05-25" },
    { id: "at-4", titulo: "Atividade 2: Props e Componentes", tipo: "atividade", valor_maximo: 10, turma_id: "turma-1", data_entrega: "2026-06-01" },
    { id: "at-5", titulo: "Atividade 1: Lógica de Programação HTML", tipo: "atividade", valor_maximo: 10, turma_id: "turma-2", data_entrega: "2026-05-14" },
    { id: "at-7", titulo: "Prova Mensal de CSS", tipo: "prova", valor_maximo: 10, turma_id: "turma-2", data_entrega: "2026-05-27" }
  ],
  notas: [
    { id: "n-1", aluno_id: "alu-1", atividade_id: "at-1", valor_obtido: 9.5 },
    { id: "n-3", aluno_id: "alu-1", atividade_id: "at-3", valor_obtido: 8.0 },
    { id: "n-4", aluno_id: "alu-1", atividade_id: "at-4", valor_obtido: 10.0 },
    { id: "n-5", aluno_id: "alu-2", atividade_id: "at-1", valor_obtido: 7.0 },
    { id: "n-7", aluno_id: "alu-2", atividade_id: "at-3", valor_obtido: 6.5 },
    { id: "n-8", aluno_id: "alu-2", atividade_id: "at-4", valor_obtido: 8.0 },
    { id: "n-9", aluno_id: "alu-3", atividade_id: "at-1", valor_obtido: 8.5 },
    { id: "n-11", aluno_id: "alu-3", atividade_id: "at-3", valor_obtido: 9.0 },
    { id: "n-12", aluno_id: "alu-3", atividade_id: "at-4", valor_obtido: 7.5 },
    { id: "n-13", aluno_id: "alu-4", atividade_id: "at-5", valor_obtido: 6.0 },
    { id: "n-15", aluno_id: "alu-4", atividade_id: "at-7", valor_obtido: 5.5 },
    { id: "n-16", aluno_id: "alu-5", atividade_id: "at-5", valor_obtido: 9.0 },
    { id: "n-18", aluno_id: "alu-5", atividade_id: "at-7", valor_obtido: 9.5 }
  ],
  semanas_turma: [
    { classId: "turma-1", semanas: [1, 2, 3, 4, 5] },
    { classId: "turma-2", semanas: [1, 2, 3, 4] }
  ],
  vistos_semanais: [
    { aluno_id: "alu-1", class_id: "turma-1", semana: 1, status: true },
    { aluno_id: "alu-2", class_id: "turma-1", semana: 1, status: true },
    { aluno_id: "alu-3", class_id: "turma-1", semana: 1, status: false },
    { aluno_id: "alu-1", class_id: "turma-1", semana: 2, status: true },
    { aluno_id: "alu-2", class_id: "turma-1", semana: 2, status: false },
    { aluno_id: "alu-3", class_id: "turma-1", semana: 2, status: true },
    { aluno_id: "alu-1", class_id: "turma-1", semana: 3, status: false },
    { aluno_id: "alu-2", class_id: "turma-1", semana: 3, status: false },
    { aluno_id: "alu-3", class_id: "turma-1", semana: 3, status: true },
    { aluno_id: "alu-1", class_id: "turma-1", semana: 4, status: true },
    { aluno_id: "alu-2", class_id: "turma-1", semana: 4, status: true },
    { aluno_id: "alu-3", class_id: "turma-1", semana: 4, status: false },
    { aluno_id: "alu-1", class_id: "turma-1", semana: 5, status: true },
    { aluno_id: "alu-2", class_id: "turma-1", semana: 5, status: false },
    { aluno_id: "alu-3", class_id: "turma-1", semana: 5, status: false }
  ]
};

function initializeLocalDB() {
  if (!localStorage.getItem("prof_gradebook_db")) {
    localStorage.setItem("prof_gradebook_db", JSON.stringify(SEED_DATA));
  }
}

initializeLocalDB();

function getLocalDB() {
  const db = JSON.parse(localStorage.getItem("prof_gradebook_db"));
  if (db) {
    let changed = false;
    if (!db.semanas_turma) {
      db.semanas_turma = [
        { classId: "turma-1", semanas: [1, 2, 3, 4, 5] },
        { classId: "turma-2", semanas: [1, 2, 3, 4] }
      ];
      changed = true;
    }
    if (!db.vistos_semanais) {
      db.vistos_semanais = [
        { aluno_id: "alu-1", class_id: "turma-1", semana: 1, status: true },
        { aluno_id: "alu-2", class_id: "turma-1", semana: 1, status: true },
        { aluno_id: "alu-3", class_id: "turma-1", semana: 1, status: false }
      ];
      changed = true;
    }
    if (db.turmas) {
      db.turmas.forEach(t => {
        if (!t.pesos || !Object.prototype.hasOwnProperty.call(t.pesos, "prova_paulista")) {
          t.pesos = {
            provas: t.pesos?.provas !== undefined ? Math.round(t.pesos.provas * 0.8) : 50,
            prova_paulista: 20,
            atividades: t.pesos?.atividades !== undefined ? Math.round(t.pesos.atividades * 0.75) : 15,
            vistos: t.pesos?.vistos !== undefined ? Math.round(t.pesos.vistos * 0.75) : 15
          };
          const total = t.pesos.provas + t.pesos.prova_paulista + t.pesos.atividades + t.pesos.vistos;
          if (total !== 100) {
            t.pesos.provas += (100 - total);
          }
          changed = true;
        }
      });
    }
    if (changed) {
      saveLocalDB(db);
    }
  }
  return db;
}

function saveLocalDB(db) {
  localStorage.setItem("prof_gradebook_db", JSON.stringify(db));
}


// ==========================================
// 2. CONEXÃO DE MÉTODOS (SUPABASE / LOCAL)
// ==========================================

export const dbService = {
  // Autenticação
  login: async (email, senha) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password: senha 
      });
      if (error) return { success: false, error: error.message };
      
      const { data: perfil, error: perfilError } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", data.user.id)
        .single();
        
      if (perfilError) return { success: false, error: perfilError.message };
      return { success: true, user: perfil };
    } else {
      // Local
      const db = getLocalDB();
      const usuario = db.perfis.find(p => p.email.toLowerCase() === email.toLowerCase() && p.senha === senha);
      if (usuario) {
        const sessao = { ...usuario };
        delete sessao.senha;
        localStorage.setItem("prof_gradebook_session", JSON.stringify(sessao));
        return { success: true, user: sessao };
      }
      return { success: false, error: "E-mail ou senha incorretos." };
    }
  },

  getCurrentUser: async () => {
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data: perfil } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      return perfil || null;
    } else {
      const session = localStorage.getItem("prof_gradebook_session");
      return session ? JSON.parse(session) : null;
    }
  },

  logout: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("prof_gradebook_session");
    }
  },

  // Turmas
  getClasses: async (professorId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("turmas")
        .select("*")
        .eq("professor_id", professorId)
        .order("created_at", { ascending: true });
      return data || [];
    } else {
      const db = getLocalDB();
      return db.turmas.filter(t => t.professor_id === professorId);
    }
  },

  getClassById: async (classId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("turmas")
        .select("*")
        .eq("id", classId)
        .single();
      return data || null;
    } else {
      const db = getLocalDB();
      return db.turmas.find(t => t.id === classId) || null;
    }
  },

  createClass: async (nome, ano, professorId) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("turmas")
        .insert({ nome, ano, professor_id: professorId })
        .select()
        .single();
        
      if (error) throw error;
      
      await supabase
        .from("semanas_turma")
        .insert([
          { turma_id: data.id, semana: 1 },
          { turma_id: data.id, semana: 2 },
          { turma_id: data.id, semana: 3 },
          { turma_id: data.id, semana: 4 }
        ]);
        
      return data;
    } else {
      const db = getLocalDB();
      const classId = "turma-" + Date.now();
      const newClass = {
        id: classId,
        nome,
        ano,
        professor_id: professorId,
        pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 }
      };
      db.turmas.push(newClass);
      db.semanas_turma.push({
        classId: classId,
        semanas: [1, 2, 3, 4]
      });
      saveLocalDB(db);
      return newClass;
    }
  },

  deleteClass: async (classId) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("turmas")
        .delete()
        .eq("id", classId);
      if (error) throw error;
      return { success: true };
    } else {
      const db = getLocalDB();
      db.turmas = db.turmas.filter(t => t.id !== classId);
      db.atividades = db.atividades.filter(a => a.turma_id !== classId);
      db.semanas_turma = db.semanas_turma.filter(s => s.classId !== classId);
      if (db.vistos_semanais) {
        db.vistos_semanais = db.vistos_semanais.filter(v => v.class_id !== classId);
      }
      saveLocalDB(db);
      return { success: true };
    }
  },


  // Alunos
  getStudentsByClass: async (classId) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("turma_alunos")
        .select("aluno:perfis(*)")
        .eq("turma_id", classId);
      if (error) return [];
      return data.map(item => item.aluno).filter(Boolean);
    } else {
      const db = getLocalDB();
      return db.perfis.filter(p => 
        p.tipo === "aluno" && 
        (p.turma_id === classId || (p.turma_ids && p.turma_ids.includes(classId)))
      );
    }
  },

  addStudentToClass: async (classId, nome, email, senha, matricula) => {
    if (isSupabaseConfigured) {
      // 1. Verifica se já existe perfil com esse email
      const { data: existingStudent } = await supabase
        .from("perfis")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (existingStudent) {
        if (existingStudent.tipo === "professor") {
          return { success: false, error: "Este e-mail pertence a um professor." };
        }
        
        // Associa aluno existente à turma em turma_alunos
        const { error: linkError } = await supabase
          .from("turma_alunos")
          .insert({ turma_id: classId, aluno_id: existingStudent.id });
          
        if (linkError) {
          if (linkError.code === "23505") { // Violou constraint unique
            return { success: false, error: "Este aluno já está cadastrado nesta turma/matéria." };
          }
          return { success: false, error: linkError.message };
        }
        return { success: true, student: existingStudent, exists: true };
      }

      // 2. Cria conta de autenticação via cliente sem persistência
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            tipo: "aluno",
            matricula
          }
        }
      });

      if (authError) return { success: false, error: authError.message };

      // 3. Aguarda o trigger criar o registro no banco público
      let studentProfile = null;
      for (let i = 0; i < 5; i++) {
        const { data: p } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (p) {
          studentProfile = p;
          break;
        }
        await new Promise(r => setTimeout(r, 200));
      }

      if (!studentProfile) {
        return { success: false, error: "Perfil do aluno não pôde ser criado automaticamente." };
      }

      // 4. Matricula o aluno recém-criado na turma
      await supabase
        .from("turma_alunos")
        .insert({ turma_id: classId, aluno_id: studentProfile.id });

      return { success: true, student: studentProfile, exists: false };
    } else {
      // Local
      const db = getLocalDB();
      const perfilExistente = db.perfis.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      if (perfilExistente) {
        if (perfilExistente.tipo === "professor") {
          return { success: false, error: "Este e-mail pertence a um professor." };
        }
        const ids = perfilExistente.turma_ids || (perfilExistente.turma_id ? [perfilExistente.turma_id] : []);
        if (ids.includes(classId)) {
          return { success: false, error: "Este aluno já está cadastrado nesta turma/matéria." };
        }
        ids.push(classId);
        perfilExistente.turma_ids = ids;
        if (!perfilExistente.turma_id) perfilExistente.turma_id = classId;
        saveLocalDB(db);
        
        const studentResponse = { ...perfilExistente };
        delete studentResponse.senha;
        return { success: true, student: studentResponse, exists: true };
      }

      const newStudent = {
        id: "alu-" + Date.now(),
        nome,
        email,
        tipo: "aluno",
        senha,
        turma_id: classId,
        turma_ids: [classId],
        matricula: matricula || "MAT" + Math.floor(1000 + Math.random() * 9000)
      };
      
      db.perfis.push(newStudent);
      saveLocalDB(db);
      
      const studentResponse = { ...newStudent };
      delete studentResponse.senha;
      return { success: true, student: studentResponse, exists: false };
    }
  },

  // Atividades
  getActivitiesByClass: async (classId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("atividades")
        .select("*")
        .eq("turma_id", classId)
        .order("created_at", { ascending: true });
      return data || [];
    } else {
      const db = getLocalDB();
      return db.atividades.filter(a => a.turma_id === classId);
    }
  },

  createActivity: async (classId, titulo, tipo, valorMaximo, dataEntrega) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("atividades")
        .insert({
          turma_id: classId,
          titulo,
          tipo,
          valor_maximo: Number(valorMaximo),
          data_entrega: dataEntrega || new Date().toISOString().split("T")[0]
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDB();
      const newActivity = {
        id: "at-" + Date.now(),
        titulo,
        tipo,
        valor_maximo: Number(valorMaximo),
        turma_id: classId,
        data_entrega: dataEntrega || new Date().toISOString().split("T")[0]
      };
      db.atividades.push(newActivity);
      saveLocalDB(db);
      return newActivity;
    }
  },

  updateActivity: async (activityId, titulo, valorMaximo, dataEntrega) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("atividades")
        .update({
          titulo,
          valor_maximo: Number(valorMaximo),
          data_entrega: dataEntrega || new Date().toISOString().split("T")[0]
        })
        .eq("id", activityId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const db = getLocalDB();
      const activity = db.atividades.find(a => a.id === activityId);
      if (activity) {
        activity.titulo = titulo;
        activity.valor_maximo = Number(valorMaximo);
        activity.data_entrega = dataEntrega || new Date().toISOString().split("T")[0];
        saveLocalDB(db);
        return activity;
      }
      throw new Error("Atividade não encontrada");
    }
  },

  deleteActivity: async (activityId) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("atividades")
        .delete()
        .eq("id", activityId);
      if (error) throw error;
      return { success: true };
    } else {
      const db = getLocalDB();
      db.atividades = db.atividades.filter(a => a.id !== activityId);
      db.notas = db.notas.filter(n => n.atividade_id !== activityId);
      saveLocalDB(db);
      return { success: true };
    }
  },


  // Notas
  getGradesByClass: async (classId) => {
    if (isSupabaseConfigured) {
      const { data: activities } = await supabase
        .from("atividades")
        .select("id")
        .eq("turma_id", classId);
        
      if (!activities || activities.length === 0) return [];
      const activityIds = activities.map(a => a.id);
      
      const { data: grades } = await supabase
        .from("notas")
        .select("*")
        .in("atividade_id", activityIds);
        
      return grades || [];
    } else {
      const db = getLocalDB();
      const atividades = db.atividades.filter(a => a.turma_id === classId);
      const atividadeIds = atividades.map(a => a.id);
      return db.notas.filter(n => atividadeIds.includes(n.atividade_id));
    }
  },

  saveGrade: async (alunoId, atividadeId, valorObtido) => {
    if (isSupabaseConfigured) {
      const valor = (valorObtido === "" || valorObtido === null || valorObtido === undefined) ? null : Number(valorObtido);
      if (valor === null) {
        await supabase
          .from("notas")
          .delete()
          .match({ aluno_id: alunoId, atividade_id: atividadeId });
      } else {
        await supabase
          .from("notas")
          .upsert({ 
            aluno_id: alunoId, 
            atividade_id: atividadeId, 
            valor_obtido: valor 
          }, { onConflict: "aluno_id,atividade_id" });
      }
      return { success: true };
    } else {
      const db = getLocalDB();
      const notaExistente = db.notas.find(n => n.aluno_id === alunoId && n.atividade_id === atividadeId);
      const valor = valorObtido === "" || valorObtido === null || valorObtido === undefined ? null : Number(valorObtido);

      if (notaExistente) {
        if (valor === null) {
          db.notas = db.notas.filter(n => n.id !== notaExistente.id);
        } else {
          notaExistente.valor_obtido = valor;
        }
      } else if (valor !== null) {
        db.notas.push({
          id: "n-" + Date.now() + Math.random().toString(36).substr(2, 5),
          aluno_id: alunoId,
          atividade_id: atividadeId,
          valor_obtido: valor
        });
      }
      saveLocalDB(db);
      return { success: true };
    }
  },

  // Controle de Vistos Semanais
  getWeeksByClass: async (classId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("semanas_turma")
        .select("semana")
        .eq("turma_id", classId)
        .order("semana", { ascending: true });
      if (!data || data.length === 0) return [1, 2, 3, 4];
      return data.map(w => w.semana);
    } else {
      const db = getLocalDB();
      const turmaSemanas = db.semanas_turma.find(s => s.classId === classId);
      return turmaSemanas ? turmaSemanas.semanas : [1, 2, 3, 4];
    }
  },

  addWeekToClass: async (classId) => {
    if (isSupabaseConfigured) {
      const semanas = await dbService.getWeeksByClass(classId);
      const proximaSemana = semanas.length > 0 ? Math.max(...semanas) + 1 : 1;
      await supabase
        .from("semanas_turma")
        .insert({ turma_id: classId, semana: proximaSemana });
      return proximaSemana;
    } else {
      const db = getLocalDB();
      const turmaSemanas = db.semanas_turma.find(s => s.classId === classId);
      if (turmaSemanas) {
        const proximaSemana = turmaSemanas.semanas.length > 0 
          ? Math.max(...turmaSemanas.semanas) + 1 
          : 1;
        turmaSemanas.semanas.push(proximaSemana);
        saveLocalDB(db);
        return proximaSemana;
      } else {
        db.semanas_turma.push({
          classId: classId,
          semanas: [1]
        });
        saveLocalDB(db);
        return 1;
      }
    }
  },

  deleteWeekFromClass: async (classId, semana) => {
    if (isSupabaseConfigured) {
      // 1. Deleta a semana letiva da turma
      const { error: weekError } = await supabase
        .from("semanas_turma")
        .delete()
        .match({ turma_id: classId, semana: Number(semana) });
      if (weekError) throw weekError;

      // 2. Deleta os vistos registrados para essa semana nessa turma
      const { error: vistosError } = await supabase
        .from("vistos_semanais")
        .delete()
        .match({ turma_id: classId, semana: Number(semana) });
      if (vistosError) throw vistosError;

      return { success: true };
    } else {
      const db = getLocalDB();
      const sIndex = db.semanas_turma.findIndex(s => s.classId === classId);
      if (sIndex !== -1) {
        db.semanas_turma[sIndex].semanas = db.semanas_turma[sIndex].semanas.filter(w => w !== Number(semana));
      }
      if (db.vistos_semanais) {
        db.vistos_semanais = db.vistos_semanais.filter(v => !(v.class_id === classId && v.semana === Number(semana)));
      }
      saveLocalDB(db);
      return { success: true };
    }
  },

  saveAllVistosForStudent: async (alunoId, classId, semanas, status) => {
    if (isSupabaseConfigured) {
      const records = semanas.map(semana => ({
        aluno_id: alunoId,
        turma_id: classId,
        semana: Number(semana),
        status: status
      }));
      const { error } = await supabase
        .from("vistos_semanais")
        .upsert(records, { onConflict: "aluno_id,turma_id,semana" });
      if (error) throw error;
      return { success: true };
    } else {
      const db = getLocalDB();
      if (!db.vistos_semanais) db.vistos_semanais = [];
      
      semanas.forEach(semana => {
        const index = db.vistos_semanais.findIndex(
          v => v.aluno_id === alunoId && v.class_id === classId && v.semana === Number(semana)
        );
        if (index !== -1) {
          db.vistos_semanais[index].status = status;
        } else {
          db.vistos_semanais.push({
            aluno_id: alunoId,
            class_id: classId,
            semana: Number(semana),
            status: status
          });
        }
      });
      saveLocalDB(db);
      return { success: true };
    }
  },

  getVistosByClass: async (classId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("vistos_semanais")
        .select("*")
        .eq("turma_id", classId);
      return data || [];
    } else {
      const db = getLocalDB();
      return (db.vistos_semanais || []).filter(v => v.class_id === classId);
    }
  },

  saveVistoSemanal: async (alunoId, classId, semana, status) => {
    if (isSupabaseConfigured) {
      await supabase
        .from("vistos_semanais")
        .upsert({ 
          aluno_id: alunoId, 
          turma_id: classId, 
          semana: Number(semana), 
          status: status 
        }, { onConflict: "aluno_id,turma_id,semana" });
      return { success: true };
    } else {
      const db = getLocalDB();
      if (!db.vistos_semanais) db.vistos_semanais = [];
      const vistoExistente = db.vistos_semanais.find(
        v => v.aluno_id === alunoId && v.class_id === classId && v.semana === Number(semana)
      );

      if (vistoExistente) {
        vistoExistente.status = status;
      } else {
        db.vistos_semanais.push({
          aluno_id: alunoId,
          class_id: classId,
          semana: Number(semana),
          status: status
        });
      }
      saveLocalDB(db);
      return { success: true };
    }
  },

  updateClassWeights: async (classId, pesos) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("turmas")
        .update({ pesos })
        .eq("id", classId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, pesos: data.pesos };
    } else {
      const db = getLocalDB();
      const turma = db.turmas.find(t => t.id === classId);
      if (turma) {
        turma.pesos = {
          provas: Number(pesos.provas ?? 50),
          prova_paulista: Number(pesos.prova_paulista ?? 20),
          atividades: Number(pesos.atividades ?? 15),
          vistos: Number(pesos.vistos ?? 15)
        };
        saveLocalDB(db);
        return { success: true, pesos: turma.pesos };
      }
      return { success: false, error: "Turma não encontrada." };
    }
  },

  // Painel do Aluno
  getStudentReport: async (alunoId, targetClassId) => {
    if (isSupabaseConfigured) {
      const { data: profile } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", alunoId)
        .single();
        
      if (!profile) return null;
      
      const { data: studentClasses } = await supabase
        .from("turma_alunos")
        .select("turma:turmas(*)")
        .eq("aluno_id", alunoId);
        
      const classes = (studentClasses || []).map(sc => sc.turma).filter(Boolean);
      const activeClassId = targetClassId || profile.turma_id || (classes[0]?.id) || null;
      if (!activeClassId) return null;
      
      const { data: activeClass } = await supabase
        .from("turmas")
        .select("*")
        .eq("id", activeClassId)
        .single();
        
      if (!activeClass) return null;
      
      const { data: professor } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", activeClass.professor_id)
        .single();
        
      const { data: activities } = await supabase
        .from("atividades")
        .select("*")
        .eq("turma_id", activeClassId);
        
      const { data: studentGrades } = await supabase
        .from("notas")
        .select("*")
        .eq("aluno_id", alunoId);
        
      const reportNotas = (activities || []).map(at => {
        const grade = (studentGrades || []).find(g => g.atividade_id === at.id);
        return {
          atividade_id: at.id,
          titulo: at.titulo,
          tipo: at.tipo,
          valor_maximo: at.valor_maximo,
          valor_obtido: grade ? grade.valor_obtido : null,
          data_entrega: at.data_entrega
        };
      });
      
      const weeks = await dbService.getWeeksByClass(activeClassId);
      const { data: studentVistos } = await supabase
        .from("vistos_semanais")
        .select("*")
        .eq("aluno_id", alunoId)
        .eq("turma_id", activeClassId);
        
      const reportVistos = weeks.map(sem => {
        const visto = (studentVistos || []).find(v => v.semana === sem);
        return {
          semana: sem,
          status: visto ? visto.status : false
        };
      });
      
      return {
        aluno: profile,
        turma: activeClass,
        notas: reportNotas,
        vistos: reportVistos,
        materias: classes,
        activeClassId,
        professor: professor ? { nome: professor.nome, escola: professor.escola, semestre: professor.semestre } : null
      };
    } else {
      // Local
      const db = getLocalDB();
      const aluno = db.perfis.find(p => p.id === alunoId);
      if (!aluno) return null;

      const activeClassId = targetClassId || aluno.turma_id;
      const turma = db.turmas.find(t => t.id === activeClassId);
      if (!turma) return null;

      const atividades = db.atividades.filter(a => a.turma_id === activeClassId);
      const notas = db.notas.filter(n => n.aluno_id === alunoId);

      const reportNotas = atividades.map(at => {
        const nota = notas.find(n => n.atividade_id === at.id);
        return {
          atividade_id: at.id,
          titulo: at.titulo,
          tipo: at.tipo,
          valor_maximo: at.valor_maximo,
          valor_obtido: nota ? nota.valor_obtido : null,
          data_entrega: at.data_entrega
        };
      });

      const semanas = db.semanas_turma.find(s => s.classId === activeClassId)?.semanas || [];
      const vistos = db.vistos_semanais ? db.vistos_semanais.filter(v => v.aluno_id === alunoId && v.class_id === activeClassId) : [];

      const reportVistos = semanas.map(sem => {
        const visto = vistos.find(v => v.semana === sem);
        return {
          semana: sem,
          status: visto ? visto.status : false
        };
      });

      const ids = aluno.turma_ids || (aluno.turma_id ? [aluno.turma_id] : []);
      const materias = db.turmas.filter(t => ids.includes(t.id));
      const professor = db.perfis.find(p => p.id === turma.professor_id);

      return {
        aluno,
        turma,
        notas: reportNotas,
        vistos: reportVistos,
        materias,
        activeClassId,
        professor: professor ? { nome: professor.nome, escola: professor.escola, semestre: professor.semestre } : null
      };
    }
  },

  updateProfile: async (userId, data) => {
    if (isSupabaseConfigured) {
      // Se houver alteração de senha, atualiza no Supabase Auth
      if (data.senha && data.senha !== "******") {
        const { error: authError } = await supabase.auth.updateUser({ 
          password: data.senha 
        });
        if (authError) return { success: false, error: authError.message };
      }

      // Dados para atualizar na tabela pública de perfis
      const profileData = { ...data };
      delete profileData.senha; // A senha não é persistida na tabela pública

      const { data: profile, error } = await supabase
        .from("perfis")
        .update(profileData)
        .eq("id", userId)
        .select()
        .single();
        
      if (error) return { success: false, error: error.message };
      return { success: true, user: profile };
    } else {
      // Local
      const db = getLocalDB();
      const index = db.perfis.findIndex(p => p.id === userId);
      if (index === -1) return { success: false, error: "Usuário não encontrado." };
      
      if (data.email && db.perfis.some(p => p.id !== userId && p.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, error: "Este e-mail já está sendo utilizado por outro usuário." };
      }

      db.perfis[index] = {
        ...db.perfis[index],
        ...data
      };
      saveLocalDB(db);

      const session = localStorage.getItem("prof_gradebook_session");
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.id === userId) {
          const updatedSession = { ...db.perfis[index] };
          delete updatedSession.senha;
          localStorage.setItem("prof_gradebook_session", JSON.stringify(updatedSession));
        }
      }

      const updatedUser = { ...db.perfis[index] };
      delete updatedUser.senha;
      return { success: true, user: updatedUser };
    }
  },

  getUserPassword: async (userId) => {
    if (isSupabaseConfigured) {
      // No Supabase, as senhas são confidenciais. Retornamos um placeholder
      return "******";
    } else {
      const db = getLocalDB();
      const user = db.perfis.find(p => p.id === userId);
      return user ? user.senha : "";
    }
  },

  updateClass: async (classId, nome, ano) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("turmas")
        .update({ nome, ano })
        .eq("id", classId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, class: data };
    } else {
      const db = getLocalDB();
      const turma = db.turmas.find(t => t.id === classId);
      if (turma) {
        turma.nome = nome;
        turma.ano = ano;
        saveLocalDB(db);
        return { success: true, class: turma };
      }
      return { success: false, error: "Turma não encontrada." };
    }
  },

  removeStudentFromClass: async (classId, studentId) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("turma_alunos")
        .delete()
        .match({ turma_id: classId, aluno_id: studentId });
      if (error) throw error;
      return { success: true };
    } else {
      const db = getLocalDB();
      const student = db.perfis.find(p => p.id === studentId);
      if (student) {
        if (student.turma_ids) {
          student.turma_ids = student.turma_ids.filter(id => id !== classId);
        }
        if (student.turma_id === classId) {
          student.turma_id = student.turma_ids && student.turma_ids.length > 0 ? student.turma_ids[0] : null;
        }
        saveLocalDB(db);
      }
      return { success: true };
    }
  },

  updateStudentInfo: async (studentId, data) => {
    if (isSupabaseConfigured) {
      const { data: updated, error } = await supabase
        .from("perfis")
        .update({
          nome: data.nome,
          email: data.email,
          matricula: data.matricula
        })
        .eq("id", studentId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, student: updated };
    } else {
      const db = getLocalDB();
      const student = db.perfis.find(p => p.id === studentId);
      if (student) {
        student.nome = data.nome;
        student.email = data.email;
        student.matricula = data.matricula;
        saveLocalDB(db);
        return { success: true, student };
      }
      return { success: false, error: "Aluno não encontrado." };
    }
  }
};
