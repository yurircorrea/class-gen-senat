# Aula — Análise de Dados com Power BI: Estudo de Caso, Análise Completa (Aula 5)

Página única da quinta aula do curso Análise de Dados com Power BI, para ser projetada e rolada
durante a aula. Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de
internet.

**Curso e aula:** Análise de Dados com Power BI, Aula 5 · **Instrutor:** Yuri Reis Correa,
Instrutor de Tecnologia · **SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Esta aula é diferente das anteriores: são **dois encontros** (cerca de 6 horas) com um fluxo de
análise completo sobre os dados de uma empresa de entregas. A página não entrega a análise pronta:
algumas análises vêm sugeridas e as outras a turma decide com o instrutor. Os selos **Sugerido** e
**A turma decide** marcam cada seção. **Não há atividade para enviar**: a avaliação é a
participação; por isso a página não tem a faixa de envio por e-mail.

## Material de origem

| Arquivo | Uso na aula |
|---|---|
| `material/power-bi/aula5/DadosEmpresaEntregas.xlsx` | Os dados do caso: abas Entregadores (124), Veículos (223), Empresas Clientes (111) e Entregas (4.598 entregas de 30/07/2024 a 30/07/2025, mais 399 linhas em branco no fim). Todas as linhas estão em `js/dados-entregas.js`. **Único material para baixar** em Materiais da Aula. |
| `material/power-bi/aula5/POWER BI ESTUDO DE CASO.pdf` | Slides: o objetivo da aula e o pedido da empresa (seção 01). Não fica para download. |
| `material/power-bi/aula5/Análise de Dados para Empresa de En.txt` | Documentação feita pela turma anterior com o instrutor. Serviu de base para o diagnóstico (03), os tratamentos (04 a 06), as regras das colunas (08), as relações (07), o modelo do documento (14) e as análises sugeridas. Não fica para download nem aparece pronta na página. |
| `material/power-bi/aula5/Estudo de Caso.pbix` | Relatório da turma anterior. O layout (posição de cada visual e campos usados) foi lido do arquivo e serve de referência aqui no README; na página, só os cartões das medidas sugeridas aparecem no lugar, e os outros espaços ficam vazios para a turma. Não fica para download. |
| `material/power-bi/aula5/Fundo.png` | Fundo feito pela turma anterior no Canva. Aparece na seção 11 como referência e é o fundo do simulador da seção 12 (cópia reduzida em `img/fundo-exemplo.jpg`). O fundo da turma é feito na hora, no Canva. Não fica para download. |
| `material/power-bi/aula5/Aulas 7 e 8 - Do Zero.pbix` | Ignorado, como pedido. |

## Roteiro dos dois encontros

Os horários na página são relativos (0:00 = início do encontro), para 3h20 de aula com intervalo.

| Encontro 1 · Dos dados ao modelo | | Encontro 2 · Do modelo à decisão | |
|---|---|---|---|
| 0:00 01 O pedido do cliente | 20 min | 0:00 09 Das perguntas às medidas | 25 min |
| 0:20 02 Conhecer a planilha + quadro de perguntas | 30 min | 0:25 10 As medidas | 35 min |
| 0:50 03 Diagnóstico | 20 min | 1:00 11 O fundo no Canva | 35 min |
| 1:10 04 Tratar Entregas | 25 min | 1:35 intervalo | 15 min |
| 1:35 intervalo | 15 min | 1:50 12 O relatório | 40 min |
| 1:50 05 Tratar Entregadores | 30 min | 2:30 13 Conclusões | 20 min |
| 2:20 06 Empresas Clientes, com a turma | 20 min | 2:50 14 Documento e 15 Compartilhar | 30 min |
| 2:40 07 Relacionamentos | 15 min | | |
| 2:55 08 Colunas e regras da empresa | 25 min | | |

## O espaço da turma na página

- **Quadros tracejados** (Perguntas da turma, Decisões da turma, Conclusões da turma): o instrutor
  digita o que a turma diz. Ficam guardados **neste navegador, neste computador** (localStorage,
  chaves `pbi-aula5:*`), então o encontro 2 começa com o que o encontro 1 escreveu. O quadro de
  perguntas aparece em 02 e de novo em 09, onde as perguntas respondidas ganham ✓. Para começar
  do zero com outra turma, apague os itens no ✕ ou limpe os dados do site no navegador.
- **Documento (14)**: quatro campos editáveis (tratamentos, colunas, relacionamentos, análises),
  pré-preenchidos com o que a página ensina, mais o conteúdo dos três quadros. "Baixar documento"
  gera o `.txt` no formato da documentação da turma anterior.
- **Empresas Clientes (06)** não tem passo a passo: a turma dita os comandos.
- **Relatório (12)**: os cartões sugeridos estão no lugar; os espaços s1, s7, s9, s10, s11 e s12
  do fundo ficam vazios ("espaço livre") para as análises da turma.

## Pontos para conferir

1. **A regra da taxa.** A documentação diz "aplica-se taxa de 5% em cada entrega realizada", sem
   dizer sobre qual valor. A seção 08 mostra três leituras e deixa a turma decidir (e registrar):

   | Leitura | Faturamento das entregas |
   |---|---|
   | taxa sobre o valor da entrega: `Valor Final × (1 + taxa)` | R$ 186.333,07 |
   | taxa sobre o valor do conteúdo: `Valor Final + Conteúdo × taxa` | R$ 531.055,76 |
   | só a taxa é da empresa: `Valor Final × taxa` | R$ 13.204,62 |

   Os simuladores seguintes usam a primeira; as tarefas aceitam a primeira ou a segunda. As
   fórmulas da turma anterior estão no modelo compactado do `.pbix` e não foram extraídas aqui:
   confira no Power BI qual leitura ela usou.
2. **Mensal × período.** "Valor mensal do contrato" e "Salário Mensal" são de um mês; as entregas
   cobrem um ano. A documentação soma tudo junto (como a seção 10 faz); a página levanta a questão
   para a turma.
3. **Salários de demitidos.** 34 dos 124 entregadores têm data de demissão. Soma de todos:
   R$ 317.315,90; só dos 90 ativos: R$ 231.068,30
   (`CALCULATE(SUM(Entregadores[Salário Mensal]), ISBLANK(Entregadores[Data da Demissão]))`).
4. **Dados que não fecham** (para o diagnóstico e as conclusões): 966 entregas com data depois da
   demissão do entregador; 418 entregas antes da assinatura do contrato do cliente; julho de 2024
   com só 24 entregas (o período começa em 30/07); tipos de veículo incoerentes (Yamaha Factor como
   caminhonete, BMW X1 como moto); valores de conteúdo sem relação com a descrição (arroz de 5 kg
   de R$ 1.790,91). Os dados são fictícios.
5. **Tipo da Data e Hora.** A página supõe que o Power Query detecta "Data e Hora da Entrega"
   (texto `2024-10-02 18:15:20` no Excel) como Data/Hora, e ensina Adicionar Coluna › Data ›
   Somente Data e Hora › Somente Hora. Se na versão instalada a coluna ficar como texto, o caminho
   é Dividir Coluna pelo espaço e acertar o tipo de cada parte (está no cartão de armadilha da 04).
6. **Detecção automática.** Não acha nenhuma relação: as chaves têm nomes diferentes nos dois
   lados (CPF × CPF do Entregador), e as colunas de mesmo nome (Endereço, CEP, Cidade, UF) não
   têm valores em comum ou se repetem. As três relações se fazem à mão.
7. **Filtro de data e o lucro.** Com um mês escolhido na segmentação, o faturamento das entregas
   muda e o dos contratos e os salários não (o filtro não chega a Empresas Clientes nem a
   Entregadores). É assunto de discussão nas seções 07, 10 e 12.
8. **Nomes e caminhos para conferir na versão instalada:** Dividir Coluna › Por Delimitador,
   "Delimitador mais à esquerda / mais à direita / Cada ocorrência do delimitador", Substituir
   Valores ("Valor a Ser Localizado", "Substituir Por"), Data › Somente Data, Hora › Somente Hora,
   Filtros neste visual › N superior, Formatar página › Tela de fundo, Página Inicial › Publicar,
   Arquivo › Exportar › Exportar para PDF e, no serviço, Arquivo › Inserir relatório › Publicar na
   Web (público). No Canva: Criar design › Tamanho personalizado e Compartilhar › Baixar › PNG.
   Licenças do serviço (seção 15): compartilhar pede Pro de quem compartilha e de quem recebe,
   exceto em capacidade Premium ou Fabric.

## Referência para o instrutor: as análises da turma anterior

Da documentação `.txt` e do layout do `.pbix` (página 1280 × 720 sobre o fundo). Números com a
primeira leitura da taxa e todos os salários. Use para conduzir a conversa; a página não mostra
estas análises prontas.

| # | Pergunta | Medida e visual da turma anterior | Número |
|---|---|---|---|
| 1 | Total de entregas | COUNTROWS · cartão | 4.598 |
| 2 | Faturamento total (entregas + contratos) | soma das duas medidas · cartão sem agrupar unidades | R$ 837.537,65 |
| 3 | Despesa com salários | SUM(Salário Mensal) · cartão | R$ 317.315,90 |
| 4 | Lucro | receita − despesa · cartão | R$ 520.221,75 |
| 5 | Faturamento das entregas (soma e média) | SUM(Faturamento) · cartão | R$ 186.333,07 |
| 6 | Faturamento dos contratos (soma e média) | SUM(Valor mensal do contrato) · cartão | R$ 651.204,58 |
| 7 | Receita por UF | colunas, sem eixo X, com rótulos | TO R$ 80.850,19 · MS R$ 71.214,69 · MA R$ 50.255,39 |
| 8 | Top 3 entregadores por receita | barras com N superior | Ana Laura Silva R$ 2.183,04 · Calebe Brito R$ 2.149,06 · Henrique Cirino R$ 2.085,52 |
| 9 | Faturamento médio por porte | MEDIAN(entregas) + MEDIAN(contratos) · área com rótulos | mediana das entregas: Pequeno R$ 39,46 · Médio R$ 40,06 · Grande R$ 42,23; dos contratos: Pequeno R$ 5.901,66 · Médio R$ 4.823,51 · Grande R$ 7.752,39 |
| 10 | Os números de cada mês | segmentação Ano/Mês da Data da Entrega | 323 a 419 entregas nos meses completos |

Outros números: 111 dos 223 veículos com manutenção em breve (Moto 41, Carro 40, Caminhonete 30);
121 veículos com débitos; entregas espalhadas pelas 24 horas do dia (de 165 a 225 por hora).

Posições no `.pbix` da turma (x, y, largura, altura em 1280 × 720): segmentação (62, 120, 192, 63);
Total de Entregas (46, 198, 210, 120); Faturamento Total (273, 90, 333, 108); salários (301, 170,
276, 105); Lucro (286, 246, 291, 105); Faturamento Entregas (651, 103, 255, 83); soma do
Faturamento (970, 100, 238, 88); Faturamento com Contratos (640, 193, 280, 81); soma do Valor
mensal (961, 188, 251, 91); colunas por Estado (43, 373, 581, 195); barras por Nome Completo (795,
318, 285, 190); área por Porte com Média de Faturamento (721, 557, 402, 137). No `.pbix` a UF das
empresas se chama **Estado**; na página, **UF**, como na documentação.

## Os simuladores

**Power Query (`js/pq.js`)**: o editor das aulas 3 e 4 com as quatro abas como o Excel entrega e
comandos novos: Dividir Coluna por Delimitador (personalizado, mais à esquerda, mais à direita,
cada ocorrência; o Tipo Alterado automático vem depois, como no programa), Substituir Valores,
Data › Somente Data e Hora › Somente Hora (Transformar e Adicionar Coluna) e os tipos Data/Hora e
Hora. Duas correções em relação às aulas 3 e 4: o clique duplo no título da coluna agora abre
Renomear (antes o primeiro clique redesenhava a grade e o segundo se perdia), e a rolagem
horizontal da grade não volta para o começo quando se seleciona uma coluna à direita.

**Power BI (`js/pbi.js`)**: o simulador da aula 4 com as quatro tabelas já tratadas, SWITCH,
MEDIAN e MEDIANX no DAX, Filtros neste visual › N superior no painel Visualizações, e o relatório
sobre o fundo com espaços livres. A detecção automática só cria relação quando as colunas de mesmo
nome têm valores em comum.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01 | construtor `fluxo` | as oito etapas, o encontro de cada uma, a ferramenta, a aula onde vimos e o entregável |
| 02 | construtor `abas` + quadro `perguntas` | amostra de cada aba como no Excel (com a linha em branco), chave e ligações; perguntas da turma |
| 03 | `details.pista` | nove problemas reais da planilha, para a turma achar antes de clicar |
| 04 | `data-pq="entregas"` | linhas em branco, Somente Data e Somente Hora, renomear, remover, Fechar e Aplicar |
| 05 | `data-pq="entregadores"` | Nome Completo, +55, endereço em três divisões: Endereço, CEP, Cidade, UF |
| 06 | `data-pq="empresas"` | o mesmo tratamento sem passo a passo |
| 07 | `data-sim="modelo"` | detecção sem resultado, três relações arrastando, antes e depois no relatório |
| 08 | `data-sim="colunas"` + construtor `taxa` + quadro `decisoes` | IF da manutenção, SWITCH com RELATED, as três leituras da taxa |
| 09 | construtor `perguntas` + quadro `perguntas` | medida × eixo = pergunta, visual sugerido e alerta quando o filtro não chega |
| 10 | `data-sim="medidas"` | as seis medidas sugeridas nos seis cartões |
| 12 | `data-sim="relatorio"` | o fundo, os cartões sugeridos e os espaços livres; segmentação e N superior |
| 13 | quadro `conclusoes` | conclusões em três partes |
| 14 | `data-documento` | o documento do projeto, com download do `.txt` |
| 15 | construtor `compartilhar` | publicar, PDF, `.pbix` ou Publicar na Web, conforme quem recebe |
| quiz | `data-quiz` | uma pergunta por etapa do fluxo |

## Estrutura

```
aula5/
├── index.html            a aula inteira
├── css/
│   ├── estilo.css        identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css         blocos do modelo + classes desta aula (agenda, quadros, documento,
│                         diagnóstico, laboratórios, Power Query e Power BI)
├── js/
│   ├── dados-entregas.js as quatro abas da planilha (gerado do .xlsx)
│   ├── pq.js             simulador do Editor do Power Query
│   ├── pbi.js            simulador do Power BI
│   └── aula.js           motor da aula (colorização, navegação, laboratórios, quadros, quiz)
├── fonts/                Roboto (títulos) em cópia local + licença OFL
└── img/                  símbolo e logotipos SEST SENAT, fundo de exemplo
```

## Dicas de condução (não aparecem na página)

- **Link de download**: aponta para `material/power-bi/aula5/DadosEmpresaEntregas.xlsx` pelo
  caminho relativo, então funciona abrindo a página de dentro do repositório.
- A prática precisa do **Power BI Desktop**, da planilha e, no encontro 2, de uma conta no
  **Canva** para o fundo. Publicar no serviço do Power BI exige conta corporativa ou de estudante.
- Abra os dois encontros no **mesmo computador e navegador**, para os quadros e o documento
  continuarem de onde pararam. No fim, baixe o documento `.txt`.
- No diagnóstico (03), deixe a turma falar antes de abrir cada cartão.
- Na seção 08, registre a leitura da taxa no quadro de decisões antes de seguir: os números do
  encontro 2 dependem dela.

## Convenção visual

- Painel escuro = o que se faz: caminho de menus, fórmula M ou DAX, campos.
- Janelas do Power Query e do Power BI = simuladores; tudo nelas responde.
- Selo **Sugerido** (claro) e **A turma decide** (ciano) no topo de cada seção.
- Quadro tracejado = espaço da turma, guardado entre os encontros.
- Tracejado azul em volta de um visual = visual selecionado.

## Verificação

Conferida por `file://` em 1500, 1280, 1200 e 900 px: sem transbordo horizontal da página, sem
erro de console, Roboto e logotipos carregados, menu sem itens cortados. Teste de interação
automatizado: as tarefas dos três editores do Power Query (linhas em branco, Somente Data e Hora,
renomear por clique duplo, Mesclar, Substituir Valores, as três divisões do endereço, Fechar e
Aplicar), a detecção automática sem resultado, as três relações arrastando, as três colunas
calculadas, as seis medidas nos cartões, o relatório com colunas por UF, ranking com N superior,
segmentação por mês e os espaços livres preenchidos, os laboratórios, os quadros (as perguntas do
encontro 1 voltando no encontro 2, ✓ refletindo nas duas cópias, conteúdo mantido depois de
recarregar), o documento baixado em `.txt` e o quiz. O link de download baixa o arquivo idêntico
ao de `material/`, conferido byte a byte por `file://` e por http.
