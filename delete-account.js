// Deleting a Notereef account from a browser, for someone who no longer has
// the app. It does what the app's Settings → Delete account does: log in,
// remove the account's pictures (files, which the database cannot remove),
// then ask the database to delete the account (`delete_account`, migration
// 0023). The password is used for the one log-in request and kept nowhere.
(function () {
  // The app's database. The key is the public one every copy of the app
  // carries: it identifies the project and gives no access by itself.
  var API = "https://vexuorcavhexnfhhnvtc.supabase.co";
  var KEY = "sb_publishable_BmLeBzt7ZFxwxe3kmKA4QA_KPVCaGP8";

  var TEXT = {
    en: {
      wrong: "Incorrect email or password.",
      unconfirmed: "This account's email address has not been confirmed yet.",
      busy: "Too many attempts. Wait a minute and try again.",
      offline: "Could not reach the server. Check your connection and try again.",
      failed:
        "Something went wrong and the account was not deleted. Try again, or write to barszczewski.patryk01@gmail.com.",
    },
    pl: {
      wrong: "Nieprawidłowy e-mail lub hasło.",
      unconfirmed: "Adres e-mail tego konta nie został jeszcze potwierdzony.",
      busy: "Za dużo prób. Odczekaj minutę i spróbuj ponownie.",
      offline: "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
      failed:
        "Coś poszło nie tak i konto nie zostało usunięte. Spróbuj ponownie albo napisz na barszczewski.patryk01@gmail.com.",
    },
  };
  var text = function (key) {
    return TEXT[window.siteLanguage()][key];
  };

  var byId = function (id) {
    return document.getElementById(id);
  };
  var login = byId("login");
  var confirm = byId("confirm");
  var done = byId("done");
  var sure = byId("sure");
  var deleteButton = byId("delete-button");

  // The account that is logged in on this page: its id, address and token.
  var account = null;

  function request(method, path, body) {
    return fetch(API + path, {
      method: method,
      headers: {
        apikey: KEY,
        Authorization: "Bearer " + (account ? account.token : KEY),
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  // A request that has to succeed; gives back what the server answered.
  async function must(method, path, body) {
    var response = await request(method, path, body);
    if (!response.ok) throw new Error(method + " " + path + ": " + response.status);
    var answer = await response.text();
    return answer ? JSON.parse(answer) : null;
  }

  function show(element, message) {
    element.textContent = message || "";
    element.hidden = !message;
  }

  login.addEventListener("submit", async function (event) {
    event.preventDefault();
    var error = byId("login-error");
    var button = byId("login-button");
    show(error, "");
    button.disabled = true;
    try {
      var response = await request("POST", "/auth/v1/token?grant_type=password", {
        email: byId("email").value.trim(),
        password: byId("password").value,
      });
      var data = await response.json().catch(function () {
        return {};
      });
      if (response.ok && data.access_token && data.user) {
        account = { id: data.user.id, email: data.user.email, token: data.access_token };
        byId("password").value = "";
        byId("who").textContent = account.email;
        sure.checked = false;
        deleteButton.disabled = true;
        login.hidden = true;
        confirm.hidden = false;
      } else if (response.status === 429) {
        show(error, text("busy"));
      } else if (data.error_code === "email_not_confirmed") {
        show(error, text("unconfirmed"));
      } else {
        show(error, text("wrong"));
      }
    } catch (failure) {
      show(error, text("offline"));
    }
    button.disabled = false;
  });

  sure.addEventListener("change", function () {
    deleteButton.disabled = !sure.checked;
  });

  byId("cancel").addEventListener("click", function () {
    account = null;
    show(byId("delete-error"), "");
    confirm.hidden = true;
    login.hidden = false;
  });

  // Every file in one folder of the pictures' bucket.
  async function forget(folder) {
    var files = await must("POST", "/storage/v1/object/list/avatars", {
      prefix: folder,
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (!files || files.length === 0) return;
    await must("DELETE", "/storage/v1/object/avatars", {
      prefixes: files.map(function (file) {
        return folder + "/" + file.name;
      }),
    });
  }

  confirm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!account || !sure.checked) return;
    var error = byId("delete-error");
    show(error, "");
    deleteButton.disabled = true;
    try {
      // The account's own picture, and those of the organizations it made
      // (they are deleted with it).
      var owned = await must(
        "GET",
        "/rest/v1/organizations?select=id&created_by=eq." + encodeURIComponent(account.id),
      );
      await forget("user/" + account.id);
      for (var index = 0; index < owned.length; index++) {
        await forget("organization/" + owned[index].id);
      }
      await must("POST", "/rest/v1/rpc/delete_account", {});
      account = null;
      confirm.hidden = true;
      done.hidden = false;
    } catch (failure) {
      console.error(failure);
      show(error, text(failure instanceof TypeError ? "offline" : "failed"));
      deleteButton.disabled = false;
    }
  });
})();
