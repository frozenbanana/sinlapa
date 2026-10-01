const TRACKED_PAGES = [
  { path: "/", label: "Startsidan", aliases: ["/", "/index.html"] },
  { path: "/erbjudande", label: "Erbjudande", aliases: ["/erbjudande", "/erbjudande.html"] },
  { path: "/dagens-lunch", label: "Lunch", aliases: ["/dagens-lunch"] },
  { path: "/thai-lunch-meny-malmo", label: "Menyn", aliases: ["/thai-lunch-meny-malmo"] },
  { path: "/boka-bord", label: "Bordbokning", aliases: ["/boka-bord"] },
  { path: "/catering-events", label: "Catering", aliases: ["/catering-events"] },
  { path: "/kontakt", label: "Kontakt", aliases: ["/kontakt"] },
  { path: "/om-oss", label: "Om oss", aliases: ["/om-oss"] }
];

const HASH_LABELS = {
  "/#lunch": "Lunch",
  "/#meny": "Menyn",
  "/#boka": "Bordbokning",
  "/#catering": "Catering",
  "/#kontakt": "Kontakt"
};

const ALIAS_TO_CANONICAL = new Map();
const LABELS = new Map();

for (const page of TRACKED_PAGES) {
  LABELS.set(page.path, page.label);
  for (const alias of page.aliases) {
    ALIAS_TO_CANONICAL.set(alias, page.path);
  }
}

// A single stored sample, scaled up by a coarse interval, is reported as
// exactly 1000 or 2000 views. That is not a real popular page.
const COARSE_COUNT = 1000;

export function trackedPaths() {
  const paths = new Set();
  for (const page of TRACKED_PAGES) {
    for (const alias of page.aliases) {
      paths.add(alias);
      if (alias !== "/") paths.add(`${alias}/`);
    }
  }
  return [...paths];
}

export function normalizePath(path) {
  const withoutQuery = String(path || "").split("?")[0].split("#")[0];
  if (!withoutQuery || withoutQuery === "/") return "/";
  return withoutQuery.replace(/\/+$/, "") || "/";
}

export function canonicalSitePath(path) {
  return ALIAS_TO_CANONICAL.get(normalizePath(path)) || null;
}

export function pageLabel(path) {
  if (HASH_LABELS[path]) return HASH_LABELS[path];
  const canonical = canonicalSitePath(path);
  if (!canonical) return path;
  return LABELS.get(canonical) || path;
}

export function selectTopPages(groups, limit = 6) {
  const totals = new Map();
  for (const group of groups || []) {
    const path = canonicalSitePath(group.path);
    if (!path) continue;
    const count = Number(group.count) || 0;
    if (count <= 0) continue;
    const interval = Number(group.sampleInterval) > 0 ? Number(group.sampleInterval) : 1;
    const current = totals.get(path) || { path, count: 0, samples: 0 };
    current.count += count;
    current.samples += count / interval;
    totals.set(path, current);
  }

  return [...totals.values()]
    .filter((page) => page.samples >= 3 || page.count < COARSE_COUNT)
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path, "sv"))
    .slice(0, limit)
    .map((page) => ({ path: page.path, count: Math.round(page.count) }));
}
