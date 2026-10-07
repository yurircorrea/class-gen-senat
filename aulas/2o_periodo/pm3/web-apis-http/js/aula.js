/* =========================================================
   Aula: HTTP e Web APIs
   aula.js - motor da aula em página única
   1. APIs públicas usadas pelos laboratórios
   2. Colorização dos blocos de código (HTML, JS, HTTP, JSON, curl)
   3. Navegação: progresso, menu ativo, voltar ao topo
   4. Motor de requisições: envia, mede, avisa quando não há Internet
   5. Componentes: diagramas de sequência, navegador, anatomia
   6. Laboratórios de requisição HTTP
   7. Laboratório livre (fetch) e miniaplicação da atividade

   JavaScript puro, sem dependência. Os laboratórios enviam
   requisições REAIS para APIs públicas: precisam de Internet.
   ========================================================= */

(function () {
  "use strict";

  /* ======================================================
     1. APIs PÚBLICAS

     Todas aceitam pedidos de outro site (CORS) e respondem
     JSON. window.AULA_APIS permite apontar para um servidor
     de testes durante a verificação da aula.
     ====================================================== */

  var APIS = {
    crud: "https://jsonplaceholder.typicode.com",   // CRUD de treino (não grava nada)
    eco: {                                          // devolvem o pedido que receberam
      "httpbin.org": "https://httpbin.org",
      "httpbingo.org": "https://httpbingo.org"
    },
    cep: "https://viacep.com.br/ws",                // CEPs do Brasil
    dns: "https://dns.google/resolve"               // DNS sobre HTTPS, em JSON
  };
  if (window.AULA_APIS) {
    Object.keys(window.AULA_APIS).forEach(function (k) { APIS[k] = window.AULA_APIS[k]; });
  }

  var PREF_ECO = "aula-http:servidor-eco";
  var ecoAtual = Object.keys(APIS.eco)[0];
  try {
    var salvo = localStorage.getItem(PREF_ECO);
    if (salvo && APIS.eco[salvo]) ecoAtual = salvo;
  } catch (e) { /* armazenamento indisponível: fica o padrão */ }

  function eco() { return APIS.eco[ecoAtual]; }

  function baseDa(api) {
    if (api === "crud") return APIS.crud;
    if (api === "eco") return eco();
    if (api === "cep") return APIS.cep;
    if (api === "dns") return APIS.dns;
    return "";
  }

  /* ======================================================
     2. COLORIZAÇÃO DE CÓDIGO

     Linha a linha. O conteúdo é lido de pre.textContent:
     no HTML fonte todo "<" precisa estar escapado como &lt;.
     data-lang: html (padrão), js, http, json, bash.
     ====================================================== */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function span(cls, txt) {
    return '<span class="' + cls + '">' + esc(txt) + "</span>";
  }

  /* HTML: <tag atributo="valor"> */
  function hlHtml(linha) {
    var re = /(<\/?)([a-zA-Z][-\w]*)|([-\w:@.]+)(=)("[^"]*"|'[^']*')/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[2]) out += span("tk-tag", m[1] + m[2]);
      else out += span("tk-attr", m[3]) + esc(m[4]) + span("tk-str", m[5]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* JavaScript: textos, palavras-chave e números */
  function hlJs(linha) {
    var re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(let|const|var|for|of|in|new|function|return|if|else|async|await|try|catch|throw|true|false|null|document|window)\b|(\b\d+(?:\.\d+)?\b)/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[1]) out += span("tk-str", m[1]);
      else if (m[2]) out += span("tk-val", m[2]);
      else out += span("tk-num", m[3]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* posição do // que começa um comentário (ignora // dentro de textos, como em https://) */
  function inicioComentarioJs(linha) {
    var aspas = "";
    for (var i = 0; i < linha.length; i++) {
      var c = linha.charAt(i);
      if (aspas) {
        if (c === "\\") { i++; continue; }
        if (c === aspas) aspas = "";
      } else if (c === '"' || c === "'" || c === "`") {
        aspas = c;
      } else if (c === "/" && linha.charAt(i + 1) === "/") {
        return i;
      }
    }
    return -1;
  }

  /* JSON (também usado no corpo das mensagens HTTP) */
  function hlJson(linha) {
    var re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|\b(true|false|null)\b/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[1] && m[2]) out += span("tk-attr", m[1]) + esc(m[2]);
      else if (m[1]) out += span("tk-str", m[1]);
      else if (m[3]) out += span("tk-num", m[3]);
      else out += span("tk-val", m[4]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* curl na linha de comando */
  function hlBash(linha) {
    if (/^\s*#/.test(linha)) return span("tk-com", linha);
    var iC = linha.search(/\s#\s/);
    if (iC !== -1) return hlBash(linha.slice(0, iC)) + span("tk-com", linha.slice(iC));
    var re = /("(?:[^"\\]|\\.)*"|'[^']*')|(^|\s)(-{1,2}[A-Za-z][-\w]*)|\b(curl)\b/g;
    var out = "", ultimo = 0, m;
    while ((m = re.exec(linha)) !== null) {
      out += esc(linha.slice(ultimo, m.index));
      if (m[1]) out += span("tk-str", m[1]);
      else if (m[3]) out += esc(m[2]) + span("tk-val", m[3]);
      else out += span("tk-tag", m[4]);
      ultimo = re.lastIndex;
    }
    return out + esc(linha.slice(ultimo));
  }

  /* HTTP: linha inicial, cabeçalhos, linha em branco, corpo.
     Linhas que começam com "~" são o que o navegador acrescenta
     sozinho (aparecem em cinza); "#" é comentário didático. */
  var RE_INICIO_RESP = /^(HTTP\/[\d.]+)(\s+)(\d{3})(.*)$/;
  var RE_INICIO_PED = /^([A-Z]{3,8})(\s+)(\S+)(\s*)(HTTP\/[\d.]+)?(.*)$/;

  function hlHttpInicio(l) {
    var m = RE_INICIO_RESP.exec(l);
    if (m) return span("tk-val", m[1]) + esc(m[2]) + span("tk-num", m[3]) + span("tk-str", m[4]);
    m = RE_INICIO_PED.exec(l);
    if (m) return span("tk-tag", m[1]) + esc(m[2]) + span("tk-str", m[3]) + esc(m[4]) + (m[5] ? span("tk-val", m[5]) : "") + esc(m[6]);
    return esc(l);
  }

  function hlHttpCabecalho(l) {
    var m = /^([!#$%&'*+.^_`|~\w-]+)(:)(.*)$/.exec(l);
    if (m) return span("tk-prop", m[1]) + esc(m[2]) + esc(m[3]);
    return esc(l);
  }

  function colorirHttp(texto) {
    var fase = 0;   // 0 = antes da linha inicial, 1 = cabeçalhos, 2 = corpo
    return texto.split("\n").map(function (l) {
      if (l.charAt(0) === "~") return span("tk-dim", l.slice(1));
      if (/^#/.test(l)) return span("tk-com", l);
      if (fase === 2 && (RE_INICIO_RESP.test(l) || /^[A-Z]{3,8} \S+ HTTP\//.test(l))) fase = 0;
      if (fase === 0) {
        if (!l.trim()) return "";
        fase = 1;
        return hlHttpInicio(l);
      }
      if (fase === 1) {
        if (!l.trim()) { fase = 2; return ""; }
        return hlHttpCabecalho(l);
      }
      return hlJson(l);
    }).join("\n");
  }

  function hlLinha(linha, lang) {
    if (lang === "js") {
      var iJ = inicioComentarioJs(linha);
      if (iJ !== -1) return hlJs(linha.slice(0, iJ)) + span("tk-com", linha.slice(iJ));
      return hlJs(linha);
    }
    if (lang === "json") return hlJson(linha);
    if (lang === "bash") return hlBash(linha);
    var iH = linha.indexOf("<!--");
    if (iH !== -1) return hlLinha(linha.slice(0, iH), lang) + span("tk-com", linha.slice(iH));
    return hlHtml(linha);
  }

  function colorir(pre) {
    var lang = pre.getAttribute("data-lang") || "html";
    var fonte = pre.textContent.replace(/^\n/, "").replace(/\s+$/, "");
    if (lang === "http") { pre.innerHTML = colorirHttp(fonte); return; }
    pre.innerHTML = fonte.split("\n").map(function (l) { return hlLinha(l, lang); }).join("\n");
  }

  function escreverCodigo(pre, texto) {
    if (!pre) return;
    pre.textContent = texto;
    colorir(pre);
  }

  document.querySelectorAll("pre.codigo").forEach(colorir);

  /* ======================================================
     3. NAVEGAÇÃO
     ====================================================== */

  var progresso = document.querySelector(".progresso");
  var botaoTopo = document.querySelector(".voltar-topo");
  var links = Array.prototype.slice.call(document.querySelectorAll(".barra-menu a"));
  var alvos = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  function aoRolar() {
    var altura = document.documentElement.scrollHeight - window.innerHeight;
    var pct = altura > 0 ? (window.scrollY / altura) * 100 : 0;
    if (progresso) progresso.style.width = pct + "%";
    if (botaoTopo) botaoTopo.classList.toggle("visivel", window.scrollY > 600);

    var atual = -1;
    for (var i = 0; i < alvos.length; i++) {
      if (alvos[i].getBoundingClientRect().top <= 140) atual = i;
    }
    links.forEach(function (a, i) { a.classList.toggle("ativo", i === atual); });
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", aoRolar);
  aoRolar();

  if (botaoTopo) {
    botaoTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ======================================================
     4. MOTOR DE REQUISIÇÕES

     enviar(req) nunca rejeita: devolve { resposta } ou { erro }.
     Antes de enviar confere navigator.onLine; sem conexão,
     nada sai do navegador e o laboratório mostra um aviso.
     ====================================================== */

  try { performance.setResourceTimingBufferSize(3000); } catch (e) { /* opcional */ }

  var LIMITE_MS = 15000;
  var METODOS_PROIBIDOS = ["CONNECT", "TRACE", "TRACK"];
  var CAB_PROIBIDOS = ["accept-charset", "accept-encoding", "access-control-request-headers",
    "access-control-request-method", "connection", "content-length", "cookie", "cookie2", "date",
    "dnt", "expect", "host", "keep-alive", "origin", "referer", "set-cookie", "te", "trailer",
    "transfer-encoding", "upgrade", "via"];
  var FRASES = {
    200: "OK", 201: "Created", 202: "Accepted", 204: "No Content", 206: "Partial Content",
    301: "Moved Permanently", 302: "Found", 303: "See Other", 304: "Not Modified",
    307: "Temporary Redirect", 308: "Permanent Redirect", 400: "Bad Request", 401: "Unauthorized",
    403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed", 406: "Not Acceptable",
    409: "Conflict", 410: "Gone", 412: "Precondition Failed", 415: "Unsupported Media Type",
    418: "I'm a teapot", 422: "Unprocessable Content", 429: "Too Many Requests",
    500: "Internal Server Error", 501: "Not Implemented", 502: "Bad Gateway",
    503: "Service Unavailable", 504: "Gateway Timeout"
  };
  var NOMES_CANONICOS = { etag: "ETag", "www-authenticate": "WWW-Authenticate", te: "TE", dnt: "DNT" };

  function cabProibido(nome) {
    var n = String(nome).toLowerCase();
    return CAB_PROIBIDOS.indexOf(n) !== -1 || n.indexOf("proxy-") === 0 || n.indexOf("sec-") === 0;
  }

  function canonico(nome) {
    var n = String(nome).toLowerCase();
    if (NOMES_CANONICOS[n]) return NOMES_CANONICOS[n];
    return n.split("-").map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join("-");
  }

  function temCorpo(req) {
    return req.corpo != null && req.corpo !== "" && req.metodo !== "GET" && req.metodo !== "HEAD";
  }

  function bytesDe(texto) {
    try { return new Blob([texto]).size; } catch (e) { return texto.length; }
  }

  function rotuloProtocolo(p) {
    if (p === "h2") return "HTTP/2";
    if (p === "h3") return "HTTP/3";
    if (p === "http/1.1") return "HTTP/1.1";
    if (p === "http/1.0") return "HTTP/1.0";
    return "";
  }

  function protocoloDe(url) {
    try {
      var e = performance.getEntriesByName(url);
      return e.length ? (e[e.length - 1].nextHopProtocol || "") : "";
    } catch (err) { return ""; }
  }

  /* motivo pelo qual o navegador faz um OPTIONS antes (preflight do CORS) */
  function motivoPreflight(req) {
    if (["GET", "HEAD", "POST"].indexOf(req.metodo) === -1) return "método " + req.metodo;
    var motivo = "";
    (req.cabecalhos || []).some(function (c) {
      var n = c[0].toLowerCase();
      if (cabProibido(n)) return false;
      if (n === "accept" || n === "accept-language" || n === "content-language") return false;
      if (n === "content-type") {
        var tipo = String(c[1]).split(";")[0].trim().toLowerCase();
        if (["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"].indexOf(tipo) !== -1) return false;
        motivo = "Content-Type: " + c[1];
        return true;
      }
      motivo = "cabeçalho " + canonico(c[0]);
      return true;
    });
    return motivo;
  }

  function enviar(req) {
    var url;
    try { url = new URL(req.url); } catch (e) {
      return Promise.resolve({ erro: { tipo: "url", url: req.url } });
    }
    var host = url.host;
    if (METODOS_PROIBIDOS.indexOf(req.metodo) !== -1) {
      return Promise.resolve({ erro: { tipo: "proibido", metodo: req.metodo, host: host } });
    }
    if (!navigator.onLine) {
      return Promise.resolve({ erro: { tipo: "offline", host: host } });
    }

    var cab = new Headers();
    (req.cabecalhos || []).forEach(function (c) {
      if (!c[0] || cabProibido(c[0])) return;
      try { cab.append(c[0], c[1]); } catch (e) { /* nome inválido: o navegador recusaria */ }
    });

    var ctrl = window.AbortController ? new AbortController() : null;
    var limite = req.limite || LIMITE_MS;
    var relogio = ctrl ? setTimeout(function () { ctrl.abort(); }, limite) : null;
    var opcoes = { method: req.metodo, headers: cab, cache: "no-store", credentials: "omit", redirect: "follow" };
    if (ctrl) opcoes.signal = ctrl.signal;
    if (temCorpo(req)) opcoes.body = req.corpo;

    var inicio = performance.now();
    return fetch(url.href, opcoes).then(function (r) {
      var tipo = (r.headers.get("content-type") || "").toLowerCase();
      var leitura = tipo.indexOf("image/") === 0
        ? r.blob().then(function (b) { return { blob: b, texto: null, bytes: b.size }; })
        : r.text().then(function (t) { return { blob: null, texto: t, bytes: bytesDe(t) }; });
      return leitura.then(function (c) {
        clearTimeout(relogio);
        var lista = [];
        r.headers.forEach(function (v, n) { lista.push([n, v]); });
        return {
          resposta: {
            status: r.status,
            frase: r.statusText || FRASES[r.status] || "",
            ok: r.ok,
            cabecalhos: lista,
            texto: c.texto,
            blob: c.blob,
            bytes: c.bytes,
            tipo: tipo,
            redirecionada: r.redirected,
            urlFinal: r.url,
            tempo: Math.round(performance.now() - inicio),
            protocolo: protocoloDe(r.url) || protocoloDe(url.href)
          }
        };
      });
    }).catch(function (e) {
      clearTimeout(relogio);
      if (e && e.name === "AbortError") return { erro: { tipo: "tempo", host: host, limite: limite } };
      if (!navigator.onLine) return { erro: { tipo: "offline", host: host } };
      return { erro: { tipo: "rede", host: host, detalhe: e && e.message } };
    });
  }

  /* ---------- textos das mensagens ---------- */

  function origemDaPagina() {
    return location.protocol === "file:" || location.origin === "null" ? "null" : location.origin;
  }

  function textoPedido(req) {
    var u = new URL(req.url);
    var linhas = [req.metodo + " " + u.pathname + u.search + " HTTP/1.1", "Host: " + u.host];
    var temAccept = false, temTipo = false;
    (req.cabecalhos || []).forEach(function (c) {
      if (!c[0]) return;
      var n = c[0].toLowerCase();
      if (n === "accept") temAccept = true;
      if (n === "content-type") temTipo = true;
      if (cabProibido(n)) linhas.push("~" + canonico(c[0]) + ": " + c[1] + "   (ignorado: o navegador não deixa o JavaScript definir este)");
      else linhas.push(canonico(c[0]) + ": " + c[1]);
    });
    if (!temAccept) linhas.push("~Accept: */*");
    var corpo = temCorpo(req) ? req.corpo : "";
    if (corpo && !temTipo) linhas.push("~Content-Type: text/plain;charset=UTF-8");
    if (corpo) linhas.push("~Content-Length: " + bytesDe(corpo));
    linhas.push("~Origin: " + origemDaPagina());
    linhas.push("~User-Agent: " + navigator.userAgent);
    linhas.push("");
    if (corpo) linhas.push(corpo);
    return linhas.join("\n");
  }

  function corpoLegivel(res) {
    if (res.blob) return "~(imagem de " + res.bytes + " bytes: veja o resultado ao lado)";
    if (res.texto == null || res.texto === "") return "~(corpo vazio)";
    var t = res.texto;
    if (/json/.test(res.tipo) || /^\s*[\[{]/.test(t)) {
      try { t = JSON.stringify(JSON.parse(t), null, 2); } catch (e) { /* não era JSON */ }
    }
    if (t.length > 5000) t = t.slice(0, 5000) + "\n~(… corpo cortado aqui: " + res.bytes + " bytes no total)";
    return t;
  }

  function textoResposta(res) {
    var proto = rotuloProtocolo(res.protocolo) || "HTTP/1.1";
    var linhas = [proto + " " + res.status + " " + res.frase];
    res.cabecalhos.forEach(function (c) { linhas.push(canonico(c[0]) + ": " + c[1]); });
    linhas.push("~(os demais cabeçalhos só aparecem no F12, aba Rede)");
    linhas.push("");
    linhas.push(corpoLegivel(res));
    return linhas.join("\n");
  }

  function classeStatus(s) { return "s" + String(s).charAt(0); }

  function chipStatus(res) {
    return '<span class="status-chip ' + classeStatus(res.status) + '">' + res.status + " " + esc(res.frase) + "</span>";
  }

  function itemMeta(rotulo, valor) {
    return '<span class="meta-item">' + esc(rotulo) + ": <b>" + esc(valor) + "</b></span>";
  }

  /* ---------- avisos ---------- */

  function htmlAviso(erro) {
    var host = "<code>" + esc(erro.host || "") + "</code>";
    var ehEco = Object.keys(APIS.eco).some(function (k) { return APIS.eco[k].indexOf(erro.host) !== -1; });
    var titulo, textos, tipo = "erro", icone = "!";
    if (erro.tipo === "offline") {
      tipo = "offline";
      titulo = "Sem conexão com a Internet";
      textos = ["Este laboratório envia uma requisição de verdade para " + host +
                ", e o seu dispositivo está desconectado. Nada foi enviado.",
                "Conecte-se à Internet e clique de novo."];
    } else if (erro.tipo === "tempo") {
      titulo = esc(erro.host) + " não respondeu em " + Math.round(erro.limite / 1000) + " segundos";
      textos = ["A conexão está lenta ou o serviço está sobrecarregado. O pedido foi cancelado.",
                ehEco ? "Tente de novo ou troque o servidor de eco no seletor do laboratório." : "Tente de novo em instantes."];
    } else if (erro.tipo === "proibido") {
      tipo = "info"; icone = "i";
      titulo = "O navegador não envia " + esc(erro.metodo);
      textos = ["TRACE, TRACK e CONNECT são proibidos para o JavaScript por segurança: o pedido nem saiu do navegador.",
                "Em ferramentas de linha de comando, como o <code>curl</code>, eles funcionam."];
    } else if (erro.tipo === "url") {
      titulo = "URL inválida";
      textos = ["Confira se ela começa com <code>https://</code> e não tem espaços."];
    } else {
      titulo = "Sem resposta de " + esc(erro.host);
      textos = ["O pedido não recebeu resposta. Causas comuns: a rede bloqueia este site, o serviço está fora do ar ou o navegador barrou a resposta por CORS.",
                ehEco ? "Tente de novo ou troque o servidor de eco (httpbin.org ou httpbingo.org) no seletor do laboratório." : "Tente de novo em instantes."];
      if (!navigator.onLine) textos.unshift("O dispositivo parece estar sem Internet.");
    }
    return '<div class="aviso aviso--' + tipo + '" role="alert"><span class="aviso-icone" aria-hidden="true">' + icone +
      "</span><div><h4>" + titulo + "</h4>" + textos.map(function (t) { return "<p>" + t + "</p>"; }).join("") + "</div></div>";
  }

  function avisoSeOffline(caixa, host) {
    if (navigator.onLine) { if (caixa) caixa.innerHTML = ""; return false; }
    if (caixa) caixa.innerHTML = htmlAviso({ tipo: "offline", host: host });
    return true;
  }

  /* faixa no topo da página quando a conexão cai */
  var faixa = document.querySelector(".faixa-offline");
  function atualizarFaixa() { if (faixa) faixa.classList.toggle("visivel", !navigator.onLine); }
  window.addEventListener("online", atualizarFaixa);
  window.addEventListener("offline", atualizarFaixa);
  atualizarFaixa();

  /* ---------- troca: pedido + resposta exibidos lado a lado ---------- */

  function montarTroca(el) {
    if (el.getAttribute("data-montada")) return;
    el.setAttribute("data-montada", "1");
    el.classList.add("troca");
    var empilhado = el.getAttribute("data-troca") === "empilhado";
    el.innerHTML =
      '<div class="troca-meta" data-meta><span class="nota-demo">nada enviado ainda</span></div>' +
      '<div data-aviso aria-live="polite"></div>' +
      '<div class="troca-pares' + (empilhado ? " troca-pares--empilhado" : "") + '">' +
      '<figure class="painel-codigo painel-msg"><figcaption>pedido enviado · em cinza, o que o navegador acrescenta</figcaption>' +
      '<pre class="codigo" data-lang="http" data-msg-pedido></pre></figure>' +
      '<figure class="painel-codigo painel-msg"><figcaption>resposta recebida</figcaption>' +
      '<pre class="codigo" data-lang="http" data-msg-resposta></pre></figure></div>' +
      '<p class="preflight" data-preflight></p>';
  }
  document.querySelectorAll("[data-troca]").forEach(montarTroca);

  function pendente(t, req) {
    montarTroca(t);
    t.querySelector("[data-aviso]").innerHTML = "";
    t.querySelector("[data-meta]").innerHTML = '<span class="status-chip enviando">enviando…</span>' + itemMeta("destino", hostDe(req.url));
    escreverCodigo(t.querySelector("[data-msg-pedido]"), textoPedido(req));
    t.querySelector("[data-msg-resposta]").textContent = "";
    t.querySelector("[data-preflight]").innerHTML = "";
  }

  function hostDe(url) { try { return new URL(url).host; } catch (e) { return url; } }

  function exibir(t, req, r) {
    var meta = t.querySelector("[data-meta]");
    var aviso = t.querySelector("[data-aviso]");
    var pResp = t.querySelector("[data-msg-resposta]");
    var pre = t.querySelector("[data-preflight]");
    if (r.erro) {
      aviso.innerHTML = htmlAviso(r.erro);
      meta.innerHTML = '<span class="status-chip">sem resposta</span>' + itemMeta("destino", r.erro.host || "");
      escreverCodigo(pResp, r.erro.tipo === "offline" ? "~(nada foi enviado: sem conexão com a Internet)" : "~(nenhuma resposta chegou)");
      pre.innerHTML = "";
      return;
    }
    var res = r.resposta;
    aviso.innerHTML = "";
    meta.innerHTML = chipStatus(res) +
      itemMeta("tempo", res.tempo + " ms") +
      itemMeta("tamanho do corpo", res.bytes + " bytes") +
      (rotuloProtocolo(res.protocolo) ? itemMeta("protocolo", rotuloProtocolo(res.protocolo)) : "") +
      (res.redirecionada ? itemMeta("redirecionado para", res.urlFinal) : "");
    escreverCodigo(pResp, textoResposta(res));
    var motivo = motivoPreflight(req);
    pre.innerHTML = motivo
      ? "Antes deste pedido o navegador enviou um <b>OPTIONS</b> (o <i>preflight</i> do CORS) por causa do <b>" + esc(motivo) + "</b>. Veja no F12, aba Rede."
      : "";
  }

  function disparar(t, req) {
    pendente(t, req);
    return enviar(req).then(function (r) { exibir(t, req, r); return r; });
  }

  /* ---------- código equivalente: fetch e curl ---------- */

  function corpoComoJs(req) {
    var tipo = "";
    (req.cabecalhos || []).forEach(function (c) { if (c[0].toLowerCase() === "content-type") tipo = c[1]; });
    if (/json/i.test(tipo)) {
      try {
        var obj = JSON.parse(req.corpo);
        return "JSON.stringify(" + JSON.stringify(obj, null, 2).replace(/\n/g, "\n  ") + ")";
      } catch (e) { /* JSON inválido: mostra como texto */ }
    }
    return "'" + String(req.corpo).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
  }

  function codigoFetch(req) {
    var cab = (req.cabecalhos || []).filter(function (c) { return c[0] && !cabProibido(c[0]); });
    var simples = req.metodo === "GET" && !cab.length;
    var l = [];
    if (simples) {
      l.push("const resposta = await fetch('" + req.url + "');");
    } else {
      l.push("const resposta = await fetch('" + req.url + "', {");
      l.push("  method: '" + req.metodo + "',");
      if (cab.length) {
        l.push("  headers: {");
        cab.forEach(function (c, i) { l.push("    '" + canonico(c[0]) + "': '" + String(c[1]).replace(/'/g, "\\'") + "'" + (i < cab.length - 1 ? "," : "")); });
        l.push("  },");
      }
      if (temCorpo(req)) l.push("  body: " + corpoComoJs(req));
      if (/,$/.test(l[l.length - 1])) l[l.length - 1] = l[l.length - 1].slice(0, -1);
      l.push("});");
    }
    l.push("console.log(resposta.status, resposta.ok);  // 404 não lança erro");
    if (req.metodo !== "HEAD") l.push("const corpo = await resposta.text();          // ou .json()");
    return l.join("\n");
  }

  function codigoCurl(req) {
    var l = ["curl -i -X " + req.metodo + " '" + req.url + "'"];
    (req.cabecalhos || []).forEach(function (c) { if (c[0]) l.push("  -H '" + canonico(c[0]) + ": " + c[1] + "'"); });
    if (temCorpo(req)) l.push("  -d '" + String(req.corpo).replace(/'/g, "'\\''").replace(/\n\s*/g, " ") + "'");
    return l.join(" \\\n") + "\n# -i mostra também a linha de estado e os cabeçalhos da resposta";
  }

  function atualizarCodigos(lab, req) {
    escreverCodigo(lab.querySelector("[data-codigo-fetch]"), codigoFetch(req));
    escreverCodigo(lab.querySelector("[data-codigo-curl]"), codigoCurl(req));
  }

  /* ---------- seletor do servidor de eco ---------- */

  function sincronizarEco() {
    document.querySelectorAll("[data-servidor-eco]").forEach(function (s) { s.value = ecoAtual; });
    document.querySelectorAll("[data-host-eco]").forEach(function (s) { s.textContent = ecoAtual; });
  }
  document.querySelectorAll("[data-servidor-eco]").forEach(function (s) {
    s.innerHTML = Object.keys(APIS.eco).map(function (k) { return '<option value="' + k + '">' + k + "</option>"; }).join("");
    s.addEventListener("change", function () {
      ecoAtual = s.value;
      try { localStorage.setItem(PREF_ECO, ecoAtual); } catch (e) { /* sem armazenamento */ }
      sincronizarEco();
    });
  });
  document.querySelectorAll("[data-host-crud]").forEach(function (s) { s.textContent = hostDe(APIS.crud); });
  sincronizarEco();

  /* ======================================================
     5. COMPONENTES
     ====================================================== */

  /* ---------- diagrama de sequência passo a passo ---------- */
  document.querySelectorAll("[data-seq]").forEach(function (s) {
    var n = parseInt(s.getAttribute("data-colunas"), 10) || 2;
    var atores = s.querySelector(".seq-atores");
    var corpo = s.querySelector(".seq-corpo");
    var nota = s.querySelector(".seq-nota");
    atores.style.gridTemplateColumns = "repeat(" + n + ",1fr)";

    var faixas = [];
    for (var i = 0; i < n; i++) {
      var c = ((2 * i + 1) / (2 * n)) * 100;
      faixas.push("transparent calc(" + c + "% - 1px)", "#C5CCC9 calc(" + c + "% - 1px)",
                  "#C5CCC9 calc(" + c + "% + 1px)", "transparent calc(" + c + "% + 1px)");
    }
    corpo.style.backgroundImage = "linear-gradient(90deg," + faixas.join(",") + ")";

    var passos = Array.prototype.slice.call(corpo.querySelectorAll(".seq-passo"));
    passos.forEach(function (p) {
      var de = parseInt(p.getAttribute("data-de"), 10), para = parseInt(p.getAttribute("data-para"), 10);
      var a = Math.min(de, para), b = Math.max(de, para);
      var esquerda = ((2 * a - 1) / (2 * n)) * 100 + "%";
      var largura = ((b - a) / n) * 100 + "%";
      var seta = document.createElement("div");
      seta.className = "seq-seta " + (para > de ? "dir" : "esq") + (p.hasAttribute("data-tracejada") ? " tracejada" : "");
      seta.style.left = esquerda;
      seta.style.width = largura;
      var rot = document.createElement("div");
      var centro = ((2 * a - 1) / (2 * n)) * 100 + ((b - a) / n) * 50;
      var larguraRotulo = Math.min(100, ((b - a) / n) * 100 + 24);
      rot.className = "seq-rotulo";
      rot.style.left = Math.max(0, Math.min(100 - larguraRotulo, centro - larguraRotulo / 2)) + "%";
      rot.style.width = larguraRotulo + "%";
      rot.style.right = "auto";
      rot.innerHTML = "<span>" + esc(p.getAttribute("data-msg")) + "</span>";
      p.appendChild(seta);
      p.appendChild(rot);
    });

    var atual = -1;
    function mostrar(k) {
      atual = k;
      passos.forEach(function (p, j) {
        p.classList.toggle("feito", j <= k);
        p.classList.toggle("atual", j === k);
      });
      nota.innerHTML = k >= 0
        ? "<b>Passo " + (k + 1) + " de " + passos.length + ".</b> " + passos[k].getAttribute("data-nota")
        : s.getAttribute("data-inicio");
    }
    var prox = s.querySelector("[data-seq-prox]");
    var tudo = s.querySelector("[data-seq-tudo]");
    var reinicia = s.querySelector("[data-seq-reinicia]");
    if (prox) prox.addEventListener("click", function () { mostrar(Math.min(atual + 1, passos.length - 1)); });
    if (tudo) tudo.addEventListener("click", function () {
      passos.forEach(function (p) { p.classList.add("feito"); p.classList.remove("atual"); });
      atual = passos.length - 1;
      nota.innerHTML = s.getAttribute("data-fim") || s.getAttribute("data-inicio");
    });
    if (reinicia) reinicia.addEventListener("click", function () { mostrar(-1); });
    mostrar(-1);
  });

  /* ---------- navegador: o interpretador mostra o código-fonte ---------- */
  document.querySelectorAll("[data-navegador]").forEach(function (nav) {
    var fonte = nav.querySelector("[data-fonte]");
    var tela = nav.querySelector("[data-tela]");
    var timer;
    function render() {
      tela.srcdoc = "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\">" +
        "<style>body{font-family:Arial,sans-serif;margin:18px;line-height:1.45;color:#111}</style></head><body>" +
        fonte.value + "</body></html>";
    }
    fonte.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(render, 300); });
    render();
  });

  /* ---------- anatomia: regiões da mensagem e caracteres invisíveis ---------- */
  function regioesDaMensagem(texto) {
    var linhas = texto.split("\n");
    var vazia = linhas.indexOf("");
    var inicio = linhas[0];
    var cab = linhas.slice(1, vazia === -1 ? linhas.length : vazia);
    var corpo = vazia === -1 ? [] : linhas.slice(vazia + 1);
    function marcar(l) {
      return esc(l).replace(/ /g, '<span class="sp"> </span>') + '<span class="crlf">CR LF</span>';
    }
    return { inicio: marcar(inicio), cab: cab.map(marcar).join("\n"), corpo: corpo.map(esc).join("\n") };
  }

  document.querySelectorAll("[data-anatomia]").forEach(function (an) {
    an.querySelectorAll("[data-mensagem]").forEach(function (m) {
      var tipo = m.getAttribute("data-mensagem");
      var r = regioesDaMensagem(m.querySelector("template").innerHTML.replace(/^\n/, "").replace(/\s+$/, "")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
      var rotInicio = tipo === "pedido" ? "linha de solicitação" : "linha de estado";
      m.insertAdjacentHTML("beforeend",
        '<pre class="msg-reg reg-inicio" data-rotulo="' + rotInicio + '">' + r.inicio + "</pre>" +
        '<pre class="msg-reg reg-cab" data-rotulo="linhas de cabeçalho">' + r.cab + "</pre>" +
        '<pre class="msg-reg reg-branco" data-rotulo="linha em branco"><span class="crlf">CR LF</span></pre>' +
        '<pre class="msg-reg reg-corpo" data-rotulo="corpo">' + (r.corpo || '<span class="tk-dim">(sem corpo)</span>') + "</pre>");
    });
    var chave = an.querySelector("[data-invisiveis]");
    if (chave) chave.addEventListener("change", function () { an.classList.toggle("invisiveis", chave.checked); });
  });

  /* ---------- relógio: documento ativo ---------- */
  document.querySelectorAll("[data-relogio]").forEach(function (el) {
    function tic() { el.textContent = new Date().toLocaleTimeString("pt-BR"); }
    tic();
    setInterval(tic, 1000);
  });

  /* ---------- cookies desta página ---------- */
  document.querySelectorAll("[data-cookies]").forEach(function (box) {
    var nome = box.querySelector("[data-cookie-nome]");
    var valor = box.querySelector("[data-cookie-valor]");
    var lista = box.querySelector("[data-cookie-lista]");
    var linha = box.closest("section").querySelector("[data-cookie-linha]");
    var aviso = box.querySelector("[data-aviso]");
    function listar() {
      var c = document.cookie;
      lista.textContent = c ? c.split("; ").join("\n") : "(nenhum cookie guardado para este site)";
      if (location.protocol === "file:") {
        aviso.innerHTML = '<div class="aviso aviso--info"><span class="aviso-icone" aria-hidden="true">i</span><div>' +
          "<h4>Aberta como arquivo, a página não guarda cookies</h4><p>Cookies pertencem a um domínio. Abra a aula pelo endereço do GitHub Pages para testar.</p></div></div>";
      }
    }
    function nomeLimpo() { return (nome.value || "tema").replace(/[^\w-]/g, ""); }
    box.querySelector("[data-cookie-gravar]").addEventListener("click", function () {
      var n = nomeLimpo(), v = encodeURIComponent(valor.value || "escuro");
      document.cookie = n + "=" + v + "; Max-Age=3600; Path=/; SameSite=Lax";
      linha.textContent = "HTTP/1.1 200 OK\nSet-Cookie: " + n + "=" + v + "; Max-Age=3600; Path=/; SameSite=Lax";
      colorir(linha);
      listar();
    });
    box.querySelector("[data-cookie-apagar]").addEventListener("click", function () {
      var n = nomeLimpo();
      document.cookie = n + "=; Max-Age=0; Path=/; SameSite=Lax";
      linha.textContent = "HTTP/1.1 200 OK\nSet-Cookie: " + n + "=; Max-Age=0; Path=/";
      colorir(linha);
      listar();
    });
    listar();
  });

  /* ======================================================
     6. LABORATÓRIOS DE REQUISIÇÃO

     Botão genérico: <button data-pedido='{"api":"crud",
     "metodo":"GET","caminho":"/users/1"}'> dentro de um
     [data-lab-http] com um [data-troca].
     ====================================================== */

  function montarReq(cfg) {
    var corpo = cfg.corpo == null ? null : (typeof cfg.corpo === "string" ? cfg.corpo : JSON.stringify(cfg.corpo, null, 2));
    return {
      metodo: cfg.metodo || "GET",
      url: baseDa(cfg.api) + (cfg.caminho || ""),
      cabecalhos: (cfg.cabecalhos || []).slice(),
      corpo: corpo
    };
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("button[data-pedido]") : null;
    if (!b) return;
    var lab = b.closest("[data-lab-http]");
    if (!lab) return;
    var cfg = JSON.parse(b.getAttribute("data-pedido"));
    var req = montarReq(cfg);
    if (cfg.condicao === "last-modified") {
      var lm = lab.getAttribute("data-ultimo-last-modified") || "Thu, 04 Sep 2008 00:00:00 GMT";
      req.cabecalhos.push(["If-Modified-Since", lm]);
    }
    atualizarCodigos(lab, req);
    var t = lab.querySelector("[data-troca]");
    disparar(t, req).then(function (r) {
      if (r.resposta) {
        r.resposta.cabecalhos.forEach(function (c) {
          if (c[0] === "last-modified") lab.setAttribute("data-ultimo-last-modified", c[1]);
        });
      }
      var depois = lab.getAttribute("data-depois");
      if (depois && posProcessos[depois]) posProcessos[depois](lab, req, r);
    });
  });

  var posProcessos = {
    /* negociação de conteúdo: mostra a imagem que voltou */
    imagem: function (lab, req, r) {
      var alvo = lab.querySelector("[data-imagem]");
      if (!r.resposta || !r.resposta.blob) { alvo.innerHTML = '<span class="nota-demo">nenhuma imagem recebida</span>'; return; }
      var u = URL.createObjectURL(r.resposta.blob);
      alvo.innerHTML = '<img alt="Imagem devolvida pelo servidor" src="' + u + '">';
    },
    /* cabeçalhos de resposta visíveis para o JavaScript */
    respCab: function (lab, req, r) {
      var tb = lab.querySelector("[data-visiveis]");
      if (!r.resposta) { tb.innerHTML = '<tr><td colspan="2" class="vazio-tabela">nenhuma resposta</td></tr>'; return; }
      tb.innerHTML = r.resposta.cabecalhos.map(function (c) {
        var pedido = /^x-turma$/i.test(c[0]);
        return "<tr" + (pedido ? ' class="do-aluno"' : "") + "><td><code>" + esc(canonico(c[0])) + "</code></td><td>" + esc(c[1]) + "</td></tr>";
      }).join("");
      var temTurma = r.resposta.cabecalhos.some(function (c) { return /^x-turma$/i.test(c[0]); });
      var nota = lab.querySelector("[data-nota-turma]");
      nota.innerHTML = temTurma
        ? "O servidor liberou <code>X-Turma</code> em <code>Access-Control-Expose-Headers</code>, então o JavaScript consegue lê-lo."
        : "<code>X-Turma</code> veio na resposta, mas o servidor não o liberou em <code>Access-Control-Expose-Headers</code>: o navegador o esconde do JavaScript (ele aparece no F12, aba Rede).";
    }
  };

  /* ---------- servidor: em fila x ao mesmo tempo ---------- */
  document.querySelectorAll("[data-concorrencia]").forEach(function (box) {
    var raias = box.querySelector("[data-raias]");
    var total = box.querySelector("[data-total]");
    var aviso = box.querySelector("[data-aviso]");
    var N = 5;
    raias.innerHTML = "";
    for (var i = 0; i < N; i++) {
      raias.insertAdjacentHTML("beforeend", '<div class="raia"><span>pedido ' + (i + 1) +
        '</span><div class="raia-trilho"><div class="raia-barra"></div></div><span class="raia-tempo">—</span></div>');
    }
    var barras = raias.querySelectorAll(".raia-barra");
    var tempos = raias.querySelectorAll(".raia-tempo");
    var botoes = box.querySelectorAll("[data-modo]");

    function rodar(modo) {
      var host = hostDe(eco());
      if (avisoSeOffline(aviso, host)) return;
      botoes.forEach(function (b) { b.disabled = true; });
      var escala = modo === "fila" ? 7000 : 3000;
      var t0 = performance.now();
      var falhou = false;
      for (var k = 0; k < N; k++) {
        barras[k].style.left = "0"; barras[k].style.width = "0"; barras[k].classList.remove("erro"); tempos[k].textContent = "…";
      }
      total.textContent = "…";
      function um(k) {
        var ini = performance.now() - t0;
        return enviar({ metodo: "GET", url: eco() + "/delay/1" }).then(function (r) {
          var fim = performance.now() - t0;
          if (r.erro) { falhou = r.erro; barras[k].classList.add("erro"); }
          barras[k].style.left = Math.min(100, (ini / escala) * 100) + "%";
          barras[k].style.width = Math.max(1, ((fim - ini) / escala) * 100) + "%";
          tempos[k].textContent = Math.round(fim - ini) + " ms";
        });
      }
      var tudo;
      if (modo === "fila") {
        tudo = [0, 1, 2, 3, 4].reduce(function (p, k) { return p.then(function () { return um(k); }); }, Promise.resolve());
      } else {
        var lista = [];
        for (var k2 = 0; k2 < N; k2++) lista.push(um(k2));
        tudo = Promise.all(lista);
      }
      tudo.then(function () {
        total.textContent = (Math.round((performance.now() - t0) / 100) / 10).toLocaleString("pt-BR") + " s no total";
        aviso.innerHTML = falhou ? htmlAviso(falhou) : "";
        botoes.forEach(function (b) { b.disabled = false; });
      });
    }
    botoes.forEach(function (b) { b.addEventListener("click", function () { rodar(b.getAttribute("data-modo")); }); });
  });

  /* ---------- partes da URL ---------- */
  document.querySelectorAll("[data-url]").forEach(function (box) {
    var entrada = box.querySelector("[data-url-entrada]");
    var cores = box.querySelector("[data-url-cores]");
    var tabela = box.querySelector("[data-url-partes]");
    var PORTAS = { "http:": "80", "https:": "443", "ftp:": "21" };

    function analisar() {
      var u;
      try { u = new URL(entrada.value.trim()); } catch (e) {
        cores.innerHTML = '<span class="nota-demo">URL incompleta: comece com protocolo://host</span>';
        tabela.innerHTML = "";
        return null;
      }
      var porta = u.port ? ":" + u.port : "";
      cores.innerHTML = '<span class="u-proto">' + esc(u.protocol) + "//</span>" +
        '<span class="u-host">' + esc(u.hostname) + "</span>" +
        (porta ? '<span class="u-porta">' + esc(porta) + "</span>" : "") +
        '<span class="u-caminho">' + esc(u.pathname) + "</span>" +
        (u.search ? '<span class="u-consulta">' + esc(u.search) + "</span>" : "") +
        (u.hash ? '<span class="u-frag">' + esc(u.hash) + "</span>" : "");
      var params = [];
      u.searchParams.forEach(function (v, k) { params.push(k + " = " + v); });
      var linhas = [
        ["u-proto", "protocolo", u.protocol.replace(":", ""), "como conversar com o servidor"],
        ["u-host", "host", u.hostname, "qual servidor (o DNS traduz o nome em IP)"],
        ["u-porta", "porta", u.port || (PORTAS[u.protocol] ? PORTAS[u.protocol] + " (implícita)" : "—"), "qual programa dentro do servidor"],
        ["u-caminho", "caminho", u.pathname, "qual recurso, de cima para baixo"],
        ["u-consulta", "consulta", params.length ? params.join(" · ") : "—", "parâmetros extras (vão ao servidor)"],
        ["u-frag", "fragmento", u.hash || "—", "parte da página (NÃO vai ao servidor)"]
      ];
      tabela.innerHTML = linhas.map(function (l) {
        return '<tr><td><span class="' + l[0] + '">' + l[1] + "</span></td><td><code>" + esc(l[2]) + "</code></td><td>" + l[3] + "</td></tr>";
      }).join("");
      return u;
    }
    entrada.addEventListener("input", analisar);
    box.querySelectorAll("[data-url-exemplo]").forEach(function (b) {
      b.addEventListener("click", function () { entrada.value = b.getAttribute("data-url-exemplo"); analisar(); });
    });
    var enviarBtn = box.querySelector("[data-url-enviar]");
    if (enviarBtn) enviarBtn.addEventListener("click", function () {
      var u = analisar();
      var t = box.querySelector("[data-troca]");
      var caminho = u ? u.pathname : "/";
      var req = { metodo: "GET", url: eco() + "/anything" + (caminho === "/" ? "" : caminho) + (u ? u.search : "") };
      disparar(t, req);
    });
    analisar();
  });

  /* ---------- documento dinâmico: o servidor gera a cada pedido ---------- */
  document.querySelectorAll("[data-uuid]").forEach(function (box) {
    var saida = box.querySelector("[data-uuid-saida]");
    var aviso = box.querySelector("[data-aviso]");
    box.querySelector("button").addEventListener("click", function () {
      saida.innerHTML = '<span class="nota-demo">pedindo ao servidor…</span>';
      enviar({ metodo: "GET", url: eco() + "/uuid" }).then(function (r) {
        if (r.erro) { aviso.innerHTML = htmlAviso(r.erro); saida.innerHTML = '<span class="nota-demo">sem resposta</span>'; return; }
        aviso.innerHTML = "";
        var id = "";
        try { id = JSON.parse(r.resposta.texto).uuid; } catch (e) { id = r.resposta.texto; }
        saida.innerHTML = '<span class="grande">' + esc(id) + '</span><br><span class="nota-demo">gerado pelo servidor em ' +
          new Date().toLocaleTimeString("pt-BR") + " · " + r.resposta.tempo + " ms</span>";
      });
    });
  });

  /* ---------- cabeçalhos de pedido: o que o servidor recebeu ---------- */
  function valorEco(v) { return Array.isArray(v) ? v.join(", ") : String(v); }
  var INFRA = /^(x-amzn|x-forwarded|x-real-ip|via|cf-|fly-|x-request-start|x-envoy|forwarded|cdn-loop)/i;

  document.querySelectorAll("[data-cab-pedido]").forEach(function (lab) {
    var texto = lab.querySelector("[data-cab-texto]");
    var metodo = lab.querySelector("[data-cab-metodo]");
    var tb = lab.querySelector("[data-recebidos]");
    var t = lab.querySelector("[data-troca]");
    function lerCabecalhos() {
      return texto.value.split("\n").map(function (l) {
        var i = l.indexOf(":");
        return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : null;
      }).filter(Boolean);
    }
    lab.querySelector("[data-cab-enviar]").addEventListener("click", function () {
      var cab = lerCabecalhos();
      var req = { metodo: metodo.value, url: eco() + "/anything/aula", cabecalhos: cab, corpo: metodo.value === "POST" ? '{"turma":"pm3"}' : null };
      if (req.corpo) req.cabecalhos.push(["Content-Type", "application/json"]);
      atualizarCodigos(lab, req);
      disparar(t, req).then(function (r) {
        if (!r.resposta) { tb.innerHTML = '<tr><td colspan="2" class="vazio-tabela">nenhuma resposta</td></tr>'; return; }
        var dados;
        try { dados = JSON.parse(r.resposta.texto); } catch (e) { dados = {}; }
        var recebidos = dados.headers || {};
        var meus = cab.filter(function (c) { return !cabProibido(c[0]); }).map(function (c) { return c[0].toLowerCase(); });
        if (req.corpo) meus.push("content-type");
        tb.innerHTML = Object.keys(recebidos).sort().map(function (n) {
          var cls = meus.indexOf(n.toLowerCase()) !== -1 ? "do-aluno" : (INFRA.test(n) ? "do-infra" : "do-navegador");
          return '<tr class="' + cls + '"><td><code>' + esc(canonico(n)) + "</code></td><td>" + esc(valorEco(recebidos[n])) + "</td></tr>";
        }).join("") || '<tr><td colspan="2" class="vazio-tabela">o servidor não devolveu a lista</td></tr>';
      });
    });
  });

  /* ---------- cabeçalhos de resposta: peça ao servidor quais quer receber ---------- */
  document.querySelectorAll("[data-cab-resposta]").forEach(function (lab) {
    var t = lab.querySelector("[data-troca]");
    lab.querySelector("[data-resp-enviar]").addEventListener("click", function () {
      var q = new URLSearchParams();
      lab.querySelectorAll("[data-resp]").forEach(function (c) {
        var n = c.getAttribute("data-resp");
        if (c.type === "checkbox") {
          if (!c.checked) return;
          if (n === "Last-Modified") q.append(n, new Date(Date.now() - 86400000).toUTCString());
          if (n === "Access-Control-Expose-Headers") q.append(n, "X-Turma");
          return;
        }
        if (c.value) q.append(n, c.value);
      });
      var req = { metodo: "GET", url: eco() + "/response-headers?" + q.toString() };
      atualizarCodigos(lab, req);
      disparar(t, req).then(function (r) { posProcessos.respCab(lab, req, r); });
    });
  });

  /* ---------- DNS sobre HTTPS ---------- */
  var TIPOS_DNS = { 1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 65: "HTTPS" };
  document.querySelectorAll("[data-dns]").forEach(function (lab) {
    var nome = lab.querySelector("[data-dns-nome]");
    var tipo = lab.querySelector("[data-dns-tipo]");
    var ficha = lab.querySelector("[data-dns-ficha]");
    var t = lab.querySelector("[data-troca]");
    function consultar() {
      var dominio = nome.value.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "") || "descomplica.com.br";
      nome.value = dominio;
      var req = { metodo: "GET", url: APIS.dns + "?name=" + encodeURIComponent(dominio) + "&type=" + tipo.value, cabecalhos: [["Accept", "application/json"]] };
      atualizarCodigos(lab, req);
      ficha.innerHTML = '<span class="nota-demo">consultando…</span>';
      disparar(t, req).then(function (r) {
        if (!r.resposta) { ficha.innerHTML = '<span class="nota-demo">sem resposta</span>'; return; }
        var d;
        try { d = JSON.parse(r.resposta.texto); } catch (e) { d = {}; }
        var resp = d.Answer || [];
        if (!resp.length) {
          ficha.innerHTML = "<h4>" + esc(dominio) + "</h4><p>Nenhum registro " + esc(tipo.value) + " encontrado" +
            (d.Status === 3 ? " (o domínio não existe: NXDOMAIN)" : "") + ".</p>";
          return;
        }
        ficha.innerHTML = "<h4>" + esc(dominio) + "</h4>" +
          '<table class="tabela-lab"><thead><tr><th>nome</th><th>tipo</th><th>TTL (s)</th><th>valor</th></tr></thead><tbody>' +
          resp.map(function (a) {
            return "<tr><td><code>" + esc(a.name) + "</code></td><td>" + esc(TIPOS_DNS[a.type] || a.type) + "</td><td>" + esc(a.TTL) +
              '</td><td><code class="grande">' + esc(a.data) + "</code></td></tr>";
          }).join("") + "</tbody></table>";
      });
    }
    lab.querySelector("[data-dns-enviar]").addEventListener("click", consultar);
    lab.querySelectorAll("[data-dns-exemplo]").forEach(function (b) {
      b.addEventListener("click", function () { nome.value = b.getAttribute("data-dns-exemplo"); consultar(); });
    });
    nome.addEventListener("keydown", function (e) { if (e.key === "Enter") consultar(); });
  });

  /* ---------- versão do HTTP usada de verdade ---------- */
  document.querySelectorAll("[data-versao]").forEach(function (lab) {
    var pagina = lab.querySelector("[data-proto-pagina]");
    var tabela = lab.querySelector("[data-protocolos]");
    var aviso = lab.querySelector("[data-aviso]");
    var vistos = {};
    function marcar() {
      lab.querySelectorAll(".versao").forEach(function (v) { v.classList.toggle("atual", !!vistos[v.getAttribute("data-v")]); });
    }
    var nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    var pp = nav && nav.nextHopProtocol;
    pagina.textContent = location.protocol === "file:" ? "nenhum (aberta como arquivo, sem HTTP)" : (rotuloProtocolo(pp) || pp || "não informado");
    if (pp) { vistos[pp] = true; marcar(); }

    /* o navegador só revela o protocolo de outro site se ele enviar Timing-Allow-Origin */
    function medir() {
      var porHost = {};
      var entradas = (nav ? [nav] : []).concat(performance.getEntriesByType("resource"));
      entradas.forEach(function (e) {
        var h = hostDe(e.name);
        if (!/^https?:/.test(e.name)) return;
        if (!(h in porHost) || (!porHost[h] && e.nextHopProtocol)) porHost[h] = e.nextHopProtocol || "";
      });
      var hosts = Object.keys(porHost);
      hosts.forEach(function (h) { if (porHost[h]) vistos[porHost[h]] = true; });
      marcar();
      tabela.innerHTML = hosts.length ? hosts.map(function (h) {
        var p = porHost[h];
        return "<tr><td><code>" + esc(h) + "</code></td><td>" + (p ? "<b>" + esc(rotuloProtocolo(p) || p) + "</b>"
          : '<span class="vazio-tabela">escondido: o servidor não enviou Timing-Allow-Origin</span>') + "</td></tr>";
      }).join("") : '<tr><td colspan="2" class="vazio-tabela">nenhum servidor contatado por HTTP ainda</td></tr>';
    }
    lab.querySelector("[data-versao-enviar]").addEventListener("click", function () {
      tabela.innerHTML = '<tr><td colspan="2" class="vazio-tabela">enviando…</td></tr>';
      enviar({ metodo: "GET", url: APIS.crud + "/users/1" }).then(function (r) {
        aviso.innerHTML = r.erro ? htmlAviso(r.erro) : "";
        medir();
      });
    });
  });

  /* ---------- JSON: valide e envie ---------- */
  document.querySelectorAll("[data-json]").forEach(function (lab) {
    var ed = lab.querySelector("[data-json-editor]");
    var st = lab.querySelector("[data-json-status]");
    var srv = lab.querySelector("[data-json-servidor]");
    var t = lab.querySelector("[data-troca]");
    var EXEMPLOS = {
      aluno: '{\n  "firstName": "Guilherme",\n  "id": 1,\n  "lastName": "Cruz"\n}',
      completo: '{\n  "id": 7,\n  "nome": "Ana",\n  "ativo": true,\n  "media": 8.5,\n  "apelido": null,\n  "disciplinas": ["Redes", "Web"],\n  "endereco": { "cidade": "Foz do Iguaçu", "uf": "PR" }\n}',
      curvas: "{\n  “id” : 1,\n  “firstName” : “Guilherme”,\n  “lastName” :  “Cruz”\n}",
      virgula: '{\n  "id": 1,\n  "firstName": "Guilherme",\n}',
      simples: "{\n  'id': 1,\n  firstName: 'Guilherme'\n}"
    };
    function validar() {
      var v = ed.value;
      try {
        JSON.parse(v);
        st.className = "aviso aviso--info";
        st.innerHTML = '<span class="aviso-icone" aria-hidden="true">i</span><div><h4>JSON válido</h4><p>Pronto para ir no corpo de um pedido com <code>Content-Type: application/json</code>.</p></div>';
        return true;
      } catch (e) {
        var dica = /[“”‘’]/.test(v) ? "Há aspas curvas (“ ”): troque por aspas retas \"." :
          (/'/.test(v) ? "JSON só aceita aspas duplas: troque ' por \"." :
          (/,\s*[}\]]/.test(v) ? "Há uma vírgula sobrando antes de } ou ]." : "Confira aspas, vírgulas e chaves."));
        st.className = "aviso aviso--erro";
        st.innerHTML = '<span class="aviso-icone" aria-hidden="true">!</span><div><h4>JSON inválido</h4><p>' + esc(dica) +
          "</p><p><code>" + esc(e.message) + "</code></p></div>";
        return false;
      }
    }
    ed.addEventListener("input", validar);
    lab.querySelectorAll("[data-json-exemplo]").forEach(function (b) {
      b.addEventListener("click", function () { ed.value = EXEMPLOS[b.getAttribute("data-json-exemplo")]; validar(); });
    });
    lab.querySelector("[data-json-enviar]").addEventListener("click", function () {
      validar();
      var req = { metodo: "POST", url: eco() + "/anything/alunos", cabecalhos: [["Content-Type", "application/json"]], corpo: ed.value };
      atualizarCodigos(lab, req);
      srv.textContent = "…";
      disparar(t, req).then(function (r) {
        if (!r.resposta) { srv.textContent = "(sem resposta)"; return; }
        var d;
        try { d = JSON.parse(r.resposta.texto); } catch (e) { d = {}; }
        escreverCodigo(srv, d.json == null
          ? "null\n// o servidor recebeu o texto, mas não conseguiu interpretá-lo como JSON"
          : JSON.stringify(d.json, null, 2));
      });
    });
    ed.value = EXEMPLOS.aluno;
    validar();
  });

  /* ---------- fluxo de mensagens: as seis caixas de uma troca HTTP ---------- */
  var VERBOS_FLUXO = {
    GET: { metodo: "GET", caminho: "/users/1" },
    POST: { metodo: "POST", caminho: "/users", cabecalhos: [["Content-Type", "application/json"]], corpo: { firstName: "Eduardo", lastName: "Supla" } },
    PUT: { metodo: "PUT", caminho: "/users/1", cabecalhos: [["Content-Type", "application/json"]], corpo: { firstName: "Jorge", lastName: "Aragão" } },
    PATCH: { metodo: "PATCH", caminho: "/users/1", cabecalhos: [["Content-Type", "application/json"]], corpo: { lastName: "Aragão" } },
    DELETE: { metodo: "DELETE", caminho: "/users/1" }
  };

  document.querySelectorAll("[data-fluxo]").forEach(function (lab) {
    var caixas = {};
    lab.querySelectorAll("[data-caixa]").forEach(function (c) { caixas[c.getAttribute("data-caixa")] = c; });
    var aviso = lab.querySelector("[data-aviso]");
    var meta = lab.querySelector("[data-meta]");
    function preencher(nome, texto) {
      var c = caixas[nome];
      c.querySelector("pre").textContent = texto;
      c.classList.toggle("vazia", !texto);
    }
    function semTil(l) { return l.charAt(0) === "~" ? l.slice(1) : l; }
    lab.querySelectorAll("[data-verbo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var req = montarReq(Object.assign({ api: "crud" }, VERBOS_FLUXO[b.getAttribute("data-verbo")]));
        atualizarCodigos(lab, req);
        var ped = textoPedido(req).split("\n");
        var vazia = ped.indexOf("");
        preencher("ped-inicio", ped[0]);
        preencher("ped-cab", ped.slice(1, vazia).map(semTil).join("\n"));
        preencher("ped-corpo", ped.slice(vazia + 1).join("\n"));
        ["resp-inicio", "resp-cab", "resp-corpo"].forEach(function (k) { preencher(k, ""); });
        meta.innerHTML = '<span class="status-chip enviando">enviando…</span>';
        aviso.innerHTML = "";
        enviar(req).then(function (r) {
          if (r.erro) {
            aviso.innerHTML = htmlAviso(r.erro);
            meta.innerHTML = '<span class="status-chip">sem resposta</span>';
            return;
          }
          var res = r.resposta;
          meta.innerHTML = chipStatus(res) + itemMeta("tempo", res.tempo + " ms");
          var proto = rotuloProtocolo(res.protocolo) || "HTTP/1.1";
          preencher("resp-inicio", proto + " " + res.status + " " + res.frase);
          preencher("resp-cab", res.cabecalhos.map(function (c) { return canonico(c[0]) + ": " + c[1]; }).join("\n"));
          preencher("resp-corpo", res.texto ? corpoLegivel(res) : "");
        });
      });
    });
  });

  /* ---------- tabela dos verbos com a coluna "ao vivo" ---------- */
  document.querySelectorAll("[data-tabela-verbos]").forEach(function (box) {
    var aviso = box.querySelector("[data-aviso]");
    function testar(linha) {
      var cel = linha.querySelector(".ao-vivo [data-st]");
      var cfg = VERBOS_FLUXO[linha.getAttribute("data-verbo")];
      cel.innerHTML = '<span class="status-chip enviando">…</span>';
      return enviar(montarReq(Object.assign({ api: "crud" }, cfg))).then(function (r) {
        if (r.erro) { cel.innerHTML = '<span class="status-chip">sem resposta</span>'; aviso.innerHTML = htmlAviso(r.erro); return; }
        aviso.innerHTML = "";
        cel.innerHTML = chipStatus(r.resposta);
      });
    }
    box.querySelectorAll("tr[data-verbo]").forEach(function (linha) {
      linha.querySelector("button").addEventListener("click", function () { testar(linha); });
    });
    box.querySelector("[data-testar-todos]").addEventListener("click", function () {
      if (avisoSeOffline(aviso, hostDe(APIS.crud))) return;
      var linhas = Array.prototype.slice.call(box.querySelectorAll("tr[data-verbo]"));
      linhas.reduce(function (p, l) { return p.then(function () { return testar(l); }); }, Promise.resolve());
    });
  });

  /* ---------- API de CEP ---------- */
  document.querySelectorAll("[data-cep]").forEach(function (lab) {
    var entrada = lab.querySelector("[data-cep-entrada]");
    var ficha = lab.querySelector("[data-cep-ficha]");
    var t = lab.querySelector("[data-troca]");
    function consultar() {
      var cep = entrada.value.replace(/\D/g, "");
      if (cep.length !== 8) {
        montarTroca(t);
        t.querySelector("[data-meta]").innerHTML = '<span class="nota-demo">nada enviado: o CEP não passou na validação</span>';
        t.querySelector("[data-aviso]").innerHTML = "";
        t.querySelector("[data-msg-pedido]").textContent = "";
        t.querySelector("[data-msg-resposta]").textContent = "";
        t.querySelector("[data-preflight]").innerHTML = "";
        ficha.innerHTML = '<div class="aviso aviso--erro" role="alert"><span class="aviso-icone" aria-hidden="true">!</span><div><h4>CEP precisa de 8 dígitos</h4>' +
          "<p>Validar antes de enviar evita um pedido que o servidor recusaria com <code>400 Bad Request</code>.</p></div></div>";
        return;
      }
      var req = { metodo: "GET", url: APIS.cep + "/" + cep + "/json/" };
      atualizarCodigos(lab, req);
      ficha.innerHTML = '<span class="nota-demo">consultando…</span>';
      disparar(t, req).then(function (r) {
        if (!r.resposta) { ficha.innerHTML = '<span class="nota-demo">sem resposta</span>'; return; }
        var d;
        try { d = JSON.parse(r.resposta.texto); } catch (e) { d = null; }
        if (!d) { ficha.innerHTML = "<p>A resposta não veio em JSON.</p>"; return; }
        if (d.erro) {
          ficha.innerHTML = "<h4>CEP não encontrado</h4><p>O status foi <b>" + r.resposta.status +
            "</b>, mas o corpo diz <code>\"erro\": " + esc(JSON.stringify(d.erro)) + "</code>. Esta API não usa 404: confira o corpo.</p>";
          return;
        }
        ficha.innerHTML = "<h4>" + esc(d.logradouro || "(CEP geral da cidade)") + "</h4>" +
          '<p class="grande">' + esc(d.localidade) + " / " + esc(d.uf) + "</p>" +
          "<p>Bairro: <b>" + esc(d.bairro || "—") + "</b> · CEP <b>" + esc(d.cep) + "</b> · DDD <b>" + esc(d.ddd || "—") + "</b></p>";
      });
    }
    lab.querySelector("[data-cep-enviar]").addEventListener("click", consultar);
    entrada.addEventListener("keydown", function (e) { if (e.key === "Enter") consultar(); });
    lab.querySelectorAll("[data-cep-exemplo]").forEach(function (b) {
      b.addEventListener("click", function () { entrada.value = b.getAttribute("data-cep-exemplo"); consultar(); });
    });
  });

  /* ---------- cliente HTTP completo (o "Postman" da aula) ---------- */
  var PRESETS = [
    { grupo: "JSONPlaceholder (CRUD de treino)", itens: [
      ["GET um usuário", "GET", "{crud}/users/1", "Accept: application/json", ""],
      ["GET lista com limite (veja X-Total-Count)", "GET", "{crud}/users?_limit=3", "Accept: application/json", ""],
      ["GET com filtro na consulta", "GET", "{crud}/users?username=Bret", "", ""],
      ["GET recurso aninhado", "GET", "{crud}/users/1/todos?_limit=3", "", ""],
      ["GET que não existe (404)", "GET", "{crud}/users/999", "", ""],
      ["POST cria um usuário", "POST", "{crud}/users", "Content-Type: application/json", '{\n  "firstName": "Eduardo",\n  "lastName": "Supla"\n}'],
      ["POST sem Content-Type (o corpo some)", "POST", "{crud}/users", "", '{\n  "firstName": "Eduardo",\n  "lastName": "Supla"\n}'],
      ["POST com JSON quebrado", "POST", "{crud}/users", "Content-Type: application/json", '{\n  "firstName": "Eduardo",\n}'],
      ["PUT troca o recurso inteiro", "PUT", "{crud}/users/1", "Content-Type: application/json", '{\n  "firstName": "Jorge",\n  "lastName": "Aragão"\n}'],
      ["PATCH troca só um campo", "PATCH", "{crud}/users/1", "Content-Type: application/json", '{\n  "email": "jorge@exemplo.com"\n}'],
      ["DELETE remove", "DELETE", "{crud}/users/1", "", ""]
    ] },
    { grupo: "Servidor de eco (httpbin)", itens: [
      ["devolve o pedido recebido", "POST", "{eco}/anything/teste?turma=pm3", "Content-Type: application/json\nX-Aula: http", '{\n  "mensagem": "olá, servidor"\n}'],
      ["status à escolha (418)", "GET", "{eco}/status/418", "", ""],
      ["autenticação Bearer", "GET", "{eco}/bearer", "Authorization: Bearer aula-http-123", ""],
      ["HEAD: só os cabeçalhos", "HEAD", "{eco}/json", "", ""],
      ["redirecionamento (302)", "GET", "{eco}/redirect-to?url=%2Fget&status_code=302", "", ""]
    ] },
    { grupo: "APIs do mundo real", itens: [
      ["ViaCEP: endereço de um CEP", "GET", "{cep}/01001000/json/", "", ""],
      ["DNS do Google: IP de um domínio", "GET", "{dns}?name=github.com&type=A", "Accept: application/json", ""]
    ] }
  ];

  function expandir(u) {
    return u.replace("{crud}", APIS.crud).replace("{eco}", eco()).replace("{cep}", APIS.cep).replace("{dns}", APIS.dns);
  }

  document.querySelectorAll("[data-cliente]").forEach(function (lab) {
    var met = lab.querySelector("[data-cli-metodo]");
    var url = lab.querySelector("[data-cli-url]");
    var cab = lab.querySelector("[data-cli-cab]");
    var corpo = lab.querySelector("[data-cli-corpo]");
    var pre = lab.querySelector("[data-cli-preset]");
    var nota = lab.querySelector("[data-cli-nota]");
    var t = lab.querySelector("[data-troca]");

    pre.innerHTML = '<option value="">carregar um exemplo…</option>' + PRESETS.map(function (g, gi) {
      return '<optgroup label="' + esc(g.grupo) + '">' + g.itens.map(function (it, ii) {
        return '<option value="' + gi + "." + ii + '">' + esc(it[1] + " · " + it[0]) + "</option>";
      }).join("") + "</optgroup>";
    }).join("");

    function carregar(chave) {
      var p = chave.split(".");
      var it = PRESETS[+p[0]].itens[+p[1]];
      met.value = it[1]; url.value = expandir(it[2]); cab.value = it[3]; corpo.value = it[4];
      atualizarNota();
    }
    function lerReq() {
      return {
        metodo: met.value,
        url: url.value.trim(),
        cabecalhos: cab.value.split("\n").map(function (l) {
          var i = l.indexOf(":");
          return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : null;
        }).filter(Boolean),
        corpo: corpo.value
      };
    }
    function atualizarNota() {
      var req = lerReq();
      var msgs = [];
      if ((req.metodo === "GET" || req.metodo === "HEAD") && req.corpo.trim()) msgs.push(req.metodo + " não leva corpo: o texto do corpo será ignorado.");
      if (req.corpo.trim() && !req.cabecalhos.some(function (c) { return /^content-type$/i.test(c[0]); }) && req.metodo !== "GET" && req.metodo !== "HEAD")
        msgs.push("Sem Content-Type, o navegador envia o corpo como text/plain.");
      nota.textContent = msgs.join(" ");
      try { atualizarCodigos(lab, req); } catch (e) { /* URL ainda incompleta */ }
    }
    pre.addEventListener("change", function () { if (pre.value) carregar(pre.value); });
    [met, url, cab, corpo].forEach(function (c) { c.addEventListener("input", atualizarNota); c.addEventListener("change", atualizarNota); });
    function mandar() { var req = lerReq(); atualizarCodigos(lab, req); disparar(t, req); }
    lab.querySelector("[data-cli-enviar]").addEventListener("click", mandar);
    lab.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); mandar(); } });
    pre.value = "0.0";
    carregar("0.0");
  });

  /* ======================================================
     7. LABORATÓRIO LIVRE E ATIVIDADE
     ====================================================== */

  var EXEMPLOS_FETCH = {
    get: "// GET: buscar um recurso\nconst resposta = await fetch('{crud}/users/1');\nconsole.log(resposta.status, resposta.statusText);\nconst usuario = await resposta.json();\nconsole.log(usuario.name, '-', usuario.email);",
    post: "// POST: criar um recurso enviando JSON no corpo\nconst resposta = await fetch('{crud}/users', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ firstName: 'Eduardo', lastName: 'Supla' })\n});\nconsole.log(resposta.status);          // 201\nconsole.log(await resposta.json());    // o recurso criado, com id",
    erro404: "// fetch NÃO lança erro em 404: quem confere é você\nconst resposta = await fetch('{crud}/users/999');\nif (!resposta.ok) {\n  console.warn('Falhou:', resposta.status, '(usuário não existe)');\n} else {\n  console.log(await resposta.json());\n}",
    putpatch: "// PUT troca tudo; PATCH troca só o que você mandou\nconst corpo = JSON.stringify({ email: 'novo@exemplo.com' });\nconst cab = { 'Content-Type': 'application/json' };\n\nconst put = await fetch('{crud}/users/1', { method: 'PUT', headers: cab, body: corpo });\nconsole.log('PUT  ->', await put.json());\n\nconst patch = await fetch('{crud}/users/1', { method: 'PATCH', headers: cab, body: corpo });\nconsole.log('PATCH ->', (await patch.json()).name, '(o nome continua lá)');",
    cabecalhos: "// lendo cabeçalhos da resposta\nconst resposta = await fetch('{crud}/users?_limit=2');\nconsole.log('Content-Type:', resposta.headers.get('Content-Type'));\nconsole.log('X-Total-Count:', resposta.headers.get('X-Total-Count'));\nconsole.log('Server:', resposta.headers.get('Server'), '<- escondido pelo navegador');\nfor (const [nome, valor] of resposta.headers) console.log(nome + ':', valor);",
    cep: "// uma API brasileira: ViaCEP\nconst cep = '01001000';\nconst resposta = await fetch('{cep}/' + cep + '/json/');\nconst endereco = await resposta.json();\nif (endereco.erro) console.warn('CEP não encontrado');\nelse console.log(endereco.logradouro + ', ' + endereco.localidade + '/' + endereco.uf);",
    tempo: "// tempo limite: desiste depois de 2 segundos\nconst controle = new AbortController();\nsetTimeout(() => controle.abort(), 2000);\ntry {\n  const r = await fetch('{eco}/delay/5', { signal: controle.signal });\n  console.log(r.status);\n} catch (e) {\n  console.warn('Cancelado:', e.name);   // AbortError\n}",
    offline: "// conferir a conexão antes de enviar\nif (!navigator.onLine) {\n  console.warn('Sem Internet: o pedido não foi enviado.');\n} else {\n  try {\n    const r = await fetch('{crud}/todos/1');\n    console.log(await r.json());\n  } catch (e) {\n    console.error('Servidor inacessível:', e.message);\n  }\n}"
  };

  function expandirCodigo(c) {
    return c.replace(/\{crud\}/g, APIS.crud).replace(/\{eco\}/g, eco()).replace(/\{cep\}/g, APIS.cep);
  }

  var CONSOLE_IFRAME = "(function(){var s=document.getElementById('s');" +
    "function f(v){if(typeof v==='string')return v;if(v instanceof Error)return v.name+': '+v.message;" +
    "try{return JSON.stringify(v,null,2);}catch(e){return String(v);}}" +
    "function o(c,a){var d=document.createElement('div');d.className='l '+c;d.textContent=[].map.call(a,f).join(' ');s.appendChild(d);}" +
    "console.log=function(){o('',arguments)};console.info=function(){o('info',arguments)};" +
    "console.warn=function(){o('warn',arguments)};console.error=function(){o('err',arguments)};" +
    "var nf=window.fetch;window.fetch=function(){if(!navigator.onLine){" +
    "o('warn',['Sem conexão com a Internet: o fetch não foi enviado. Conecte-se e clique em Executar de novo.']);" +
    "return Promise.reject(new TypeError('Sem conexão com a Internet'));}" +
    "return nf.apply(this,arguments).catch(function(e){if(e&&e.name==='TypeError')" +
    "o('err',[navigator.onLine?'Falha de rede: o servidor não respondeu (rede bloqueada, serviço fora do ar ou CORS).':'Sem conexão com a Internet.']);throw e;});};" +
    "window.addEventListener('error',function(e){o('err',[e.message]);});" +
    "window.addEventListener('unhandledrejection',function(e){o('err',['Erro não tratado: '+f(e.reason)]);});})();";

  var pg = document.querySelector("[data-playground]");
  if (pg) {
    var editor = pg.querySelector("textarea");
    var quadro = pg.querySelector("iframe");
    var seletor = pg.querySelector("[data-exemplos]");

    function rodar() {
      var codigo = editor.value.replace(/<\/script/gi, "<\\/script");
      quadro.srcdoc = "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><style>" +
        "body{margin:0;background:#0E1A15;color:#F2F5F3;font:14.5px/1.6 ui-monospace,Consolas,monospace;padding:14px 18px}" +
        ".l{white-space:pre-wrap;overflow-wrap:anywhere;border-bottom:1px solid #1C2B25;padding:4px 0}" +
        ".warn{color:#FFD866}.err{color:#FF9B8F}.info{color:#8A9199}</style></head><body><div id=\"s\"></div>" +
        "<script>" + CONSOLE_IFRAME + "<\/script><script>(async function(){\n" + codigo +
        "\n})().then(function(){console.info('— fim —');},function(e){console.error(e);});<\/script></body></html>";
    }
    pg.querySelector("[data-rodar]").addEventListener("click", rodar);
    editor.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodar(); }
    });
    seletor.addEventListener("change", function () {
      if (EXEMPLOS_FETCH[seletor.value]) { editor.value = expandirCodigo(EXEMPLOS_FETCH[seletor.value]); }
    });
    editor.value = expandirCodigo(EXEMPLOS_FETCH.get);
    quadro.srcdoc = "<!doctype html><html><head><meta charset=\"utf-8\"></head><body style=\"margin:0;background:#0E1A15;color:#8A9199;font:14.5px/1.6 ui-monospace,Consolas,monospace;padding:14px 18px\">" +
      "Clique em Executar (ou Ctrl+Enter) para enviar a requisição.</body></html>";
  }

  /* ---------- miniaplicação: o resultado esperado da atividade ---------- */
  document.querySelectorAll("[data-app-alunos]").forEach(function (app) {
    var corpoTab = app.querySelector("tbody");
    var log = app.querySelector("[data-app-log]");
    var aviso = app.querySelector("[data-aviso]");
    var form = app.querySelector("form");
    var busca = app.querySelector("[data-app-busca]");
    var detalhe = app.querySelector("[data-app-detalhe]");
    var usuarios = [];

    function registrar(req, r) {
      var caminho = new URL(req.url).pathname + new URL(req.url).search;
      var linha = document.createElement("div");
      if (r.erro) {
        linha.className = "falha";
        linha.textContent = req.metodo + " " + caminho + "  ->  " + (r.erro.tipo === "offline" ? "não enviado (sem Internet)" : "sem resposta");
        aviso.innerHTML = htmlAviso(r.erro);
      } else {
        linha.className = r.resposta.ok ? "ok" : "falha";
        linha.textContent = req.metodo + " " + caminho + "  ->  " + r.resposta.status + " " + r.resposta.frase + " (" + r.resposta.tempo + " ms)";
        aviso.innerHTML = "";
      }
      log.insertBefore(linha, log.firstChild);
    }
    function pedir(cfg) {
      var req = montarReq(Object.assign({ api: "crud" }, cfg));
      return enviar(req).then(function (r) { registrar(req, r); return r; });
    }
    function json(r) { try { return JSON.parse(r.resposta.texto); } catch (e) { return null; } }

    function desenhar() {
      corpoTab.innerHTML = usuarios.length ? usuarios.map(function (u) {
        return '<tr data-id="' + u.id + '"><td>' + u.id + "</td><td>" + esc(u.name) + '</td><td data-email>' + esc(u.email) +
          "</td><td>" + esc(u.address && u.address.city ? u.address.city : "—") + "</td><td>" +
          '<button type="button" class="btn-mini" data-acao="editar">editar e-mail</button> ' +
          '<button type="button" class="btn-mini" data-acao="excluir">excluir</button></td></tr>';
      }).join("") : '<tr><td colspan="5" class="vazio-tabela">clique em "Carregar usuários"</td></tr>';
    }

    app.querySelector("[data-app-carregar]").addEventListener("click", function () {
      pedir({ metodo: "GET", caminho: "/users" }).then(function (r) {
        if (r.resposta && r.resposta.ok) { usuarios = json(r) || []; desenhar(); }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nome = form.querySelector("[name=nome]").value.trim();
      var email = form.querySelector("[name=email]").value.trim();
      if (!nome || !/^\S+@\S+\.\S+$/.test(email)) {
        aviso.innerHTML = '<div class="aviso aviso--erro" role="alert"><span class="aviso-icone" aria-hidden="true">!</span><div><h4>Confira o formulário</h4><p>Nome e um e-mail válido são obrigatórios. Nada foi enviado.</p></div></div>';
        return;
      }
      pedir({ metodo: "POST", caminho: "/users", cabecalhos: [["Content-Type", "application/json"]], corpo: { name: nome, email: email } }).then(function (r) {
        var novo = r.resposta && r.resposta.ok ? json(r) : null;
        if (novo) { usuarios.push(novo); desenhar(); form.reset(); }
      });
    });

    corpoTab.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-acao]");
      if (!b) return;
      var tr = b.closest("tr");
      var id = +tr.getAttribute("data-id");
      var acao = b.getAttribute("data-acao");
      if (acao === "editar") {
        var cel = tr.querySelector("[data-email]");
        var atual = (usuarios.filter(function (u) { return u.id === id; })[0] || {}).email || "";
        cel.innerHTML = '<input class="entrada" type="text" value="' + esc(atual) + '" aria-label="Novo e-mail"> ' +
          '<button type="button" class="btn-mini" data-acao="salvar">salvar (PATCH)</button>';
        cel.querySelector("input").focus();
      } else if (acao === "salvar") {
        var novoEmail = tr.querySelector("[data-email] input").value.trim();
        pedir({ metodo: "PATCH", caminho: "/users/" + id, cabecalhos: [["Content-Type", "application/json"]], corpo: { email: novoEmail } }).then(function (r) {
          if (r.resposta && r.resposta.ok) {
            usuarios.forEach(function (u) { if (u.id === id) u.email = novoEmail; });
          }
          desenhar();
        });
      } else if (acao === "excluir") {
        pedir({ metodo: "DELETE", caminho: "/users/" + id }).then(function (r) {
          if (r.resposta && r.resposta.ok) { usuarios = usuarios.filter(function (u) { return u.id !== id; }); desenhar(); }
        });
      }
    });

    app.querySelector("[data-app-buscar]").addEventListener("click", function () {
      var id = busca.value.replace(/\D/g, "") || "1";
      pedir({ metodo: "GET", caminho: "/users/" + id }).then(function (r) {
        if (!r.resposta) { detalhe.innerHTML = ""; return; }
        if (r.resposta.status === 404) { detalhe.innerHTML = "<p><b>Usuário " + esc(id) + " não encontrado</b> (404).</p>"; return; }
        var u = json(r) || {};
        detalhe.innerHTML = "<p><b>" + esc(u.name) + "</b> · telefone " + esc(u.phone || "—") + " · empresa " +
          esc(u.company && u.company.name ? u.company.name : "—") + "</p>";
      });
    });

    desenhar();
  });
})();
