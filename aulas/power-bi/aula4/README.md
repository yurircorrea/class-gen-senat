# Aula — Análise de Dados com Power BI: Modelagem de Dados (Aula 4)

Página única da quarta aula do curso Análise de Dados com Power BI, para ser projetada e rolada
durante a aula. Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de
internet.

**Curso e aula:** Análise de Dados com Power BI, Aula 4 · **Instrutor:** Yuri Reis Correa,
Instrutor de Tecnologia · **SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema em duas partes. Parte 1, o Dashboard Financeiro: receita e pagamentos com CALCULATE, imposto,
lucro e o gráfico de cascata, a margem na rosca e três visuais personalizados (Image Grid,
Enlighten Data Story e Scroller) sobre o plano de fundo. Parte 2, a modelagem de dados: chave
primária e estrangeira, relações 1:1, 1:N e N:N, limpeza da BaseDevoluções, colunas calculadas
com IF, relacionamentos na Exibição de modelo (arrastando, em Gerenciar relações e com a detecção
automática) e medidas entre tabelas com SUMX e RELATED.

## Material de origem

| Arquivo | Uso na aula |
|---|---|
| `material/power-bi/aula4/Parte1 - Roteiro do Professor.txt` | **Roteiro da Parte 1**, seguido na ordem nas seções 01 a 07. Não é mostrado aos alunos nem oferecido para download. |
| `material/power-bi/aula4/Parte1 - BaseFinanceiro.xlsx` | 2.725 movimentações de 2020 e 2021 (todas as linhas em `js/dados-financeiro.js`). Para baixar em Materiais da Aula e na atividade. |
| `material/power-bi/aula4/Parte1 - Imagens/*.png` | Os logotipos dos 5 bancos. Para baixar em Materiais da Aula (com cópia embutida em `js/materiais.js`, porque o navegador abre PNG em vez de baixar quando a página está em `file://`). Versões reduzidas em `img/banco-*.png` alimentam o Image Grid simulado. |
| `material/power-bi/aula4/Parte1 - Plano de Fundo.png` | O fundo do dashboard (1280 × 720). Para baixar (também embutido); cópia em JPEG em `img/fundo-financeiro.jpg` para o simulador da seção 07. |
| `material/power-bi/aula4/Parte1 - Gabarito.pbix` | O Dashboard Financeiro pronto. Posições, cores da rosca (`#365160`/`#F1F1F1`), texto do Data Story, fundo do Scroller e título "Lucro Mensal" foram lidos do arquivo. Para baixar. |
| `material/power-bi/aula4/Parte2.pdf` | Slides da Parte 2 (modelagem, chaves, 1:1, 1:N, N:N com tabela intermediária, passos no Power BI, boas práticas): seções 08, 09 e 14. Não fica para download. |
| `material/power-bi/aula4/Parte2 - Roteiro do Professor.txt` | **Roteiro da Parte 2**, seções 10 a 14. Não fica para download. |
| `material/power-bi/aula4/Parte2 - Vendas.xlsx`, `Devoluções.xlsx`, `Produtos.xlsx`, `Lojas.xlsx`, `Clientes.xlsx` | As cinco tabelas do modelo (23.794 vendas, 1.140 devoluções, 24 produtos, 13 lojas, 822 clientes), em `js/dados-modelo.js`. Todas para baixar. |
| `material/power-bi/aula4/Parte2 - Gabarito.pbix` | O modelo relacionado com os gráficos de vendas e devoluções (seção 14). Para baixar. |

A identidade visual da página é a do SEST SENAT. As cores do plano de fundo, da rosca e do Scroller
aparecem só dentro do dashboard simulado, porque são as do gabarito que a turma vai reproduzir.

## Pontos para conferir

1. **Nomes das medidas.** A página usa os nomes do roteiro; os gabaritos usam outros:

   | Roteiro e página | Gabarito Parte 1 |
   |---|---|
   | Pagamentos | Despesas |
   | % Margem · Complemento Margem | Margem · Margem Auxiliar |
   | Qtd Movimentações · Transações Pix · % Pix | Transações · Transações PIX · % PIX |

   Na Parte 2, o gabarito chama Total Itens Vendidos de "Quantidade Vendida" e Total Devoluções de
   "Itens Devolvidos". O cartão do gabarito na seção Materiais avisa da diferença em Despesas.
2. **"Calculete"** no roteiro é erro de digitação de CALCULATE. A página usa CALCULATE e mostra o
   erro "A função 'Calculete' não existe." como armadilha da seção 01. O roteiro também escreve
   `0,15`; no DAX o decimal é com ponto (`0.15`), e a vírgula dá "A sintaxe para ',' está
   incorreta." (seção 02).
3. **% Margem.** O roteiro escreve `Lucro/Receita`; a página usa `DIVIDE([Lucro], [Receita])`, que
   dá o mesmo 37,58% e não quebra com receita zero (um mês filtrado sem recebimentos).
4. **Desvio Margem.** O roteiro termina em "Desvio da meta" e "Gráfico Scroller · Categoria -
   Município", sem a fórmula. A página usa a margem do município menos a margem geral,
   `[% Margem] - CALCULATE([% Margem], ALL(Movimentações))` (São Paulo +26,02 pp, Belo Horizonte
   −16,13 pp), e o desafio sugere a versão com meta fixa. Confira se era essa a intenção.
5. **Endereço de imagem do Google Drive.** O formato `https://drive.google.com/uc?id=CÓDIGO` do
   roteiro é antigo e o Google já mudou o acesso direto a arquivos mais de uma vez: teste o link
   antes da aula. A planilha usa links do imgur.com; o Image Grid precisa de internet para mostrar
   os logotipos no Power BI (o simulador usa as cópias locais).
6. **Visuais personalizados.** Image Grid (1.0.1), Enlighten Data Story (1.3.2) e Scroller (2.0.3)
   vêm do AppSource (Visualizações › ··· › Obter mais visuais), que pede entrar com conta
   Microsoft; os gabaritos já os trazem. O gabarito da Parte 2 lista Sparkline, Data Story e
   Scroller entre os visuais importados, mas não os usa na página.
7. **"Não encontrou a de Data (fazer na mão)".** Nos arquivos da aula, a detecção automática acha
   as três relações com o mesmo nome dos dois lados (Loja duas vezes e Código Cliente) e deixa de
   fora as duas de SKU (SKU Produto × SKU). Nenhuma relação usa data. A página trata as de SKU como
   as que se fazem à mão.
8. **Colunas que já vêm prontas.** A planilha de Produtos já tem a coluna Lucro, e a de Clientes já
   tem Categoria de Cliente e Promoção dia das Mães. Na seção 11 as colunas ganham nomes novos
   (Lucro Calculado, Categoria Calculada, Promoção Calculada) para não colidir com as originais, e
   o simulador só marca a tarefa quando as 822 linhas batem. As regras foram tiradas dos dados:
   menos de 45 anos Jovem, de 45 a 59 Adulto, 60 ou mais Idoso; promoção Sim para Feminino com
   filhos.
9. **Os dados têm armadilhas de verdade**, aproveitadas na atividade:
   - as devoluções são de 2016 a 2018 e as vendas de 2019 a 2021: a % Devolução (2,85%) mistura
     períodos;
   - Salvador está no cadastro de lojas e não tem nenhuma venda;
   - a BaseDevoluções chega com 5 colunas vazias (Column5 a Column9);
   - Pagamentos vêm negativos na planilha (daí o menos na frente da medida);
   - abril, junho e agosto têm lucro negativo (somando 2020 e 2021).

## O que foi atualizado em relação ao material

| No material | Na aula | Onde |
|---|---|---|
| "Abrir Relacionamentos" / "Na aba Relacionamentos" | A antiga Exibição de relações hoje se chama **Exibição de modelo** (terceiro ícone da barra da esquerda). | 12 |
| "Página Inicial > Relações > Gerenciar Relações" | Continua; na Exibição de modelo, o mesmo botão aparece em Página Inicial. Conforme a versão, a janela pode ter outro desenho, mas os campos são os mesmos. | 12 |
| Rótulos em inglês dos visuais personalizados | Ficam em inglês (Image URL, Render type, Measures, Category, Measure Absolute, Measure Deviation): os visuais do AppSource não são traduzidos. | 04–06 |

Nomes de menus e opções seguem o Power BI Desktop em português, mas estes podem variar entre
versões: Gerenciar relações, Novo relacionamento, Detecção automática,
Da tabela / Para a tabela, Cardinalidade, Direção do filtro cruzado, Gráfico de cascata, Valor do
balão › Unidades de exibição. Havendo diferença, vale o que aparece na versão instalada.

## Seções

Capa · roteiro e objetivos · Materiais da Aula (Parte 1: imagens, planilha, plano de fundo,
gabarito; Parte 2: as cinco planilhas e o gabarito) ·
**Parte 1, Dashboard Financeiro** — 01 Receita e pagamentos · 02 Imposto, lucro e cascata ·
03 A margem na rosca · 04 Image Grid · 05 Data Story · 06 Scroller · 07 O dashboard pronto ·
**Parte 2, Modelagem de Dados** — 08 Modelagem e chaves · 09 Tipos de relação · 10 Tratar colunas e
linhas em branco · 11 Colunas com IF · 12 Relacionamentos · 13 RELATED · 14 O relatório de vendas e
devoluções · quiz · referência rápida · atividade.

## Os simuladores

**Power BI (`js/pbi.js`).** O simulador das aulas 2 e 3 (motor de DAX, painéis, filtros), com o que
esta aula usa:

- **relacionamentos de verdade**: o filtro anda do lado 1 para o lado * (um produto filtra as
  vendas e as devoluções); sem relação, o visual repete o total (71.442) em toda linha;
- **Exibição de modelo** com as cinco tabelas: arrastar uma coluna sobre a coluna de outra tabela
  cria a relação (tipos diferentes, muitos para muitos e relação duplicada são recusados com
  aviso); clicar na linha mostra a relação e o botão Excluir;
- **Gerenciar relações** (Página Inicial): lista, Novo relacionamento com Da tabela / Para a tabela
  e cardinalidade reconhecida, Detecção automática pelo nome e Excluir;
- **RELATED** (com o erro do Power BI quando não há relação), SUMX, IF, AND, ALL, DIVIDE,
  COUNTROWS, colunas calculadas na tabela selecionada;
- visuais novos: gráfico de cascata com Total, rosca com várias medidas sem legenda, Image Grid
  (clique filtra), Enlighten Data Story (troca os # pelas medidas na ordem), Scroller com ▲/▼, e
  cartão com unidades Nenhum (valor inteiro);
- o dashboard da seção 07 com as posições do gabarito sobre o plano de fundo (1280 × 720).

Quando a fórmula de uma tarefa é escrita pelo botão "escrever na barra de fórmulas" e a medida ou
coluna já existe (por exemplo, salva com erro), a fórmula corrige a existente.

**Editor do Power Query (`js/pq.js`).** O da aula 3, carregado com a BaseDevoluções como chega do
Excel (4 colunas, 5 colunas vazias): Ctrl + clique, Remover Colunas, Remover Linhas em Branco e
Fechar e Aplicar.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01 | `data-sim="receita"` | Receita e Pagamentos com CALCULATE, formato Moeda, cartões com valor inteiro (R$ 94.602.866,94) |
| 02 | `data-sim="lucro"` | Imposto (erro com 0,15), Lucro (R$ 35.548.595,98), cascata por mês |
| 03 | `data-sim="margem"` | % Margem 37,58% e complemento na rosca, cartão no meio |
| 04 | `data-sim="imagens"` | Image Grid em círculos; clique no Itaú filtra (R$ 33.261.602,80) |
| 05 | `data-sim="historia"` | três medidas no Data Story: 2.725, 1.200 e 44,04%; segmentação por banco |
| 06 | `data-sim="letreiro"` | Desvio Margem com ALL e o Scroller por município |
| 07 | `data-sim="financeiro"` | o Dashboard Financeiro do gabarito, com filtro por banco e por mês |
| 08 | construtor `chaves` | uma venda seguindo a chave até o cadastro de produto, loja ou cliente |
| 09 | construtor `cardinalidade` | os exemplos 1:1, 1:N e N:N dos slides, com as chaves coloridas |
| 10 | `data-pq="devolucoes"` | remover Column5 a Column9, linhas em branco, Fechar e Aplicar (1.140 linhas) |
| 11 | `data-sim="colunasModelo"` | Lucro Calculado, Categoria com IF aninhado, Promoção com IF e AND |
| 12 | `data-sim="relacoes"` | antes/depois da relação, arrastar, Gerenciar relações, Detecção automática |
| 13 | `data-sim="related"` | Lucro Total R$ 72.305.600,00 com SUMX e RELATED; Total Devoluções na tabela certa |
| 14 | `data-sim="dashModelo"` | o relatório de vendas e devoluções com filtro cruzado entre as bases |
| quiz | `data-quiz` | oito perguntas com os erros que o aluno comete de verdade |

## Dicas de condução (não aparecem na página)

- **Links de download** (Materiais da Aula e atividade): apontam para `material/power-bi/aula4/`
  pelo caminho relativo (`../../../material/...`), então funcionam abrindo a página de dentro do
  repositório. As imagens PNG, por `file://`, saem de uma cópia embutida em `js/materiais.js`
  (carregada só no primeiro clique). Se for copiar só a pasta da aula para outro computador, leve
  os arquivos de `material/` junto e ajuste os links no `index.html`.
- A página funciona sem internet. A prática precisa do **Power BI Desktop**, das planilhas e, para
  importar os três visuais personalizados, de internet e login no Power BI (ou abrir o gabarito, que
  já os traz).
- **Números para conferir com a turma.** Parte 1: Receita R$ 94.602.866,94; Pagamentos
  R$ 44.863.840,92; Imposto R$ 14.190.430,04; Lucro R$ 35.548.595,98; % Margem 37,58%;
  2.725 movimentações, 1.200 via Pix (44,04%); melhor margem São Paulo 63,60%, pior Belo Horizonte
  21,45%. Parte 2: 71.442 itens vendidos; Lucro Total R$ 72.305.600,00; 2.037 itens devolvidos;
  mais vendido Smart TV 50' 4K - Preto (7.762); iPhone 7 - Dourado 2.591. Desafio: Faturamento
  R$ 156.765.700,00; % Devolução 2,85%; lucro por categoria Jovem R$ 32.317.700, Adulto
  R$ 19.775.800, Idoso R$ 20.212.100.
- Na seção 12, comece pela Exibição de relatório (todos os produtos com 71.442) e só depois
  relacione: a mudança da tabela é o ponto da aula.
- Os simuladores de cada seção começam com o que as seções anteriores deixaram pronto, então dá
  para pular direto para qualquer parte. Redefinir volta ao começo.

## Estrutura

```
aula4/
├── index.html              a aula inteira
├── css/
│   ├── estilo.css          identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css           blocos do modelo + classes desta aula (Exibição de modelo, Gerenciar
│                           relações, visuais personalizados, laboratórios de chaves)
├── js/
│   ├── dados-financeiro.js as 2.725 movimentações (gerado da planilha)
│   ├── dados-modelo.js     as cinco tabelas da Parte 2 (gerado das planilhas)
│   ├── materiais.js        cópia embutida das imagens para download por file://
│   ├── pq.js               simulador do Editor do Power Query
│   ├── pbi.js              simulador do Power BI com relacionamentos
│   └── aula.js             motor da aula (colorização, navegação, laboratórios, materiais, quiz)
├── fonts/                  Roboto (títulos) em cópia local + licença OFL
└── img/                    símbolo e logotipos SEST SENAT, logotipos dos bancos, plano de fundo
```

## Convenção visual

- Painel escuro = o que se faz: caminho de menus, fórmula DAX ou M, campos.
- Janelas do Power Query e do Power BI = simuladores; tudo nelas responde.
- Nas tabelas de exemplo: amarelo = chave primária, azul = chave estrangeira; nos exemplos de
  cardinalidade, a mesma cor liga registros com a mesma chave.
- Na Exibição de modelo: 1 do lado do cadastro, * do lado da base, seta no meio = direção do
  filtro; linha azul = relação selecionada.
- Tracejado azul em volta de um visual = visual selecionado.
- Números no padrão do Power BI em português (Mil, Mi), com vírgula decimal.

## Verificação

Conferida por `file://` em 1500, 1280, 1200 e 900 px: sem transbordo horizontal da página (o
letreiro do Scroller corre dentro do visual), sem erro de console, Roboto e logotipos carregados,
menu sem itens cortados. Teste de interação automatizado: as tarefas de todos os simuladores
(medidas com erro e corrigidas, formatos, cascata, rosca, Image Grid com filtro do Itaú, Data Story
com segmentação, Scroller, dashboard com filtro do Safra), arrastar BaseVendas[SKU Produto] até
CadastroProdutos[SKU], Gerenciar relações com Novo relacionamento e Detecção automática (cinco
relações), iPhone 7 - Dourado com 2.591 depois das relações, RELATED, Total Devoluções na
BaseDevoluções, o Power Query das devoluções, os laboratórios e o quiz. Os links de download baixam
arquivos idênticos aos de `material/`, conferidos byte a byte por `file://` e por http.
