# class-gen - Engenharia de Software Descomplica Uniamérica

Transforme uma apresentação ou apostila em uma **aula em página única** para projetar: cada conceito
com o código e o resultado ao vivo lado a lado, laboratórios interativos, simuladores de largura de
tela e uma atividade final desafiadora.

## Uso rápido

```
1. diga o período e o PM do material       (ex.: 2º período, PM2)
2. no Claude Code, dentro desta pasta:     /nova-aula meu-material.pptx 2o_periodo pm2
3. abra aulas/2o_periodo/pm2/<tema>/index.html
```

Também funciona em linguagem natural: *"crie uma aula do 2º período, PM2, a partir de
apostila.pdf"*. Se você não disser o período e o PM, o Claude pergunta antes de começar.

## Organização

Tudo é guardado por período, por PM (projeto mensal) e por **tema**:

```
material/                          o que você recebe (PPTX, PDF, DOCX)
└── 1o_periodo/ e 2o_periodo/
    └── pm1/  pm2/  pm3/  pm4/
        └── <tema>/                um ou vários materiais do mesmo tema

aulas/                             o que é gerado, uma pasta por tema
└── 1o_periodo/ e 2o_periodo/
    └── pm1/  pm2/  pm3/  pm4/
        └── <tema>/                a aula (index.html, css/, js/, ...)
```

O nome do tema é o mesmo em `material/` e em `aulas/` (minúsculas, sem acento, com hífen:
`flexbox`, `bootstrap`, `banco-de-dados`). Vários materiais sobre o mesmo tema ficam juntos na
pasta do tema, sem bagunçar a pasta do PM.

A página da aula mostra o período e o PM na capa e no rodapé.

## Aulas já feitas

| Aula | Material | Destaques |
|---|---|---|
| `aulas/2o_periodo/pm2/flexbox` | `material/2o_periodo/pm2/flexbox/Flexbox-Descomplica.pptx` | CSS puro, bordas revelando o contêiner, laboratório de Flexbox |
| `aulas/2o_periodo/pm2/bootstrap` | `material/2o_periodo/pm2/bootstrap/bootstrap5_min.pdf` | 8 laboratórios, 8 simuladores, playground, conteúdo atualizado de 5.1 para 5.3 |
| `aulas/2o_periodo/pm3/web-apis-http` | `material/2o_periodo/pm3/web-apis-http/` (3 PDFs: HTTP partes 1 e 2, Web APIs) | laboratórios com requisições HTTP reais a APIs públicas, aviso quando não há Internet, cliente HTTP e playground de `fetch` |

As duas aulas também existem em `exemplos/`, como referência de qualidade (sem a referência de
período/PM na página).

## O que sai de cada aula

- `index.html` com 20–30 seções, uma por conceito
- painel de código colorido + caixa de *live preview* em cada seção
- laboratórios interativos que mostram o código gerado
- simuladores de largura de tela (quando o assunto é responsividade)
- laboratório livre com editor e resultado ao vivo
- referência rápida e atividade final em três partes
- cópia local de qualquer framework ensinado: abre **sem internet**

## A habilidade

O conhecimento está em `.claude/skills/aula-single-page/`:

| Arquivo | Conteúdo |
|---|---|
| `SKILL.md` | processo, regras e o que entregar |
| `references/design-system.md` | tokens, anatomia dos blocos, formato da atividade, referência de período/PM |
| `references/interatividade.md` | laboratórios, simuladores, playground, realce de código |
| `references/qa-e-armadilhas.md` | verificação e erros já encontrados |
| `assets/` | CSS, JS e HTML-modelo prontos para copiar |

A mesma habilidade está instalada em `~/.claude/skills/aula-single-page/`, então funciona também
em outros projetos. Se você editar a habilidade aqui, copie a alteração para lá (ou o contrário)
para as duas não divergirem.

## Mudar a identidade visual

Os tokens ficam no `:root` do `css/estilo.css` de cada aula: cor de destaque, fundo, painel de
código, fontes. Para uma instituição diferente, peça: *"use a identidade visual de
aulas/2o_periodo/pm2/flexbox"* ou *"extraia as cores do PPTX"*.
