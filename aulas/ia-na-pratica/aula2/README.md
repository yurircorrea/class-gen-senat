# Aula — IA na Prática: Criar com IA (Aula 2)

Página única da segunda aula do curso IA na Prática, para ser projetada e rolada durante a aula.
Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de internet.

**Curso e aula:** IA na Prática, Aula 2 · **Instrutor:** Yuri Reis Correa, Instrutor de Tecnologia ·
**SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema: imagens e vídeos com IA generativa (prompt visual, estilos, refinamento, prompt audiovisual,
ferramentas e revisão) e utilidades de IA para o trabalho (texto, voz, documentos, estudo, mapas
mentais, apresentações e reuniões).

## Material de origem

Todos em `material/ia-na-pratica/aula2/`:

| Arquivo | Uso na aula |
|---|---|
| `Criando-Imagens-com-Inteligencia-Artificial.pdf` | Parte 1 (seções 01 a 06): modalidades, os onze elementos do prompt visual, estilos, Gemini, Copilot, Leonardo AI, ImageFX, rostos sintéticos, DALL·E, refinamento por feedback, ChatGPT como assistente de prompts e uso responsável. |
| `Criando-videos-com-Inteligencia-Artificial (1).pdf` | Parte 2 (seções 07 a 10): fluxo ideia → geração, oito modalidades, clipe/cena/sequência/vídeo, prompt audiovisual em quatro blocos, Sora, Runway, InVideo, Revid, HeyGen, LTX Studio, FLUX, OpenArt, Flow e Veo, escolha da ferramenta e revisão humana. O cabeçalho do PDF diz "Aula 4"; o conteúdo foi usado nesta aula 2, como pedido. |
| `Utilidades-de-IA-para-o-Trabalho.pdf` | Parte 3 (seções 11 a 17): ciclo identificar → revisar, QuillBot, ElevenLabs, ChatPDF, Tutor AI, Mapify, Gamma, tl;dv, as três perguntas orientadoras e o checklist final. |
| `Guia-Basico-de-Inteligencia-Artificial.pdf` | **Apoio.** Trecho do *Guia Básico de Inteligência Artificial*, de Daniella Caruso Gandra: Jasper e NovelAI (seção 12) e a atividade "capa de livro" com DALL·E, adaptada como exemplo de pedir ajuda para escrever o prompt (seção 05). Texto próprio, sem reprodução literal. |

Imagens dos PDFs não foram usadas. As cenas da aula são **esboços de composição** desenhados em
SVG pela própria página. Eles mostram o que o prompt define e marcam com "?" o que fica para a IA
decidir; não pretendem ser a imagem gerada.

## O que foi atualizado em relação ao material

Conferido em outubro de 2026.

| No material | Na aula | Onde |
|---|---|---|
| Slide "DALL·E — OpenAI" e atividades do guia com o DALL·E | O ChatGPT passou a gerar imagens com modelos próprios (GPT Image), e a OpenAI aposentou o DALL·E em 2026. A ferramenta aparece como "ChatGPT · antes DALL·E". | 04 (cartão "novo") |
| ImageFX como ferramenta à parte | Em 2026, o Google reuniu o ImageFX e o Whisk no Flow. A ferramenta aparece como "Google Flow · antes ImageFX". | 04 (cartão "novo") |
| Sora: "descontinuado em 26 de abril de 2026" | Conferido na central de ajuda da OpenAI: o aplicativo saiu em 26/04/2026. A API tem outro cronograma. Mantido como referência histórica. | 09 |
| Texto dentro da imagem | Nuance acrescentada: os modelos de 2026 escrevem bem melhor, mas ainda trocam letras e acentos. Para material oficial, o título vai depois, no editor. | 02, atividade |
| Duração dos clipes | Nota acrescentada: muitas ferramentas geram clipes de poucos segundos, e um vídeo longo é montagem. | 07, laboratório 08 |

Nomes de modos, botões e modelos das ferramentas mudam com frequência. A aula descreve o que cada
ferramenta faz, sem copiar rótulos de uma versão específica.

## Seções

Capa · roteiro e objetivos ·
**Parte 1 — Imagens:** 01 modalidades · 02 anatomia do prompt visual · 03 estilos · 04 ferramentas
de imagem · 05 refinar por feedback · 06 rostos sintéticos e uso responsável ·
**Parte 2 — Vídeos:** 07 do roteiro ao vídeo · 08 prompt audiovisual · 09 ferramentas de vídeo ·
10 revisão humana ·
**Parte 3 — Trabalho:** 11 produtividade · 12 textos · 13 texto em fala · 14 documentos ·
15 aprender e organizar · 16 apresentações e reuniões · 17 escolher a ferramenta ·
quiz · referência rápida · atividade.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01, 03, 06, 16, 17 | quizzes curtos (`data-quiz`) | qual modalidade, qual estilo, pode ou não pode, o erro da ata, qual ferramenta |
| 02 | comparativo + esboços | o prompt genérico deixa luz, formato, estilo e cores com "?"; o estruturado define cada um |
| 02 · Lab | construtor `visual` | os onze elementos montam o prompt e o esboço (formato, luz, ambiente, sujeito, terços, plano, estilo, cores); avisa conflitos (pessoa × "sem pessoas", cartaz × "sem textos") |
| 03 | galeria de esboços | a mesma cena em fotografia, ilustração, 3D isométrico, cinematográfico, cartaz e sem estilo |
| 04 · Lab | construtor `rubrica` | seis critérios de 0 a 5 → nota de 30, ponto fraco e próximo passo |
| 05 · Lab | construtor `feedback` | versão 1 → versão 2: cada feedback muda o esboço; "deixe melhor" muda o que não devia; sem "evite", entra o efeito futurista |
| 08 · Lab | construtor `video` | o prompt audiovisual em quatro blocos e a pré-visualização animada do movimento de câmera (fixa, lateral, aproximação, drone, panorâmica), com linha do tempo de imagem e áudio |
| 09 · Lab | construtor `escolha` | as quatro perguntas orientadoras → ferramentas sugeridas, em ordem, e alerta sem autorização de imagem e voz |
| 10 | jogo `data-falhas` | três quadros de um clipe com seis falhas para achar: cor que muda, roda flutuando, poste que some, caminhão que anda de ré, placa ilegível, som errado |
| 12 · Lab | construtor `reescrita` | quatro reescritas de um aviso, com o que saiu e o que entrou marcado palavra a palavra e alerta quando o sentido muda |
| 13 | texto em fala (`data-voz`) | leitura com a voz do computador (Web Speech API, sem internet), velocidade, tom e "escrever como se fala" (BR-277, km, CNH, 18h) |
| 14 · Lab | construtor `documento` | perguntas a um manual fictício de 4 páginas: a busca destaca o parágrafo de origem ou responde "não encontrei" |
| 15 · Lab | construtor `mapa` | mapa mental de uma reunião (ou desta aula) e a revisão que acha a relação errada |
| 16 · Lab | construtor `contraste` | slide com as cores escolhidas e o teste de contraste (WCAG: 4,5:1 texto normal, 3:1 texto grande) |

As respostas de IA nas demonstrações são **exemplos escritos para a aula**: mostram o efeito de
cada parte do prompt de forma previsível. O detector de parágrafo da seção 14, o teste de
contraste e a leitura em voz alta funcionam de verdade com qualquer entrada.

## Dicas de condução (não aparecem na página)

- A página funciona sem internet. A **atividade** precisa de internet e de ferramentas gratuitas
  (Gemini, Copilot ou ChatGPT para imagem; QuillBot ou similar para texto).
- Os botões **copiar o prompt** (laboratórios 02, 05 e 08) levam o prompt montado para uma IA de
  verdade: bom momento para comparar o esboço com a imagem gerada.
- No laboratório 05, mostre primeiro o feedback vago, depois o estruturado, e por fim desmarque
  "evite" para ver o efeito futurista entrar.
- No jogo da seção 10, deixe a turma apontar as falhas antes de clicar. "mostrar todas" revela de
  uma vez.
- A leitura em voz alta da seção 13 usa as vozes do Windows ("Microsoft Maria", por exemplo). Em
  computador sem voz em português, a leitura sai com sotaque de outro idioma; a página avisa.

## Estrutura

```
aula2/
├── index.html        a aula inteira
├── css/
│   ├── estilo.css    identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css     blocos do modelo, blocos reaproveitados da aula 1 (objetivos, fluxo, chat,
│                     partes) e os desta aula (esboço, câmera, falhas, documento, mapa, slide…)
├── js/
│   └── aula.js       motor do asset (sem simuladores e playground) + esboço de cena (5b),
│                     construtores desta aula (6), falhas (10), voz (11) e copiar (12)
├── fonts/            Roboto (títulos) em cópia local + licença OFL
└── img/              símbolo e logotipos SEST SENAT
```

## Convenção visual

- Painel escuro = o que se escreve: o prompt, o feedback, a pergunta.
- Caixa branca = o que acontece; todo laboratório responde aos controles.
- Esboço com "?" = o que o prompt não definiu e a IA vai decidir; tracejado cinza em volta = formato
  não definido.
- Tracejado azul = os terços da imagem (composição) e a estrutura do mapa mental.
- Riscado/destacado na reescrita = o que saiu do original e o que entrou na versão sugerida.

## Verificação

Conferida por `file://` em 1500, 1366, 1200 e 900 px:
- sem transbordo horizontal, sem erro de console, Roboto e logotipos carregados;
- menu sem itens cortados e nenhuma seção com vazio acima de 250 px entre painel e preview.

Teste de interação com todos os controles:
- os 12 esboços fixos renderizados;
- os cinco movimentos de câmera animando;
- os conflitos avisados no prompt visual e no de vídeo;
- os quatro caminhos do laboratório de ferramentas;
- as quatro reescritas, com os dois alertas de sentido;
- as cinco perguntas ao documento e uma pergunta livre;
- os dois mapas com revisão e quatro combinações de contraste;
- as seis falhas do jogo, a leitura em voz alta, os cinco quizzes e o botão de copiar.
