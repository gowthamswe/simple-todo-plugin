// Runs synchronously in <head> before paint so the popup never flashes the wrong theme/size.
(function () {
  var d = document.documentElement;
  var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  d.setAttribute("data-theme", prefersLight ? "light" : "dark");
  d.setAttribute("data-text-size", "medium");
})();
