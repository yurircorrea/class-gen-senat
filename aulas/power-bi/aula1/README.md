# Aula — Análise de Dados com Power BI: Análise de dados (Aula 1)

Página única da primeira aula do curso Análise de Dados com Power BI, para ser projetada e rolada
durante a aula. Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de
internet.

**Curso e aula:** Análise de Dados com Power BI, Aula 1 · **Instrutor:** Yuri Reis Correa,
Instrutor de Tecnologia · **SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema: o que é análise de dados, tipos de análise, Business Intelligence e etapas do processo de BI,
o Power BI; prática do primeiro relatório (Power Query, cartões, filtros, gráficos e mapa) com a
BaseVendas.

## Material de origem

| Arquivo | Uso na aula |
|---|---|
| `material/power-bi/aula1/POWER BI AULA 01.pdf` | **Base da parte teórica** (apresentação do instrutor, 20 slides): quem é o instrutor (seção de abertura, com a foto do próprio slide em `img/instrutor.jpg`), objetivo do curso e o que ele é e não é, definição e usos da análise de dados, diagrama "análise de dados e as ciências", os quatro tipos de análise (exemplo do Biquíni), passo a passo da análise, BI, etapas do processo de BI, o que é o Power BI, se ele é "tipo Excel", a atividade (mais 2 gráficos) e os próximos capítulos. |
| `material/power-bi/aula1/Aula1.txt` | **Roteiro da prática** (não é mostrado aos alunos). Virou as seções 08 a 21, na mesma ordem: exibições, carregar o Excel, Power Query (nome da consulta, colunas e linhas em branco, dividir a Localidade, renomear, Faturamento, coluna de exemplos, Fechar e Aplicar), cartão de faturamento, cartão com N superior e escopo dos filtros, pincel de formatação, barras, interação entre visuais, linhas e colunas e mapa. |
| `material/power-bi/aula1/BaseVendas.xlsx` | **Dados da prática**: 203.882 vendas, de junho de 2017 a agosto de 2019. Todos os números da página são os reais: `js/dados.js` foi gerado a partir dela (totais por marca, mês, continente e país, produtos mais e menos vendidos). As grades do Power Query usam oito linhas reais do arquivo (linhas 2, 3, 12, 13, 15, 16, 26 e 800). Para baixar em Materiais da Aula e no ponto de partida da atividade. |
| `material/power-bi/descritivo-do-curso.md` | Contexto do curso inteiro (justificativa, objetivo, perfil de conclusão), usado na seção "O que é este curso". |

O diagrama da seção 01 é adaptado do slide 9, que cita como fonte Alexandre Duarte (UFPB); a bolha
"Transporte" foi acrescentada. A BaseVendas é uma base de exemplo de uma loja fictícia de
eletrônicos (marcas Contoso, Litware, Proseware etc.).

A identidade visual é a do SEST SENAT, não a dos slides (o amarelo do Power BI não entra). Os
visuais do relatório são refeitos em HTML com os números da base, nunca capturas de tela.

## O que foi atualizado em relação ao material

| No material | Na aula | Onde |
|---|---|---|
| "As 3 guias do Power BI (relatórios, dados e modelo)" | Hoje são exibições, na barra da esquerda: relatório, tabela (a antiga "dados"), modelo, consulta DAX e TMDL. As três primeiras são as da aula; DAX e TMDL só aparecem. | 08 |
| Visual de cartão | Desde novembro de 2025 o Cartão é o visual novo (o antigo ficou como herdado). Os nomes das opções no painel de formatação (Valor do balão, Rótulo da categoria) podem variar um pouco entre versões: cartão "novo" na página. | 16 |
| Visual de mapa | A Microsoft anunciou que o Mapa (Bing) será substituído pelo Azure Maps, ainda sem data. A opção de segurança da aula continua valendo; cartão "novo" orienta a aceitar a troca quando o Power BI oferecer. | 21 |
| "Bussiness Inteligence" (slides 13 e 14) | Grafia corrigida: Business Intelligence. | 05, 06 |
| "Power BI é gratuito e não requer conta" | Mantido, com o complemento de que o Power BI Desktop só roda no Windows. | 07 |

Nomes de menus, botões e visuais seguem a interface do Power BI Desktop em português (conferidos em
outubro de 2026). A Microsoft renomeia opções com frequência; havendo diferença, vale o que aparece
na versão instalada (os nomes dos visuais aparecem ao passar o mouse nos ícones de Visualizações).

## Seções

Capa · Quem é o instrutor · O que é este curso · roteiro e objetivos · Materiais da Aula (a
BaseVendas.xlsx, para baixar) ·
**Parte 1** — 01 O que é análise de dados · 02 Para que serve · 03 Tipos de análise ·
04 Passo a passo da análise · 05 Business Intelligence · 06 Etapas do processo de BI ·
07 O que é o Power BI (e se é tipo Excel) ·
**Parte 2** — 08 Exibições do Power BI Desktop · 09 Carregar a BaseVendas · 10 O Power Query ·
11 Limpeza · 12 Dividir a Localidade e renomear · 13 Faturamento · 14 Coluna de exemplos ·
15 Etapas Aplicadas e Fechar e Aplicar · 16 Cartão de faturamento · 17 Cartão do produto mais
vendido, escopo dos filtros e Pincel de Formatação · 18 Gráfico de barras · 19 Interação entre
visuais · 20 Gráfico de linhas e colunas · 21 Mapa ·
quiz · referência rápida · atividade.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01 | construtor `ciencias` | diagrama de Venn clicável: computação, matemática e estatística, domínio de aplicação e a ciência de dados no meio |
| 02 | quiz | quatro situações (três de transporte e comércio em Foz, uma científica): qual uso da análise de dados aparece |
| 03 | construtor `tipos` | as vendas do Biquíni em 2024 respondem às quatro perguntas; faixas no gráfico e escada de valor |
| 04 | construtor `jornada` | os quatro passos com a BaseVendas: grade bruta × tratada, faturamento por marca, barras e conclusões |
| 05 | construtor `perguntas` | cinco perguntas de negócio respondidas com os totais reais |
| 06 | tour | as seis etapas do BI sobre o Power BI Desktop refeito em HTML |
| 07 | construtor `campos` + mini planilha | escolher campos monta o visual (cartão ou barras); no Excel, uma fórmula `=SOMASE` por célula |
| 08 | componente `data-exibicoes` | barra da esquerda clicável: relatório, tabela, modelo, consulta DAX (com resultado) e TMDL |
| 09 | tour | Obter dados › Pasta de trabalho do Excel › BaseVendas.xlsx › Navegador › Transformar Dados |
| 10 | construtor `consulta` | o Editor do Power Query com as cinco áreas numeradas; renomear a consulta muda título, painel Consultas e Nome |
| 11 | construtor `limpeza` | remover Column10, remover linhas em branco, aparar Marca; contagem de marcas distintas (9 → 7) |
| 12 | construtor `dividir` | delimitador " - " × "-" × vírgula, os três modos de divisão, renomear para País e Continente |
| 13 | construtor `calculo` | Faturamento, Custo Total e Lucro Unitário pelo menu Padrão, com a fórmula M gravada |
| 14 | construtor `exemplos` | coluna de exemplos de verdade: o exemplo digitado é testado contra sete regras (nome e sobrenome, só nome, maiúsculas, inicial, e-mail…) e preenche as outras linhas |
| 15 | componente `data-etapas` | as 13 Etapas Aplicadas clicáveis, cada uma com a tabela e a fórmula M daquele momento; Fechar e Aplicar leva à Exibição de tabela |
| 16 | construtor `cartao` | unidades de exibição, casas decimais, moeda, rótulo da categoria e título |
| 17 | construtores `topn` e `escopo` + componente `data-pincel` | o "Primeiro Produto" sem filtro, o N superior (e a pegadinha de N > 1), filtro neste visual × nesta página × em todas as páginas, Pincel de Formatação em três cliques |
| 18 | construtor `barras` | título, eixo X, rótulos de dados e classificação |
| 19 | componente `data-relatorio` | relatório com cartões, barras e colunas por ano: clique filtra e realça, Ctrl + clique soma marcas |
| 20 | construtor `combo` | colunas de faturamento e linha de quantidade, por ano ou por ano e mês, eixo secundário |
| 21 | construtor `mapa` | mapa esquemático com bolhas por continente ou por país, por faturamento ou quantidade |
| quiz | `data-quiz` | oito perguntas com os erros que o aluno comete de verdade |
| atividade | visuais prontos | o resultado esperado com os números reais e dois espaços para os gráficos novos |

## Dicas de condução (não aparecem na página)

- **Download da BaseVendas** (Materiais da Aula e atividade): o link aponta para
  `material/power-bi/aula1/BaseVendas.xlsx` pelo caminho relativo (`../../../material/...`), então
  funciona abrindo a página de dentro do repositório. Se for copiar só a pasta da aula para outro
  computador, leve a planilha junto e ajuste os dois links no `index.html`.
- A página funciona sem internet. A prática precisa do **Power BI Desktop** (gratuito, Windows) e
  da `BaseVendas.xlsx` em cada computador.
- **Linhas e coluna em branco da BaseVendas:** as 6 linhas em branco do fim (linhas 203.884 a
  203.889 do Excel) têm um espaço na coluna A, e a décima coluna tem espaços em 2 linhas (175.234 e
  175.235). Depois do Tipo Alterado, a Data da Venda dessas 6 linhas pode virar **Error**; se
  Remover Linhas em Branco não as tirar, use Página Inicial › Remover Linhas › Remover Erros com a
  coluna Data da Venda selecionada.
- **Marcas com espaço no fim:** "Litware " (13.329 linhas) e "Contoso " (871). No Power Query o
  filtro da coluna Marca mostra 9 marcas. No relatório, o modelo do Power BI tende a juntar valores
  que só diferem por espaço no fim (comportamento relatado pela comunidade, sem documentação
  oficial), então o gráfico de barras pode mostrar 7 marcas mesmo sem o Aparar. A seção 11 ensina o
  Aparar para não depender disso.
- **Números para conferir com a turma:** faturamento total R$ 64.172.843,26 (64,17 Mi); Contoso
  R$ 19,57 Mi; produto mais vendido DVD M360 Preto (42.527 unidades); sem filtro, o cartão de
  Produto mostra "180 CFM Ventilador de Coluna X450 Azul"; melhor mês novembro de 2017
  (R$ 3,51 Mi); América do Norte R$ 33,17 Mi. Para o desafio: Lucro R$ 37,46 Mi; categoria que mais
  faturou, Sistema de Som (R$ 22,23 Mi).
- No laboratório 17, comece em Filtragem básica (o cartão mostra o primeiro produto em ordem
  alfabética), passe para N superior 1 e depois teste N = 2 por Faturamento: o cartão mostra "DVD
  M360 Preto" e não o nº 1, gancho para explicar o "Primeiro".
- No laboratório 14, digite os exemplos sugeridos e por último "Vicente Pinheiro da Silva": nenhuma
  regra explica, como acontece no Power Query.
- A seção 15 percorre as etapas na ordem do roteiro; vale fazer a mesma sequência no Power Query
  real e clicar nas etapas para "voltar no tempo".
- Os visuais refeitos aqui são provas de conceito: o ritmo sugerido é mostrar a seção na página e
  em seguida fazer o mesmo no Power BI, com a turma acompanhando.
- O mapa da seção 21 é esquemático (contornos simplificados) e serve para situar as bolhas.

## Estrutura

```
aula1/
├── index.html        a aula inteira
├── css/
│   ├── estilo.css    identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css     blocos do modelo + classes desta aula (Power BI e Power Query refeitos,
│                     grade de dados, visuais, mapa, relatório, pincel, laboratório largo)
├── js/
│   ├── dados.js      totais reais da BaseVendas.xlsx (gerado a partir da planilha)
│   └── aula.js       motor do asset (sem simuladores e playground) + desenho dos visuais
│                     (seção 5), construtores desta aula (seção 6) e componentes (seção 9)
├── fonts/            Roboto (títulos) em cópia local + licença OFL
└── img/              símbolo, logotipos SEST SENAT e foto do instrutor (do slide 2 do material)
```

## Convenção visual

- Painel escuro = o que se faz no Power BI ou no Power Query: caminho de menus, campos do visual,
  filtro; às vezes a fórmula M que o Power Query grava.
- Caixa branca = o que acontece; todo laboratório responde aos controles.
- Marcador amarelo dentro do texto = espaço sobrando (invisível no programa).
- Tracejado azul em volta de um visual = visual selecionado ou que recebeu o filtro.
- Nas grades do Power Query: cabeçalho azul-claro = coluna selecionada; cabeçalho ciano = coluna
  nova; linha amarelada = linha em branco; `null` em itálico = célula vazia.
- Valores em reais no padrão do Power BI em português (Mil, Mi), com vírgula decimal.

## Verificação

Conferida por `file://` em 1500, 1280, 1200 e 900 px: sem transbordo horizontal da página, sem erro
de console, Roboto e logotipos carregados, menu sem itens cortados e nenhuma seção com vazio acima
de 250 px entre painel e preview. Em 1500 e 1280 px nenhuma grade precisa de rolagem interna; abaixo
disso, as grades largas do Power Query rolam dentro da própria caixa. Teste de interação com todas
as opções de todos os laboratórios, os dois tours até o fim, as cinco exibições, as 13 etapas e o
Fechar e Aplicar, o pincel de formatação (aplicar e desfazer), o relatório (clique, Ctrl + clique e
limpar), a coluna de exemplos com oito entradas, o quiz (certo e errado) e a planilha da seção 07
(`=SOMASE` confere com a soma da amostra).
