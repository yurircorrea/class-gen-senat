# class-gen

Projeto para produzir **aulas de tecnologia em página única** (HTML/CSS/JS) que o professor abre no
navegador e rola no projetor, a partir de um material de origem (PPTX, PDF, apostila).

Cada aula é uma pasta autônoma, sem servidor e sem build, que funciona offline e abre por duplo
clique. As aulas e os materiais são organizados por **período**, por **PM (projeto mensal)** e por
**tema**.

## Como usar

1. Informe o material e diga **a que período e PM ele pertence**.
2. Peça a aula, de uma das duas formas:
   - `/nova-aula arquivo.pptx 2o_periodo pm2` (comando deste projeto)
   - em linguagem natural: "crie uma aula do 2º período, PM2, a partir de arquivo.pdf"
3. A aula nasce em `aulas/<periodo>/<pm>/<tema>/`. Abra o `index.html`.
4. Para ajustar, peça mudanças em linguagem natural ("troque a seção X", "adicione um laboratório
   de Y", "remova a seção Z").

## Estrutura

```
class-gen/
├── CLAUDE.md                          este arquivo
├── material/                          ENTRADA: PPTX, PDF, DOCX de origem
│   ├── 1o_periodo/  pm1  pm2  pm3  pm4
│   └── 2o_periodo/  pm1  pm2  pm3  pm4
│                         └── pm2/  flexbox/  bootstrap/     (uma pasta por tema)
├── aulas/                             SAÍDA: uma pasta por tema, dentro do PM
│   ├── 1o_periodo/  pm1  pm2  pm3  pm4
│   └── 2o_periodo/  pm1  pm2  pm3  pm4
│                         └── pm2/  flexbox/  bootstrap/
├── exemplos/
│   ├── aula-flexbox/                  referência de qualidade (CSS puro, a partir de PPTX)
│   └── aula-bootstrap/               referência de qualidade (framework, a partir de PDF)
└── .claude/
    ├── skills/aula-single-page/       a habilidade (processo, regras, assets)
    └── commands/nova-aula.md          o comando /nova-aula
```

Nomes de pasta: `1o_periodo`, `2o_periodo`; `pm1` a `pm4`; tema em minúsculas, sem acento, com
hífen (`flexbox`, `bootstrap`, `banco-de-dados`). Pastas vazias guardam um `.gitkeep` para
existirem no git: apague o `.gitkeep` quando colocar o primeiro arquivo.

## Regras de organização (valem sempre)

1. **Todo material novo pertence a um período e a um PM.** Se o pedido não disser qual, **pergunte
   antes de qualquer outra coisa** (período e PM, com as opções existentes). Nunca deduza pelo
   assunto nem coloque na raiz de `material/` ou `aulas/`.
2. **Todo material pertence a um tema, e cada tema tem a sua pasta**:
   `material/<periodo>/<pm>/<tema>/`. Vários materiais do mesmo tema (um PPTX, uma apostila, um
   exercício) ficam juntos nessa pasta, nunca soltos na pasta do PM. Se já existir uma pasta para
   o tema, reutilize; se for um tema novo, crie e confirme o nome na mesma pergunta do passo 1.
3. **Se o arquivo vier de outro lugar** (Downloads, Desktop), **copie**, não mova: o original do
   usuário fica onde estava.
4. **Aula em `aulas/<periodo>/<pm>/<tema>/`**, **sem o prefixo `aula-`**: só o nome do tema
   (`aulas/2o_periodo/pm2/bootstrap`). O tema tem o **mesmo nome** em `material/` e em `aulas/`.
5. **A página da aula mostra o período e o PM**: chips na capa (`.capa-meta`), linha no rodapé
   (`.rodape-meta`) e `data-periodo`/`data-pm` no `<body>`. O `README.md` da aula também cita.
   Modelo em `.claude/skills/aula-single-page/references/design-system.md` §8.
6. **`exemplos/` é só leitura.** Guarda as duas aulas de referência de qualidade, com os nomes
   antigos (`aula-flexbox`, `aula-bootstrap`). Ao criar uma aula nova, nunca altere `exemplos/`; a
   versão "oficial" de cada aula (com período e PM na página) fica em `aulas/`.

## Regras que valem para toda aula

Detalhadas na habilidade `aula-single-page`. As que mais importam:

1. **Nada dirigido ao professor na página.** A aula é projetada para os alunos. Instruções de uso
   vão no `README.md` da aula, que não é projetado.
2. **Todo conceito tem código e resultado ao vivo lado a lado**, nunca captura de tela.
3. **Bordas revelam a estrutura** nas demonstrações de layout.
4. **Funciona offline e por `file://`.** Frameworks ensinados ficam em `vendor/`.
5. **Nenhuma linha de código escondida** (`white-space: pre-wrap`).
6. **Sem área vazia** entre painel de código e preview: `.dupla` quando as alturas são parecidas,
   `.pilha` (preview em cima, código em duas colunas embaixo) quando o código é bem mais alto.
7. **Atividade final em três partes**: obrigatória, desafio e investigação.
8. **Conferir se o material envelheceu** antes de escrever. Apostilas erram e frameworks mudam.

## Convenções de trabalho

- Idioma da aula e dos comentários: português do Brasil.
- Nunca apague nem edite o conteúdo de `material/`.
- Arquivos temporários de verificação (`_qa.css`, perfis de navegador, `.claude/launch.json`)
  devem ser removidos antes de entregar. Confira que o `<link>` do `_qa.css` saiu do `index.html`.
- Para arquivos grandes, prefira a ferramenta de escrita de arquivo a heredocs de shell.
- Se o material for protegido por direitos autorais de terceiros, mantenha a atribuição na aula
  (rodapé ou README) e não reproduza trechos longos literalmente além do necessário para ensinar.
  Exemplo: a apostila `bootstrap5_min.pdf` é CC BY-NC 4.0 (Mariano, D., Alfahelix, 2022).
- A habilidade existe em duas cópias: `.claude/skills/aula-single-page/` (projeto) e
  `~/.claude/skills/aula-single-page/` (usuário). Ao alterar uma, copie para a outra.

## Verificação

Roteiro completo em `.claude/skills/aula-single-page/references/qa-e-armadilhas.md`. Resumo:

```bash
python -m http.server 8788 --directory aulas/<periodo>/<pm>/<tema>
```

Medir no console: transbordo horizontal, erros, laboratórios renderizados, altura dos iframes,
vazio entre painéis. Capturar uma seção por vez com Chrome headless e **perfil novo a cada
captura**. Testar por `file://`. Conferir que os chips de período e PM aparecem na capa.
