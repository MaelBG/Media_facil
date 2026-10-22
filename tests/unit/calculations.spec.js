import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcWeightedAvg } from '../../src/utils/calculations.js';

describe('Unidade: Regras de Cálculo de Média Ponderada (calcWeightedAvg)', () => {

  it('Deve retornar "0.0" para relatório nulo ou indefinido', () => {
    assert.equal(calcWeightedAvg(null), '0.0');
    assert.equal(calcWeightedAvg(undefined), '0.0');
  });

  it('Deve retornar "0.0" para turma zerada (sem atividades, provas ou vistos)', () => {
    const mockReport = {
      notas: [],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    assert.equal(calcWeightedAvg(mockReport), '0.0');
  });

  it('Deve calcular corretamente nota de Prova isolada com peso de 50%', () => {
    const mockReport = {
      notas: [
        { tipo: 'prova', valor_obtido: 8.0, valor_maximo: 10.0 }
      ],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    // (8.0/10.0 * 10) * 50% = 8.0 * 0.5 = 4.0
    assert.equal(calcWeightedAvg(mockReport), '4.0');
  });

  it('Deve calcular corretamente quando há apenas Vistos Semanais', () => {
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
    assert.equal(calcWeightedAvg(mockReport), '0.8');
  });

  it('Deve calcular média completa com todas as categorias preenchidas', () => {
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
    assert.equal(calcWeightedAvg(mockReport), '7.5');
  });

  it('Deve respeitar alteração nos pesos customizados da turma', () => {
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
    assert.equal(calcWeightedAvg(mockReport), '10.0');
  });

  it('Deve retornar "0.0" se todas as atividades forem excluídas da turma', () => {
    const mockReport = {
      notas: [],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    assert.equal(calcWeightedAvg(mockReport), '0.0');
  });

  it('Não deve gerar NaN em caso de valor_maximo zerado ou nota nula', () => {
    const mockReport = {
      notas: [
        { tipo: 'prova', valor_obtido: null, valor_maximo: 0 }
      ],
      vistos: [],
      turma: { pesos: { provas: 50, prova_paulista: 20, atividades: 15, vistos: 15 } }
    };
    assert.equal(calcWeightedAvg(mockReport), '0.0');
  });

});
