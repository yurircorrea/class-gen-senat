# Aula — IA na Prática: Inteligência artificial (Aula 1)

Página única da primeira aula do curso IA na Prática, para ser projetada e rolada durante a aula.
Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de internet.

**Curso e aula:** IA na Prática, Aula 1 · **Instrutor:** Yuri Reis Correa, Instrutor de Tecnologia ·
**SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema: fundamentos de IA e aplicação no setor de transporte; ferramentas de Processamento de
Linguagem Natural (PLN) e engenharia de prompt.

## Material de origem

| Arquivo | Uso na aula |
|---|---|
| `material/ia-na-pratica/aula1/IA na Prática Aula 1 (1).pdf` | **Base da aula** (apresentação do instrutor, 21 slides): ordem dos temas, objetivos, definições, exemplos no transporte, tabela dados/algoritmos/modelos, IA assistiva × autônoma, PLN, prompts e boas práticas. O slide "Quem é o instrutor" virou a seção de abertura, com a foto do próprio slide (`img/instrutor.jpg`). |
| `material/ia-na-pratica/aula1/Guia-Basico-de-Inteligencia-Artificial.pdf` | **Apoio.** *Guia Básico de Inteligência Artificial: descomplicando a IA em seu dia a dia*, de Daniella Caruso Gandra. Usado, com texto próprio e sem reprodução literal, em: as 5 grandes ideias da IA (seção 03), bolha de filtro e as cinco atitudes para sair dela (seção 03), persona/objetivo/tom (seções 10 e 11) e desafios e limitações (seção 14). As atividades com Jasper, NovelAI e DALL·E do guia não entraram nesta aula. |
| `material/ia-na-pratica/descritivo-do-curso.md` | Contexto do curso inteiro (justificativa, objetivo, perfil de conclusão, metodologia). |

As 5 grandes ideias (percepção, representação e raciocínio, aprendizagem, interação natural,
impacto social) são da iniciativa AI4K12, citada no guia. A escala de níveis de automação da
seção 07 é a SAE J3016.

Imagens do material (bancos de imagem e marcas d'água do Canva) não foram usadas: cada conceito
tem uma demonstração refeita em HTML. A identidade visual é a do SEST SENAT, não a dos slides.

## O que foi atualizado em relação ao material

| No material | Na aula | Onde |
|---|---|---|
| Copilot com três estilos de conversa (Mais Criativo, Mais Equilibrado, Mais Preciso) | A Microsoft retirou essa escolha em 2024; hoje a ferramenta escolhe o modelo. Para o mesmo efeito, pede-se no prompt ("seja criativo", "seja preciso e cite as fontes"). | 13, cartão de alerta; "modo certo" |
| Botão "Novo Tópico" do Copilot | "Comece uma conversa nova": o nome do botão muda de ferramenta para ferramenta. | 10 (passo a passo), 13 |
| "Aprendizado contínuo": a IA aprende com os dados que recebe | Nuance para os assistentes de chat: o modelo não muda durante a conversa; o treino tem data de corte; o app pode guardar memórias ou usar conversas em treinos futuros, conforme as configurações. | 04, cartão de alerta |
| "Mecanismo de resposta dos modelos GPT" | Vale para todos os modelos de linguagem (ChatGPT, Copilot, Gemini, Claude). | 09 |
| "Cadeia de pensamento" | Acrescentado que, desde 2024, existem modelos de raciocínio; neles o passo a passo importa menos para acertar, mas continua útil para conferir. | 12, cartão "novo" |
| IA autônoma | Acrescentados os agentes de IA (desde 2025) e a escala SAE de automação veicular. | 07 |
| Boletim da empresa fictícia "Contoso" | Exemplos trocados por situações de transporte em Foz do Iguaçu (carga atrasada, BR-277, cliente no Paraguai). | 10 a 14 |

Conferido em outubro de 2026. Nomes de botões e modos das ferramentas de IA mudam com frequência:
a página fala em "botão de nova conversa" e "modo de raciocínio" em vez de copiar rótulos de uma
versão específica.

## Seções

Capa · Quem é o instrutor · roteiro e objetivos ·
**Parte 1** — 01 O que é IA · 02 IA no transporte · 03 IA no dia a dia (e bolha de filtro) ·
04 Como a IA aprende · 05 Dados, algoritmos e modelos · 06 Tipos de aprendizado ·
07 IA assistiva × autônoma ·
**Parte 2** — 08 Ferramentas de PLN · 09 A próxima palavra mais provável · 10 O que é um prompt ·
11 Monte um prompt · 12 Técnicas de prompt · 13 Boas práticas · 14 Cuidados ·
quiz · referência rápida · atividade.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01 | quiz "É IA ou não é?" | o teste rápido: aprendeu com dados ou segue uma regra fixa |
| 02 · Lab | construtor `manutencao` | sensores do caminhão → risco de falha (modelo logístico simplificado) → ação sugerida |
| 03 · Lab | construtor `bolha` | curtidas e dias de uso fecham o feed num assunto só |
| 04 · Lab | construtor `treino` | um classificador de golpes (Naive Bayes) treinado ao vivo: mais exemplos, mais certeza; rótulos errados estragam o modelo |
| 05 | mini planilha editável + comparação | o "algoritmo" `=SOMA(C2:C7)/SOMA(B2:B7)` aprende o consumo por km; um zero a mais quadruplica o modelo |
| 06 · Lab | construtor `rede` | rede neural em SVG: camadas, neurônios e número de conexões; rasa × profunda |
| 07 · Lab | construtor `autonomia` | níveis 0 a 5 da escala SAE: quem dirige e quem vigia |
| 08 · Lab | construtor `pln` | a mesma mensagem resumida, classificada, extraída e traduzida |
| 09 | gerador de palavras (`data-gerador`) | escolha da próxima palavra por probabilidade, com temperatura |
| 10 | comparativo + tour sobre um assistente refeito em HTML | prompt simples × estruturado; os sete passos de uso de uma ferramenta |
| 11 · Lab | construtor `prompt` | cada parte do prompt muda a resposta; lacunas em amarelo; botão para copiar o prompt |
| 12 | galeria | zero-shot, few-shot, papel e cadeia de pensamento, com resposta |
| 13 · Lab | construtor `avaliador` | confere qualquer prompt digitado: 7 partes e alerta de dado pessoal (CPF, telefone, e-mail, senha, cartão) |
| 14 | comparativo + quiz "Pode colar na IA?" | dados reais × fictícios; LGPD |
| quiz | `data-quiz` | sete perguntas com os erros que o aluno comete de verdade |

As respostas de IA nas demonstrações são **exemplos escritos para a aula** (marcados como
"resposta de exemplo"): mostram o efeito de cada parte do prompt de forma previsível. As
probabilidades do gerador da seção 09 são ilustrativas; o mecanismo de escolha (temperatura e
sorteio) é o de verdade.

## Dicas de condução (não aparecem na página)

- A página funciona sem internet. A **atividade** precisa de internet e de uma ferramenta de IA
  gratuita (ChatGPT, Copilot, Gemini ou outra).
- No laboratório 11, o botão **copiar o prompt** leva o prompt montado para uma IA de verdade:
  bom momento para comparar a resposta de exemplo com a real e mostrar que ela varia.
- No laboratório 13 dá para digitar o prompt que a turma ditar e conferir as partes na hora.
- No laboratório 04, comece com 2 exemplos (acerta, mas com pouca certeza), suba até 12 e depois
  marque "rotulou errado".
- No gerador da seção 09, temperatura 0 sempre produz a mesma frase; acima de 1, aparecem as
  absurdas ("abduzida", "purpurina"): gancho para falar de alucinação.

## Estrutura

```
aula1/
├── index.html        a aula inteira
├── css/
│   ├── estilo.css    identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css     blocos do modelo + classes desta aula (feed, sensores, rede, chat, avaliador…)
├── js/
│   └── aula.js       motor do asset (sem simuladores e playground) + construtores desta aula
│                     (seção 6), gerador de palavras (seção 10) e botão copiar (seção 11)
├── fonts/            Roboto (títulos) em cópia local + licença OFL
└── img/              símbolo, logotipos SEST SENAT e foto do instrutor (do slide 2 do material)
```

## Convenção visual

- Painel escuro = o que se escreve ou se faz: a regra, o prompt, a fórmula.
- Caixa branca = o que acontece; todo laboratório responde aos controles.
- Tracejado azul = um grupo que contém outro (IA ⊃ aprendizado de máquina ⊃ deep learning ⊃ IA
  generativa).
- Amarelo nas respostas de IA = lacuna: a informação que o prompt não deu.
- Fórmulas da planilha em português, com `;` entre argumentos e vírgula decimal.

## Verificação

Conferida por `file://` em 1500, 1200 e 900 px: sem transbordo horizontal, sem erro de console,
Roboto e logotipos carregados, menu sem itens cortados, nenhuma seção com vazio acima de 250 px
entre painel e preview. Teste de interação com todos os controles de cada laboratório, as 9.216
combinações do laboratório de prompt (nenhuma resposta passa do limite de palavras pedido), os
quizzes, os sete passos do tour, o gerador de palavras (cliques, sorteio, temperatura 0 e 1,6), a
planilha (trocar um consumo recalcula o modelo e a previsão) e o botão de copiar.
