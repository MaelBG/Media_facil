// Funções utilitárias de cálculos de notas e médias

/**
 * Calcula a média ponderada de um aluno baseado no relatório de notas e vistos.
 * Se uma categoria não tem lançamentos, assume a pontuação máxima (10.0)
 * para não penalizar o aluno antes do início das avaliações.
 * 
 * @param {Object} report - Relatório do aluno contendo notas, vistos e dados da turma
 * @returns {string} Média final com uma casa decimal (ex: "7.5")
 */
export const calcWeightedAvg = (report) => {
  if (!report) return "0.0";
  
  // 1. Provas / Projetos
  const provas = report.notas.filter(n => n.tipo === "prova" && n.valor_obtido !== null);
  let pAvg = 0.0;
  if (provas.length > 0) {
    const somaO = provas.reduce((s, n) => s + n.valor_obtido, 0);
    const somaM = provas.reduce((s, n) => s + n.valor_maximo, 0);
    pAvg = (somaO / somaM) * 10;
  }

  // 2. Prova Paulista
  const paulista = report.notas.filter(n => n.tipo === "prova_paulista" && n.valor_obtido !== null);
  let paulistaAvg = 0.0;
  if (paulista.length > 0) {
    const somaO = paulista.reduce((s, n) => s + n.valor_obtido, 0);
    const somaM = paulista.reduce((s, n) => s + n.valor_maximo, 0);
    paulistaAvg = (somaO / somaM) * 10;
  }

  // 3. Atividades / Checklist
  const atividades = report.notas.filter(n => n.tipo === "atividade");
  let aScore = 10.0;
  if (atividades.length > 0) {
    let somaObtida = 0;
    let somaMaxima = 0;
    atividades.forEach(n => {
      if (n.valor_obtido !== null) {
        somaObtida += Number(n.valor_obtido);
      }
      somaMaxima += Number(n.valor_maximo);
    });
    aScore = somaMaxima > 0 ? (somaObtida / somaMaxima) * 10 : 10.0;
  }

  // 4. Controle de Vistos Semanais
  let vScore = 10.0;
  if (report.vistos && report.vistos.length > 0) {
    const concluidos = report.vistos.filter(v => v.status === true).length;
    vScore = (concluidos / report.vistos.length) * 10;
  }

  // 5. Pesos definidos para a turma ou pesos padrão
  const pesos = report.turma?.pesos || { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 };
  
  const finalAvg = (
    pAvg * (pesos.provas ?? 50) +
    paulistaAvg * (pesos.prova_paulista ?? 20) +
    aScore * (pesos.atividades ?? 15) +
    vScore * (pesos.vistos ?? 15)
  ) / 100;
  
  return finalAvg.toFixed(1);
};
