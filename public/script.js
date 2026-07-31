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

document.querySelectorAll(".demo-form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const response = form.querySelector(".form-response");
    if (response) {
      response.textContent =
        "Tack! Formuläret är klart för koppling till Sinlapas e-postsystem inför lansering.";
    }
  });
});

function updateOpeningStatus() {
  const status = document.querySelector("#open-status");
  if (!status) return;

  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const schedule = {
    1: [[660, 840], [960, 1200]],
    2: [[660, 840], [960, 1200]],
    3: [[660, 840], [960, 1200]],
    4: [[660, 840], [960, 1200]],
    5: [[660, 1260]],
    6: [[720, 1260]]
  };
  const periods = schedule[day] ?? [];
  const currentPeriod = periods.find(([start, end]) => minutes >= start && minutes < end);
  const nextPeriod = periods.find(([start]) => minutes < start);

  if (currentPeriod) {
    const closingHour = String(Math.floor(currentPeriod[1] / 60)).padStart(2, "0");
    const closingMinute = String(currentPeriod[1] % 60).padStart(2, "0");
    status.textContent = `Öppet till ${closingHour}:${closingMinute}`;
    return;
  }

  if (nextPeriod) {
    const openingHour = String(Math.floor(nextPeriod[0] / 60)).padStart(2, "0");
    const openingMinute = String(nextPeriod[0] % 60).padStart(2, "0");
    status.textContent = `Öppnar ${openingHour}:${openingMinute}`;
    return;
  }

  status.textContent = day === 0 ? "Stängt idag" : "Stängt för idag";
}

updateOpeningStatus();
document.querySelector("#year").textContent = new Date().getFullYear();
