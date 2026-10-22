// Synthetic reference inputs for legacy academic calculations and flows.
// No production identifiers or student records belong in this file.

const defaultWeights = {
  provas: 50,
  prova_paulista: 20,
  atividades: 15,
  vistos: 15,
};

const report = (notas = [], vistos = [], pesos = defaultWeights) => ({
  notas,
  vistos,
  turma: { pesos },
});

export const academicReferenceFixtures = [
  {
    id: "empty-period",
    description: "No activities, grades, or weekly checkmarks exist.",
    report: report(),
    expectedCentral: "0.0",
    knownSidebarResult: "3.0",
  },
  {
    id: "real-zero",
    description: "All categories have a real recorded zero; the checkmark is false.",
    report: report(
      [
        { tipo: "prova", valor_obtido: 0, valor_maximo: 10 },
        { tipo: "prova_paulista", valor_obtido: 0, valor_maximo: 10 },
        { tipo: "atividade", valor_obtido: 0, valor_maximo: 10 },
      ],
      [{ semana: 1, status: false }],
    ),
    expectedCentral: "0.0",
  },
  {
    id: "pending-grade",
    description: "A grade row exists with null value; the central calculation currently treats it as zero.",
    report: report([{ tipo: "prova", valor_obtido: null, valor_maximo: 10 }]),
    expectedCentral: "0.0",
  },
  {
    id: "partial-9_5-of-10",
    description: "One exam is graded 9.5/10; other weighted categories have no records.",
    report: report([{ tipo: "prova", valor_obtido: 9.5, valor_maximo: 10 }]),
    expectedCentral: "4.8",
  },
  {
    id: "custom-weights",
    description: "All category scores are 10 with a non-default valid weight distribution.",
    report: report(
      [
        { tipo: "prova", valor_obtido: 10, valor_maximo: 10 },
        { tipo: "prova_paulista", valor_obtido: 10, valor_maximo: 10 },
        { tipo: "atividade", valor_obtido: 10, valor_maximo: 10 },
      ],
      [{ semana: 1, status: true }],
      { provas: 20, prova_paulista: 30, atividades: 30, vistos: 20 },
    ),
    expectedCentral: "10.0",
  },
  {
    id: "student-without-enrollment",
    description: "No report may be loaded until a valid class enrollment is established.",
    eligible: false,
    report: null,
    expectedCentral: null,
  },
  {
    id: "student-in-two-classes",
    description: "The same synthetic student has independent reports for two classes.",
    reportsByClass: {
      classA: report([{ tipo: "prova", valor_obtido: 8, valor_maximo: 10 }]),
      classB: report([{ tipo: "prova", valor_obtido: 6, valor_maximo: 10 }]),
    },
    expectedByClass: { classA: "4.0", classB: "3.0" },
    expectedCombined: null,
  },
];

export { defaultWeights };
