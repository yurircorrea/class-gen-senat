# Aula — Análise de Dados com Power BI: Dashboard de Vendas (Aula 3)

Página única da terceira aula do curso Análise de Dados com Power BI, para ser projetada e rolada
durante a aula. Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de
internet.

**Curso e aula:** Análise de Dados com Power BI, Aula 3 · **Instrutor:** Yuri Reis Correa,
Instrutor de Tecnologia · **SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema: um relatório do começo ao fim com duas bases. Parte 1, no Power Query: limpar a Base Vendas,
converter datas em formato americano com a localidade, mesclar nome e sobrenome, tirar o mês da
data e tratar a Base Devoluções. Parte 2, no relatório: coluna calculada em DAX com formato moeda,
gráfico de barras e tema, cartões com Primeiro e N superior, colunas com o eixo cortado, pizza,
mapa, tela de fundo preta e Pincel de Formatação.

## Material de origem

| Arquivo | Uso na aula |
|---|---|
| `material/power-bi/aula3/Roteiro do Professor.txt` | **Roteiro da prática**, seguido na ordem: seções 01 a 05 (Power Query) e 06 a 13 (relatório). Não é mostrado aos alunos. É o mesmo roteiro que estava na Parte 1 da aula 2 (só a ordem de duas linhas muda). |
| `material/power-bi/aula3/Base Vendas.xlsx` | Dados da prática: 9.999 vendas de 2018 (aba "Vendas 2019"). Todas as linhas estão em `js/dados-vendas.js`. Para baixar em Materiais da Aula e na atividade. |
| `material/power-bi/aula3/Base Devoluções.xlsx` | 499 devoluções e 9.500 linhas em branco formatadas no fim (aba "Devoluções 2019"), também em `js/dados-vendas.js`. Para baixar em Materiais da Aula e na atividade. |
| `material/power-bi/aula3/Produtos.xlsx` | Lista dos 7 produtos com SKU e das 9 lojas. Não aparece no roteiro nem no gabarito: entrou no desafio da atividade e numa pergunta da investigação. Para baixar em Materiais da Aula. |
| `material/power-bi/aula3/Aula 2 - Gabarito.pbix` | O dashboard pronto. O layout (posições, campos, filtro N superior do cartão, eixo Y a partir de 6.000.000, rótulos da pizza, mapa escuro, tela preta) foi lido do arquivo e refeito no simulador da seção 13. Para baixar em Materiais da Aula, com o nome original. |

A identidade visual da página é a do SEST SENAT. O preto, o branco e o azul `#118DFF` aparecem só
dentro do dashboard simulado, porque são as cores do gabarito que a turma vai reproduzir. O
logotipo do gabarito (selo de 30 anos) foi trocado pelo logotipo branco do SEST SENAT.

## Pontos para conferir

1. **Nome do gabarito.** O arquivo se chama `Aula 2 - Gabarito.pbix`, mas é o relatório desta
   aula. A página oferece o download com o nome original.
2. **Faturamento da Venda × Faturamento na Venda.** O roteiro chama a coluna de Faturamento da
   Venda; no gabarito ela se chama Faturamento na Venda. A página usa o nome do roteiro e avisa
   no cartão do gabarito.
3. **Tema Clássico.** O roteiro pede a paleta Clássico; o gabarito ficou com o tema padrão (azul
   `#118DFF`). A seção 07 ensina a troca de tema; o dashboard simulado segue o gabarito.
4. **Mês.** O roteiro diz Transformar › Data › Mês, que troca a própria coluna Data pelo número
   do mês. A página ensina Adicionar Coluna › Data › Mês › Mês, que mantém a Data e cria a coluna
   Mês (o nome que aparece no gabarito), e mostra o outro caminho no mesmo laboratório.
5. **Os dados têm armadilhas de verdade**, aproveitadas na aula:
   - as datas vêm como texto americano: com Português (Brasil), 6.124 viram Error (61%) e 3.548
     viram datas erradas sem aviso (35%);
   - a aba se chama Vendas 2019, mas todas as datas são de 2018;
   - a Base Vendas não tem linhas em branco (a etapa remove 0); a Base Devoluções tem 9.500;
   - os SKUs não batem entre as bases (HL1148 é Câmera nas vendas e Iphone nas devoluções e na
     Produtos.xlsx), e o nome muda de iPhone para Iphone;
   - Preco Unitario na Base Vendas é sem acento; Preço Unitário na Base Devoluções é com acento;
   - "Goiás" na coluna Loja é um estado: o mapa põe a bolha no meio dele.

## O que foi atualizado em relação ao material

| No material | Na aula | Onde |
|---|---|---|
| "Clicar com o botão direito e selecionar Nova Coluna" | Continua valendo no painel Dados; também em Ferramentas de tabela › Nova coluna, na Exibição de tabela. | 06 |
| "Na guia Modelagem ou Exibição de Dados, formatar o campo como moeda" | Hoje fica em Ferramentas de coluna › Formato, com a coluna selecionada (a antiga Exibição de Dados é a Exibição de tabela). | 06 |
| Visual de mapa (Bing) | A Microsoft anunciou a troca pelo Azure Maps; a opção de segurança da aula 1 continua valendo. | 11 |

Nomes de menus e opções seguem o Power BI Desktop em português, conferidos em outubro de 2026, mas
estes podem variar entre versões: Rótulos de detalhes › Conteúdo do rótulo (pizza), Configurações
do mapa › Estilo, Eixo Y › Intervalo › Mínimo, Exibição › Temas (Clássico, Executivo), Nova Fonte
e os nomes de etapa do Power Query para o mês (Mês Inserido, Mês Calculado, Nome do Mês
Inserido). Havendo diferença, vale o que aparece na versão instalada.

## Seções

Capa · roteiro e objetivos · Materiais da Aula (Base Vendas, Base Devoluções, Produtos e o
gabarito, para baixar) ·
**Parte 1, Power Query** — 01 Carregar e limpar a Base Vendas · 02 Datas em formato americano ·
03 Nome Completo · 04 O mês de cada venda · 05 A segunda base: devoluções ·
**Parte 2, o dashboard** — 06 Faturamento em DAX · 07 Gráfico de barras e tema · 08 Cartões ·
09 Faturamento por mês e o eixo · 10 Pizza das devoluções · 11 Mapa · 12 Tela preta e Pincel ·
13 O dashboard pronto · quiz · referência rápida · atividade.

## Os simuladores

**Editor do Power Query (`js/pq.js`).** Roda sobre as 9.999 linhas da Base Vendas e as 9.999 da
Base Devoluções, como chegam do Excel (com a coluna vazia e as linhas em branco):

- clique no título seleciona a coluna; Ctrl + clique soma outra (a ordem aparece num número ao
  lado do título, e é a ordem da mescla); botão direito abre o menu da coluna; clique duplo
  renomeia; o ícone de tipo (ABC, 123, calendário) abre os tipos e Usando a Localidade;
- Remover Colunas, Remover Linhas em Branco, Alterar Tipo (com e sem localidade), Mesclar Colunas,
  Data › Mês (em Transformar e em Adicionar Coluna) e Fechar e Aplicar;
- cada comando vira uma etapa com a fórmula M na barra; clicar numa etapa mostra a tabela daquele
  momento; o ✕ apaga a etapa, e uma etapa que perdeu a coluna aparece quebrada, com o erro;
- a linha de qualidade da coluna (Válido, Erro, Vazio) e o rodapé com colunas, linhas e erros;
- a grade mostra as 9 primeiras e as 3 últimas linhas (é no fim que estão as linhas em branco).

**Power BI (`js/pbi.js`).** O mesmo simulador da aula 2 (motor de DAX, painéis, filtros), com as
bases já tratadas e o que esta aula usa: tabela com espaço no nome entre aspas simples (sem as
aspas, o erro explica), Ferramentas de coluna com Formato Moeda, resumo Primeiro para texto em
cartão, filtro N superior num visual, gráfico de pizza, mapa com bolhas, eixo Y com mínimo e tela
de fundo preta. As duas tabelas não têm relacionamento: clicar nas barras não muda a pizza.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01 | `data-pq="vendasLimpeza"` | renomear a consulta, remover Column9, remover linhas em branco, voltar no tempo pelas etapas |
| 02 | `data-pq="vendasData"` | tipo Data em pt-BR (6.124 erros e datas trocadas), apagar a etapa, Usando a Localidade em Inglês (EUA) |
| 03 | `data-pq="vendasNome"` | seleção em ordem, Mesclar Colunas com espaço → Nome Completo |
| 04 | `data-pq="vendasMes"` | Adicionar Coluna › Mês × Transformar › Mês, Fechar e Aplicar; Data cinza em coluna de texto |
| 05 | `data-pq="devolucoes"` | 9.999 → 499 linhas, Column7, localidade, Fechar e Aplicar |
| 06 | `data-sim="faturamento"` | Nova coluna em DAX, erro sem aspas e com acento, formato Moeda, cartão R$ 99,32 Mi |
| 07 | construtor `tema` | temas Padrão, Clássico e Executivo e os rótulos de dados no gráfico de barras |
| 08 | construtor `primeiro` | Filtragem básica (Android), N superior 1 (iPhone), N inferior 1 (Câmera), moeda no cartão |
| 09 | construtor `eixo` | eixo Y a partir de 0, 6.000.000 e 7.500.000, com a diferença real e a aparente |
| 10 | construtor `pizza` | os seis conteúdos de rótulo da pizza, com as devoluções reais |
| 11 | construtor `mapa` | bolhas por faturamento ou quantidade, cinco estilos de mapa, o caso de Goiás |
| 12 | construtor `escuro` | a formatação passo a passo na tela preta e o Pincel para o gráfico de colunas |
| 13 | `data-sim="dashVendas"` | o dashboard do gabarito, com filtro cruzado e o N superior recalculado |
| quiz | `data-quiz` | oito perguntas com os erros que o aluno comete de verdade |

## Dicas de condução (não aparecem na página)

- **Links de download** (Materiais da Aula e atividade): apontam para `material/power-bi/aula3/`
  pelo caminho relativo (`../../../material/...`), então funcionam abrindo a página de dentro do
  repositório. Se for copiar só a pasta da aula para outro computador, leve esses arquivos junto
  e ajuste os links no `index.html`. São planilhas e `.pbix`, que o navegador sempre baixa; esta
  aula não precisa de cópia embutida (`js/materiais.js`), como as imagens da aula 2.
- A página funciona sem internet. A prática precisa do **Power BI Desktop** e das duas planilhas
  em cada computador.
- **Números para conferir com a turma:** faturamento R$ 99.319.500,00 (R$ 99,32 Mi); 30.043
  unidades vendidas; iPhone 8.974 unidades; primeiro produto em ordem alfabética, Android;
  melhor mês dezembro (R$ 8,80 Mi), pior maio (R$ 7,68 Mi); São Paulo R$ 22,10 Mi; 1.517
  unidades devolvidas, SmartWatch 395. Desafio: % Devolvido 5,05%.
- Na seção 02, deixe a turma cair no erro primeiro (tipo Data direto pelo ícone) e só depois
  apagar a etapa e usar a localidade: a barra vermelha da qualidade e as datas trocadas sem aviso
  são o ponto da aula.
- Os simuladores de cada seção começam com as etapas das seções anteriores prontas, então dá para
  pular direto para qualquer parte. Redefinir volta ao começo.

## Estrutura

```
aula3/
├── index.html            a aula inteira
├── css/
│   ├── estilo.css        identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css         blocos do modelo + classes desta aula (Power Query interativo,
│                         visuais dos laboratórios, mapa, tema escuro, simulador do Power BI)
├── js/
│   ├── dados-vendas.js   as linhas da Base Vendas e da Base Devoluções (gerado das planilhas)
│   ├── pq.js             simulador do Editor do Power Query e a configuração de cada laboratório
│   ├── pbi.js            simulador do Power BI (da aula 2, com as bases desta aula)
│   └── aula.js           motor da aula (colorização, navegação, laboratórios, quiz)
├── fonts/                Roboto (títulos) em cópia local + licença OFL
└── img/                  símbolo e logotipos SEST SENAT
```

## Convenção visual

- Painel escuro = o que se faz: caminho de menus, fórmula M ou DAX, campos.
- Janelas do Power Query e do Power BI = simuladores; tudo nelas responde.
- No Power Query: cabeçalho azul = coluna selecionada; Error em vermelho = valor que não
  converteu; linha amarelada = linha em branco; barra verde, vermelha e cinza = qualidade da
  coluna (válido, erro, vazio).
- Tracejado azul em volta de um visual = visual selecionado.
- Números no padrão do Power BI em português (Mil, Mi), com vírgula decimal.

## Verificação

Conferida por `file://` em 1500, 1280, 1200 e 900 px: sem transbordo horizontal da página, sem erro
de console, Roboto e logotipos carregados, menu sem itens cortados; em 1500 px nenhuma grade do
Power Query precisa de rolagem interna. Teste de interação automatizado com os cinco editores do
Power Query (todas as tarefas, voltar no tempo, apagar etapa, erro de data em pt-BR, localidade,
mescla em ordem, mês nos dois caminhos, Fechar e Aplicar, menu Data cinza em coluna de texto), o
simulador de faturamento (erro sem aspas, erro com acento, formato moeda, cartão), o dashboard
(cartões, filtro cruzado, pizza sem relacionamento) e os laboratórios. Os links de download
baixam arquivos idênticos aos de `material/`, conferidos byte a byte por `file://` e por http.
