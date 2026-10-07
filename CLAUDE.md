# class-gen SEST SENAT

Projeto para produzir **aulas de informática e tecnologia em página única** (HTML/CSS/JS) que o
instrutor abre no navegador e rola no projetor, a partir de um material de origem (PPTX, PDF,
apostila, planilha).

Instituição: **SEST SENAT — Unidade B086 - Foz do Iguaçu/PR**, cursos livres de informática e
tecnologia (Excel, Power BI, informática básica, internet e segurança, Word, programação…).

Cada aula é uma pasta autônoma, sem servidor e sem build, que funciona offline e abre por duplo
clique. Material e aulas são organizados por **curso** e por **aula**.

## Como usar

1. Informe o material e diga **de que curso e de que aula ele é**, e **quem é o instrutor**.
2. Peça a aula, de uma das duas formas:
   - `/nova-aula arquivo.pdf excel-basico aula3 "Yuri Reis Correa"` (comando deste projeto)
   - em linguagem natural: "crie a aula 3 do curso de Excel Básico, instrutor Yuri Reis Correa, a
     partir de arquivo.pdf"
3. A aula nasce em `aulas/<curso>/<aula>/`. Abra o `index.html`.
4. Para ajustar, peça mudanças em linguagem natural ("troque a seção X", "adicione um laboratório
   de Y", "remova a seção Z").

## Estrutura

```
class-gen-senat/
├── CLAUDE.md                          este arquivo
├── material/                          ENTRADA: PPTX, PDF, DOCX, XLSX de origem
│   ├── designsystem.pdf               modelo institucional SEST SENAT (cores, fontes, logotipos)
│   └── <curso>/                       ex.: excel-basico/, power-bi/
│       ├── apostila-do-curso.pdf      material que serve ao curso inteiro (opcional)
│       └── <aula>/                    ex.: aula1/, aula2/ — materiais daquela aula
├── aulas/                             SAÍDA: uma pasta por aula, dentro do curso
│   └── <curso>/<aula>/                ex.: aulas/excel-basico/aula1/index.html
├── exemplos/
│   ├── aula-flexbox/                  referência de qualidade (CSS puro, a partir de PPTX)
│   └── aula-bootstrap/                referência de qualidade (framework, a partir de PDF)
└── .claude/
    ├── skills/aula-sest-senat/        a habilidade (processo, regras, assets)
    └── commands/nova-aula.md          o comando /nova-aula
```

Nomes de pasta: curso em minúsculas, sem acento, com hífen (`excel-basico`, `power-bi`,
`informatica-basica`); aula como `aula` + número, sem zero à esquerda (`aula1`, `aula2`,
`aula12`). As pastas são criadas quando o primeiro material do curso chega.

**Pastas legadas:** `material/1o_periodo/`, `material/2o_periodo/`, `aulas/1o_periodo/` e
`aulas/2o_periodo/` vêm da instância anterior do class-gen (Descomplica UniAmérica, organizada por
período e PM). Não seguem o modelo curso/aula: não crie nada nelas, não as ofereça como curso e
não as use como referência de organização ou de identidade visual.

## Regras de organização (valem sempre)

1. **Todo material novo pertence a um curso e a uma aula, e toda aula tem um instrutor.** Se o
   pedido não disser qual curso, qual aula ou quem é o instrutor, **pergunte antes de qualquer
   outra coisa**, numa rodada só, oferecendo os cursos que já existem (e, se o curso já tem aulas,
   o instrutor delas). Nunca deduza o curso pelo assunto nem coloque material solto na raiz de
   `material/` ou de `aulas/`.
2. **Material da aula em `material/<curso>/<aula>/`.** Vários materiais da mesma aula (um PPTX,
   uma apostila, um exercício) ficam juntos nessa pasta. Material que serve ao curso inteiro fica
   em `material/<curso>/`. Se o curso é novo, proponha o nome da pasta e o rótulo com acentos
   ("Excel Básico") na mesma pergunta do passo 1.
3. **Se o arquivo vier de outro lugar** (Downloads, Desktop), **copie**, não mova: o original do
   usuário fica onde estava.
4. **Aula em `aulas/<curso>/<aula>/`**, com os mesmos nomes de curso e aula de `material/`.
5. **A página mostra curso, aula, instrutor e unidade**: chips de curso e aula na capa
   (`.capa-meta`), assinatura do instrutor com cargo e "Unidade B086 - Foz do Iguaçu/PR"
   (`.assinatura`), linha no rodapé (`.rodape-meta`) e `data-curso`/`data-aula`/`data-instrutor`/
   `data-unidade` no `<body>`. O `README.md` da aula também cita. Modelo em
   `.claude/skills/aula-sest-senat/references/design-system.md` §8.
6. **Cargo do instrutor como o pedido escrever** ("Instrutor de Informática", "Instrutora de
   Informática"). Se não vier, pergunte junto com o nome; não deduza pelo nome da pessoa. E-mail só
   entra se for informado.
7. **`exemplos/` é só leitura** ao criar uma aula. Guarda as duas aulas de referência de qualidade,
   já na identidade SEST SENAT (o curso e a aula dos chips delas são ilustrativos).

## Regras que valem para toda aula

Detalhadas na habilidade `aula-sest-senat`. As que mais importam:

1. **Nada dirigido ao instrutor na página.** A aula é projetada para os alunos. Instruções de uso
   vão no `README.md` da aula, que não é projetado.
2. **Todo conceito tem "o que se faz" e o resultado ao vivo lado a lado**, nunca captura de tela.
   O "o que se faz" nem sempre é código: pode ser a fórmula, o caminho de menus, o atalho. O
   resultado funciona de verdade: mini planilha que calcula, aplicativo refeito em HTML, tour
   clicável, quiz, laboratório com controles.
3. **Bordas revelam a estrutura** nas demonstrações de layout (tracejado azul = contêiner).
4. **Funciona offline e por `file://`.** Frameworks ensinados ficam em `vendor/`; a fonte Roboto,
   em `fonts/`.
5. **Nenhuma linha escondida** (`white-space: pre-wrap`).
6. **Sem área vazia** entre painel e preview: `.dupla` quando as alturas são parecidas, `.pilha`
   (preview em cima, painel em duas colunas embaixo) quando o painel é bem mais alto.
7. **Atividade final em três partes**: obrigatória, desafio e investigação.
8. **Conferir se o material envelheceu** antes de escrever. Apostilas erram, menus mudam de lugar
   entre versões do Office e frameworks mudam.
9. **Identidade SEST SENAT sempre** (de `material/designsystem.pdf`, já pronta nos assets da
   habilidade): azul `#00307C`, ciano `#5FE1FF`, azul-gelo `#EAF6FE`, azul-marinho `#002060`,
   títulos em Roboto, corpo em Calibri, logotipos oficiais. Não use as cores do material de origem.
10. **Termos como o aluno vê na tela**: menus, botões e funções como na versão em português, com
    `;` entre argumentos e vírgula decimal nas fórmulas.

## Convenções de trabalho

- Idioma da aula e dos comentários: português do Brasil.
- Nunca apague nem edite o conteúdo de `material/`.
- Arquivos temporários de verificação (`_qa.css`, perfis de navegador, `.claude/launch.json`)
  devem ser removidos antes de entregar. Confira que o `<link>` do `_qa.css` saiu do `index.html`.
- Para arquivos grandes, prefira a ferramenta de escrita de arquivo a heredocs de shell.
- Se o material for protegido por direitos autorais de terceiros, mantenha a atribuição na aula
  (rodapé ou README) e não reproduza trechos longos literalmente além do necessário para ensinar.
  Exemplo: a apostila `bootstrap5_min.pdf` do exemplo de Bootstrap é CC BY-NC 4.0 (Mariano, D.,
  Alfahelix, 2022).
- `material/designsystem.pdf` é classificado pela instituição como informação interna: use-o como
  referência, não o publique nem anexe a aulas.
- **A habilidade desta instância existe só no projeto** (`.claude/skills/aula-sest-senat/`). Não a
  copie para `~/.claude/skills/`: lá pode estar a `aula-single-page` de outra instituição, e uma
  habilidade pessoal tem prioridade sobre a do projeto quando os nomes coincidem — por isso esta se
  chama `aula-sest-senat`.

## Verificação

Roteiro completo em `.claude/skills/aula-sest-senat/references/qa-e-armadilhas.md`. Resumo:

```bash
python -m http.server 8788 --directory aulas/<curso>/<aula>
```

Medir no console: transbordo horizontal, erros, laboratórios e planilhas renderizados, altura dos
iframes, vazio entre painéis, Roboto e logotipos carregados. Clicar nos laboratórios, na planilha,
no quiz e no tour. Capturar uma seção por vez com Chrome headless e **perfil novo a cada captura**.
Testar por `file://`. Conferir chips de curso e aula e a assinatura do instrutor na capa.
