// Which of the two languages a page shows: the one asked for in the address
// (`?lang=pl`, which is how the app links here), or else the browser's.
(function () {
  var asked = new URLSearchParams(location.search).get("lang");
  var wanted = asked || navigator.language || "en";
  var language = wanted.toLowerCase().indexOf("pl") === 0 ? "pl" : "en";

  function show(next) {
    language = next;
    document.documentElement.dataset.lang = next;
    document.documentElement.lang = next;
    var title = document.querySelector('meta[name="title-' + next + '"]');
    if (title) document.title = title.content;
    // Links to the other pages keep the language.
    document.querySelectorAll("a[data-page]").forEach(function (link) {
      link.href = link.dataset.page + "?lang=" + next;
    });
  }

  show(language);
  document.addEventListener("DOMContentLoaded", function () {
    show(language);
    document.querySelectorAll(".langs button").forEach(function (button) {
      button.addEventListener("click", function () {
        show(button.dataset.set);
      });
    });
  });

  window.siteLanguage = function () {
    return language;
  };
})();
