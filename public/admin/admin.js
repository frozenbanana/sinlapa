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
const galleryGrid = document.querySelector("#gallery-grid");
const galleryResponse = document.querySelector("#gallery-response");
const galleryUpload = document.querySelector("#gallery-upload");
const mediaDialog = document.querySelector("#media-dialog");
const dialogGalleryGrid = document.querySelector("#dialog-gallery-grid");
const dialogUpload = document.querySelector("#dialog-upload");
const dialogResponse = document.querySelector("#dialog-response");
const mediaDialogClose = document.querySelector("#media-dialog-close");

let token = sessionStorage.getItem("sinlapa-admin-token") || "";
let galleryImages = [];
let activeLunchItem = null;

function setMessage(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#b42318" : "";
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && options.body && !headers["content-type"]) {
    headers["content-type"] = "application/json";
  }
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Något gick fel");
  }
  return data;
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

function lunchItemTemplate(item = {}, index = 0) {
  const hasImage = Boolean(item.imageUrl);
  return `
    <article class="lunch-item" data-lunch-item>
      <div class="lunch-item-head">
        <strong>Lunchrätt ${index + 1}</strong>
        <button class="chip-btn" type="button" data-remove-lunch>Ta bort</button>
      </div>
      <div class="image-picker">
        ${
          hasImage
            ? `<img class="image-picker-preview" data-preview src="${escapeAttr(item.imageUrl)}" alt="" />`
            : `<div class="image-picker-empty" data-preview-empty>Ingen bild</div>`
        }
        <div>
          <input type="hidden" data-field="imageUrl" value="${escapeAttr(item.imageUrl || "")}" />
          <input type="hidden" data-field="imageKey" value="${escapeAttr(item.imageKey || "")}" />
          <div class="image-picker-actions">
            <button class="button button-ghost" type="button" data-open-gallery>Välj / ladda upp</button>
            <button class="chip-btn" type="button" data-clear-image ${hasImage ? "" : "hidden"}>Ta bort bild</button>
          </div>
        </div>
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
      <div class="hours-period-times">
        <label>
          <span>Från</span>
          <input type="time" data-open value="${escapeAttr(period.open || "11:00")}" inputmode="numeric" />
        </label>
        <label>
          <span>Till</span>
          <input type="time" data-close value="${escapeAttr(period.close || "14:00")}" inputmode="numeric" />
        </label>
      </div>
      <button class="hours-remove" type="button" data-remove-period>Ta bort tidspass</button>
    </div>
  `;
}

function galleryItemTemplate(image, { selectable = false, selectedKey = "" } = {}) {
  const canDelete = image.source === "r2";
  return `
    <article class="gallery-item ${selectable && image.key === selectedKey ? "selected" : ""}" data-gallery-item data-key="${escapeAttr(image.key)}" data-url="${escapeAttr(image.url)}" data-source="${escapeAttr(image.source)}">
      <img src="${escapeAttr(image.url)}" alt="${escapeAttr(image.name)}" loading="lazy" />
      <strong>${escapeHtml(image.name)}</strong>
      <span class="gallery-meta">${image.source === "r2" ? "Uppladdad" : "Webbplats"}</span>
      ${canDelete && !selectable ? `<button class="gallery-delete" type="button" data-delete-image>Ta bort</button>` : ""}
    </article>
  `;
}

function renderLunchItems(items) {
  lunchItemsEl.innerHTML = (items || []).map((item, index) => lunchItemTemplate(item, index)).join("");
}

function renderHours(hours) {
  hoursEditor.innerHTML = DAY_META.map(([key, label]) =>
    hoursDayTemplate(key, label, hours[key] || { closed: true, periods: [] })
  ).join("");
}

function renderGalleryGrids(selectedKey = "") {
  if (galleryGrid) {
    galleryGrid.innerHTML = galleryImages.map((image) => galleryItemTemplate(image)).join("") ||
      `<p>Inga bilder ännu. Ladda upp din första bild.</p>`;
  }
  if (dialogGalleryGrid) {
    dialogGalleryGrid.innerHTML = galleryImages
      .map((image) => galleryItemTemplate(image, { selectable: true, selectedKey }))
      .join("");
  }
}

function collectConfigFromForm() {
  const lunchItems = [...lunchItemsEl.querySelectorAll("[data-lunch-item]")].map((item) => ({
    tag: item.querySelector('[data-field="tag"]').value.trim(),
    name: item.querySelector('[data-field="name"]').value.trim(),
    description: item.querySelector('[data-field="description"]').value.trim(),
    note: item.querySelector('[data-field="note"]').value.trim(),
    imageUrl: item.querySelector('[data-field="imageUrl"]').value.trim(),
    imageKey: item.querySelector('[data-field="imageKey"]').value.trim()
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

function setActiveTab(tabName) {
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".admin-pane").forEach((pane) => {
    pane.hidden = pane.dataset.pane !== tabName;
    pane.classList.toggle("active", pane.dataset.pane === tabName);
  });
}

function setLunchImage(itemEl, image) {
  const urlInput = itemEl.querySelector('[data-field="imageUrl"]');
  const keyInput = itemEl.querySelector('[data-field="imageKey"]');
  const clearBtn = itemEl.querySelector("[data-clear-image]");
  const picker = itemEl.querySelector(".image-picker");
  urlInput.value = image?.url || "";
  keyInput.value = image?.key || "";
  clearBtn.hidden = !image?.url;

  const existingPreview = picker.querySelector("[data-preview], [data-preview-empty]");
  if (image?.url) {
    const img = document.createElement("img");
    img.className = "image-picker-preview";
    img.src = image.url;
    img.alt = "";
    img.dataset.preview = "";
    existingPreview?.replaceWith(img);
  } else {
    const empty = document.createElement("div");
    empty.className = "image-picker-empty";
    empty.dataset.previewEmpty = "";
    empty.textContent = "Ingen bild";
    existingPreview?.replaceWith(empty);
  }
}

async function loadGallery() {
  const result = await api("/api/admin/media");
  galleryImages = result.images || [];
  renderGalleryGrids();
}

async function loadConfig() {
  const [config] = await Promise.all([api("/api/admin/site-config"), loadGallery()]);
  fillForm(config);
  showEditor(true);
  setActiveTab("lunch");
}

async function uploadImage(file, responseEl) {
  if (!file) return null;
  setMessage(responseEl, "Laddar upp…");
  const body = new FormData();
  body.append("file", file);
  const result = await api("/api/admin/media", { method: "POST", body });
  galleryImages = [result.image, ...galleryImages.filter((image) => image.key !== result.image.key)];
  renderGalleryGrids(result.image.key);
  setMessage(responseEl, "Bilden är uppladdad.");
  return result.image;
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

document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
});

addLunchBtn?.addEventListener("click", () => {
  lunchItemsEl.insertAdjacentHTML("beforeend", lunchItemTemplate({}, lunchItemsEl.children.length));
  setActiveTab("lunch");
});

lunchItemsEl?.addEventListener("click", async (event) => {
  const item = event.target.closest("[data-lunch-item]");
  if (!item) return;

  if (event.target.matches("[data-remove-lunch]")) {
    item.remove();
    return;
  }

  if (event.target.matches("[data-clear-image]")) {
    setLunchImage(item, null);
    return;
  }

  if (event.target.matches("[data-open-gallery]")) {
    activeLunchItem = item;
    const selectedKey = item.querySelector('[data-field="imageKey"]').value;
    renderGalleryGrids(selectedKey);
    mediaDialog?.showModal();
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
  if (event.target.closest("[data-remove-period]")) {
    event.target.closest("[data-period]")?.remove();
  }
});

galleryUpload?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  try {
    await uploadImage(file, galleryResponse);
  } catch (error) {
    setMessage(galleryResponse, error.message, true);
  } finally {
    event.target.value = "";
  }
});

dialogUpload?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  try {
    const image = await uploadImage(file, dialogResponse);
    if (image && activeLunchItem) {
      setLunchImage(activeLunchItem, image);
      mediaDialog?.close();
    }
  } catch (error) {
    setMessage(dialogResponse, error.message, true);
  } finally {
    event.target.value = "";
  }
});

galleryGrid?.addEventListener("click", async (event) => {
  if (!event.target.matches("[data-delete-image]")) return;
  event.preventDefault();
  const card = event.target.closest("[data-gallery-item]");
  if (!card) return;
  try {
    setMessage(galleryResponse, "Tar bort…");
    await api(`/api/admin/media?key=${encodeURIComponent(card.dataset.key)}`, { method: "DELETE" });
    galleryImages = galleryImages.filter((image) => image.key !== card.dataset.key);
    renderGalleryGrids();
    setMessage(galleryResponse, "Bilden är borttagen.");
  } catch (error) {
    setMessage(galleryResponse, error.message, true);
  }
});

dialogGalleryGrid?.addEventListener("click", (event) => {
  const card = event.target.closest("[data-gallery-item]");
  if (!card || !activeLunchItem) return;
  setLunchImage(activeLunchItem, {
    url: card.dataset.url,
    key: card.dataset.key
  });
  mediaDialog?.close();
});

mediaDialogClose?.addEventListener("click", () => mediaDialog?.close());
mediaDialog?.addEventListener("click", (event) => {
  if (event.target === mediaDialog) mediaDialog.close();
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
