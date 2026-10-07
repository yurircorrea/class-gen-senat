# class-gen — SEST SENAT, Unidade B086 - Foz do Iguaçu/PR

Transforme uma apresentação, apostila ou planilha em uma **aula em página única** para projetar
nos cursos livres de informática e tecnologia: cada conceito com o que se faz (a fórmula, o caminho
de menus, o atalho ou o código) e o resultado ao vivo lado a lado, laboratórios interativos e uma
atividade final desafiadora, na identidade visual do SEST SENAT.

## Uso rápido

```
1. diga o curso, a aula e o instrutor       (ex.: Excel Básico, aula 3, Yuri Reis Correa)
2. no Claude Code, dentro desta pasta:      /nova-aula apostila.pdf excel-basico aula3 "Yuri Reis Correa"
3. abra aulas/excel-basico/aula3/index.html
```

Também funciona em linguagem natural: *"crie a aula 3 do curso de Excel Básico, instrutor Yuri
Reis Correa, a partir de apostila.pdf"*. Se faltar o curso, a aula ou o instrutor, o Claude
pergunta antes de começar.

## Organização

Tudo é guardado por **curso** e por **aula**:

```
material/                          o que você recebe (PPTX, PDF, DOCX, XLSX)
├── designsystem.pdf               modelo institucional (cores, fontes, logotipos)
└── <curso>/                       excel-basico/, power-bi/, informatica-basica/ …
    ├── (apostila do curso todo)   opcional
    └── aula1/  aula2/  …          os materiais de cada aula

aulas/                             o que é gerado
└── <curso>/
    └── aula1/  aula2/  …          a aula (index.html, css/, js/, fonts/, img/, ...)
```

Nomes de pasta: curso em minúsculas, sem acento, com hífen; aula como `aula1`, `aula2`… O curso e a
aula têm o mesmo nome em `material/` e em `aulas/`.

A página da aula mostra o curso e a aula em chips na capa e é assinada pelo instrutor, com o cargo
e a unidade (B086 - Foz do Iguaçu/PR), na capa e no rodapé.

As pastas `1o_periodo/` e `2o_periodo/` em `material/` e `aulas/` são da instância anterior do
class-gen (outra instituição, organizada por período e PM) e não fazem parte do modelo curso/aula.

## O que sai de cada aula

- `index.html` com uma seção por conceito
- painel escuro com o que se faz (fórmula, caminho de menus, atalho ou código) + caixa de preview
  com o resultado funcionando
- **demonstrações sem código**: mini planilha que calcula de verdade (fórmulas em português, com
  `;`), aplicativo refeito em HTML com o botão da vez destacado, passo a passo clicável, quiz com
  correção na hora, gráfico de barras
- laboratórios interativos que mostram, junto com o resultado, onde clicar ou o que digitar
- simuladores de largura de tela e playground de código (nas aulas de programação)
- referência rápida e atividade final em três partes
- identidade SEST SENAT: capa no formato do slide institucional, logotipos oficiais, Roboto local —
  abre **sem internet**

## Exemplos

| Exemplo | Destaques |
|---|---|
| `exemplos/aula-flexbox` | CSS puro, bordas revelando o contêiner, laboratório de Flexbox |
| `exemplos/aula-bootstrap` | 9 laboratórios, 8 simuladores, playground, conteúdo atualizado de 5.1 para 5.3 |
| `.claude/skills/aula-sest-senat/assets/modelo-aula.html` | esqueleto com cada bloco funcionando, inclusive os sem código (planilha, faixa de opções, tour, quiz) |

Os dois exemplos estão na identidade SEST SENAT; o curso e a aula mostrados nos chips são
ilustrativos.

## A habilidade

O conhecimento está em `.claude/skills/aula-sest-senat/`:

| Arquivo | Conteúdo |
|---|---|
| `SKILL.md` | processo, regras, curso/aula/instrutor e qual demonstração usar para cada conceito |
| `references/design-system.md` | tokens SEST SENAT, anatomia dos blocos, capa, atividade, logotipos |
| `references/interatividade.md` | planilha, aplicativo refeito, tour, quiz, laboratórios, simuladores, playground |
| `references/qa-e-armadilhas.md` | verificação e erros já encontrados |
| `assets/` | CSS, JS, HTML-modelo, fonte Roboto e logotipos prontos para copiar |

A habilidade fica **só neste projeto**. Ela se chama `aula-sest-senat` (e não `aula-single-page`)
para não ser encoberta por uma habilidade pessoal de mesmo nome em `~/.claude/skills/`, que no
Claude Code tem prioridade sobre a do projeto.

## Identidade visual

Tirada de `material/designsystem.pdf` e já aplicada em `assets/estilo.css`: azul `#00307C`, ciano
`#5FE1FF`, azul-gelo `#EAF6FE`, azul-marinho `#002060`, contornos em `#009EE2`; títulos em Roboto
Bold, corpo em Calibri, nome do instrutor em Calibri negrito itálico. A capa reproduz o slide de
abertura (meias-luas e logotipos à direita) e a barra superior, a faixa do slide interno.
