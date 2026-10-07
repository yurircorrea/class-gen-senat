/* Vai em demos/demo.js — carregado por cada página que roda dentro de um simulador.

   Informa a altura desta página ao documento que a carregou no <iframe>,
   para que o quadro fique justo e sem barra de rolagem.

   A medida sai do <body> (que tem só a altura do conteúdo) e NÃO do <html>:
   a altura do <html> é no mínimo a do próprio quadro, que o pai acabou de
   definir a partir desta mensagem — medir ali faz o iframe só crescer e nunca
   encolher, deixando uma sobra branca permanente.

   postMessage funciona por file://, ao contrário de ler contentDocument. */
(function () {
  "use strict";

  function medir() {
    var alvo = document.getElementById("palco-fixo");   /* demos de altura fixa */
    var h = alvo
      ? alvo.getBoundingClientRect().height
      : document.body.getBoundingClientRect().height;
    parent.postMessage({ tipo: "altura-demo", altura: Math.ceil(h) + 2 }, "*");
  }

  window.addEventListener("load", medir);
  window.addEventListener("resize", medir);
  if (window.ResizeObserver) new ResizeObserver(medir).observe(document.body);

  /* se a demo tiver componentes que expandem, meça de novo quando abrirem */
  document.addEventListener("shown.bs.collapse", medir);
  document.addEventListener("hidden.bs.collapse", medir);

  setTimeout(medir, 300);
  setTimeout(medir, 1200);
})();
