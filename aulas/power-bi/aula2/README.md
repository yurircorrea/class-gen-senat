# Aula — Análise de Dados com Power BI: Medidas com DAX (Aula 2)

Página única da segunda aula do curso Análise de Dados com Power BI, para ser projetada e rolada
durante a aula. Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de
internet.

**Curso e aula:** Análise de Dados com Power BI, Aula 2 · **Instrutor:** Yuri Reis Correa,
Instrutor de Tecnologia · **SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema: a linguagem DAX e as medidas, aplicadas em dois relatórios. Parte 1, o Dashboard de Produção
(BaseProdução): SUM, DISTINCTCOUNT, CALCULATE com BLANK(), DIVIDE, formato de porcentagem, coluna
calculada × medida, plano de fundo e ícones. Parte 2, o Dashboard de RH (BaseFuncionarios):
COUNTROWS × COUNT, coluna com YEAR, visual personalizado (Sparkline), ativos, desligados e
rotatividade, Coluna de Exemplos, funil, rosca, árvore hierárquica e página de dica de ferramenta.

## Material de origem

| Arquivo | Uso na aula |
|---|---|
| `material/power-bi/aula2/Parte1 - Linguagem DAX.pdf` | Slides da abertura: o que é DAX (Data Analysis eXpressions), medidas, "vamos praticar". Viraram as seções 01 e 02. |
| `material/power-bi/aula2/Parte1- Gabarito.pbix` | **Base da Parte 1.** O layout do dashboard (posições, visuais, campos, medidas na tabela Medidas) foi lido do arquivo e refeito no simulador da seção 08. Para baixar em Materiais da Aula. |
| `material/power-bi/aula2/Parte1 - BaseProdução.xlsx` | Dados da Parte 1: 31.616 registros de produção, de 01/01/2021 a 09/01/2022. Todas as linhas estão em `js/dados-producao.js` (sem Hora Inicio, Data Fim e Hora Fim, que a aula não usa). A página tem um link para baixar a planilha (Parte 1 e atividade). |
| `material/power-bi/aula2/Parte1 - Plano de Fundo.png` e `Parte1 - Ícones/` | Fundo e ícones do Dashboard de Produção, em `img/` (fundo reduzido para 1280 × 720). Os originais, para baixar em Materiais da Aula. |
| `material/power-bi/aula2/Parte1 - Roteiro do Professor.txt` | Usado só para os passos de formatação (título, rótulos, eixo, linhas de grade, Pincel de Formatação). Veja a divergência abaixo. |
| `material/power-bi/aula2/Parte2 - Roteiro do Professor.txt` | **Roteiro da Parte 2**, seguido na ordem: seções 09 a 14. |
| `material/power-bi/aula2/Parte2 - Gabarito.pbix` | Layout do Dashboard de RH e da página de dica de ferramenta (320 × 240), refeitos na seção 14. Confirmou o Sparkline by OKViz e a coluna Ano da Contratação no eixo dele. Para baixar em Materiais da Aula. |
| `material/power-bi/aula2/Parte2 - BaseFuncionarios.xlsx` | Dados da Parte 2: 234 contratações de 2010 a 2018, em `js/dados-rh.js`. A página tem um link para baixar a planilha (Parte 2 e atividade). |
| `material/power-bi/aula2/Parte2 - Plano de Fundo.png` e `Parte2 - Fundo da Dica de Ferramenta.png` | Fundos do Dashboard de RH e da dica, em `img/`. Os originais, para baixar em Materiais da Aula. |

A identidade visual da página é a do SEST SENAT. As cores escuras, verdes e limão aparecem só
dentro dos dashboards simulados, porque são as do gabarito que a turma vai reproduzir.

## Pontos para conferir

1. **O roteiro da Parte 1 não é desta aula.** O `Parte1 - Roteiro do Professor.txt` descreve um
   relatório de Base Vendas e Base Devoluções (Power Query, Faturamento da Venda, gráfico de pizza,
   mapa), mas a planilha, o plano de fundo, os ícones e o gabarito da Parte 1 são de um Dashboard
   de Produção. A página segue o gabarito; do roteiro, aproveitou os passos de formatação.
2. **Fórmulas da Parte 1 deduzidas.** O modelo de dados do `.pbix` é compactado e não pôde ser
   lido aqui; os nomes das medidas e os visuais vieram do layout. As fórmulas usadas na página:
   `Qtd Produzida = SUM(...)`, `Qtd Rejeitada = SUM(...)`,
   `Horas Produtivas = CALCULATE(SUM(BaseProdução[Total Horas]), BaseProdução[Ocorrência] = BLANK())`,
   `Horas Paradas` com `<> BLANK()`,
   `Disponibilidade = DIVIDE([Horas Produtivas], [Horas Produtivas] + [Horas Paradas])` (77,69%) e
   `Qualidade = DIVIDE([Qtd Produzida] - [Qtd Rejeitada], [Qtd Produzida])` (99,32%). Se o gabarito
   usa outra regra, abra-o na Exibição de modelo e ajuste as seções 04 e 05.
3. **Nomes da Parte 2.** A página usa os nomes do roteiro (Contratações, Func. Ativos,
   Func. Desligados, % Rotatividade). No gabarito as medidas se chamam Total Contratacoes,
   Funcionarios Ativos, Demissoes e % Turnover; os títulos dos cartões do dashboard (Demissões,
   Turnover) seguem o gabarito.
4. **Cidade e Ano da Contratação não existem na planilha.** O roteiro da Parte 2 diz que não é
   preciso mexer no Power Query, mas usa Cidade no funil e anos no Sparkline. O gabarito tem as
   duas colunas. A página cria Cidade com a Coluna de Exemplos (seção 12, já vista na aula 1) e
   Ano da Contratação como coluna calculada `YEAR(...)` (seção 10). Faça as duas antes do funil e
   do Sparkline.

## O que foi atualizado em relação ao material

| No material | Na aula | Onde |
|---|---|---|
| Separador de argumentos | DAX no Power BI Desktop usa vírgula entre argumentos e ponto decimal (como no roteiro), diferente do Excel em português. O simulador também aceita ponto e vírgula. | 01 |
| Cartão (Parte 2: "alterar para Cartão de Linha Múltipla") | Desde novembro de 2025 o Cartão novo é o padrão e o Cartão de linha múltipla aparece como visual herdado em algumas versões. O gabarito usa o de linha múltipla; se ele não estiver na galeria, o Cartão novo com várias medidas faz o mesmo papel. | 10, 14 |
| "Esquema Hierárquico (Árvore Hierárquica)" | A página usa Árvore hierárquica (Decomposition tree, em inglês). Confira o nome ao passar o mouse no ícone da galeria. | 13 |
| Importar o Sparkline | Visualizações › ··· › Obter mais visuais (AppSource, precisa de conta e internet). Sem internet, ··· › Importar um visual de um arquivo, com o `.pbiviz` baixado antes. | 10 |

Nomes de menus e opções seguem o Power BI Desktop em português, conferidos em outubro de 2026, mas
estes podem variar entre versões: Tela de fundo (Formatar página), Ferramentas de medida, Eixo do
medidor, Permitir uso como dica de ferramenta, Configurações de tela › Tipo › Dica de ferramenta,
Dicas de ferramenta › Página do relatório e Importar um visual de um arquivo. Havendo diferença,
vale o que aparece na versão instalada.

## Seções

Capa · roteiro e objetivos · Materiais da Aula (ícones, planos de fundo e gabaritos das duas partes, para baixar) ·
**Parte 1, Dashboard de Produção** — 01 O que é a linguagem DAX · 02 A anatomia de uma medida ·
03 Criar medidas · 04 CALCULATE · 05 DIVIDE e porcentagem · 06 Coluna calculada ou medida ·
07 Plano de fundo e ícones · 08 O Dashboard de Produção ·
**Parte 2, Dashboard de RH** — 09 Contar linhas e valores · 10 Ano da contratação e visual
personalizado · 11 Ativos, desligados e rotatividade · 12 A cidade a partir do endereço ·
13 Funil, rosca e árvore hierárquica · 14 Dica de ferramenta e o Dashboard de RH ·
quiz · referência rápida · atividade.

## O simulador do Power BI

As janelas do Power BI da página são um simulador (`js/pbi.js`), não capturas de tela. Ele tem as
linhas reais das duas planilhas e um motor de DAX próprio, então as medidas digitadas na barra de
fórmulas são calculadas de verdade e obedecem ao contexto de filtro:

- **Barra de fórmulas**: Nova medida e Nova coluna abrem a barra; Enter confirma, Shift + Enter
  quebra a linha (com numeração), Esc ou ✕ cancela. Clicar numa medida do painel Dados abre a
  fórmula dela para editar.
- **DAX suportado**: SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, COUNTBLANK, DISTINCTCOUNT, COUNTROWS,
  SUMX, AVERAGEX, MINX, MAXX, COUNTX, FILTER, ALL, CALCULATE, DIVIDE, IF, AND, OR, NOT, BLANK,
  ISBLANK, YEAR, MONTH, DAY, TODAY, DATEDIFF, ROUND, INT, ABS e funções de texto; medida dentro de
  medida, transição de contexto, BLANK como no Power BI (`BLANK() = 0` é verdadeiro, `/` por zero
  dá NaN ou Infinito).
- **Erros com a mensagem do Power BI**: função em português (`SOMA` sugere `SUM`), coluna sem
  agregação numa medida, coluna sem a tabela, texto em SUM, parêntese faltando, dependência
  circular, nome repetido.
- **Visuais**: cartão, cartão de linha múltipla, barras, colunas, área, rosca, funil, medidor,
  segmentação (lista ou suspensa), tabela, árvore hierárquica, Sparkline (depois de importar),
  imagem. Selecione um visual na tela e marque campos no painel Dados; ✕ tira o campo; os ícones
  de Visualizações trocam o tipo (ou criam um visual novo se nada estiver selecionado).
- **Filtros**: segmentações filtram a página; clicar numa barra, fatia ou ponto filtra os outros
  visuais (Ctrl + clique soma itens); a dica de ferramenta da seção 14 é calculada para a cidade
  sob o mouse.
- **Ferramentas de medida**: com uma medida selecionada aparecem Tabela inicial, Formato e o botão %.
- **Tarefas**: embaixo de cada simulador, a lista se marca sozinha quando o modelo tem uma medida
  com o valor certo (o nome é livre). "escrever na barra de fórmulas" preenche a fórmula pronta,
  para quem se perder. **Redefinir** volta o laboratório ao começo.

Simplificações conscientes: a árvore hierárquica abre o próximo nível com um clique no nó (no Power
BI, clica-se no + e escolhe-se o campo); arrastar campos foi trocado por marcar a caixa; a
segmentação de Mês junta os dois anos, como o nível Mês da hierarquia de datas.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01 | simulador `excel` | segmentação de Operador, cartão e colunas por mês: a mesma medida recalcula a cada filtro |
| 02 | construtor `anatomia` | nome, função, tabela e coluna separados; seis agregações × sete colunas, com o resultado real ou o erro |
| 03 | simulador `medidas` | Inserir dados (tabela Medidas), Qtd Produzida, Qtd Rejeitada e o bônus Ordens (8.595) |
| 04 | simulador `calculate` | Total Horas por Ocorrência; Horas Produtivas e Paradas; clicar numa barra não muda o CALCULATE |
| 05 | simulador `divide` | Disponibilidade e Qualidade em medidores, formato %, Manuela Merege: (Em branco) com DIVIDE, NaN com `/` |
| 06 | simulador `coluna` | Exibição de tabela: Peças Boas como coluna, Total Peças Boas como medida, SUM numa coluna, coluna solta numa medida |
| 07 | construtor `fundo` | imagem, ajuste (Normal corta, Ajustar cobre) e transparência (100% esconde), ícones e cartões por cima |
| 08 | simulador `dashProducao` | o Dashboard de Produção no fundo do gabarito, com segmentações suspensas e filtro por clique no gráfico |
| 09 | simulador `contar` | COUNTROWS 234, COUNT da Data de Demissao 17, DISTINCTCOUNT de Cargo 5 |
| 10 | simulador `ano` | trocar para Cartão de linha múltipla, coluna YEAR, Obter mais visuais › Sparkline, montar o visual |
| 11 | simulador `ativos` | Func. Ativos 217 e Func. Desligados 17 com Shift + Enter, % Rotatividade 7,26% |
| 12 | construtor `cidade` | Coluna de Exemplos: o exemplo digitado é testado contra quatro regras (cidade, UF, CEP, rua) e preenche as outras linhas, com a fórmula M |
| 13 | simulador `visuaisRh` | funil por Cidade, rosca por Genero e árvore hierárquica (Área › Cargo) com filtro cruzado |
| 14 | simulador `dashRh` | o Dashboard de RH; passar o mouse no funil mostra a página de dica (Func. Ativos, Folha Salarial, Horas Extras por Cargo) |
| materiais | links `download` | os 4 ícones, os 3 planos de fundo e os 2 gabaritos, cada um baixado do arquivo original em `material/` |
| quiz | `data-quiz` | oito perguntas com os erros que o aluno comete de verdade |

## Dicas de condução (não aparecem na página)

- **Links de download** (planilhas nas faixas da Parte 1 e da Parte 2 e na atividade, e a seção
  Materiais da Aula): apontam para `material/power-bi/aula2/` pelo caminho relativo
  (`../../../material/...`), então funcionam abrindo a página de dentro do repositório. Se for
  copiar só a pasta da aula para outro computador, leve esses arquivos junto e ajuste os links no
  `index.html`. Os roteiros do professor, o PDF dos slides e as planilhas não estão em Materiais da
  Aula.
- **Imagens por duplo clique**: aberta por `file://`, o navegador abre uma imagem em vez de
  baixá-la pelo link. Por isso os 4 ícones e os 3 planos de fundo também estão em
  `js/materiais.js` (cópias exatas em base64), e a página baixa de lá quando é aberta assim. Se
  alguma dessas imagens mudar em `material/`, gere o arquivo de novo. Servida por http, a página
  usa os links normais.
- A página funciona sem internet. A prática precisa do **Power BI Desktop** em cada computador, das
  duas planilhas, dos planos de fundo e dos ícones. Para o Sparkline sem internet, baixe o
  `.pbiviz` antes da aula (o gabarito da Parte 2 já traz o visual embutido).
- **Números para conferir com a turma.** Parte 1: Qtd Produzida 3.084.251 (3,08 Mi), Qtd
  Rejeitada 21.076, Horas Produtivas 30,96 Mil, Horas Paradas 8,89 Mil, Disponibilidade 77,69%,
  Qualidade 99,32%, 8.595 ordens, 31 operadores. Parte 2: 234 contratações, 217 ativos, 17
  desligados, 7,26% de rotatividade, 104 mulheres ativas, salário médio dos ativos R$ 6.615,85.
- **Manuela Merege** não produziu nenhuma peça (só tem horas registradas): é o caso pronto para
  mostrar DIVIDE × `/` na seção 05.
- **Janeiro no gráfico mensal**: a base vai até 09/01/2022, e o nível Mês soma janeiro de 2021
  (288 Mil) com esses dias de 2022 (22 Mil). É a primeira pergunta da investigação.
- O simulador de cada seção começa com as medidas das seções anteriores prontas, então dá para
  pular direto para qualquer parte. Para refazer do zero, use Redefinir.
- Ritmo sugerido: mostrar a seção na página (a turma vê a fórmula funcionando e os erros comuns) e
  em seguida fazer o mesmo no Power BI, com a turma acompanhando.

## Estrutura

```
aula2/
├── index.html            a aula inteira
├── css/
│   ├── estilo.css        identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css         blocos do modelo + classes desta aula (simulador do Power BI,
│                         anatomia da medida, plano de fundo, Coluna de Exemplos)
├── js/
│   ├── dados-producao.js as 31.616 linhas da BaseProdução (gerado a partir da planilha)
│   ├── dados-rh.js       as 234 linhas da BaseFuncionarios (gerado a partir da planilha)
│   ├── pbi.js            simulador do Power BI: modelo, motor DAX, visuais, interface e a
│   │                     configuração de cada laboratório (seção 6 do arquivo)
│   ├── materiais.js      cópias exatas (base64) dos ícones e planos de fundo, para o download
│   │                     funcionar quando a página é aberta por duplo clique
│   └── aula.js           motor da aula (colorização, navegação, laboratórios, download dos
│                         materiais, quiz)
├── fonts/                Roboto (títulos) em cópia local + licença OFL
└── img/                  símbolo e logotipos SEST SENAT, planos de fundo e ícones do material
```

## Convenção visual

- Painel escuro = o que se faz no Power BI: a fórmula DAX, o caminho de menus, os campos.
- Janela do Power BI = simulador; tudo nela responde (barra de fórmulas, painéis, visuais).
- Faixa vermelha embaixo da barra de fórmulas = erro; faixa amarela = medida salva, mas com erro.
- Tracejado azul em volta de um visual = visual selecionado.
- Números no padrão do Power BI em português (Mil, Mi), com vírgula decimal.

## Verificação

Conferida por `file://` em 1500, 1280, 1200 e 900 px: sem transbordo horizontal da página, sem erro
de console, Roboto, logotipos, fundos e ícones carregados, menu sem itens cortados. Abaixo de
1100 px os painéis do simulador descem para baixo da tela do relatório. Teste de interação
automatizado em todos os simuladores: criar medida com nome de coluna (recusada), `SOMA` (erro com
sugestão de SUM), medidas certas nos cartões, segmentação em lista, clique numa barra com
CALCULATE, formato %, Manuela Merege com DIVIDE e com `/`, coluna calculada na Exibição de tabela,
Shift + Enter em três linhas, importar o Sparkline e montar o visual, árvore em dois níveis, rosca
filtrando o funil, segmentação suspensa no dashboard, dica de ferramenta no hover, todas as tarefas
marcadas; laboratórios de plano de fundo, Coluna de Exemplos e anatomia; quiz. Os 13 links de
download (planilhas e Materiais da Aula) baixam arquivos idênticos aos de `material/`, conferidos
byte a byte por `file://` e por http.
