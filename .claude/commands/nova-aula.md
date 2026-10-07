---
description: Cria uma aula em página única (HTML/CSS/JS para projetar) a partir de um material, guardando tudo no período e PM corretos
argument-hint: <arquivo> [periodo] [pm] [tema] [identidade-visual]
---

Crie uma aula nova com a habilidade `aula-single-page`.

**Argumentos recebidos:** $ARGUMENTS

Siga este roteiro, sem pular etapas:

1. **Descobrir período e PM (obrigatório, vem primeiro).**
   Procure nos argumentos e na mensagem do usuário o período (`1o_periodo`, `2o_periodo`,
   "2º período", "segundo período") e o PM (`pm1` a `pm4`, "PM2", "projeto mensal 2").
   **Se qualquer um dos dois faltar, pergunte antes de fazer qualquer outra coisa**, uma pergunta
   por vez ou as duas juntas, oferecendo as opções existentes. Nunca deduza pelo assunto.

2. **Definir o tema e guardar o material no lugar certo.**
   O primeiro argumento é um arquivo (PPTX, PDF, DOCX ou texto). Procure em
   `material/<periodo>/<pm>/<tema>/`, depois em `material/<periodo>/<pm>/`, depois em
   `material/` (raiz) e, se for um caminho, no caminho dado.
   O **tema** é o nome curto do assunto, em minúsculas, sem acento e com hífen (`flexbox`,
   `bootstrap`, `banco-de-dados`). Se já existir uma pasta para ele em `material/<periodo>/<pm>/`,
   reutilize; se for um tema novo, proponha o nome e confirme junto com a pergunta do passo 1.
   **Todo material fica dentro da pasta do tema**: `material/<periodo>/<pm>/<tema>/arquivo`.
   Se o arquivo estiver em outro lugar, **copie** (não mova) para lá.
   Se não vier argumento, liste o que existe em `material/<periodo>/<pm>/` e pergunte qual usar.

3. **Identidade visual.** Se um argumento citar outra aula de `exemplos/` ou `aulas/`, reaproveite
   os tokens dela. Caso contrário, extraia a paleta e as fontes do próprio material (PPTX: cores e
   `typeface` dos slides; PDF/DOCX: pergunte se não houver pista) e, na falta de qualquer
   referência, use a paleta padrão do `assets/estilo.css` da habilidade.

4. **Ler o material por inteiro** antes de planejar. Em PDFs longos, extraia o texto para um
   arquivo temporário e leia em blocos.

5. **Conferir se o conteúdo envelheceu**, se o material tiver mais de um ano: busque a versão
   atual na documentação oficial e compare classe por classe, propriedade por propriedade.
   Registre o que mudou em um cartão de alerta dentro da seção correspondente.

6. **Criar `aulas/<periodo>/<pm>/<tema>/`**, só o nome do tema, **sem o prefixo `aula-`**, e com
   o mesmo nome da pasta do tema em `material/`. Use a estrutura da habilidade (`index.html`,
   `css/`, `js/`, `demos/`, `img/`, `vendor/` quando houver framework, `README.md`), copiando os
   arquivos de `assets/` e adaptando.

7. **Inserir a referência de período e PM na página**: chips na capa (`.capa-meta`), linha no
   rodapé (`.rodape-meta`) e `data-periodo`/`data-pm` no `<body>`. Modelo em
   `references/design-system.md` §8. Cite também o período e o PM no `README.md` da aula.

8. **Referência de qualidade:** `exemplos/aula-flexbox/` (CSS puro, a partir de PPTX) e
   `exemplos/aula-bootstrap/` (framework, a partir de PDF, com laboratórios e simuladores). As
   versões publicadas com a referência de período/PM estão em `aulas/2o_periodo/pm2/flexbox/` e
   `aulas/2o_periodo/pm2/bootstrap/`.

9. **Verificar** conforme `references/qa-e-armadilhas.md`: sem transbordo horizontal, sem erro de
   console, laboratórios renderizando, iframes com altura justa, sem área vazia entre painéis,
   abrindo por `file://`, nenhum texto dirigido ao professor, chips de período/PM visíveis na capa.

10. **Entregar** com um resumo curto: onde ficaram o material e a aula (caminhos completos), o
    período, o PM e o tema registrados, e o que foi corrigido em relação ao material de origem.
    Não apague nem edite o material original.
