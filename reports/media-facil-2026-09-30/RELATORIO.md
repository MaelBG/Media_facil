# Relatório de análise — Média Fácil

Data: 30 de setembro de 2026. Escopo: projeto disponível em `C:/Users/ismae/Documents/Media_facil`, incluindo login, portais do professor e do aluno, perfis, componentes, serviço de dados, migrações, testes e CI.

## 1. Conclusão executiva

O Média Fácil apresenta uma base útil de diário de classe: gestão de turmas, notas, atividades, vistos e acompanhamento individual. A identidade visual é coerente com o contexto educacional, e a composição da média é um diferencial relevante.

Entretanto, a versão analisada combina funcionalidades reais com indicadores estáticos, regras divergentes e recursos de demonstração. Recomendo tratar segurança, consistência dos resultados acadêmicos e uso em celular como condições para ampliar o uso do produto. Um redesenho apenas visual preservaria problemas que afetam diretamente a confiança de professores e alunos.

Ordem sugerida: **acesso seguro → regras acadêmicas consistentes → persistência confiável → interface responsiva e acessível → produtividade → expansão do produto**.

## 2. Método e limites

- Revisão do código React, estilos, documentação, serviço local/Supabase e arquivos SQL.
- Navegação manual no navegador integrado usando exclusivamente contas e dados da demonstração local.
- Inspeção do login, painel docente, boletim, aba de provas, resumo do aluno e detalhe da disciplina.
- Medição do layout em larguras de 390 e 1.440 px e observação visual na janela padrão de aproximadamente 855 px.
- Execução de lint, build, oito testes unitários existentes e auditoria npm.
- Consulta de referências oficiais de acessibilidade, autorização e requisitos de execução.

Nenhuma URL de produção ou página anexada foi fornecida; o contexto indicava nenhuma Page aberta. A análise considera o projeto desta pasta. Não consultei dados reais, não executei funções destrutivas do banco, não alterei notas reais e não apliquei melhorias ao código.

As fragilidades SQL abaixo são verificadas nos arquivos do repositório. Sua presença em produção depende de quais migrações foram aplicadas, dos privilégios efetivos e das configurações de autenticação. Não foi realizada exploração nem auditoria do banco remoto. A revisão de acessibilidade é técnica e visual, não uma certificação WCAG. Não medi desempenho em dispositivos reais ou redes móveis, nem Core Web Vitals de produção. O modo escuro foi revisado nos estilos; não foi submetido a uma bateria visual completa.

## 3. Inventário de funcionalidades

| Área | Implementação encontrada | Avaliação |
|---|---|---|
| Login | E-mail/senha, mensagens, carregamento e bloqueio local após cinco falhas | Fluxo básico presente; falta recuperação de senha e orientação mais clara |
| Turmas | Criar, editar, excluir, listar por cartões e acessar pelo menu | Implementação presente; resumo tem dados incorretos e contagem quebrada |
| Alunos | Cadastro, vínculo a turmas, edição, remoção e busca por nome/matrícula | Boa base; permissões de edição no banco não correspondem ao fluxo da interface |
| Boletim | Componentes de nota, média ponderada e situação | Útil, mas regras e indicadores divergem entre telas |
| Provas/projetos | Colunas, edição/exclusão, notas numéricas e ordenação | Adequado ao diário; salvamento e validação precisam ser robustos |
| Prova Paulista | Categoria própria com peso configurável | Boa separação; sem política explícita para avaliação não realizada |
| Atividades | Checklist que alterna nota máxima e ausência de nota | Simples, mas incapaz de representar claramente entregas parciais |
| Vistos | Semanas, marcações por aluno e exclusão | Funcionalidade prática; ações pequenas e organização por datas incompleta |
| Pesos | Modal com soma obrigatória de 100% | Boa validação na interface; precisa de equivalente na camada de dados |
| Ordenação | Nome, componentes, média final e colunas específicas | Presente; cabeçalhos não são operáveis de forma adequada por teclado |
| Portal do aluno | Resumo, disciplinas, notas, vistos e composição da média | Principal diferencial; contradições nas entregas e explicações de cálculo |
| Perfis | Nome/e-mail conforme papel, senha, avatar e dados institucionais | Alteração de e-mail não acompanha Supabase Auth; mudança de senha deve ser separada |
| Tema | Preferência clara/escura persistida | Tokens presentes; pares de cor de botões exigem revisão |
| Navegação | Estado em query string e histórico do navegador | Base presente; falta validação de rotas, permissões e preservação da aba docente |
| Dados | Supabase quando configurado; simulação em localStorage quando ausente | São modos distintos; não existe sincronização offline comprovada |
| Observabilidade | Vercel Analytics e Speed Insights | Integração presente; não substitui rastreamento de falhas de salvamento |

Não identifiquei implementação de exportação de boletim, importação de alunos, histórico de alterações de notas, publicação/fechamento por período, notificações, recuperação de senha ou sincronização entre dispositivos em tempo real. São propostas de evolução, não funções já existentes.

## 4. Problemas funcionais e de confiança

### F01 — Média geral fixa no painel docente — P1

`src/pages/Teacher/Dashboard.jsx:136` exibe literalmente **8.2**. O número apareceu no navegador, independentemente das turmas e notas. Um indicador acadêmico deve ser calculado ou apresentar “Sem dados”. Também é necessário definir se a média geral considera alunos, disciplinas ou turmas com pesos iguais, para evitar uma estatística ambígua.

### F02 — Número de alunos ausente nos cartões — P1

`Dashboard.jsx:167` chama `dbService.getStudentsByClass`, uma função assíncrona, durante a renderização e usa `.length` no resultado. Esse resultado é uma Promise. O navegador mostrou apenas “Alunos”, sem quantidade. A chamada também pode provocar consultas repetidas a cada renderização. Carregar totais junto com as turmas ou obter uma agregação antes de renderizar.

### F03 — Cálculos divergentes — P1

O cálculo central (`src/utils/calculations.js`) atribui zero às categorias vazias. O cálculo da barra lateral em `src/App.jsx` atribui dez às atividades e aos vistos quando não existem registros. A explicação no portal do aluno também concede dez nesses dois casos.

Reprodução por cálculo: para um aluno sem avaliações, atividades ou semanas, com pesos 50/20/15/15, a função central retorna **0,0**, enquanto o algoritmo lateral produz **3,0**. A explicação do aluno pode mostrar contribuições de +1,50 e +1,50 e terminar com 0,0.

Além disso, as médias de provas exibidas em algumas partes ignoram notas pendentes, enquanto o cálculo final inclui o valor máximo dessas provas no denominador. Com duas provas de dez pontos, uma nota oito e outra pendente, a média parcial exibida pode ser oito e sua contribuição sugerida quatro; o cálculo final atribui dois pontos à categoria com peso de 50%.

Criar uma única função que devolva notas dos componentes, contribuições, resultado e estado de completude. Todas as telas devem consumir esse resultado. A decisão sobre pendências deve ser pedagógica e explícita, não consequência de filtros diferentes.

### F04 — Entregas parciais com estados contraditórios — P1

Para Ana Silva na demonstração, a atividade de 9,5/10 aparece entre as entregas no resumo, mas como pendente no detalhe. O resumo exibe **2/2 entregues**; o detalhe mostra **1/2**, e a composição volta a mostrar **2/2**. A interface alterna entre “nota não nula”, “nota positiva” e “nota igual ao máximo”.

Separar o estado da entrega da nota: pendente, entregue, parcial, dispensada e corrigida, conforme a necessidade real. Uma nota parcial não deve apagar a informação de que houve entrega. O checklist docente atual só alterna nota máxima e ausência.

### F05 — Situação definitiva durante o período — P1

“Aprovado”, “Recuperação” e “Reprovado” são derivados diretamente de limites fixos em seis e quatro, inclusive sem fechamento do período. Proponho “Em acompanhamento”, “Abaixo da meta” ou “Sem avaliações” durante o período, e situação definitiva apenas após fechamento/publicação. Limites e arredondamento devem ser configurados e documentados.

### F06 — Salvamento pode informar sucesso sem persistência — P1

`src/db.js:570` não verifica o objeto `error` retornado pelo Supabase no delete/upsert de notas e retorna sucesso. Em `ClassView.jsx:321`, cada alteração envia uma gravação e agenda recarga integral da turma após 300 ms. Esse atraso é posterior à gravação; não é debounce. Há risco de estado antigo sobrescrever o recente e falhas ficarem restritas ao console.

Manter um valor de edição imediato, serializar gravações da mesma célula, conferir erros, reconciliar a célula alterada e mostrar “Salvando”, “Salvo” ou “Falha — tentar novamente”. Se houver atualização otimista, implementar reversão no erro. Requisições antigas precisam ser descartadas quando muda a turma.

### F07 — Cadastro/edição de alunos incompletos no modo cloud — P1

A interface permite editar alunos, mas as migrações revisadas autorizam UPDATE de `perfis` apenas ao próprio titular. O professor pode ler perfis, mas isso não autoriza sua edição. Esse fluxo precisa de uma operação limitada aos alunos vinculados ao docente e aos campos autorizados.

A alteração de e-mail atualiza `public.perfis`, sem atualizar a identidade do Supabase Auth. O e-mail mostrado pode deixar de ser o que permite login. Manter uma fonte de verdade e usar o fluxo oficial de alteração e confirmação de e-mail.

O cadastro cria conta e depois vínculo em etapas. Se a matrícula falhar, pode restar uma conta sem vínculo. O fluxo deve ser idempotente e recuperável, com indicação clara de cada etapa.

### F08 — Navegação e atalhos — P2

A opção “Nova Turma” está na barra lateral de todas as telas docentes, mas o modal é renderizado somente no painel de turmas. Ao acionar o atalho dentro do diário/perfil, o estado muda sem modal visível. Mover o modal ao layout compartilhado ou navegar para o painel com a intenção de criação.

As abas docentes não são preservadas na URL. O parâmetro `view` não é validado contra uma lista de rotas ou o papel do usuário. O carregamento inicial depende de leitura manual do armazenamento e não há assinatura de eventos de Auth. Implementar guardas, estado de sessão resolvida, tratamento de rota inexistente e restauração de aba/filtros.

### F09 — Demonstração e documentação — P2

O botão rápido do professor preenche senha diferente da presente no seed local; o botão do aluno usa um endereço inexistente nesse seed. Há vínculos/atividades para `turma-2`, mas essa turma não existe na lista inicial.

O README anuncia atualização em tempo real, normalização automática e arquitetura com funções privadas. Não identifiquei assinatura Realtime no cliente; o modal exige soma de 100% em vez de normalizar; os helpers privados citados não aparecem no SQL revisado. Atualizar a documentação conforme o comportamento entregue.

## 5. Segurança e integridade dos dados

### S01 — RPC privilegiada de cadastro — P0

`supabase/migrations/20260804000001_create_student_user_rpc.sql` cria `public.bulk_create_student` como `SECURITY DEFINER`. Não há verificação interna de autenticação, papel docente ou propriedade das turmas. A função pode alterar perfil existente e vincular usuários às turmas recebidas. Ela também cria usuários com senha inicial fixa.

Há concessão a `authenticated`, mas não há revogação explícita do privilégio padrão de `PUBLIC`. Em uma instalação com privilégios padrão, o acesso pode ser ainda mais amplo. Conferir os grants efetivos e corrigir antes de expor esse fluxo. Cadastro deve usar operação administrativa autorizada no servidor, com convite ou senha temporária individual e política adequada de primeiro acesso.

### S02 — Limpeza de testes acessível a usuários autenticados — P0

`20260720000000_refine_perfis_rls.sql:44` define `clean_test_data` com privilégios elevados e concede execução a qualquer usuário autenticado. Não verifica papel, ambiente ou propriedade. A seleção inclui nomes terminados em “Editada” e “Editado”, podendo alcançar registros legítimos.

Remover a função do acesso dos clientes e da implantação de produção. A limpeza deve rodar apenas na infraestrutura de testes, sobre registros identificados por execução em banco isolado.

### S03 — Papel derivado de metadados de cadastro — P0 condicionado ao signup

O trigger inicial usa `raw_user_meta_data.tipo` para definir o papel em `perfis`. Essa origem pode ser controlada por quem cria a conta. Se o signup estiver aberto e esse trigger ativo, a restrição posterior de UPDATE não evita um papel privilegiado criado inicialmente.

Criar perfis comuns como aluno por padrão. Concessão de papel docente deve partir de operação administrativa confiável, sem aceitar essa escolha no payload público de cadastro.

### S04 — Políticas não correspondem ao isolamento anunciado — P1

A migração de leitura permite a um professor ver todos os perfis, não apenas alunos de suas turmas. Ao remover políticas antigas, não adiciona uma permissão específica para alunos lerem os perfis de seus professores; o portal pode perder nome/escola do docente no modo cloud.

As políticas de `turmas` e `turma_alunos` consultam reciprocamente essas tabelas, exigindo teste de recursão em uma instalação limpa. RLS habilitada é uma boa base, mas não comprova autorização correta. Testar leituras e mutações permitidas e negadas para anônimo, aluno, professor proprietário e outro professor.

### S05 — Validações de banco insuficientes — P1

O banco valida nota não negativa, mas não impõe o máximo da avaliação no trecho revisado. `valor_maximo` não tem uma restrição de positividade; o JSON de pesos não tem validação de valores e soma. Proteger essas invariantes em operação transacional/trigger apropriado e em constraints onde possível. A interface é apenas uma das formas de acessar a API.

### S06 — Simulação local e bloqueio de login — P1/P2

O modo local guarda senhas de demonstração em texto simples e permite manipular dados no navegador. Ele deve ser ativado explicitamente e identificado como demonstração. Em produção, ausência de configuração deve produzir erro de configuração, não uma troca silenciosa de backend.

O bloqueio após falhas usa `sessionStorage`; não limita chamadas diretas ao serviço de autenticação e pode ser reiniciado. Manter como feedback de interface, com proteção real configurada no serviço.

### S07 — Dependências — P1

`npm audit` apontou cinco pacotes com alertas: quatro de severidade alta e um moderado. Pacotes: `postcss`, `nanoid`, `browserslist`, `brace-expansion` e `baseline-browser-mapping`. Os caminhos de exploração precisam ser avaliados; esse total não significa cinco vulnerabilidades exploráveis no navegador. A maioria está associada à cadeia de ferramentas. O npm informou correções disponíveis. Atualizar de maneira controlada e repetir build/testes; não aplicar correção forçada sem revisar mudanças.

## 6. Avaliação de design e experiência

### Identidade e hierarquia

A combinação de azul acadêmico, verde e superfícies claras é apropriada. A fonte Plus Jakarta Sans, títulos fortes, bordas arredondadas e espaçamento consistente criam uma identidade reconhecível. Convém preservar essa base.

Os cartões de indicadores dão destaque aos números, mas o cartão explicativo “Cálculo Inteligente” consome espaço de trabalho. Substituí-lo por informações úteis: pendências, cobertura das avaliações ou alterações não salvas. A saudação observada “Olá, Prof.!” resulta de dividir o nome no primeiro espaço; usar o nome preferido.

A tela do diário expõe código interno da turma, pesos em texto muito longo e abas extensas. O nome da turma, disciplina e período devem dominar. Pesos podem virar uma ação “Critérios de avaliação” com resumo compacto. Identificadores técnicos podem ficar nos detalhes administrativos.

### Responsividade

O problema mais grave de design é estrutural. A sidebar usa `w-64 fixed` e as telas `ml-64 p-10` em todos os tamanhos. A grade de cartões muda com breakpoints, mas o layout geral não.

Medição: em 390 px, o documento do diário atingiu 1.372 px; em 1.440 px, a aba de provas atingiu 1.616 px. Há transbordamento do documento, além da rolagem prevista da tabela. Na janela de aproximadamente 855 px, títulos e disciplinas ficam truncados e o diário exige rolagem horizontal global.

Proposta: navegação lateral no desktop, gaveta no celular, recuo apenas a partir do breakpoint apropriado e conteúdo com `min-width: 0`. A página deve caber no viewport. A rolagem horizontal, quando indispensável, deve ficar restrita à tabela, com indicação visual e primeira coluna fixa. No celular, oferecer lista por aluno ou avaliação e abertura do detalhe, reduzindo a necessidade de operar uma planilha inteira.

### Tipografia e densidade

Há metadados de 9–11 px e muitos rótulos em caixa alta. O login depende de texto pequeno para explicar a convenção de acesso. Nas tabelas, nomes, matrículas e e-mails competem por espaço; classes como `text-caption` não estão definidas nos tokens revisados, podendo herdar tamanho inesperado.

Usar corpo de 14–16 px, metadados legíveis, números tabulares e escala tipográfica consistente. Priorizar nome e matrícula no diário; e-mail pode ficar no detalhe. Encurtar abas para “Boletim”, “Provas”, “Paulista”, “Atividades” e “Vistos”, com descrição contextual abaixo.

### Ações e feedback

Editar/excluir aparecem frequentemente só no hover e têm áreas pequenas. Em toque, isso prejudica descoberta. Usar botão de ações por linha/cartão com tamanho consistente, disponível por toque e teclado. Manter ações destrutivas em segundo nível. A confirmação por nome de turma já é uma boa proteção contra enganos; evolução preferível é arquivamento/recuperação quando fizer sentido.

Trocar `alert`/`confirm` dispersos por diálogos consistentes e mensagens no contexto. “Autosalvamento Ativo” deve comunicar capacidade do sistema, mas o estado real de cada gravação precisa ser visível. Uma falha não pode parecer sucesso.

### Acessibilidade

Encontrei campos de formulário com label visual sem associação `htmlFor/id`, células numéricas e checkboxes sem identificação de aluno/avaliação, cabeçalhos de ordenação implementados com clique no `<th>`, e modais sem semântica e gestão explícita de foco.

Na aba de provas examinada, quatro inputs não tinham label associado nem `aria-label`. Não é suficiente que o nome do aluno esteja em outra célula visualmente próxima.

Implementar labels associados; botões de ordenação com `aria-sort` no cabeçalho; nomes como “Nota de Ana Silva na Prova Bimestral 1”; navegação de abas por teclado; `dialog` acessível com título, foco inicial, contenção e retorno de foco; mensagens de estado anunciadas; textos claros para ausência de registros. Usar WCAG 2.2 AA como referência e validar teclado, zoom e leitor de tela.

### Modo escuro

O projeto tem tokens para tema escuro, mas também ajustes globais com `!important` e componentes com `text-white` sobre cores que clareiam nesse tema. Azul `#7da8e6` com branco tem contraste aproximado de 2,44:1; verde `#6ec4a6` com branco, 2,08:1. Esses pares não atendem ao contraste usual de texto normal. Usar os tokens `on-primary` e `on-secondary` nos componentes e medir os pares efetivamente renderizados, incluindo hover, foco e desabilitado.

Consolidar tokens no CSS utilizado pelo Tailwind 4 e reduzir divergência entre `DESIGN.md`, configuração legada e implementação. Revisar se Inter e Material Symbols são necessários junto com Plus Jakarta Sans e Lucide, evitando recursos redundantes.

### Conteúdo e contexto pedagógico

Corrigir “e-mail é formato por” e “controle de visto active”; exibir datas no formato brasileiro; distinguir visto de caderno de frequência às aulas; remover o link técnico “Diretrizes (DESIGN.md)” do menu operacional ou substituí-lo por ajuda real. Período e calendário não devem depender de strings fixas de 2026.1/2026.

## 7. Arquitetura, desempenho e qualidade

Pontos positivos: separação de componentes, carregamento lazy de telas, build compacto para o escopo, lint configurado e testes de cálculo existentes. O chunk inicial produzido tem aproximadamente 241 kB antes de compressão e 73,44 kB gzip; esse tamanho isolado não determina experiência de carregamento.

Pontos a melhorar:

- `App.jsx` concentra sessão, navegação, carregamento e cálculos. Extrair domínios e hooks, mantendo uma fonte única para regra acadêmica.
- `db.js` mistura simulação e cloud e nem sempre trata erros. Padronizar contratos e adapters equivalentes.
- `loadStudentData` pede relatório inicial e depois outro por matéria; cada relatório cloud repete várias consultas. Agregar dados, reaproveitar perfil/matrículas e consultar notas no escopo necessário.
- Gravações recarregam todos os dados da turma; atualizar só o registro alterado e invalidar o necessário.
- Ordenações fazem buscas e cálculos repetidos. Indexar notas/vistos em memória e memorizar resumos apenas após medir impacto.
- Evitar virtualização prematura; considerar com volume real de alunos/colunas e testes de teclado.
- Não existe assinatura Realtime encontrada. Se houver demanda de atualização entre professor/aluno, implementar eventos e invalidação com autorização correta, ou declarar atualização por recarga.
- Ausência de chaves ativa simulação; isso não é fallback offline para dados cloud. PWA/offline verdadeiro exige cache, fila de alterações e resolução de conflitos, como projeto separado.
- CI executa lint/build e reset de migrações, mas não os testes Playwright existentes. Incluir testes unitários, E2E e RLS em ambiente isolado.
- README indica Node 18 e CI usa Node 20 genérico, enquanto Vite atual exige mínimos mais altos. Declarar engines e fixar versão compatível com o lockfile e a documentação oficial.

## 8. Validação realizada

| Verificação | Resultado | Limite |
|---|---|---|
| `npm run lint` | Passou | Não comprova regras de produto ou autorização |
| `npm run build` | Passou | Não comprova funcionamento do banco remoto |
| Testes unitários existentes | 8/8 passaram | Cobrem a função central, não todas as telas |
| Login/logout de demonstração | Funcionaram com credenciais do seed | Botões rápidos não são consistentes com o seed |
| Diário/boletim/aba de provas | Renderizaram | Transbordamento e falhas de acessibilidade presentes |
| Portal do aluno/detalhe | Renderizaram | Contagem de entregas divergente reproduzida |
| Console durante inspeção | Aviso de configuração ausente; sem erro de execução capturado no trecho examinado | Não equivale a uma execução completa de todos os fluxos |
| Auditoria npm | 5 pacotes alertados | Exposição deve ser avaliada por caminho de uso |
| Supabase remoto/RLS | Não executado | Achados baseados nos arquivos do repositório |
| E2E completo | Não executado | Credenciais e limpeza exigem ambiente de testes corrigido/isolado |

## 9. Evidências principais

| Evidência | Localização |
|---|---|
| Média fixa / Promise na contagem | `src/pages/Teacher/Dashboard.jsx:136` e `:167` |
| Regra lateral divergente | `src/App.jsx:264` |
| Regra central | `src/utils/calculations.js:11` |
| Parcial de provas e gravações | `src/pages/Teacher/ClassView.jsx:134` e `:321` |
| Contagens e composição do aluno | `src/pages/Student/Dashboard.jsx:42`, `:219` e `:426` |
| Erros de gravação ignorados | `src/db.js:570` |
| Alteração de perfil e e-mail | `src/db.js:931` e `:1044` |
| Layout fixo | `src/components/Sidebar.jsx:34` e `:216`; telas com `ml-64` |
| Ordenação sem botão acessível | `src/pages/Teacher/components/SortableHeader.jsx:27` |
| Função de cadastro privilegiada | `supabase/migrations/20260804000001_create_student_user_rpc.sql:3` |
| Limpeza de testes privilegiada | `supabase/migrations/20260720000000_refine_perfis_rls.sql:44` |
| Origem do papel no cadastro | `supabase/migrations/20260713105000_initial_schema.sql:250` |
| Testes fora da CI | `.github/workflows/ci.yml` |

Capturas locais: `diario-mobile.png`, `diario-tablet.png` e `aluno-resumo.png`, nesta pasta. São evidências da demonstração, não dados de produção.

## 10. Plano de implementação

Prioridades: P0 = corrigir antes de ampliar exposição; P1 = confiabilidade/fluxo principal; P2 = usabilidade e produtividade; P3 = expansão. Estimativas são esforço de desenvolvimento, não prazo contratual. Premissa: uma pessoa com domínio de React/Supabase, acesso a staging e apoio do responsável pedagógico para regras. Reservar aproximadamente 20–30% adicional para integração e homologação. Ajustar após decisões e diagnóstico do banco real.

### Etapa 0 — Baseline e decisões — 1–2 dias

1. Preparar ambiente de testes isolado e identificar migrações/grants realmente aplicados.
2. Definir: categorias sem avaliações, nota pendente versus zero, entrega parcial, arredondamento, limites e publicação de resultados.
3. Definir relação entre escola, turma, disciplina e período; preservar IDs atuais e preparar migração gradual.
4. Registrar conjunto de dados de referência e reprodução dos problemas desta análise.

Entrega: especificação curta das regras, fixtures determinísticas e mapa do ambiente. Critério: mesma entrada tem resultado esperado registrado e aprovado pelo responsável pedagógico.

### Etapa 1 — Segurança e dados — 3–5 dias

1. Remover acesso de clientes à limpeza de testes; impedir inclusão desse recurso em produção.
2. Substituir/proteger RPC de cadastro: autenticação, papel, propriedade de todas as turmas, grants mínimos e idempotência.
3. Corrigir origem do papel no signup e fluxo de concessão de professor.
4. Revisar SELECT/INSERT/UPDATE/DELETE por vínculo e testar recursão das políticas.
5. Criar fluxo autorizado para edição de alunos e manter e-mail de Auth consistente.
6. Validar máximos, notas, pesos e matrícula nas operações do banco.
7. Atualizar dependências afetadas, revisar lockfile e executar validações.

Entrega: migrações versionadas e testes de autorização. Critério: anônimo/aluno/outro professor não realizam mutações administrativas nem acessam dados fora do escopo; professor proprietário realiza ações previstas. Rollback: ensaio em staging, backup antes da migração, plano específico de reversão para alterações de dados.

### Etapa 2 — Regras e salvamento — 4–6 dias

1. Centralizar cálculo e status num módulo que devolva componentes, contribuições e média.
2. Substituir média fixa e resolver totais assíncronos das turmas.
3. Unificar entrega/status e corrigir resumo/detalhe/boletim/sidebar.
4. Implementar draft de célula, fila/debounce adequado, tratamento de erro e confirmação de persistência.
5. Evitar recarga integral; proteger contra respostas antigas e troca rápida de turma.
6. Corrigir atalhos, demonstração, rotas e eventos de sessão.

Entrega: fluxo acadêmico consistente. Critério: boletim, detalhe, sidebar e exportações futuras usam o mesmo resultado; gravação recusada é anunciada e pode ser repetida; digitação rápida não perde o último valor. Testes: categorias vazias, zeros reais, notas pendentes/parciais, pesos, arredondamento nos limites e concorrência/falhas.

### Etapa 3 — Design, celular e acessibilidade — 4–6 dias

1. Criar layout compartilhado com sidebar no desktop e gaveta no celular.
2. Corrigir flex sizing/transbordamento; limitar rolagem às tabelas e fixar a coluna do aluno.
3. Encurtar abas e reorganizar filtros, período e ações principais.
4. Criar componentes padronizados de campo, botão, badge, diálogo, estado vazio e feedback.
5. Associar labels, identificar células e permitir ordenação/abas/modais por teclado.
6. Revisar contrastes nos dois temas, tipografia, tamanho das ações e movimento reduzido.
7. Revisar linguagem e substituir informação técnica por ajuda operacional.

Entrega: protótipo aplicado ao fluxo principal e homologação. Critério: páginas em 360/390/768/1.024/1.440 px sem rolagem horizontal global; exceção restrita à tabela quando necessária. Fluxos principais operáveis por teclado; foco visível e devolvido; pares de texto conforme WCAG AA. Validar também zoom, leitor de tela e toque real.

### Etapa 4 — Produtividade — 5–8 dias

1. Importar alunos por CSV com prévia, mapeamento de colunas, validação e deduplicação.
2. Exportar boletim CSV e versão para impressão/PDF com data, período e critérios.
3. Filtros por pendência e situação; busca de turma/disciplina.
4. Marcação em lote com revisão e reversão quando aplicável.
5. Histórico de alteração de notas com ator, momento, antes/depois e motivo de correções após fechamento.
6. Recuperação de acesso e convite/primeiro acesso, após definir se os endereços escolares recebem mensagens.

Entrega: reduzir tarefas repetitivas sem enfraquecer validação. Critério: importação não duplica cadastros; exportação reproduz a tela; operação em lote tem limites e resultado por item; alterações ficam rastreáveis e protegidas por papel.

### Etapa 5 — Gestão pedagógica e evolução — 8–12 dias

1. Modelar períodos, fechamento, publicação e recuperação, com migração gradual.
2. Painel de pendências do aluno e evolução por período com dados suficientes.
3. Resumos docentes com avaliações ainda não corrigidas e estudantes abaixo da meta.
4. Avaliar Realtime quando houver benefício de atualização entre usuários.
5. Considerar notificações com preferências e PWA/offline apenas após estabilizar regras e persistência.

Entrega: módulos incrementais. Critério: resultados publicados são distinguíveis de notas em andamento; fechamento impede edição casual e permite correção auditada; notificações respeitam destinatário e preferências. Offline precisa de fila e política de conflitos própria antes de ser anunciado.

### Sequência, dependências e primeiro ciclo

Etapa 0 precede mudanças de regra. Etapa 1 precede novas operações administrativas. Etapa 2 precede exportações, gráficos e notificações. A prototipação da etapa 3 pode começar cedo; sua integração deve consumir os contratos estabilizados. Etapas 4 e 5 dependem de homologação dos fluxos principais.

Primeiro ciclo sugerido, de aproximadamente dez dias úteis: dias 1–2 para baseline/decisões; dias 3–5 para riscos P0 e testes de autorização; dias 6–8 para cálculos, indicadores e gravação; dias 9–10 para corrigir o layout mobile principal e integrar testes à CI. Se o banco exigir reconstrução das políticas ou migração de dados, ampliar esse ciclo antes de abrir escopo adicional.

Esforço total indicativo das etapas: **25–39 dias úteis**, mais reserva de homologação/integração. Esta faixa depende especialmente da modelagem de períodos, do cadastro de usuários e da extensão desejada de relatórios. Não inclui como entrega fechada um modo offline completo.

### Indicadores de sucesso e validação contínua

- Zero divergência para fixtures entre componentes, contribuições, sidebar e média final.
- Toda falha de gravação detectada, comunicada e recuperável nos testes controlados.
- Zero acesso indevido nos cenários negativos de RLS/RPC.
- Zero rolagem horizontal do documento nos breakpoints homologados.
- Fluxos de consulta, lançamento e configuração completos por teclado.
- Medir tempo para lançar uma turma e taxa de retrabalho antes/depois; definir metas a partir dessa baseline.
- CI obrigatória: lint, build, cálculo, integração de dados e testes de autorização; E2E com dados isolados, determinísticos e limpeza fora da API do produto.
- Liberar incrementalmente em staging, homologar com professores/alunos e acompanhar falhas de salvamento após cada versão.

## 11. Referências externas

- Supabase — RLS, grants e testes: https://supabase.com/docs/guides/database/postgres/row-level-security
- W3C — WCAG 2.2 e critérios de acessibilidade: https://www.w3.org/WAI/WCAG22/quickref/
- Vite — requisitos atuais de execução: https://vite.dev/guide/

As recomendações de produto são propostas para este projeto. As referências embasam critérios técnicos; não comprovam o estado do ambiente de produção.
