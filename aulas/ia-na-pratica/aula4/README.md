# Aula — IA na Prática: IA com responsabilidade (Aula 4)

Página única da quarta e última aula do curso IA na Prática, para ser projetada e rolada durante a
aula. Basta abrir `index.html` no navegador: não precisa de servidor, de build nem de internet.

**Curso e aula:** IA na Prática, Aula 4 · **Instrutor:** Yuri Reis Correa, Instrutor de Tecnologia ·
**SEST SENAT** · Unidade B086 - Foz do Iguaçu/PR

Tema: uso ético, seguro e responsável da IA. Contextos de uso (pessoal, profissional,
institucional), riscos das ferramentas gratuitas, por que a IA não é ambiente seguro, princípios
éticos e limites, LGPD na prática, anonimização antes de colar, revisão humana (erros,
alucinações, desatualização e vieses), direitos autorais, o guia de uso de IA do setor e o
encerramento do curso.

## Material de origem

Todos em `material/ia-na-pratica/aula4/`:

| Arquivo | Uso na aula |
|---|---|
| `Uso-Etico-Seguro-e-Responsavel-da-Inteligencia-Artificial (1).pdf` | **Base da aula** (19 slides, "Aula 4"): objetivos, os três contextos de uso, a IA no administrativo, potencial e riscos das ferramentas gratuitas, os quatro princípios éticos, o que a IA não deve fazer, LGPD, "IA não é ambiente seguro", o que pode e o que não pode ser compartilhado, a dinâmica "pode ou não pode", validação humana, erros, alucinações e vieses, construção coletiva do guia, boas práticas e o encerramento do curso. |
| `Uso-Responsavel-da-Inteligencia-Artificial-no-Trabalho.pdf` | **Apoio** (8 slides): riscos de inserir dados pessoais, o fluxo gerar → revisar → aprovar, direitos autorais, o exemplo de uso inadequado (nome, CPF e endereço colados para "melhorar a redação") e o checklist de boas práticas. |

Os dois PDFs não trazem autoria. O texto da aula é próprio; os exemplos (e-mail, ata, comunicado,
termos de uso, anúncio de vaga) são fictícios e escritos para a aula. O slide "Dinâmica: pode ou
não pode?" aparece duplicado no primeiro PDF; a aula usa uma vez.

## O que foi corrigido ou acrescentado em relação ao material

Conferido em outubro de 2026.

| No material | Na aula | Onde |
|---|---|---|
| "Dados institucionais" listados como categoria da LGPD | A LGPD (Lei 13.709/2018) protege dados de pessoas físicas. Finanças, contratos e estratégias são protegidos por sigilo, contrato e política interna. A aula mantém as três categorias, chama a terceira de "informação sigilosa" e explica a diferença num cartão. | 07 |
| "Situações disciplinares" entre os dados sensíveis | Não estão na lista de dados sensíveis do art. 5º, II da LGPD (saúde, vida sexual, origem racial ou étnica, religião, opinião política, filiação a sindicato, dado genético ou biométrico). Continuam na lista do que não vai para a IA, como dado pessoal de alto risco. | 07, 09 |
| Sem menção à lei de IA | O PL 2338/2023 (marco legal da IA) foi aprovado no Senado em dezembro de 2024 e, em outubro de 2026, segue na Câmara sem votação em plenário. A aula diz isso num cartão "novo": por enquanto, valem a LGPD, o sigilo e as políticas internas. | 07 |
| "A IA não deve tomar decisões" | Acrescentado o art. 20 da LGPD (direito de pedir revisão de decisões tomadas só por tratamento automatizado). | 06 |
| "Violação à LGPD" sem consequência | Acrescentados a ANPD como autoridade fiscalizadora e as sanções do art. 52 (de advertência a multa de até 2% do faturamento, limitada a R$ 50 milhões por infração). | 07 |
| Vieses, sem exemplo | Exemplo de anúncio de vaga com restrição de gênero e de idade, com a Lei 9.029/1995 (proíbe práticas discriminatórias no acesso ao trabalho). | 11 |
| "Quem é o autor?" | Citada a Lei 9.610/1998 (autor é a pessoa física que cria a obra). | 13 |
| ChatGPT, Gemini e Copilot e os riscos das versões gratuitas | As regras de privacidade de cada ferramenta mudam com frequência. A aula não afirma a configuração atual de cada uma: o laboratório usa termos de uso fictícios, e a Parte 3 da atividade pede que o aluno leia a política vigente da ferramenta que usa. | 03, atividade |

## Seções

Capa · roteiro e objetivos ·
**Parte 1 — Contexto e riscos:** 01 pessoal, profissional ou institucional · 02 a IA na rotina
administrativa · 03 ferramentas gratuitas e termos de uso · 04 IA não é ambiente seguro ·
**Parte 2 — Ética, limites e LGPD:** 05 quatro princípios · 06 o que a IA não deve fazer ·
07 LGPD na prática · 08 antes de colar: o detector · 09 pode, depende ou não pode ·
**Parte 3 — Revisão humana e boas práticas:** 10 a IA erra, inventa e envelhece · 11 vieses ·
12 gerar, revisar, aprovar · 13 direitos autorais · 14 o guia do setor ·
**Encerramento:** 15 o curso em quatro aulas · quiz · boas práticas consolidadas · atividade.

## Demonstrações e laboratórios

| Onde | Bloco | O que mostra |
|---|---|---|
| 01, 05, 06, 07, 09, 13 | quizzes (`data-quiz`) | qual contexto, qual princípio, apoio ou decisão humana, qual categoria de dado, pode/depende/não pode, pode usar ou evite |
| 02 · Lab | construtor `pedidos` | a mesma tarefa (e-mail, ata, relatório, comunicado, organização) pedida com dados reais, marcados por categoria, e pedida só com a estrutura |
| 03 | trechos clicáveis (`data-achados`) | termos de uso fictícios: achar as seis cláusulas de risco entre oito |
| 04 · Lab | construtor `ambiente` | conta pessoal, conta corporativa ou sistema oficial × o que vai: o trajeto do dado, quem controla e a decisão |
| 08 · Lab | construtor `detector` | **funciona com qualquer texto**: marca CPF, CNH, RG, telefone, e-mail, CEP, placa, endereço, matrícula, nomes, saúde, valores e termos sigilosos, e troca por marcadores ([NOME 1], [CPF]…) |
| 10 | trechos clicáveis (`data-achados`) | um comunicado gerado por IA com seis problemas: data impossível, conta errada, lei inventada, generalização, dados pelo canal errado, assinatura da IA |
| 11 · Lab | construtor `vies` | o anúncio de vaga que a IA escreveu e a revisão item a item |
| 12 · Lab | construtor `checklist` | rascunho interno ou comunicado oficial: o que falta revisar antes de usar, com o registro de revisão |
| 14 · Lab | construtor `guia` | a minuta do guia de uso de IA do setor em quatro blocos, com o texto para copiar |

O detector da seção 08 é uma ferramenta simples de padrões de texto e a página avisa que ele não
acha tudo. Ele roda só no navegador: o texto digitado não sai da página. As respostas de IA das
demonstrações (comunicado, anúncio) são exemplos escritos para a aula.

## Dicas de condução (não aparecem na página)

- A página funciona sem internet. A atividade pede internet só na Parte 3 (políticas de
  privacidade, site da ANPD).
- Seção 08: comece com a troca desligada, leia o texto marcado com a turma, ligue a troca e mostre
  que "atestado" continua no texto. Depois, cole um texto da turma (fictício) no lugar.
- Seções 03 e 10: deixe a turma apontar os trechos antes de clicar; "mostrar todos" revela de uma
  vez. Os trechos sem problema ficam verdes por um instante ao serem clicados.
- Seção 14 é a construção coletiva do material: preencha com a turma, escreva o setor que a turma
  escolher e use "copiar a minuta" para guardar o resultado.
- O guia gerado é uma minuta de turma, sem valor oficial. A página diz isso.

## Estrutura

```
aula4/
├── index.html        a aula inteira
├── css/
│   ├── estilo.css    identidade SEST SENAT (cópia do asset da habilidade)
│   └── demos.css     blocos do modelo, blocos reaproveitados das aulas anteriores (objetivos,
│                     chat, partes, avisos, veredito, quiz em par) e os desta aula (marcação de
│                     dados, pedidos, trajeto, documento com trechos, detector, anúncio, etapas,
│                     minuta do guia, resumo do curso)
├── js/
│   └── aula.js       motor do asset (sem simuladores, planilha, playground e tour) +
│                     construtores desta aula (6), trechos clicáveis (10) e copiar (12)
├── fonts/            Roboto (títulos) em cópia local + licença OFL
└── img/              símbolo e logotipos SEST SENAT
```

## Convenção visual

- Painel escuro = o que se escreve: o pedido, o texto antes de colar.
- Caixa branca = o que acontece; todo laboratório responde aos controles.
- Marcas coloridas: azul = dado pessoal; vermelho = dado sensível; roxo = informação sigilosa.
- Texto com contorno tracejado ao passar o mouse = trecho clicável; vermelho = problema encontrado.
- Tracejado vermelho no trajeto = fora da instituição; tracejado azul = dentro dela.

## Verificação

Conferida por `file://` em 1500, 1366, 1200 e 900 px:
- sem transbordo horizontal, sem erro de console, Roboto e logotipos carregados;
- menu com 16 itens, sem cortes, e nenhuma seção com vazio acima de 250 px entre painel e preview.

Teste de interação com todos os controles (40 verificações):
- os sete quizzes, os cinco processos de pedidos e as nove combinações de ferramenta e dado;
- as cláusulas dos termos (trecho neutro não conta, limpar, mostrar todos, teclado) e os seis
  problemas do comunicado;
- o detector com o texto padrão (9 pessoais, 2 sensíveis, 1 sigiloso, 11 marcadores), sem o
  atestado, com texto livre, sem dados e com dados sensíveis e sigilosos;
- o anúncio revisado, o checklist interno e oficial, o guia (setor, bloco vazio, texto) e o
  botão de copiar.
