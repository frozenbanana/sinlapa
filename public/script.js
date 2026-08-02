const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const mobileNavQuery = window.matchMedia("(max-width: 820px)");

function syncNavigationAccessibility() {
  if (!siteNav) return;
  const isOpen = menuToggle?.getAttribute("aria-expanded") === "true";
  const isHidden = mobileNavQuery.matches && !isOpen;
  siteNav.toggleAttribute("inert", isHidden);
  if (mobileNavQuery.matches) {
    siteNav.setAttribute("aria-hidden", String(isHidden));
  } else {
    siteNav.removeAttribute("aria-hidden");
  }
}

function closeMenu() {
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Öppna meny");
  siteNav?.classList.remove("open");
  document.body.classList.remove("menu-open");
  syncNavigationAccessibility();
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Öppna meny" : "Stäng meny");
  siteNav?.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
  syncNavigationAccessibility();
});

siteNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
mobileNavQuery.addEventListener("change", syncNavigationAccessibility);
syncNavigationAccessibility();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const filters = document.querySelectorAll(".filter");
const dishes = document.querySelectorAll(".dish-card");

filters.forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    const selectedFilter = filterButton.dataset.filter;

    filters.forEach((button) => {
      const isActive = button === filterButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    dishes.forEach((dish) => {
      const tags = dish.dataset.tags?.split(" ") ?? [];
      dish.hidden = selectedFilter !== "all" && !tags.includes(selectedFilter);
    });
  });
});

filters.forEach((button, index) => button.setAttribute("aria-pressed", String(index === 0)));

const dialog = document.querySelector("#order-dialog");

document.querySelectorAll(".order-open").forEach((button) => {
  button.addEventListener("click", () => dialog?.showModal());
});

document.querySelector(".dialog-close")?.addEventListener("click", () => dialog?.close());

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelectorAll("[data-placeholder]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const note = dialog?.querySelector("small");
    if (note) note.textContent = "Den här leveranslänken kopplas in inför lansering.";
  });
});

const dateInputs = document.querySelectorAll('input[type="date"]');
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];
dateInputs.forEach((input) => input.setAttribute("min", localDate));

const DAY_ORDER = [
  ["monday", "Måndag"],
  ["tuesday", "Tisdag"],
  ["wednesday", "Onsdag"],
  ["thursday", "Torsdag"],
  ["friday", "Fredag"],
  ["saturday", "Lördag"],
  ["sunday", "Söndag"]
];

let siteConfig = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function minutesFromTime(value) {
  const [hours, minutes] = String(value || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function formatCompactTime(value) {
  return String(value || "").replace(/^0/, "").replace(":00", "");
}

function applyLunch(lunch) {
  if (!lunch) return;

  const weekLabel = document.querySelector("#lunch-week-label");
  const title = document.querySelector("#lunch-title-text");
  const price = document.querySelector("#lunch-price");
  const included = document.querySelector("#lunch-included");
  const list = document.querySelector("#lunch-list");
  const quickHours = document.querySelector("#quick-lunch-hours");
  const quickPrice = document.querySelector("#quick-lunch-price");
  const contactLunch = document.querySelector("#contact-lunch-hours");

  if (weekLabel) weekLabel.textContent = lunch.weekLabel || "Den här veckan";
  if (title) title.textContent = lunch.title || "Lunch hos Sinlapa";
  if (price) price.textContent = lunch.price || "129 kr";
  if (included) included.textContent = lunch.included || "";
  if (contactLunch) contactLunch.textContent = lunch.hoursLabel || "";
  if (quickHours) quickHours.textContent = lunch.hoursLabel || "Vardagar 11–14";
  if (quickPrice) {
    const priceText = lunch.price || "129 kr";
    quickPrice.textContent = priceText.toLowerCase().includes("lunch")
      ? `${priceText} inkl. soppa`
      : `Lunch ${priceText} inkl. soppa`;
  }

  if (list && Array.isArray(lunch.items)) {
    list.innerHTML = lunch.items.map((item) => `
      <article>
        <div>
          ${item.tag ? `<span class="menu-tag">${escapeHtml(item.tag)}</span>` : ""}
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description || "")}</p>
        </div>
        ${item.note ? `<span class="diet">${escapeHtml(item.note)}</span>` : ""}
      </article>
    `).join("");
  }
}

function applyHours(hours) {
  if (!hours) return;

  const list = document.querySelector("#hours-list");
  if (!list) return;

  const groups = [];
  let current = null;

  for (const [key, label] of DAY_ORDER) {
    const day = hours[key] || { label: "Stängt", closed: true };
    const value = day.closed ? "Stängt" : (day.label || "Stängt");
    if (current && current.value === value) {
      current.end = label;
      continue;
    }
    current = { start: label, end: label, value };
    groups.push(current);
  }

  list.innerHTML = groups.map((group) => {
    const title = group.start === group.end ? group.start : `${group.start}–${group.end.toLowerCase()}`;
    return `<div><dt>${escapeHtml(title)}</dt><dd>${escapeHtml(group.value)}</dd></div>`;
  }).join("");
}

function updateOpeningStatus(hours) {
  const status = document.querySelector("#open-status");
  if (!status) return;

  const now = new Date();
  const dayIndex = now.getDay();
  const dayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayIndex];
  const minutes = now.getHours() * 60 + now.getMinutes();

  let periods = [];
  if (hours?.[dayKey]) {
    const day = hours[dayKey];
    if (day.closed || !day.periods?.length) {
      status.textContent = dayIndex === 0 ? "Stängt idag" : "Stängt för idag";
      return;
    }
    periods = day.periods.map((period) => ({
      start: minutesFromTime(period.open),
      end: minutesFromTime(period.close),
      openLabel: formatCompactTime(period.open),
      closeLabel: formatCompactTime(period.close)
    }));
  } else {
    const fallback = {
      1: [[660, 840], [960, 1200]],
      2: [[660, 840], [960, 1200]],
      3: [[660, 840], [960, 1200]],
      4: [[660, 840], [960, 1200]],
      5: [[660, 1260]],
      6: [[720, 1260]]
    };
    periods = (fallback[dayIndex] || []).map(([start, end]) => ({
      start,
      end,
      openLabel: `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`.replace(/^0/, "").replace(":00", ""),
      closeLabel: `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`.replace(/^0/, "").replace(":00", "")
    }));
  }

  const currentPeriod = periods.find((period) => minutes >= period.start && minutes < period.end);
  const nextPeriod = periods.find((period) => minutes < period.start);

  if (currentPeriod) {
    status.textContent = `Öppet till ${currentPeriod.closeLabel}`;
    return;
  }

  if (nextPeriod) {
    status.textContent = `Öppnar ${nextPeriod.openLabel}`;
    return;
  }

  status.textContent = dayIndex === 0 ? "Stängt idag" : "Stängt för idag";
}

async function loadSiteConfig() {
  try {
    const response = await fetch("/api/site-config", { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("config fetch failed");
    siteConfig = await response.json();
    applyLunch(siteConfig.lunch);
    applyHours(siteConfig.hours);
    updateOpeningStatus(siteConfig.hours);
  } catch {
    updateOpeningStatus(null);
  }
}

async function submitForm(form, type) {
  const responseEl = form.querySelector(".form-response");
  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const payload = { type };

  for (const [key, value] of formData.entries()) {
    payload[key] = String(value).trim();
  }

  if (responseEl) responseEl.textContent = "Skickar…";
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Kunde inte skicka formuläret.");
    }
    if (responseEl) {
      responseEl.textContent = data.message || "Tack! Vi återkommer snart.";
    }
    form.reset();
  } catch (error) {
    if (responseEl) {
      responseEl.textContent = error.message || "Något gick fel. Ring oss gärna istället.";
    }
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

document.querySelector("#booking-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, "booking");
});

document.querySelector("#catering-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(event.currentTarget, "catering");
});

loadSiteConfig();
document.querySelector("#year").textContent = new Date().getFullYear();
