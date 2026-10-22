# PR-01 — Baseline, ambientes e testes isolados

Criado em **21/10/2026**. Referência: [PR-01 no plano de implementação](PLANO_IMPLEMENTACAO.md#pr-01--baseline-ambientes-e-testes-isolados--p0p1--12-dias).

**Objetivo:** preparar uma base de trabalho reproduzível, com ambientes identificados e testes isolados, antes das correções de segurança e da implementação dos bimestres.

**Estado:** preparação iniciada; subtarefas de implementação pendentes. Este arquivo não representa uma PR já aberta no GitHub. Branch prevista no plano: `codex/baseline-ambientes-testes`.

As subtarefas abaixo pertencem à mesma PR. A divisão serve para executar e revisar em blocos pequenos; não cria 11 PRs adicionais.

## 1. Checklist e ordem de execução

| Estado | ID | Subtarefa | Depende de |
|---|---|---|---|
| [x] | 01.1 | Registrar a consulta obrigatória ao plano | — |
| [x] | 01.2 | Registrar o diagnóstico local inicial | 01.1 |
| [x] | 01.3 | Identificar ambientes e realizar inventário remoto somente leitura | 01.2 |
| [ ] | 01.4 | Preparar referências do legado e registrar decisões pendentes | 01.2; inventário remoto para completar o manifesto |
| [ ] | 01.5 | Implementar configuração explícita de ambiente e modo de dados | 01.2; confirmação de ambientes para homologação cloud |
| [x] | 01.6 | Isolar e corrigir a demonstração e seus dados fictícios | 01.5 |
| [x] | 01.7 | Separar os testes unitários da infraestrutura de navegador/banco | 01.2 |
| [x] | 01.8 | Proteger e separar os testes E2E | 01.5, 01.6, 01.7 |
| [ ] | 01.9 | Preparar Supabase e fixtures descartáveis de integração | 01.3, 01.4, 01.8 |
| [ ] | 01.10 | Integrar a validação isolada à CI | 01.7, 01.8, 01.9 |
| [ ] | 01.11 | Documentar uso dos ambientes e verificar o aceite da PR | Todas as anteriores |

**Próxima subtarefa recomendada: concluir a 01.4**, que ainda está parcial e é dependência da 01.9. Depois, preparar Supabase e fixtures descartáveis de integração na 01.9. O smoke de deployment da 01.5 também continua pendente; os E2E atuais cobrem somente o demo local e não validam integração cloud.

Legenda: `[x]` executado e conferido; `[ ]` pendente. Se houver execução parcial, manter pendente e descrever o que falta. A PR só termina quando todos os critérios obrigatórios estiverem verificados ou quando um ajuste de escopo tiver sido registrado explicitamente no plano.

## 2. Subtarefas detalhadas

### 01.1 — Registrar a consulta obrigatória ao plano

**Status:** concluída nesta preparação.

- Criar a orientação durável no `AGENTS.md` da raiz.
- Exigir consulta ao plano no início de cada tarefa e quando surgir dúvida, incluindo escopo, dependências, migração e aceite pertinentes.
- Vincular este checklist à PR-01 no plano principal.

**Entrega:** `AGENTS.md`, este documento e referência cruzada no plano.

**Aceite:** futuras tarefas no repositório encontram a orientação e a referência correta; não há mudança de regras do produto ou de dados nesta subtarefa.

### 01.2 — Registrar o diagnóstico local inicial

**Status:** concluída para o checkout local; não substitui o inventário remoto 01.3.

Evidências conferidas em 21/10/2026:

| Ponto | Estado observado | Encaminhamento |
|---|---|---|
| Checkout | Commit `502ff86`; branch `master` no início desta preparação | Registrar a branch da implementação quando for criada |
| Plano | Arquivo presente e ainda não versionado no início desta preparação | Incluir o plano e os documentos de acompanhamento na revisão da PR |
| Comandos | `dev`, `build`, `lint`, `preview` e um único `test` via Playwright | Separar comandos por camada em 01.7/01.8 |
| Configuração | `.env.example` possui somente URL e chave pública do Supabase | Explicitar modo e ambiente em 01.5 |
| Modo de dados | `db.js` seleciona cloud pela presença de variáveis e usa demo na ausência | Eliminar troca silenciosa em 01.5 |
| Cliente | `supabaseClient.js` inicializa cliente quando há URL/chave | Centralizar validação sem criar cliente em demonstração |
| Seed | Inicialização local é chamada independentemente do modo cloud | Isolar em 01.6 |
| Unidade | Oito testes puros usam o mesmo runner/configuração dos E2E | Dar configuração independente em 01.7 |
| E2E | Carrega `.env` da raiz, usa contas fixas e chama `clean_test_data` | Corrigir em 01.8/01.9 |
| Servidor de testes | Playwright usa porta 5173 e `reuseExistingServer: true` | Servidor próprio, destino identificado e porta estrita em 01.8 |
| CI | Executa lint/build, inicia Supabase e reseta o banco local; não executa testes | Integrar unidade e infraestrutura isolada em 01.10 |
| Runtime/dependências | Ajuste completo de versões pertence à PR-02 | Não misturar atualização ampla de dependências nesta PR |

Lint, build e os oito testes de cálculo passaram na revisão que criou o plano. Esse resultado está registrado no plano; não foi tratado como nova execução de E2E ou validação remota nesta preparação.

**Aceite:** diagnóstico distingue fatos locais, verificações anteriores e itens remotos ainda não verificados; nenhuma credencial real é reproduzida aqui.

### 01.3 — Identificar ambientes e realizar inventário remoto somente leitura

**Status:** concluída; mapeamento de produção e preview verificado por leitura do bundle público; divergências remotas registradas para as PRs correspondentes.

1. Identificar, pelas integrações disponíveis e configurações autorizadas, o projeto Supabase usado em produção e os destinos de desenvolvimento/homologação. Evitar pedir informações já disponíveis nas integrações.
2. Registrar o mapeamento ambiente → aplicação → projeto de banco. Caso haja ambiguidade entre projetos, obter a identificação correta antes de consultar ou configurar o destino.
3. Consultar migrações aplicadas, schema, constraints, índices, políticas RLS, funções, grants, configurações de signup e advisories pertinentes.
4. Comparar com `supabase/migrations/` e `supabase/schema.sql`, registrando divergências sem corrigi-las nesta subtarefa.
5. Levantar contagens e relações necessárias ao legado por turma/ano: matrículas, atividades por tipo, notas, semanas, vistos e pesos. Não publicar nomes, e-mails, senhas ou valores identificáveis de alunos no relatório versionado.
6. Documentar se há Supabase local/infraestrutura necessária disponível e qual destino é descartável para testes. Provisionamento externo que envolva custo fica identificado antes da contratação.

**Entrega:** documento de inventário em `reports/media-facil-2026-09-30/pr-01/`, com data, origem de cada evidência, diferenças, pendências e mapeamento dos ambientes. Manifestos com dados identificáveis ficam em local protegido, fora do Git.

**Aceite:** projeto correto confirmado, estado remoto distinguido de suposições e destinos de teste identificados. Nenhum `reset`, `seed`, cleanup, mudança de grant ou correção de RLS executados no banco real.

**Limite:** corrigir RPCs/papéis é PR-03; corrigir RLS/integridade é PR-04. Nesta etapa, apenas identificar e registrar.

**Progresso em 21/10/2026:** inventário em [`pr-01/INVENTARIO_AMBIENTES.md`](pr-01/INVENTARIO_AMBIENTES.md). Produção foi mapeada ao Supabase `Media_facil`: o bundle servido por `www.mediafacil.app.br` contém a URL e a chave pública `anon` ativa desse projeto, comparadas em memória sem registrar o valor. As mesmas entradas Vercel estão alocadas a `production` e `preview`; portanto, Preview compartilha o banco real e não deve ser usado como homologação. O Vercel mantém esses valores como `Secret`, mas isso não impediu a verificação pelo bundle público. O dashboard Supabase confirmou `main` como produção e signup/confirmação de e-mail habilitados, login anônimo/vinculação manual desabilitados. Índices, grants, expressões RLS e funções foram consultados; divergências estão registradas para PR-03/04, sem correção remota. A CI usa Supabase local efêmero como destino descartável; a ausência de CLI/container nesta máquina fica para 01.9. Nenhuma escrita foi feita.

### 01.4 — Preparar referências do legado e registrar decisões pendentes

**Status:** parcial; fixtures sintéticas e decisões de referência registradas; manifesto de turmas protegido criado. A resposta da consulta acadêmica agregada não pôde ser interpretada e não foi gravada; uma solicitação subsequente foi bloqueada pela revisão automática, mesmo após autorização explícita do responsável. Não repetir nem contornar a extração; a comparação real fica pendente de um método aprovado.

1. Criar fixtures sintéticas determinísticas para cálculo e fluxos: sem lançamentos, zero real, pendência, parcial 9,5/10, pesos diferentes, aluno sem matrícula e aluno vinculado a mais de uma turma.
2. Registrar resultados da função central atual e divergências conhecidas como referência; não considerar o comportamento divergente como regra desejada.
3. Criar o formato do manifesto turma → ano → terceiro bimestre. A origem no terceiro foi informada pelo usuário; a classificação por ano/IDs depende do inventário 01.3.
4. Registrar as decisões da seção 3.5 do plano como definidas/propostas/pendentes: categorias vazias, pendência, entrega/correção, arredondamento, limites, publicação e recuperação.
5. Preservar IDs e valores na referência protegida que será usada para comparar a migração futura. Não executar o backfill agora.

**Entrega:** fixtures sem dados reais e registro de decisões; formato de manifesto e, após o inventário, classificação do conjunto legado.

**Aceite:** entradas reproduzíveis e resultados de referência registrados; toda regra não confirmada está identificada. Ausência de confirmação não é convertida em alteração pedagógica automática.

**Limite:** motor novo pertence à PR-05; schema e migração dos bimestres à PR-07.

**Progresso em 21/10/2026:** `tests/fixtures/academic-reference.js` criado e conferido contra a função central atual (8/8 cenários). Referência pedagógica e decisões pendentes em [`pr-01/REFERENCIA_REGRAS_ACADEMICAS.md`](pr-01/REFERENCIA_REGRAS_ACADEMICAS.md); modelo versionado em [`pr-01/MANIFESTO_LEGADO_MODELO.json`](pr-01/MANIFESTO_LEGADO_MODELO.json). Manifesto com os nove IDs de turma, anos observados, pesos e terceiro bimestre está em `/private/tmp/media-facil-pr-01-4/manifesto-legado.json`, fora do Git (diretório 0700, arquivo 0600). Oito anos `2026` permanecem hipóteses até validação institucional; o ano `20262026` está ambíguo. Nenhum backfill foi executado. Após autorização explícita do responsável para uma cópia somente de leitura em pasta temporária privada, a primeira resposta da consulta agregada (IDs de alunos, matrículas, atividades, notas e vistos) não pôde ser interpretada; ela não foi exibida nem gravada em arquivo. Uma nova solicitação foi rejeitada pela revisão automática. Não haverá tentativa de contornar ou repartir a consulta. Nenhum arquivo de referência acadêmica real foi criado; a comparação fica pendente de um método aprovado, e a validação institucional dos anos continua necessária.

### 01.5 — Implementar configuração explícita de ambiente e modo de dados

**Status:** implementação local e variáveis de ambiente na Vercel concluídas; smoke em deployment ainda pendente. As configurações serão aplicadas na próxima build; nenhum deployment foi iniciado nesta subtarefa.

1. Definir um ponto único de configuração para modo `demo`/`cloud` e ambiente de aplicação; documentar precedência e valores aceitos.
2. Validar URL/chave pública no modo cloud. Valores ausentes, inválidos ou de exemplo produzem erro de configuração claro; nunca acionam demonstração silenciosamente.
3. Inicializar clientes somente no modo adequado. Demonstração não faz chamadas ao Supabase; cloud não cria seed nem usa sessão de demonstração como identidade cloud.
4. Tornar o ambiente de testes/demonstração visível na UI e diferenciar falha de configuração de erro de senha. Em produção, seguir o modo cloud previsto no plano.
5. Impedir o uso involuntário do destino real em desenvolvimento/preview por configuração verificada e validação de ambiente; não tratar um rótulo textual “teste” como comprovação do destino.
6. Atualizar `.env.example` sem segredos administrativos e preparar testes do contrato de configuração, inclusive configuração incompleta.

**Arquivos esperados:** módulo de configuração, `src/db.js`, `src/supabaseClient.js`, pontos mínimos de inicialização/sessão/UI e `.env.example`.

**Aceite:** modos inválidos são recusados; demo/cloud não se misturam; configuração incompleta não permite login fictício; nunca expor segredo administrativo em `VITE_*`.

**Limite:** refatoração completa da sessão e navegação fica na PR-09; separação ampla dos adapters fica na PR-06. Aqui entram apenas os ajustes necessários ao isolamento dos modos.

**Progresso em 21/10/2026:** criado `src/config/appConfig.js` como ponto único de validação do modo `demo`/`cloud`, ambiente detectado pela origem e destinos autorizados. Demo não cria cliente Supabase; cloud local só aceita Supabase local em `localhost:54321`; produção só aceita o host Supabase de produção mapeado em 01.3 no domínio oficial; Preview rejeita cloud até existir projeto isolado. Modo ausente/inválido exibe erro de configuração e não monta login. A inicialização do seed local foi restrita a demo; a restauração de sessão usa apenas o provider correspondente ao modo, removendo a busca ampla por chaves `auth-token`. A UI identifica demo/cloud e botões rápidos aparecem apenas em demo local. `.env.example` e README documentam os valores. `npm run test:config` (5/5), `npm run lint` e `npm run build` passaram. Na Vercel, projeto `media-facil` da equipe `mael-teams`, foram criadas e conferidas sem descriptografar segredos as variáveis públicas: Production `VITE_APP_DATA_MODE=cloud` e `VITE_APP_ENV=production`; Preview `VITE_APP_DATA_MODE=demo` e `VITE_APP_ENV=preview`. Nenhuma variável Supabase foi lida ou alterada e nenhum deployment foi iniciado. Smoke do deployment permanece pendente.

### 01.6 — Isolar e corrigir a demonstração e seus dados fictícios

**Status:** concluída localmente; integração coberta por testes puros. A validação E2E ficará na subtarefa 01.8, após isolamento do destino de testes.

1. Extrair uma fonte única para os dados e acessos de demonstração, com identidades fictícias consistentes.
2. Corrigir botões de acesso rápido para corresponder ao seed; disponibilizá-los somente no modo demo.
3. Corrigir vínculos e atividades de turmas inexistentes e garantir que todos os IDs referenciados existam.
4. Inicializar/migrar somente a base demo, em namespace próprio. Não limpar dados locais anteriores sem estratégia de preservação ou ação explícita.
5. Não redefinir silenciosamente a senha demo a cada leitura do banco; manter comportamento previsível e coberto por teste.

**Arquivos esperados:** seed/fixtures demo, `src/db.js`, `src/pages/Login.jsx` e testes pertinentes.

**Aceite:** professor/aluno demo entram com os acessos apresentados; vínculos são válidos; cloud não carrega credenciais rápidas nem escreve a base fictícia.

**Progresso em 21/10/2026:** fixtures e acessos fictícios extraídos para `src/demo/demoFixtures.js`; login rápido usa diretamente a mesma definição de contas do seed (`ismaelfilho@professor.com` e `ana@escola.com`, senha demo `123`). O seed contém duas turmas referenciadas corretamente por atividades, notas, vínculos, semanas e vistos. A demonstração usa `media_facil_demo_db_v1`; na primeira inicialização, uma base legada reconhecida é copiada sem remover a chave anterior e sem redefinir senhas. Formato legado inválido interrompe a inicialização em vez de sobrescrever dados. O reset implícito da senha da Ana foi removido. `npm run test:demo` (7/7), `npm run test:config` (5/5), `npm run lint` e `npm run build` passaram. Nenhuma escrita foi feita no Supabase. A suíte E2E existente não foi rodada porque seu isolamento é justamente o escopo da 01.8.

### 01.7 — Separar os testes unitários da infraestrutura de navegador/banco

**Status:** concluída localmente; testes unitários executados com o runner nativo do Node.

1. Criar configuração própria para os testes puros existentes, sem `webServer`, projeto de navegador, leitura de `.env` ou inicialização de Supabase.
2. Adicionar comando explícito, por exemplo `npm run test:unit`, reaproveitando o runner instalado se for suficiente. Não instalar outro framework sem necessidade.
3. Definir claramente o que `npm test` executa para evitar acionar banco/navegador por surpresa; manter E2E em comando próprio.
4. Rodar os oito testes de cálculo e conferir que a execução não depende de Vite, browser instalado ou conexão remota.

**Progresso em 21/10/2026:** `tests/unit/calculations.spec.js` agora usa `node:test` e `node:assert/strict`, sem importar Playwright. `npm test` executa `npm run test:unit` (`node --test tests/unit/*.spec.js`); a suíte E2E foi movida para `npm run test:e2e`. A README documenta os comandos e ressalta que E2E aguarda o isolamento previsto em 01.8. `npm test` (8/8), `npm run test:config` (5/5), `npm run test:demo` (7/7), `npm run lint`, `npm run build` e `git diff --check` passaram. O runner unitário não carrega `.env`, inicia Vite, navegador ou banco. Nenhum E2E foi iniciado.

**Arquivos esperados:** `package.json`, configuração de testes puros e, apenas se necessário, organização de `tests/unit/`.

**Aceite:** um comando reproduzível executa todos os testes puros com sucesso sem servidor ou banco. A PR-02 continua responsável pela atualização ampla do runtime/dependências.

### 01.8 — Proteger e separar os testes E2E

**Status:** concluída localmente; nove cenários executados somente no demo isolado.

1. Remover carregamento implícito do `.env` real e uso de contas fixas que possam corresponder à produção. Testes demo e testes cloud recebem configurações diferentes e explícitas.
2. Criar uma verificação de destino executada antes de provisionar, autenticar ou modificar dados: destino local descartável identificado ou allowlist de ambiente de teste confirmado; erro por padrão.
3. Não aceitar somente uma variável booleana “sou teste” como garantia. Validar origem/URL/identidade do projeto contra a configuração confiável de testes.
4. Usar servidor de teste dedicado, porta definida/estrita e sem reaproveitar servidor desconhecido. Configuração do app iniciado pelo teste precisa coincidir com o destino verificado pelo runner.
5. Remover o `afterEach` que chama `clean_test_data` por cliente autenticado. Não substituir por outro cleanup genérico acessível ao produto.
6. Preparar fixtures por execução, credenciais sintéticas e teardown restrito aos registros criados, executado pela infraestrutura 01.9.
7. Manter cenários de regressão úteis; ajustar acessos/seletores somente onde necessário ao isolamento.

**Progresso em 21/10/2026:** o spec foi movido para `tests/e2e/` e agora autentica usando `DEMO_QUICK_ACCESS`, a mesma fixture do aplicativo. O hook que carregava `.env` e o `afterEach` que autenticava em conta fixa e chamava `clean_test_data` foram removidos. Os cadastros E2E usam endereços `@example.test`; a suíte observa e bloqueia requisições a hosts `*.supabase.co`. Um runner exige `--target demo`, rejeita configuração cloud/URLs herdadas e repassa ao processo somente modo demo/local sem chaves Supabase. Playwright e Vite usam endereço fixo `127.0.0.1:4178`, porta estrita, sem reutilizar servidor; `vite.e2e.config.js` desabilita carregamento de arquivos `.env`. Testes unitários cobrem destino ausente, alvo real, modo cloud, variáveis Supabase e URL externa. `npm test` (12/12), `npm run test:config` (5/5), `npm run test:demo` (7/7), lint, build, coleta Playwright e suíte demo E2E (9/9) passaram. Nenhuma conexão ou gravação Supabase foi realizada. O Chromium necessário foi instalado no cache local do Playwright.

**Arquivos esperados:** `playwright.config.js`, `vite.e2e.config.js`, `tests/e2e/`, helpers e scripts de teste.

**Aceite:** destino ausente/não autorizado/real é rejeitado antes de qualquer mutação; demo não acessa cloud; a suíte não usa RPC de limpeza do produto nem interfere no servidor do desenvolvedor.

**Limite:** revogar/dropar a função insegura no banco é PR-03. Remover sua chamada dos testes não significa que a vulnerabilidade remota já foi corrigida.

### 01.9 — Preparar Supabase e fixtures descartáveis de integração

**Status:** pendente; preflight local feito, mas não há runtime de containers disponível neste ambiente.

1. Subir instância local/descartável de testes e aplicar as migrações nesse destino identificado.
2. Preparar pelo canal administrativo da infraestrutura as contas sintéticas: aluno, professor proprietário e outro professor. Credenciais administrativas não vão para o app nem para o bundle.
3. Criar turmas/matrículas/atividades de referência identificadas por execução; não depender de contas reais nem da RPC insegura de cadastro.
4. Preparar criação e descarte com escopo exato de execução e tratamento de interrupção. Instância descartável pode ser destruída ao término; banco real nunca entra no fluxo.
5. Implementar smoke de conexão, migrações, login e leitura de fixture para provar a infraestrutura; registrar os problemas de autorização encontrados para PR-03/04.

**Arquivos esperados:** helpers/scripts de fixture/teardown, configuração local Supabase e testes de integração iniciais.

**Aceite:** execução limpa é reproduzível, contas/dados de outra execução não são removidos e teardown não depende de `clean_test_data`. Preparar papéis de teste não equivale a aprovar toda a RLS atual; a matriz completa é ampliada nas PRs de segurança.

**Pré-requisito observado em 21/10/2026:** `supabase` e `docker` não estão instalados; também não foram encontrados Podman/Colima/OrbStack, binários PostgreSQL locais, sockets Docker ou apps Docker Desktop/OrbStack/Rancher/Podman Desktop. Nenhuma instância foi iniciada, nenhuma migração foi aplicada e nenhum banco foi alterado. Para continuar, é necessário disponibilizar um runtime de containers local e o Supabase CLI; a implementação continua limitada a dados sintéticos. A 01.4 permanece parcial, portanto não se importarão registros reais nesta etapa.

### 01.10 — Integrar a validação isolada à CI

**Status:** pendente.

1. Executar lint, build e testes unitários em comandos identificados e sem backend real.
2. Criar etapa/job isolado para Supabase, migrações e smoke de integração/E2E essenciais com fixtures de 01.9.
3. Fazer a aplicação de teste receber as mesmas configurações verificadas pelo runner. Não disponibilizar segredo de produção a job de PR.
4. Guardar relatórios úteis com logs sem credenciais/dados reais; executar descarte mesmo em falha e evitar colisão entre execuções.
5. Manter upgrades amplos de runtime/lockfile na PR-02; se um ajuste mínimo for indispensável para executar esta base, registrar a dependência e o ajuste no plano.

**Arquivos esperados:** `.github/workflows/ci.yml`, scripts de teste e configuração de artefatos.

**Aceite:** execução nova a partir do checkout consegue verificar unidade, build, migrações e fluxo essencial isolado; falha de teste interrompe o job; nenhum reset remoto. Se não houver execução do GitHub Actions disponível, registrar “verificado localmente” e manter a validação remota como pendência.

### 01.11 — Documentar os ambientes e verificar o aceite da PR

**Status:** pendente.

1. Atualizar README com modos reais, comandos unitários/E2E/integração, configuração por ambiente e orientação de homologação.
2. Registrar inventário, diferenças de schema e pendências pedagógicas; separar material versionável de manifesto protegido.
3. Conferir smoke demo e configuração cloud válida/inválida, testes puros, testes de destino negado e infraestrutura descartável.
4. Revisar diff para remover segredos, alterações fora de escopo e promessas ainda não implementadas.
5. Atualizar este checklist e o plano com evidências: comando, resultado, ambiente e limitações. Preparar título e descrição da PR com problema, comportamento resultante e validação.

**Aceite:** critérios finais abaixo atendidos; tarefas pendentes/limitações visíveis; PR não é declarada concluída somente porque build passou.

## 3. Critérios finais da PR-01

- [ ] Ambientes corretamente identificados; inventário remoto e divergências registrados ou escopo ajustado explicitamente no plano.
- [ ] Dados legados possuem referência/manifesto no local apropriado; dúvidas de regra estão registradas, sem alteração silenciosa de notas.
- [ ] Demonstração é explícita e identificada; produção sem configuração não cai na demo.
- [ ] Clientes, sessões e seeds dos modos demo/cloud não se misturam.
- [ ] Acessos rápidos e seed de demonstração são consistentes.
- [ ] Testes puros executam sem Vite, navegador, `.env` real ou banco.
- [ ] E2E rejeita destino não autorizado antes de qualquer gravação.
- [ ] Não há chamada de teste à RPC `clean_test_data` nem cleanup genérico acessível ao produto.
- [ ] Fixtures e teardown usam apenas infraestrutura de testes identificada e dados sintéticos.
- [ ] CI executa os checks previstos, com resultado e limitações registrados.
- [ ] README, plano e checklist correspondem ao que foi entregue.
- [ ] Nenhuma migração de bimestre, alteração pedagógica ou correção remota de RLS entrou sem corresponder à PR prevista no plano.

## 4. Registro de progresso

| Data | Subtarefa | Evidência | Pendência |
|---|---|---|---|
| 21/10/2026 | 01.1 | `AGENTS.md` criado; referência à decomposição incluída no plano | Nenhuma nesta subtarefa |
| 21/10/2026 | 01.2 | Plano, scripts, configurações de testes/CI, serviço de dados e commit local conferidos | Diagnóstico remoto é 01.3 e permanece pendente |
| 21/10/2026 | 01.3 | Bundle público de produção confirmou URL e chave anon do Supabase `Media_facil`; Preview usa o mesmo escopo das variáveis; Auth/signup, migrations, índices, grants, policies, funções, advisories e destino efêmero da CI conferidos. Inventário atualizado; nenhuma escrita remota | Sem homologação cloud separada; Preview compartilha a produção. CLI/container local fica para 01.9 |
| 21/10/2026 | 01.4 | Fixtures sintéticas e resultados centrais conferidos 8/8; divergências e decisões pendentes registradas; manifesto de classificação de turmas criado em área local protegida | Primeira resposta acadêmica não pôde ser interpretada, exibida ou gravada; solicitação subsequente foi rejeitada pela revisão automática mesmo após autorização explícita. Não houve nova tentativa por outro caminho. Referência real não criada. Ano `20262026` e anos `2026` ainda exigem validação institucional. Backfill não executado |
| 21/10/2026 | 01.5 | Configuração demo/cloud implementada e variáveis Vercel Production/Preview verificadas sem descriptografar segredos; testes de configuração (5/5), lint e build passaram | Smoke em deployment não executado |
| 21/10/2026 | 01.6 | Fixtures demo, credenciais alinhadas, referências consistentes e migração local com preservação conferidas; testes demo (7/7), configuração (5/5), lint e build passaram | E2E permanece para 01.8 após isolamento do destino; nenhum teste ou seed remoto executado |
| 21/10/2026 | 01.7 | Runner nativo do Node isolado para unidade; `npm test` (8/8), config (5/5), demo (7/7), lint, build e diff check passaram | E2E não executado; isolamento de destino foi concluído na 01.8 |
| 21/10/2026 | 01.8 | Destino demo local imposto por runner, Vite sem `.env`, servidor exclusivo, limpeza remota removida; 9/9 E2E passaram com requisições Supabase bloqueadas | E2E cloud e fixtures/teardown Supabase aguardam infraestrutura descartável da 01.9 |
| 21/10/2026 | 01.9 | Preflight de ferramentas e runtime local; indisponibilidade registrada antes de iniciar qualquer serviço | Instalar/iniciar runtime de containers e Supabase CLI; 01.4 segue parcial |

Atualizar esta tabela durante a execução. Marcar uma tarefa como concluída exige verificar o respectivo critério de aceite, e não apenas criar seus arquivos.
