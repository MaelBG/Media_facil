# Orientações de trabalho — Média Fácil

## Referência obrigatória

Por instrução do responsável pelo projeto, **consultar o plano de implementação antes de iniciar qualquer tarefa e sempre que houver dúvida**:

- [Plano de implementação](reports/media-facil-2026-09-30/PLANO_IMPLEMENTACAO.md)
- [Relatório que fundamenta o plano](reports/media-facil-2026-09-30/RELATORIO.md)

Antes de analisar, editar código, executar testes ou preparar uma PR, conferir o objetivo, o escopo, as dependências e os critérios de aceite da entrega correspondente no plano. Consultar as seções de bimestres, migração e testes quando afetadas. Não substituir decisões registradas por suposições; se a resposta não estiver no plano ou no código, registrar a dúvida e solicitar somente a informação necessária.

## Acompanhamento

- A PR-01 está detalhada em [PR-01 — subtarefas](reports/media-facil-2026-09-30/PR-01_SUBTAREFAS.md).
- Consultar e atualizar o checklist da entrega trabalhada, registrando evidências e pendências. Marcar como concluído apenas o que foi efetivamente executado e verificado.
- Os identificadores PR-01 a PR-24 são referências do plano. Não afirmar que uma PR foi aberta, uma funcionalidade implementada ou uma migração aplicada sem evidência da ação.
- Preservar os limites entre as PRs. Qualquer ajuste de escopo deve ser explicado e refletido no plano e nas subtarefas.

## Dados e validação

Seguir os procedimentos de isolamento, testes e migração do plano. A demonstração local é independente dos dados cloud. Não executar reset, seed, limpeza ou testes destrutivos contra o banco real. Inventário remoto de diagnóstico é somente leitura; não registrar senhas, tokens ou dados pessoais de alunos nos documentos versionados.
