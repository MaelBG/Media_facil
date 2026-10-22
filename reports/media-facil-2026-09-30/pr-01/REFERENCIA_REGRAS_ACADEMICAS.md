# Referência legada e decisões acadêmicas — PR-01.4

Data: 21/10/2026. Escopo: reproduzir o comportamento atual e registrar regras pendentes antes do motor único da PR-05 e da migração da PR-07. Esta referência não altera dados nem escolhe política pedagógica.

## Comportamento atual reproduzível

Os casos sintéticos estão em [`tests/fixtures/academic-reference.js`](../../../tests/fixtures/academic-reference.js). Eles usam somente identificadores artificiais e valores fictícios. Resultados conferidos com `calcWeightedAvg` em `src/utils/calculations.js`:

| Cenário | Resultado central atual | Observação |
|---|---:|---|
| Sem atividades, notas ou vistos | `0.0` | O código lateral em `src/App.jsx` retorna `3.0` com pesos padrão: atribui nota 10 às categorias de atividades e vistos vazias (15% + 15%). Nenhum dos dois resultados fica definido como nova regra por esta referência. |
| Zero real em todas as categorias | `0.0` | Há linhas com nota `0` e visto falso; zero permanece diferente de ausência. |
| Nota pendente (`valor_obtido = null`) | `0.0` | A função central inclui a linha e soma `null` como zero. A política para pendência continua pendente. |
| Prova parcial `9,5/10`; demais categorias sem registros | `4.8` | A prova contribui 4,75 com peso padrão; apresentação atual usa uma casa decimal. |
| Todas as categorias com nota 10 e pesos `20/30/30/20` | `10.0` | Exercita pesos diferentes, válidos e somando 100. |
| Aluno sem matrícula válida | Não calcular | O serviço deve negar/omitir o relatório antes da função; `calcWeightedAvg` não recebe nem valida matrícula. |
| Mesmo aluno em duas turmas | Turma A `4.0`; turma B `3.0` | Relatórios independentes; não existe média combinada entre turmas nesta regra. |

### Divergências observadas

- Categoria sem dados: a função central retorna zero; o algoritmo lateral em `App.jsx` assume nota dez em atividades e vistos quando não há registros/semanas. Com pesos padrão e relatório vazio, a diferença é `0.0` versus `3.0`.
- Pendência e zero: a função central trata nota nula como zero na composição, embora o banco permita `valor_obtido = null`. A camada lateral exclui nulos do numerador, mas mantém o máximo de todas as atividades; isso também os torna contribuição zero, sem informar que a nota está pendente.
- Entrega: a aplicação infere contagem de entrega por valor numérico positivo em alguns pontos; isso não distingue entrega sem nota, nota zero, dispensa e pendência.
- Matrícula: a função matemática não conhece escopo de turma nem elegibilidade. A autorização e a seleção do relatório precisam ocorrer antes do cálculo e ser garantidas no servidor/banco.
- Arredondamento: a função usa `toFixed(1)` para retornar texto; regras de arredondamento de classificação oficial e cálculo bruto não estão documentadas.

## Estado das regras da seção 3.5 do plano

“Definido” descreve somente o que a referência de migração preservará ou a restrição já aprovada no plano. “Proposta” é direção técnica a homologar. As demais escolhas permanecem pendentes.

| Tema | Estado | Registro para PR-05/07 |
|---|---|---|
| Regra do terceiro legado | Proposta | Usar `calcWeightedAvg` como referência numérica `legacy_v1`; comparar boletins antes/depois. Não promover a divergência lateral a regra. |
| Categoria sem avaliações | Pendente | Distinguir sem dados de zero; não criar bônus 10. Escolher entre zero, redistribuição de peso ou outra política para períodos novos. |
| Nota pendente versus zero | Parcialmente definido | A migração preserva `null` e `0` distintos. A regra de cálculo parcial e fechamento para `null` está pendente. |
| Estado de entrega e correção | Proposta | Separar estado de entrega do valor da nota. Confirmar enumerações e transições; dado legado sem evidência fica “não informado”. |
| Arredondamento | Pendente | Definir precisão interna, casas apresentadas e uso de valor bruto/arredondado para limites e situação. |
| Limites de nota | Proposta | Validar valor finito entre zero e o máximo da atividade; confirmar exceções e comportamento em importação. |
| Pesos | Parcialmente definido | Cada conjunto válido soma 100, é finito/não negativo e pertence ao período. Alterações após publicação exigem revisão auditável. |
| Situação durante o bimestre | Pendente | Distinguir sem avaliações, acompanhamento e abaixo da meta; homologar limiares e parciais. |
| Fechamento/publicação | Proposta | Separar contexto selecionado, período aberto/fechado e resultado publicado; publicar revisão imutável. A regra institucional está pendente. |
| Recuperação e média anual | Pendente | Preservar nota original e guardar recuperação separadamente; não inferir substituição nem média anual. |

## Manifesto do legado

O modelo versionado sem IDs reais está em [`MANIFESTO_LEGADO_MODELO.json`](MANIFESTO_LEGADO_MODELO.json). A origem do terceiro bimestre é a declaração do responsável pelo projeto. O ano deve ser validado turma por turma: `2026` é esperado; o registro remoto com ano textual `20262026` permanece ambíguo e não será corrigido por inferência.

A classificação de turmas está em `/private/tmp/media-facil-pr-01-4/manifesto-legado.json`, fora do Git, com diretório `0700` e arquivo `0600`. Ela contém os nove IDs de turma, ano original, pesos e atribuição ao terceiro bimestre informada pelo responsável. Oito anos `2026` ainda aguardam validação institucional; o ano `20262026` está marcado como ambíguo.

A referência de comparação dos registros reais ainda não foi criada. Ela exigiria IDs de matrícula, atividade, nota, aluno e semana, além de valores e estados. O responsável autorizou explicitamente uma leitura somente de referência para arquivo local temporário privado. A primeira resposta da consulta agregada não pôde ser interpretada; não foi exibida nem gravada em arquivo. Uma solicitação subsequente foi rejeitada pela revisão automática por envolver cópia em massa de identificadores de alunos e registros acadêmicos. Não dividi a consulta nem tentei obter os mesmos dados por outro caminho. Nenhum nome, e-mail, senha, token ou dado real de nota foi incluído nos arquivos versionados ou no manifesto local atual. Não executar backfill nesta subtarefa. A comparação real depende de um método aprovado; se a turma de ano ambíguo não puder ser classificada por evidência institucional, ela ficará suspensa da migração até validação.
