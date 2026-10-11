(function () {
  var LANGUAGES = ["en", "pl", "de", "es"];
  function known(value) {
    var code = (value || "").toLowerCase().slice(0, 2);
    return LANGUAGES.indexOf(code) < 0 ? null : code;
  }
  var asked = new URLSearchParams(location.search).get("lang");
  var language = known(asked) || known(navigator.language) || "en";

  document.documentElement.classList.add("js");

  function show(next) {
    language = next;
    document.documentElement.dataset.lang = next;
    document.documentElement.lang = next;
    var title = document.querySelector('meta[name="title-' + next + '"]');
    if (title) document.title = title.content;
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

    var rising = document.querySelectorAll(".rise");
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in");
            seen.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      rising.forEach(function (element) {
        seen.observe(element);
      });
    } else {
      rising.forEach(function (element) {
        element.classList.add("in");
      });
    }

    document.addEventListener("pointermove", function (event) {
      var pane = event.target.closest && event.target.closest(".card.lift");
      if (!pane) return;
      var box = pane.getBoundingClientRect();
      pane.style.setProperty("--x", event.clientX - box.left + "px");
      pane.style.setProperty("--y", event.clientY - box.top + "px");
    });
  });

  window.siteLanguage = function () {
    return language;
  };
})();
