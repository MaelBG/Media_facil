export const DEMO_DB_KEY = "media_facil_demo_db_v1";
export const LEGACY_DEMO_DB_KEY = "prof_gradebook_db";

// Acesso de demonstração é deliberadamente fictício e nunca é usado no modo cloud.
export const DEMO_QUICK_ACCESS = Object.freeze({
  professor: Object.freeze({ email: "ismaelfilho@professor.com", password: "123" }),
  aluno: Object.freeze({ email: "ana@escola.com", password: "123" }),
});

export function createDemoDatabase() {
  return {
    perfis: [
      { id: "demo-prof-1", nome: "Prof. Ismael Filho", email: DEMO_QUICK_ACCESS.professor.email, tipo: "professor", senha: DEMO_QUICK_ACCESS.professor.password, escola: "Escola de Demonstração", semestre: "Ano letivo 2026", avatar_cor: "bg-primary" },
      { id: "demo-aluno-1", nome: "Ana Silva", email: DEMO_QUICK_ACCESS.aluno.email, tipo: "aluno", senha: DEMO_QUICK_ACCESS.aluno.password, turma_id: "demo-turma-1", turma_ids: ["demo-turma-1", "demo-turma-2"], matricula: "DEMO001" },
      { id: "demo-aluno-2", nome: "Bruno Santos", email: "bruno@escola.com", tipo: "aluno", senha: "123", turma_id: "demo-turma-1", turma_ids: ["demo-turma-1"], matricula: "DEMO002" },
      { id: "demo-aluno-3", nome: "Carla Oliveira", email: "carla@escola.com", tipo: "aluno", senha: "123", turma_id: "demo-turma-1", turma_ids: ["demo-turma-1"], matricula: "DEMO003" },
      { id: "demo-aluno-4", nome: "Diego Lima", email: "diego@escola.com", tipo: "aluno", senha: "123", turma_id: "demo-turma-2", turma_ids: ["demo-turma-2"], matricula: "DEMO004" },
      { id: "demo-aluno-5", nome: "Elena Souza", email: "elena@escola.com", tipo: "aluno", senha: "123", turma_id: "demo-turma-2", turma_ids: ["demo-turma-2"], matricula: "DEMO005" },
    ],
    turmas: [
      { id: "demo-turma-1", nome: "2ºE - Redes de Computadores", ano: "2026", professor_id: "demo-prof-1", pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } },
      { id: "demo-turma-2", nome: "2ºE - Lógica e Linguagem de Programação", ano: "2026", professor_id: "demo-prof-1", pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } },
    ],
    atividades: [
      { id: "demo-at-1", titulo: "Atividade 1: Estrutura React Native", tipo: "atividade", valor_maximo: 10, turma_id: "demo-turma-1", data_entrega: "2026-05-15" },
      { id: "demo-at-2", titulo: "Prova Bimestral 1", tipo: "prova", valor_maximo: 10, turma_id: "demo-turma-1", data_entrega: "2026-05-25" },
      { id: "demo-at-3", titulo: "Atividade 2: Props e Componentes", tipo: "atividade", valor_maximo: 10, turma_id: "demo-turma-1", data_entrega: "2026-06-01" },
      { id: "demo-at-4", titulo: "Atividade 1: Lógica de Programação HTML", tipo: "atividade", valor_maximo: 10, turma_id: "demo-turma-2", data_entrega: "2026-05-14" },
      { id: "demo-at-5", titulo: "Prova Mensal de CSS", tipo: "prova", valor_maximo: 10, turma_id: "demo-turma-2", data_entrega: "2026-05-27" },
    ],
    notas: [
      { id: "demo-nota-1", aluno_id: "demo-aluno-1", atividade_id: "demo-at-1", valor_obtido: 9.5 },
      { id: "demo-nota-2", aluno_id: "demo-aluno-1", atividade_id: "demo-at-2", valor_obtido: 8 },
      { id: "demo-nota-3", aluno_id: "demo-aluno-1", atividade_id: "demo-at-3", valor_obtido: 10 },
      { id: "demo-nota-4", aluno_id: "demo-aluno-2", atividade_id: "demo-at-1", valor_obtido: 7 },
      { id: "demo-nota-5", aluno_id: "demo-aluno-2", atividade_id: "demo-at-2", valor_obtido: 6.5 },
      { id: "demo-nota-6", aluno_id: "demo-aluno-2", atividade_id: "demo-at-3", valor_obtido: 8 },
      { id: "demo-nota-7", aluno_id: "demo-aluno-3", atividade_id: "demo-at-1", valor_obtido: 8.5 },
      { id: "demo-nota-8", aluno_id: "demo-aluno-3", atividade_id: "demo-at-2", valor_obtido: 9 },
      { id: "demo-nota-9", aluno_id: "demo-aluno-3", atividade_id: "demo-at-3", valor_obtido: 7.5 },
      { id: "demo-nota-10", aluno_id: "demo-aluno-4", atividade_id: "demo-at-4", valor_obtido: 6 },
      { id: "demo-nota-11", aluno_id: "demo-aluno-4", atividade_id: "demo-at-5", valor_obtido: 5.5 },
      { id: "demo-nota-12", aluno_id: "demo-aluno-5", atividade_id: "demo-at-4", valor_obtido: 9 },
      { id: "demo-nota-13", aluno_id: "demo-aluno-5", atividade_id: "demo-at-5", valor_obtido: 9.5 },
    ],
    semanas_turma: [
      { classId: "demo-turma-1", semanas: [1, 2, 3, 4, 5] },
      { classId: "demo-turma-2", semanas: [1, 2, 3, 4] },
    ],
    vistos_semanais: [
      { aluno_id: "demo-aluno-1", class_id: "demo-turma-1", semana: 1, status: true },
      { aluno_id: "demo-aluno-2", class_id: "demo-turma-1", semana: 1, status: true },
      { aluno_id: "demo-aluno-3", class_id: "demo-turma-1", semana: 1, status: false },
      { aluno_id: "demo-aluno-1", class_id: "demo-turma-1", semana: 2, status: true },
      { aluno_id: "demo-aluno-2", class_id: "demo-turma-1", semana: 2, status: false },
      { aluno_id: "demo-aluno-3", class_id: "demo-turma-1", semana: 2, status: true },
      { aluno_id: "demo-aluno-4", class_id: "demo-turma-2", semana: 1, status: true },
      { aluno_id: "demo-aluno-5", class_id: "demo-turma-2", semana: 1, status: false },
    ],
  };
}

export function authenticateDemoUser(database, email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const profile = database.perfis.find(item =>
    item.email?.toLowerCase() === normalizedEmail && item.senha === password
  );
  if (!profile) return null;

  const publicProfile = { ...profile };
  delete publicProfile.senha;
  return publicProfile;
}

export function demoDatabaseHasValidShape(database) {
  return database !== null && typeof database === "object" &&
    ["perfis", "turmas", "atividades", "notas"].every(key => Array.isArray(database[key]));
}
