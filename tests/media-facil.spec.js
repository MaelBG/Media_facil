/* global process */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis do .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

test.describe('Portal Acadêmico - Média Fácil', () => {
  
  test.beforeEach(async ({ page }) => {
    // Acessa a página de login
    await page.goto('/');
  });

  test.afterEach(async () => {
    // Limpeza obrigatória do banco de dados após cada teste (deleta turmas e alunos de E2E)
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        // Autentica como professor para poder rodar a função
        const { data } = await supabase.auth.signInWithPassword({
          email: 'professor@escola.com',
          password: '123'
        });
        if (data?.session) {
          await supabase.rpc('clean_test_data');
        }
      } catch (err) {
        console.error('Erro na limpeza pós-teste:', err);
      }
    }
  });

  test('Deve exibir erro ao tentar logar com credenciais inválidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'login_errado@escola.com');
    await page.fill('input[type="password"]', 'senha_errada');
    await page.click('button[type="submit"]');

    // Verifica se a mensagem de erro está visível (mensagem do Supabase em inglês ou pt-br)
    const errorBanner = page.locator('div[class*="bg-error-container"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner.locator('text=Invalid login credentials').or(errorBanner.locator('text=E-mail ou senha incorretos'))).toBeVisible();
  });

  test('Deve abrir perfil do Professor, alterar cor do avatar e validar reatividade', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'professor@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // Abre configurações de perfil
    await page.locator('[title="Configurações de Perfil"]').click();
    await expect(page.locator('h1')).toContainText('Configurações de Perfil');

    // Seleciona a cor do perfil (Ocean Teal)
    await page.locator('button[title="Ocean Teal"]').click();
    // Verifica se a pré-visualização de tamanho w-24 atualizou para bg-secondary
    await expect(page.locator('div[class*="w-24"]').first()).toHaveClass(/bg-secondary/);

    // Restaura a cor padrão (Serenity Blue)
    await page.locator('button[title="Serenity Blue"]').click();
    await expect(page.locator('div[class*="w-24"]').first()).toHaveClass(/bg-primary/);
  });

  test('Deve logar como Professor e realizar fluxo completo de Turma, Alunos, Provas e Vistos', async ({ page }) => {
    // 1. LOGIN
    await page.fill('input[type="email"]', 'professor@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // Verifica se entrou no dashboard do professor
    await expect(page.locator('h1')).toContainText('Olá,');

    // 2. CRIAÇÃO DE TURMA
    await page.click('button:has-text("Nova Turma")');
    const classIdName = `Turma E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: 3º Ano - Técnico em DS"]', classIdName);
    await page.fill('input[placeholder="2026"]', '2026');
    await page.click('button:has-text("Criar Turma")');

    // Confirma se a turma foi criada e aparece na lista como cabeçalho de card
    const classCardHeader = page.locator('h3', { hasText: classIdName }).first();
    await expect(classCardHeader).toBeVisible();

    // 3. EDITAR NOME DA TURMA
    // Encontra o card da turma, passa o mouse para aparecer os botões de ação
    const classCard = page.locator('div.group', { hasText: classIdName }).first();
    await classCard.hover();
    
    // Clica no botão de editar (ícone lápis) no card
    await classCard.locator('button[title="Editar Turma"]').click();
    const updatedClassName = `${classIdName} Editada`;
    const editClassModal = page.locator('div.fixed', { has: page.locator('h3', { hasText: 'Editar Turma' }) });
    await editClassModal.locator('input[type="text"]').first().fill(updatedClassName);
    await editClassModal.locator('button:has-text("Salvar Alterações")').click();

    // Verifica se atualizou o nome no card
    const updatedCardHeader = page.locator('h3', { hasText: updatedClassName }).first();
    await expect(updatedCardHeader).toBeVisible();

    // 4. ACESSAR A TURMA E CADASTRAR ALUNO
    // Clica no card da turma modificada para abrir o diário de classe
    await page.click(`text=${updatedClassName}`);
    await expect(page.locator('h1')).toContainText(updatedClassName);

    // Cadastra aluno
    await page.click('button:has-text("Cadastrar Aluno")');
    const studentMatricula = `RM${Date.now().toString().slice(-6)}`;
    const studentName = `Aluno E2E_${Date.now()}`;
    const studentEmail = `aluno_e2e_${Date.now()}@escola.com`;
    
    await page.fill('input[placeholder="Ex: Ana Clara"]', studentName);
    await page.fill('input[placeholder="DS3A99"]', studentMatricula);
    await page.fill('input[placeholder="Ex: ana@escola.com"]', studentEmail);
    await page.fill('input[placeholder="Ex: 123"]', '123456'); // Senha válida de 6 dígitos para o Supabase
    await page.click('button:has-text("Salvar Cadastro")');

    // Confirma que o aluno foi adicionado à tabela
    await expect(page.locator(`text=${studentName}`)).toBeVisible();

    // 5. EDITAR DADOS DO ALUNO
    const studentRow = page.locator('tr', { hasText: studentName }).first();
    await studentRow.hover();
    await studentRow.locator('button[title="Editar Aluno"]').click();

    const editedStudentName = `${studentName} Modificado`;
    const editStudentModal = page.locator('div.fixed', { has: page.locator('h3', { hasText: 'Editar Dados do Aluno' }) });
    await editStudentModal.locator('input[type="text"]').first().fill(editedStudentName);
    await editStudentModal.locator('button:has-text("Salvar Alterações")').click();

    // Confirma que o nome foi alterado
    await expect(page.locator(`text=${editedStudentName}`)).toBeVisible();

    // 6. MODIFICAR PESOS E VERIFICAR RECALCULO DE MÉDIA
    await page.locator('button:has-text("Pesos: Provas/Projetos")').click();
    await page.locator('label:has-text("Peso das Provas / Projetos (%)") + input').fill('40');
    await page.locator('label:has-text("Peso da Prova Paulista (%)") + input').fill('30');
    await page.locator('label:has-text("Peso das Atividades (%)") + input').fill('15');
    await page.locator('label:has-text("Peso dos Vistos do Caderno (%)") + input').fill('15');
    await page.click('button:has-text("Salvar Pesos")');
    
    // Confirma alteração no banner de pesos
    await expect(page.locator('button:has-text("Pesos: Provas/Projetos")')).toContainText('Provas/Projetos (40%)');

    // 7. LANÇAMENTO DE NOTA (PROVA)
    await page.click('button:has-text("Provas / Projetos (0 a 10)")');
    await page.click('button:has-text("Nova Prova / Projeto")');
    const examTitle = `Prova E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: Prova Bimestral I"]', examTitle);
    await page.fill('input[type="number"]', '10');
    await page.click('button:has-text("Criar Coluna")');

    // Verifica que a coluna da prova está visível na planilha de Provas
    await expect(page.locator(`th:has-text("${examTitle}")`)).toBeVisible();

    // Lança nota 8.0 para o aluno
    const editedStudentRow = page.locator('tr', { hasText: editedStudentName }).first();
    const gradeInput = editedStudentRow.locator('input[placeholder="--"]').first();
    await gradeInput.fill('8.0');
    await page.waitForTimeout(350); // Aguarda autosalvamento

    // Abre a aba do boletim geral para ver a média final recalculada
    await page.click('button:has-text("Visão Geral & Boletim")');
    const boletimStudentRow = page.locator('tr', { hasText: editedStudentName }).first();
    // Confirma a média final recalculada:
    // (8.0 obtidos de 10.0 máx nas Provas * Peso 40%) -> 3.2
    // (Atividades zeradas/sem itens padrão = 10.0 * Peso 15%) -> 1.5
    // Média ponderada esperada: 4.7
    await expect(boletimStudentRow.locator('span[class*="text-primary"]').first()).toContainText('4.7');

    // 8. ENTREGA DE ATIVIDADES (CHECKLIST)
    await page.click('button:has-text("Entrega de Atividades (Checklist)")');
    await page.click('button:has-text("Nova Atividade")');
    const activityTitle = `Atividade E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: Atividade 2 - Prática React"]', activityTitle);
    await page.click('button:has-text("Criar Coluna")');

    // Verifica na planilha de atividades
    const activityRow = page.locator('tr', { hasText: editedStudentName }).first();
    await expect(page.locator(`th:has-text("${activityTitle}")`)).toBeVisible();

    // Marca o checkbox de entrega (usamos click() para evitar o erro de reatividade de check() no React)
    await activityRow.locator('input[type="checkbox"]').first().click();
    await page.waitForTimeout(350); // Aguarda autosalvamento

    // 9. EDITA E EXCLUI A AVALIAÇÃO (PROVA)
    await page.click('button:has-text("Provas / Projetos (0 a 10)")');
    const examHeader = page.locator(`th:has-text("${examTitle}")`).first();
    await examHeader.hover();
    await examHeader.locator('button[title="Editar Prova"]').click();

    const editedExamTitle = `${examTitle} Editada`;
    const editActivityModal = page.locator('div.fixed', { has: page.locator('h3', { hasText: 'Editar Prova / Avaliação' }) });
    await editActivityModal.locator('input[type="text"]').first().fill(editedExamTitle);
    await editActivityModal.locator('button:has-text("Salvar Alterações")').click();
    await expect(page.locator(`th:has-text("${editedExamTitle}")`)).toBeVisible();

    // Exclui a prova
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Deseja realmente excluir');
      await dialog.accept();
    });
    const updatedExamHeader = page.locator(`th:has-text("${editedExamTitle}")`).first();
    await updatedExamHeader.hover();
    await updatedExamHeader.locator('button[title="Excluir Prova"]').click();

    // Confirma que a coluna da prova sumiu
    await expect(page.locator(`th:has-text("${editedExamTitle}")`)).not.toBeVisible();

    // 10. CONTROLE DE VISTOS
    await page.click('button:has-text("Controle de Vistos Semanais")');
    
    // Adiciona uma semana
    const initialWeeksCount = await page.locator('th:has-text("Semana")').count();
    await page.click('button:has-text("Adicionar Semana")');
    
    // Espera até que a nova coluna de semana seja renderizada no DOM dinamicamente
    await expect(page.locator(`th:has-text("Semana ${initialWeeksCount + 1}")`)).toBeVisible();

    // Exclui a semana adicionada
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Deseja realmente excluir a Semana');
      await dialog.accept();
    });
    const lastWeekHeader = page.locator('th[class*="group"]:has-text("Semana")').last();
    await lastWeekHeader.hover();
    await lastWeekHeader.locator('button[title^="Excluir Semana"]').click();
    await page.waitForTimeout(300);

    // 11. REMOVER ALUNO DA TURMA
    // Vai para a aba boletim
    await page.click('button:has-text("Visão Geral & Boletim")');
    const studentCellInBoletim = page.locator('tr', { hasText: editedStudentName }).first();
    await studentCellInBoletim.hover();
    
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Deseja realmente remover o aluno');
      await dialog.accept();
    });
    await studentCellInBoletim.locator('button[title="Remover da Turma"]').click();

    // Verifica que o aluno não está mais na tabela
    await expect(page.locator(`text=${editedStudentName}`)).not.toBeVisible();

    // 12. EXCLUSÃO DA TURMA (SEGURA COM DIGITAÇÃO)
    // Volta para o Dashboard
    await page.click('aside button:has-text("Turmas")');
    await expect(page.locator('h1')).toContainText('Olá,');

    // Clica para excluir
    const updatedClassCard = page.locator(`div.group:has-text("${updatedClassName}")`).first();
    await updatedClassCard.hover();
    await updatedClassCard.locator('button[title="Excluir Turma"]').click();

    // Tenta submeter confirmação errada
    await page.fill('input[placeholder="Digite o nome da turma para confirmar"]', 'NOME ERRADO');
    const deleteButton = page.locator('button:has-text("Excluir Permanentemente")');
    await expect(deleteButton).toBeDisabled();

    // Preenche com o nome correto
    await page.fill('input[placeholder="Digite o nome da turma para confirmar"]', updatedClassName);
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    // Confirma que a turma sumiu da lista do Dashboard
    await expect(page.locator('h3', { hasText: updatedClassName }).first()).not.toBeVisible();
  });

  test('Deve logar como Aluno, visualizar progresso geral, testar alteração de cor de perfil e deslogar', async ({ page }) => {
    // 1. LOGIN ALUNO
    await page.fill('input[type="email"]', 'ana@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    // Verifica se carregou o portal do aluno
    await expect(page.locator('h1')).toContainText('Meu Progresso');
    await expect(page.locator('text=RM: DS3A01')).toBeVisible();

    // 2. EDITA CONFIGURAÇÃO DE PERFIL DO ALUNO
    await page.locator('[title="Configurações de Perfil"]').click();
    await expect(page.locator('h1')).toContainText('Configurações de Perfil');

    // Altera a cor do avatar do perfil para Serenity Blue
    await page.locator('button[title="Serenity Blue"]').click();
    // Verifica se a pré-visualização de tamanho w-24 atualizou para bg-primary
    await expect(page.locator('div[class*="w-24"]').first()).toHaveClass(/bg-primary/);

    // Restaura a cor padrão (Ocean Teal bg-secondary)
    await page.locator('button[title="Ocean Teal"]').click();
    await expect(page.locator('div[class*="w-24"]').first()).toHaveClass(/bg-secondary/);

    // Volta para o progresso do aluno
    await page.locator('aside button:has-text("Meu Progresso")').click();

    // 3. LOGOUT
    const logoutBtn = page.locator('aside button:has-text("Sair da Conta")').first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click({ force: true });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Deve logar como Professor, navegar pelo painel e realizar logout com sucesso', async ({ page }) => {
    await page.fill('input[type="email"]', 'professor@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    await expect(page.locator('h1')).toContainText('Olá,');

    const logoutBtn = page.locator('aside button:has-text("Sair da Conta")').first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click({ force: true });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Deve marcar visto de caderno para um aluno e persistir alteração', async ({ page }) => {
    await page.fill('input[type="email"]', 'professor@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    await page.click('button:has-text("Nova Turma")');
    const classIdName = `Turma Visto E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: 3º Ano - Técnico em DS"]', classIdName);
    await page.fill('input[placeholder="2026"]', '2026');
    await page.click('button:has-text("Criar Turma")');

    await page.click(`text=${classIdName}`);

    await page.click('button:has-text("Cadastrar Aluno")');
    const studentMatricula = `RM${Date.now().toString().slice(-6)}`;
    const studentName = `Aluno Visto E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: Ana Clara"]', studentName);
    await page.fill('input[placeholder="DS3A99"]', studentMatricula);
    await page.fill('input[placeholder="Ex: ana@escola.com"]', `aluno_visto_${Date.now()}@escola.com`);
    await page.fill('input[placeholder="Ex: 123"]', '123456');
    await page.click('button:has-text("Salvar Cadastro")');
    await expect(page.locator(`text=${studentName}`)).toBeVisible();

    await page.click('button:has-text("Controle de Vistos Semanais (Caderno)")');
    await page.click('button:has-text("Adicionar Semana")');
    await expect(page.locator('th:has-text("Semana 1")')).toBeVisible();

    const studentRow = page.locator('tr', { hasText: studentName }).first();
    const checkbox = studentRow.locator('input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForTimeout(400);

    await page.click('button:has-text("Visão Geral & Boletim")');
    await page.click('button:has-text("Controle de Vistos Semanais (Caderno)")');
    await expect(checkbox).toBeChecked();

    await page.click('button:has-text("Visão Geral & Boletim")');
    const studentCellInBoletim = page.locator('tr', { hasText: studentName }).first();
    await studentCellInBoletim.hover();
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await studentCellInBoletim.locator('button[title="Remover da Turma"]').click();

    await page.click('aside button:has-text("Turmas")');
    const classCard = page.locator(`div.group:has-text("${classIdName}")`).first();
    await classCard.hover();
    await classCard.locator('button[title="Excluir Turma"]').click();
    await page.fill('input[placeholder="Digite o nome da turma para confirmar"]', classIdName);
    await page.click('button:has-text("Excluir Permanentemente")');
  });

  test('Deve criar coluna de Prova Paulista, lançar nota e verificar reflexo no boletim consolidado', async ({ page }) => {
    await page.fill('input[type="email"]', 'professor@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    await page.click('button:has-text("Nova Turma")');
    const classIdName = `Turma Paulista E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: 3º Ano - Técnico em DS"]', classIdName);
    await page.fill('input[placeholder="2026"]', '2026');
    await page.click('button:has-text("Criar Turma")');

    await page.click(`text=${classIdName}`);

    await page.click('button:has-text("Cadastrar Aluno")');
    const studentMatricula = `RM${Date.now().toString().slice(-6)}`;
    const studentName = `Aluno Paulista E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: Ana Clara"]', studentName);
    await page.fill('input[placeholder="DS3A99"]', studentMatricula);
    await page.fill('input[placeholder="Ex: ana@escola.com"]', `aluno_paulista_${Date.now()}@escola.com`);
    await page.fill('input[placeholder="Ex: 123"]', '123456');
    await page.click('button:has-text("Salvar Cadastro")');

    await page.locator('button:has-text("Pesos: Provas/Projetos")').click();
    await page.locator('label:has-text("Peso das Provas / Projetos (%)") + input').fill('40');
    await page.locator('label:has-text("Peso da Prova Paulista (%)") + input').fill('30');
    await page.locator('label:has-text("Peso das Atividades (%)") + input').fill('15');
    await page.locator('label:has-text("Peso dos Vistos do Caderno (%)") + input').fill('15');
    await page.click('button:has-text("Salvar Pesos")');

    await page.click('button:has-text("Prova Paulista (0 a 10)")');
    await page.click('button:has-text("Nova Prova Paulista")');
    const examTitle = `Paulista E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: Prova Paulista 1º Bimestre"]', examTitle);
    await page.fill('input[type="number"]', '10');
    await page.click('button:has-text("Criar Coluna")');

    await expect(page.locator(`th:has-text("${examTitle}")`)).toBeVisible();

    const studentRow = page.locator('tr', { hasText: studentName }).first();
    const gradeInput = studentRow.locator('input[placeholder="--"]').first();
    await gradeInput.fill('8.0');
    await page.waitForTimeout(400);

    await page.click('button:has-text("Visão Geral & Boletim")');
    const boletimRow = page.locator('tr', { hasText: studentName }).first();
    await expect(boletimRow.locator('span[class*="text-primary"]').first()).toContainText('3.9');

    await boletimRow.hover();
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await boletimRow.locator('button[title="Remover da Turma"]').click();

    await page.click('aside button:has-text("Turmas")');
    const classCard = page.locator(`div.group:has-text("${classIdName}")`).first();
    await classCard.hover();
    await classCard.locator('button[title="Excluir Turma"]').click();
    await page.fill('input[placeholder="Digite o nome da turma para confirmar"]', classIdName);
    await page.click('button:has-text("Excluir Permanentemente")');
  });

  test('Deve logar como Aluno, acessar detalhes de uma disciplina e validar boletim detalhado com cálculo step-by-step', async ({ page }) => {
    await page.fill('input[type="email"]', 'ana@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    await page.click('button:has-text("Ver Detalhes")');

    await expect(page.locator('h1')).toContainText('Painel de Rendimento');
    
    await expect(page.locator('h3:has-text("Notas de Provas / Projetos")').or(page.locator('h3:has-text("Notas de Provas/Projetos")'))).toBeVisible();
    await expect(page.locator('h3:has-text("Notas de Prova Paulista")')).toBeVisible();
    await expect(page.locator('h3:has-text("Entrega de Atividades (Checklist)")')).toBeVisible();
    await expect(page.locator('h3:has-text("Grade de Vistos Semanais do Caderno")')).toBeVisible();

    await expect(page.locator('text=Composição da Nota:')).toBeVisible();
    await expect(page.locator('text=Média Final =')).toBeVisible();

    const statusBadge = page.locator('span:has-text("Situação:") + span');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge.locator('text=Aprovado').or(statusBadge.locator('text=Recuperação')).or(statusBadge.locator('text=Reprovado'))).toBeVisible();

    await page.locator('aside button:has-text("Meu Progresso")').click();
    await expect(page.locator('h1')).toContainText('Meu Progresso');
  });

  test('Deve filtrar alunos dinamicamente através do campo de busca no diário de classe do Professor', async ({ page }) => {
    await page.fill('input[type="email"]', 'professor@escola.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    await page.click('button:has-text("Nova Turma")');
    const classIdName = `Turma Busca E2E_${Date.now()}`;
    await page.fill('input[placeholder="Ex: 3º Ano - Técnico em DS"]', classIdName);
    await page.fill('input[placeholder="2026"]', '2026');
    await page.click('button:has-text("Criar Turma")');

    await page.click(`text=${classIdName}`);

    await page.click('button:has-text("Cadastrar Aluno")');
    const student1Matricula = `RM1111_${Date.now().toString().slice(-4)}`;
    const student1Name = `Ana Maria_${Date.now()}`;
    await page.fill('input[placeholder="Ex: Ana Clara"]', student1Name);
    await page.fill('input[placeholder="DS3A99"]', student1Matricula);
    await page.fill('input[placeholder="Ex: ana@escola.com"]', `ana_maria_${Date.now()}@escola.com`);
    await page.fill('input[placeholder="Ex: 123"]', '123456');
    await page.click('button:has-text("Salvar Cadastro")');

    await page.click('button:has-text("Cadastrar Aluno")');
    const student2Matricula = `RM2222_${Date.now().toString().slice(-4)}`;
    const student2Name = `Carlos Silva_${Date.now()}`;
    await page.fill('input[placeholder="Ex: Ana Clara"]', student2Name);
    await page.fill('input[placeholder="DS3A99"]', student2Matricula);
    await page.fill('input[placeholder="Ex: ana@escola.com"]', `carlos_silva_${Date.now()}@escola.com`);
    await page.fill('input[placeholder="Ex: 123"]', '123456');
    await page.click('button:has-text("Salvar Cadastro")');

    await page.fill('input[placeholder="Buscar aluno por nome ou matrícula"]', 'Ana Maria');
    await expect(page.locator(`text=${student1Name}`)).toBeVisible();
    await expect(page.locator(`text=${student2Name}`)).not.toBeVisible();

    await page.fill('input[placeholder="Buscar aluno por nome ou matrícula"]', student2Matricula);
    await expect(page.locator(`text=${student1Name}`)).not.toBeVisible();
    await expect(page.locator(`text=${student2Name}`)).toBeVisible();

    await page.fill('input[placeholder="Buscar aluno por nome ou matrícula"]', '');
    await expect(page.locator(`text=${student1Name}`)).toBeVisible();
    await expect(page.locator(`text=${student2Name}`)).toBeVisible();

    const row1 = page.locator('tr', { hasText: student1Name }).first();
    await row1.hover();
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await row1.locator('button[title="Remover da Turma"]').click();

    const row2 = page.locator('tr', { hasText: student2Name }).first();
    await row2.hover();
    page.once('dialog', async (dialog) => { await dialog.accept(); });
    await row2.locator('button[title="Remover da Turma"]').click();

    await page.click('aside button:has-text("Turmas")');
    const classCard = page.locator(`div.group:has-text("${classIdName}")`).first();
    await classCard.hover();
    await classCard.locator('button[title="Excluir Turma"]').click();
    await page.fill('input[placeholder="Digite o nome da turma para confirmar"]', classIdName);
    await page.click('button:has-text("Excluir Permanentemente")');
  });
});

