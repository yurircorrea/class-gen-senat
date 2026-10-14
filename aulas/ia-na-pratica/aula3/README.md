# Aula — IA na Prática: O Claude no trabalho (Aula 3)

Página única da terceira aula do curso IA na Prática, para ser projetada e rolada durante a aula.
Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de internet.

**Curso e aula:** IA na Prática, Aula 3 · **Instrutor:** Yuri Reis Correa, Instrutor de Tecnologia ·
**SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema: o ecossistema do Claude, do chat ao agente. Modelos, tokens, esforço, planos e privacidade;
artefatos; Cowork; o Claude no Excel, no Word e no PowerPoint; conectores e MCP; Claude Code, do
prompt estruturado ao site publicado; e Skills, da anatomia ao SKILL.md testado.

## Material de origem

Todos em `material/ia-na-pratica/aula3/`:

| Arquivo | Uso na aula |
|---|---|
| `Apostila Curso Básico de Claude.pdf` | **Base da aula.** *Curso Básico de Claude — material de apoio*, de Diego Monutti, Hashtag Treinamentos (54 p., setembro de 2026). Tópicos 01 a 13 viraram as seções 01 a 17, o quiz, a referência rápida e a atividade. Texto próprio da aula, sem reprodução de trechos longos; os exemplos foram adaptados (cardápio da lanchonete Parada 277, notas fiscais de fornecedores da frota, relatório semanal de entregas). A página de divulgação do curso pago (tópico 14) não foi usada. |
| `The-Complete-Guide-to-Building-Skill-for-Claude - Auxiliar.pdf` | **Apoio.** *The Complete Guide to Building Skills for Claude*, Anthropic (janeiro de 2026). Fonte das regras do frontmatter (name em kebab-case, description com o que faz e quando usar, até 1.024 caracteres, sem `<` `>`, nomes reservados), da divulgação progressiva em três níveis, dos testes de ativação (ativa de menos, ativa demais) e do corpo do SKILL.md com passos, formato e erros (seções 14 e 15). |

O material é protegido por direitos autorais dos autores citados. A aula cita a fonte aqui e
não o redistribui.

## O que foi atualizado em relação ao material

Conferido em outubro de 2026.

| No material | Na aula | Onde |
|---|---|---|
| Modelos: Fable 5.1, Opus 5, Sonnet 5 e Haiku 4.5 | Depois da apostila chegaram o Sonnet 5.5 (fim de setembro), o Haiku 5.5 (início de outubro) e o Opus 5.5. A tabela, o laboratório e o quiz usam Haiku 5.5, Sonnet 5.5, Opus 5.5 e Fable 5.1, com um cartão "novo" avisando que os nomes mudam. | 02, quiz |
| Guia da Anthropic: instalar skills em "Settings › Capabilities › Skills" | Caminho atual: Personalizar › Skills (como na apostila). Em Configurações › Capacidades fica só a chave de execução de código, exigida pelas skills. | 16, atividade |
| Gabarito do exercício 01 da apostila (com Opus 5, Sonnet 5 e Haiku 4.5) | O laboratório da seção 02 traz as mesmas tarefas com os nomes atuais e o esforço recomendado. | 02 |
| Exemplo de CLAUDE.md da apostila (hamburgueria) | Adaptado para a lanchonete Parada 277, com regras verificáveis (preço com vírgula, três cores), seguindo o critério do gabarito do exercício 04. | 12 |

Continuam como na apostila, porque batem com as fontes de outubro de 2026: suplementos do Excel,
Word e PowerPoint disponíveis em todos os planos pagos e o do Outlook em beta pública; Cowork e
tarefas agendadas nos planos pagos; Skills também no plano gratuito, com a execução de código
ligada; conectores em Personalizar. Nomes de botões e menus mudam com frequência: a aula descreve o
caminho como a apostila mostra, e o quiz e os laboratórios não dependem do rótulo exato.

## Seções

Capa · roteiro e objetivos ·
**Parte 1 — Conhecer o Claude:** 01 conversar ou executar · 02 modelos, tokens e esforço ·
03 planos e privacidade ·
**Parte 2 — Criar e executar:** 04 artefatos · 05 o pedido em seis blocos e o compartilhamento ·
06 Cowork · 07 Excel, Word e PowerPoint · 08 planilha em etapas · 09 do Excel para o PowerPoint ·
**Parte 3 — Conectar, construir e ensinar:** 10 conectores e MCP · 11 Claude Code ·
12 CLAUDE.md · 13 testar e publicar · 14 skills · 15 o SKILL.md · 16 criar e instalar ·
17 qual recurso usar · quiz · referência rápida · atividade.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01 · Lab | construtor `quemfaz` | a mesma tarefa pedida como conversa e como agente: quem executa cada passo (você, o Claude, você decide) |
| 02 · Lab | construtor `modelo` | tarefa × modelo × esforço → veredito (na medida, gasta mais, insuficiente), capacidade e consumo da cota em escala ilustrativa |
| 03 · Lab | construtor `privacidade` | plano, treinamento e tipo de dado → pode enviar, envie com cuidado ou não envie assim (LGPD, anonimização) |
| 04 | dashboard (`data-lab="dashboard"`) | o artefato gerado por um pedido curto: 54 linhas fictícias, filtros por vendedor e categoria que mudam todos os números e o gráfico |
| 05 · Lab | construtores `artefato` e `compartilhar` | os seis blocos montam o pedido e o esboço do artefato (tema, botões, dados, celular); o link mostra a versão compartilhada, não a última editada |
| 06 · Lab | construtor `cowork` | o pedido seguro: sem caminho, o Claude pergunta; sem "nunca apagar", apaga a cópia ou substitui o relatório antigo; sem ler a nota, ficam arquivos sem data; com resumo, o que mudou |
| 07 | tour (`data-tour`) | instalar o suplemento no Excel refeito em HTML, em seis passos, até o painel do Claude |
| 08 | mini planilha (`data-planilha`) | total por fórmula × total colado: mudar um mês desatualiza o colado, e o aviso mostra a diferença |
| 09 · Lab | construtor `publico` | os mesmos dados em slides para síndico, conselho e moradores, com títulos genéricos ou afirmativos |
| 10 · Lab | construtor `permissoes` | as ações do conector do Gmail em sempre permitir, requer aprovação ou bloqueado, e o que acontece em cada pedido |
| 11 · Lab | construtor `code` | objetivo, contexto, stack e entregável → avisos, a árvore de pastas da estrutura inicial e o efeito do modo de permissão |
| 12, 16, 17 | quizzes (`data-quiz`) | regra verificável ou vaga; uma skill ou duas; qual recurso usar |
| 13 | cardápio (`data-cardapio`) | o site no servidor de testes: filtros que funcionam e a "rede de proteção" da foto que não carregou |
| 14 · Lab | construtor `niveis` | os três níveis de carregamento de uma skill para cada pedido e o total carregado × "se tudo entrasse sempre" |
| 15 · Lab | construtor `skillmd` | valida o frontmatter (seis regras) e simula a ativação em seis frases de teste |

As respostas e os resultados dos laboratórios são **exemplos escritos para a aula**: mostram o
efeito de cada parte do pedido de forma previsível, com dados fictícios. A simulação de ativação da
seção 15 é simplificada (palavras-chave em comum entre a frase e a description) e a página diz
isso; o Claude de verdade decide pelo sentido. As escalas de capacidade, consumo e tokens das
seções 02 e 14 são ilustrativas.

## Dicas de condução (não aparecem na página)

- A página funciona sem internet. A **atividade** precisa de internet e de uma conta no Claude: o
  artefato e a skill funcionam no plano gratuito (com a execução de código ligada); o Cowork exige
  plano pago, então quem não tiver só escreve o pedido.
- Seção 06: comece com as três caixas desmarcadas, deixe a turma ler a tabela e marque uma de cada
  vez. Depois troque a tarefa para "relatório da semana" e desmarque "nunca apagar".
- Seção 08: clique em B5, digite `5000` na barra de fórmulas e tecle Enter.
- Seção 10: o laboratório começa com "Enviar e-mail" em sempre permitir, de propósito.
- Seção 15: corrija o name para `relatorio-semanal` e percorra as quatro descriptions na ordem
  (vaga, sem quando, completa, genérica) antes de escrever uma própria.
- Os botões **copiar** (laboratórios 05, 06, 09 e 11) levam o pedido montado para o Claude de
  verdade.

## Estrutura

```
aula3/
├── index.html        a aula inteira
├── css/
│   ├── estilo.css    identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css     blocos do modelo, blocos reaproveitados das aulas 1 e 2 (objetivos, fluxo,
│                     chat, partes, avisos, barras) e os desta aula (dashboard, artefato, pasta do
│                     Cowork, suplemento, slides, permissões, árvore, níveis, SKILL.md, cardápio)
├── js/
│   └── aula.js       motor do asset (sem simuladores e playground) + construtores desta aula (6),
│                     valores colados (10), cardápio (11) e copiar (12)
├── fonts/            Roboto (títulos) em cópia local + licença OFL
└── img/              símbolo e logotipos SEST SENAT
```

## Convenção visual

- Painel escuro = o que se escreve: o pedido, o prompt, o CLAUDE.md, o SKILL.md.
- Caixa branca = o que acontece; todo laboratório responde aos controles.
- Amarelo = o Claude para e pede aprovação (acesso à pasta, ação de conector), ou um alerta.
- Vermelho = algo que deu errado: arquivo apagado, link com a versão antiga, regra reprovada.
- Tracejado azul = estrutura: as pastas do projeto e da skill; tracejado cinza = subpasta.
- "?" no esboço do artefato = o que o pedido não definiu e o Claude vai decidir.

## Verificação

Conferida por `file://` em 1500, 1366, 1200 e 900 px:
- sem transbordo horizontal, sem erro de console, Roboto e logotipos carregados;
- menu com 16 itens, sem cortes, e nenhuma seção com vazio acima de 250 px entre painel e preview.

Teste de interação com todos os controles (62 verificações):
- as seis combinações de quem faz e as 60 de modelo e esforço;
- cinco casos de privacidade e os filtros do dashboard (total igual ao do CSV);
- o artefato completo, vazio e com dados reais em link público, e os três casos de compartilhamento;
- o Cowork com e sem as instruções, sem caminho e com outro caminho;
- os seis passos do tour e a planilha (B5 = 5000 → diferença de R$ 1.390,00);
- os três públicos, as permissões do conector e os quatro blocos do Claude Code;
- os filtros do cardápio, os quatro pedidos dos níveis e as quatro descriptions do SKILL.md;
- os cinco quizzes e o botão de copiar.
