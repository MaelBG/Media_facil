import { test, expect } from '@playwright/test';
import { calcWeightedAvg } from '../../src/utils/calculations.js';

test.describe('Unidade: Regras de Cálculo de Média Ponderada (calcWeightedAvg)', () => {

  test('Deve retornar "0.0" para relatório nulo ou indefinido', () => {
    expect(calcWeightedAvg(null)).toBe('0.0');
    expect(calcWeightedAvg(undefined)).toBe('0.0');
  });

  test('Deve retornar "0.0" para turma zerada (sem atividades, provas ou vistos)', () => {
    const mockReport = {
      notas: [],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    expect(calcWeightedAvg(mockReport)).toBe('0.0');
  });

  test('Deve calcular corretamente nota de Prova isolada com peso de 50%', () => {
    const mockReport = {
      notas: [
        { tipo: 'prova', valor_obtido: 8.0, valor_maximo: 10.0 }
      ],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    // (8.0/10.0 * 10) * 50% = 8.0 * 0.5 = 4.0
    expect(calcWeightedAvg(mockReport)).toBe('4.0');
  });

  test('Deve calcular corretamente quando há apenas Vistos Semanais', () => {
    const mockReport = {
      notas: [],
      vistos: [
        { semana: 1, status: true },
        { semana: 2, status: true },
        { semana: 3, status: false },
        { semana: 4, status: false }
      ], // 2/4 vistos (50%) -> 5.0 no visto
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    // 5.0 * 15% = 0.75 -> 0.8
    expect(calcWeightedAvg(mockReport)).toBe('0.8');
  });

  test('Deve calcular média completa com todas as categorias preenchidas', () => {
    const mockReport = {
      notas: [
        { tipo: 'prova', valor_obtido: 8.0, valor_maximo: 10.0 }, // 8.0 -> 8 * 0.5 = 4.0
        { tipo: 'prova_paulista', valor_obtido: 6.0, valor_maximo: 10.0 }, // 6.0 -> 6 * 0.2 = 1.2
        { tipo: 'atividade', valor_obtido: 10.0, valor_maximo: 10.0 } // 10.0 -> 10 * 0.15 = 1.5
      ],
      vistos: [
        { semana: 1, status: true },
        { semana: 2, status: true },
        { semana: 3, status: false },
        { semana: 4, status: false }
      ], // 5.0 -> 5 * 0.15 = 0.75
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    // Soma = 4.0 + 1.2 + 1.5 + 0.75 = 7.45 -> 7.5
    expect(calcWeightedAvg(mockReport)).toBe('7.5');
  });

  test('Deve respeitar alteração nos pesos customizados da turma', () => {
    const mockReport = {
      notas: [
        { tipo: 'prova', valor_obtido: 10.0, valor_maximo: 10.0 },
        { tipo: 'prova_paulista', valor_obtido: 10.0, valor_maximo: 10.0 },
        { tipo: 'atividade', valor_obtido: 10.0, valor_maximo: 10.0 }
      ],
      vistos: [
        { semana: 1, status: true }
      ],
      turma: { pesos: { provas: 30, prova_paulista: 30, atividades: 30, vistos: 10 } }
    };
    // (10*0.3) + (10*0.3) + (10*0.3) + (10*0.1) = 3 + 3 + 3 + 1 = 10.0
    expect(calcWeightedAvg(mockReport)).toBe('10.0');
  });

  test('Deve retornar "0.0" se todas as atividades forem excluídas da turma', () => {
    const mockReport = {
      notas: [],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    expect(calcWeightedAvg(mockReport)).toBe('0.0');
  });

  test('Não deve gerar NaN em caso de valor_maximo zerado ou nota nula', () => {
    const mockReport = {
      notas: [
        { tipo: 'prova', valor_obtido: null, valor_maximo: 0 }
      ],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    expect(calcWeightedAvg(mockReport)).toBe('0.0');
  });

});
