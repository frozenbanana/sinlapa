const DAY_META = [
  ["monday", "Måndag"],
  ["tuesday", "Tisdag"],
  ["wednesday", "Onsdag"],
  ["thursday", "Torsdag"],
  ["friday", "Fredag"],
  ["saturday", "Lördag"],
  ["sunday", "Söndag"]
];

const loginPanel = document.querySelector("#login-panel");
const editorPanel = document.querySelector("#editor-panel");
const loginForm = document.querySelector("#login-form");
const loginResponse = document.querySelector("#login-response");
const configForm = document.querySelector("#config-form");
const saveResponse = document.querySelector("#save-response");
const lunchItemsEl = document.querySelector("#lunch-items");
const hoursEditor = document.querySelector("#hours-editor");
const logoutBtn = document.querySelector("#logout-btn");
const addLunchBtn = document.querySelector("#add-lunch-item");

let token = sessionStorage.getItem("sinlapa-admin-token") || "";
let currentConfig = null;

function setMessage(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "";
}

async function api(path, options = {}) {
  const headers = {
    "content-type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Något gick fel");
  }
  return data;
}

function lunchItemTemplate(item = {}, index = 0) {
  return `
    <article class="lunch-item" data-lunch-item>
      <div class="lunch-item-head">
        <strong>Lunchrätt ${index + 1}</strong>
        <button class="chip-btn" type="button" data-remove-lunch>Ta bort</button>
      </div>
      <div class="form-grid">
        <label>Etikett<input data-field="tag" value="${escapeAttr(item.tag || "")}" placeholder="Populär" /></label>
        <label>Namn<input data-field="name" value="${escapeAttr(item.name || "")}" required /></label>
        <label class="full">Beskrivning<textarea data-field="description" rows="2">${escapeHtml(item.description || "")}</textarea></label>
        <label class="full">Notering<input data-field="note" value="${escapeAttr(item.note || "")}" placeholder="Går att få vegetarisk" /></label>
      </div>
    </article>
  `;
}

function hoursDayTemplate(key, label, day) {
  const periods = day.closed ? [] : day.periods?.length ? day.periods : [{ open: "11:00", close: "14:00" }];
  return `
    <article class="hours-day" data-day="${key}">
      <div class="hours-day-head">
        <strong>${label}</strong>
        <label class="toggle">
          <input type="checkbox" data-closed ${day.closed ? "checked" : ""} />
          Stängt
        </label>
      </div>
      <div class="hours-periods" data-periods ${day.closed ? "hidden" : ""}>
        ${periods.map((period) => periodTemplate(period)).join("")}
      </div>
      <button class="chip-btn" type="button" data-add-period ${day.closed ? "hidden" : ""}>+ Lägg till tidspass</button>
    </article>
  `;
}

function periodTemplate(period = { open: "11:00", close: "14:00" }) {
  return `
    <div class="hours-period" data-period>
      <label>Öppnar<input type="time" data-open value="${escapeAttr(period.open || "11:00")}" /></label>
      <label>Stänger<input type="time" data-close value="${escapeAttr(period.close || "14:00")}" /></label>
      <button class="chip-btn" type="button" data-remove-period>Ta bort</button>
    </div>
  `;
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderLunchItems(items) {
  lunchItemsEl.innerHTML = (items || []).map((item, index) => lunchItemTemplate(item, index)).join("");
}

function renderHours(hours) {
  hoursEditor.innerHTML = DAY_META.map(([key, label]) =>
    hoursDayTemplate(key, label, hours[key] || { closed: true, periods: [] })
  ).join("");
}

function collectConfigFromForm() {
  const lunchItems = [...lunchItemsEl.querySelectorAll("[data-lunch-item]")].map((item) => ({
    tag: item.querySelector('[data-field="tag"]').value.trim(),
    name: item.querySelector('[data-field="name"]').value.trim(),
    description: item.querySelector('[data-field="description"]').value.trim(),
    note: item.querySelector('[data-field="note"]').value.trim()
  })).filter((item) => item.name);

  const hours = {};
  for (const dayEl of hoursEditor.querySelectorAll("[data-day]")) {
    const key = dayEl.dataset.day;
    const closed = dayEl.querySelector("[data-closed]").checked;
    const periods = closed
      ? []
      : [...dayEl.querySelectorAll("[data-period]")].map((period) => ({
          open: period.querySelector("[data-open]").value,
          close: period.querySelector("[data-close]").value
        }));
    hours[key] = { closed, periods };
  }

  return {
    lunch: {
      title: configForm.elements["lunch-title"].value.trim(),
      weekLabel: configForm.elements["lunch-week-label"].value.trim(),
      price: configForm.elements["lunch-price"].value.trim(),
      hoursLabel: configForm.elements["lunch-hours-label"].value.trim(),
      included: configForm.elements["lunch-included"].value.trim(),
      items: lunchItems
    },
    hours
  };
}

function fillForm(config) {
  currentConfig = config;
  configForm.elements["lunch-title"].value = config.lunch.title || "";
  configForm.elements["lunch-week-label"].value = config.lunch.weekLabel || "";
  configForm.elements["lunch-price"].value = config.lunch.price || "";
  configForm.elements["lunch-hours-label"].value = config.lunch.hoursLabel || "";
  configForm.elements["lunch-included"].value = config.lunch.included || "";
  renderLunchItems(config.lunch.items || []);
  renderHours(config.hours || {});
}

function showEditor(show) {
  loginPanel.hidden = show;
  editorPanel.hidden = !show;
  logoutBtn.hidden = !show;
}

async function loadConfig() {
  const config = await api("/api/admin/site-config");
  fillForm(config);
  showEditor(true);
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginResponse, "Loggar in…");
  try {
    const password = new FormData(loginForm).get("password");
    const result = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });
    token = result.token;
    sessionStorage.setItem("sinlapa-admin-token", token);
    await loadConfig();
    setMessage(loginResponse, "");
  } catch (error) {
    setMessage(loginResponse, error.message, true);
  }
});

logoutBtn?.addEventListener("click", () => {
  token = "";
  sessionStorage.removeItem("sinlapa-admin-token");
  showEditor(false);
  loginForm.reset();
  setMessage(loginResponse, "Du är utloggad.");
});

addLunchBtn?.addEventListener("click", () => {
  lunchItemsEl.insertAdjacentHTML("beforeend", lunchItemTemplate({}, lunchItemsEl.children.length));
});

lunchItemsEl?.addEventListener("click", (event) => {
  if (event.target.matches("[data-remove-lunch]")) {
    event.target.closest("[data-lunch-item]")?.remove();
  }
});

hoursEditor?.addEventListener("change", (event) => {
  if (!event.target.matches("[data-closed]")) return;
  const day = event.target.closest("[data-day]");
  const periods = day.querySelector("[data-periods]");
  const addBtn = day.querySelector("[data-add-period]");
  const closed = event.target.checked;
  periods.hidden = closed;
  addBtn.hidden = closed;
  if (!closed && !periods.children.length) {
    periods.insertAdjacentHTML("beforeend", periodTemplate());
  }
});

hoursEditor?.addEventListener("click", (event) => {
  if (event.target.matches("[data-add-period]")) {
    const day = event.target.closest("[data-day]");
    day.querySelector("[data-periods]").insertAdjacentHTML("beforeend", periodTemplate());
  }
  if (event.target.matches("[data-remove-period]")) {
    event.target.closest("[data-period]")?.remove();
  }
});

configForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(saveResponse, "Sparar…");
  try {
    const payload = collectConfigFromForm();
    if (!payload.lunch.items.length) {
      throw new Error("Lägg till minst en lunchrätt.");
    }
    const result = await api("/api/admin/site-config", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    fillForm(result.config);
    setMessage(saveResponse, "Sparat. Ändringarna syns på webbplatsen inom någon minut.");
  } catch (error) {
    setMessage(saveResponse, error.message, true);
  }
});

if (token) {
  loadConfig().catch(() => {
    token = "";
    sessionStorage.removeItem("sinlapa-admin-token");
    showEditor(false);
  });
}
