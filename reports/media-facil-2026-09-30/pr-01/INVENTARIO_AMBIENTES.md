# PR-01 — Inventário de ambientes e banco

**Coleta:** 21/10/2026 (America/Sao_Paulo). Advisories do Supabase informaram `observed_at` em 22/10/2026 UTC.
**Método:** integrações Supabase/Vercel em modo de leitura, catálogo PostgreSQL por `SELECT`, arquivos versionados locais. Nenhum valor de variável de ambiente, credencial ou registro individual foi consultado ou incluído.

## Mapeamento observado

| Camada/ambiente | Aplicação | Banco/destino | Evidência e limite |
|---|---|---|---|
| Produção Vercel | Projeto `media-facil` (framework Vite); deployment de produção pronto no commit `502ff86`; domínio `www.mediafacil.app.br` ligado ao projeto | Supabase `Media_facil`, URL `https://nqddatrdllvfwkmfddpc.supabase.co` | Verificação complementar pelo deployment publicado: o bundle JS servido em produção contém esse host e a chave pública `anon` ativa desse projeto. Comparação feita em memória; chave não foi registrada. A variável Vercel continua marcada como `Secret` e seu valor não foi lido no dashboard/API. |
| Preview Vercel | Mesmo projeto `media-facil` | As mesmas entradas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` têm alvo conjunto `production` e `preview`; portanto, compartilham configuração com o banco real | Não há projeto de homologação separado visível. Tratar preview como conectado à produção; não executar testes, seed, cleanup ou migrações nesse destino. |
| Supabase remoto listado | Projeto `Media_facil`, região `sa-east-1`, PostgreSQL 17, status `ACTIVE_HEALTHY` | URL `https://nqddatrdllvfwkmfddpc.supabase.co` | Host e chave pública legacy `anon` conferem com o bundle do domínio de produção. Não apareceu outro projeto Supabase para desenvolvimento/homologação na listagem conectada. |
| Desenvolvimento/testes locais | App Vite local | Configuração Supabase local definida em `supabase/config.toml` (API 54321, DB 54322, projeto local `Media_facil`); CI inicia Supabase local em runner efêmero | Destino descartável de CI identificado (`supabase start` + reset local no runner GitHub Actions). Nesta máquina, CLI `supabase` não foi encontrada e `docker ps` não mostrou containers ativos; não foi iniciado nem resetado serviço nesta coleta. |
| Homologação cloud | Não há projeto Vercel/Supabase separado visível nas integrações conectadas | Não identificado | Não usar o projeto remoto único como destino de testes. Criar/definir destino descartável fica para a preparação de testes, sem provisionar serviço pago nesta subtarefa. |

O checkout local não contém `.env`; existe apenas `.env.example`, que descreve URL e chave pública sem valores reais.

## Schema, migrations e dados agregados

O dashboard Supabase identifica a branch `main` como `PRODUCTION`. O banco reportou as migrations `20260713105000`, `20260720000000`, `20260804000000` e `20260804000001`, correspondentes às quatro migrations locais em `supabase/migrations/`. O catálogo remoto expôs sete tabelas públicas (`perfis`, `turmas`, `turma_alunos`, `atividades`, `notas`, `semanas_turma`, `vistos_semanais`), todas com RLS habilitado (nenhuma com `FORCE ROW LEVEL SECURITY`). Colunas, tipos, chaves, referências e checks observados são compatíveis com `supabase/schema.sql` e as migrations locais.

Contagens agregadas retornadas pelo banco remoto, sem nomes, IDs, e-mails ou notas individuais:

| Medida | Contagem |
|---|---:|
| Perfis de aluno | 101 |
| Perfis de professor | 2 |
| Turmas por ano: `2026` | 8 |
| Turmas por ano: `20262026` | 1 |
| Matrículas | 184 |
| Atividades | 11 |
| Provas | 7 |
| Provas Paulistas | 7 |
| Notas (linhas) | 450 |
| Semanas registradas | 39 |
| Vistos semanais | 475 |

Há cinco combinações de pesos registradas entre as nove turmas. A coluna `turmas.ano` contém um valor fora do formato aparente (`20262026`); a turma correspondente não foi identificada para preservar minimização e precisa ser conciliada com o manifesto legado antes de qualquer migração. As contagens são um retrato no instante da consulta, não devem ser usadas como importação ou seed.

Foram observadas 17 policies RLS remotas. Há divergências concretas em relação ao schema versionado: `turma_alunos` usa `private.is_professor_of_turma(...)` onde o local usa subconsulta em `turmas`; a leitura de `turmas` usa `private.is_aluno_in_turma(...)` onde o local usa subconsulta em `turma_alunos`; a policy remota de atualização de perfis de professores não aparece no schema/migrations locais. As funções `private.is_professor_of_turma` e `private.is_aluno_in_turma` são `SECURITY DEFINER` e têm `EXECUTE` efetivo para `anon` e `authenticated`; não existem nas migrations locais. Nenhuma foi chamada. A lista remota de schemas expostos ao Data API não foi consultada, então a exposição HTTP dessas funções privadas não está confirmada.

Foram listados 10 índices remotos, correspondentes a PKs e constraints unique; não há índices adicionais cobrindo chaves estrangeiras. Isso corresponde aos cinco FKs apontados pelo advisor de desempenho. Para cada uma das sete tabelas, `anon`, `authenticated` e `service_role` têm privilégios SQL de `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` e `TRIGGER`; RLS está habilitado, mas grants amplos continuam sendo divergência para avaliação em PR-03/04. O schema local não documenta grants de tabela explícitos. As funções públicas observadas foram `clean_string`, `confirm_new_user_email`, `handle_new_user`, `is_professor`, `clean_test_data` e `bulk_create_student`.

## Advisories remotos relevantes

- **Segurança:** advisory Supabase reporta cinco funções `SECURITY DEFINER` executáveis por `anon` e `authenticated`, incluindo `clean_test_data` e `bulk_create_student`. Isso confirma o risco a tratar na PR-03; nenhuma função foi chamada e nenhum grant foi alterado. Também foi reportada proteção contra senhas vazadas desabilitada.
- **Desempenho:** advisory reporta cinco chaves estrangeiras sem índice de cobertura (`atividades.turma_id`, `notas.atividade_id`, `turma_alunos.aluno_id`, `turmas.professor_id`, `vistos_semanais.turma_id`) e 17 policies com avaliação repetida de funções/settings de autenticação por linha. São itens para avaliar nas PRs de segurança/desempenho, sem mudanças nesta coleta.
- **Signup/Auth remoto (lido no dashboard):** cadastro habilitado; confirmação de e-mail habilitada; login por e-mail habilitado; login anônimo e vinculação manual desabilitados. Isso diverge de `supabase/config.toml` local, onde confirmação de e-mail está desabilitada. O advisor também informa proteção contra senhas vazadas desabilitada. As opções foram apenas observadas, sem salvar alterações.

## Divergências, incertezas e encaminhamento

1. **Domínio de produção confirmado; associação Vercel → Supabase segue sem prova direta.** O link fornecido corresponde ao deployment de produção. A URL em Vercel foi classificada como `Secret` e não pode ser revelada após salvar; a API também não decriptou o valor. O projeto Supabase único tem nome correspondente, mas isso não prova sozinho que a URL do deployment aponta para ele.
2. **Preview compartilha o alvo das variáveis com produção.** Até comprovar o contrário, não rodar E2E, seed, cleanup ou migração pelo deployment de preview.
3. **Destino descartável identificado na CI.** O runner de CI usa Supabase local com `start` e reset local; isso é o destino descartável documentado. CLI/containers não estão ativos nesta máquina; execução local reproduzível pertence a 01.9. Não há ambiente cloud de homologação identificado.
4. **Schema remoto diverge das migrations locais.** Policies usam helpers `private` não versionados e há uma policy extra para atualizar perfis. Registrar/apurar nas PRs de segurança; nenhuma correção aplicada.
5. **Ano atípico `20262026`.** Resolver a correspondência via manifesto protegido em 01.4; não alterar turma nem redistribuir notas automaticamente.
6. **Limite da comparação:** tabelas, colunas, constraints, migrations, índices, grants e expressões das policies foram inventariados. Os corpos completos de todas as funções não foram comparados com uma definição local, pois dois helpers remotos não têm arquivo/migration correspondente no repositório. Fazer essa revisão junto à correção de segurança da PR-03.

## Proveniência e ações

- Supabase MCP e dashboard: projeto/branch de produção, tabelas/constraints, migrations, índices, grants, policies, funções, advisories e contagens agregadas. Authentication → Sign In / Providers consultado sem entrar na lista de usuários nem alterar opções.
- Vercel MCP e dashboard: projeto/deployment/domínios e nomes/alvos das variáveis. Valor da URL é write-only classificado como `Secret`; tentativa pela API também retornou metadado `decrypted=false`. A consulta de domínios teve erro de API; domínios/deployment foram obtidos do detalhe do projeto e dashboard.
- Navegador: abertura do domínio informado; redirecionamento/host canônico corresponde ao domínio listado no deployment de produção Vercel. A sessão existente no navegador já estava autenticada; nenhum controle do app foi acionado.
- Verificação complementar em 21/10/2026 (America/Sao_Paulo): após atualização da conexão Vercel, a leitura pública do domínio respondeu HTTP 200. O HTML aponta para `/assets/index-BQvVihUT.js`; o bundle contém exclusivamente o host `https://nqddatrdllvfwkmfddpc.supabase.co` entre os domínios Supabase detectados. Comparação em memória também confirmou que o bundle contém a chave pública legacy `anon` ativa do projeto listado. Nenhuma chave foi gravada neste documento. Isso confirma o destino de produção sem revelar o valor `Secret` da Vercel.
- Repositório: `supabase/config.toml`, `supabase/schema.sql`, `supabase/migrations/*.sql`, `.env.example`, `.github/workflows/ci.yml`, `package.json`.
- Continuação da 01.4 em 21/10/2026: após autorização explícita do responsável, foi solicitada uma consulta somente de leitura para criar uma referência local temporária de comparação. A primeira resposta da consulta agregada não pôde ser interpretada nem foi exibida ou gravada em arquivo; a solicitação subsequente foi rejeitada pela revisão automática por envolver IDs de alunos, matrículas, atividades, notas e vistos. Não houve nova tentativa por outro caminho. As contagens agregadas deste inventário permanecem como evidência separada e não substituem o snapshot exigido para comparar o legado.
- Ações proibidas nesta coleta não ocorreram: sem reset, seed, cleanup, escrita SQL, alteração de grants/RLS, provisionamento ou leitura de linhas de alunos.

**Conclusão de 01.3:** inventário remoto e contagens agregadas feitos; Auth/signup confirmado; destino descartável de CI identificado; produção Vercel mapeada ao projeto Supabase `Media_facil` pela URL e chave pública observadas no bundle publicado. Preview usa as mesmas entradas de ambiente e, portanto, compartilha o destino de produção; não é ambiente seguro para testes. As divergências de policies/grants/índices ficam registradas para PR-03/04. Nenhuma alteração foi aplicada ao banco.
