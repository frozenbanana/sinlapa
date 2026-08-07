const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

const DAY_LABELS = [
  ["monday", "Måndag"],
  ["tuesday", "Tisdag"],
  ["wednesday", "Onsdag"],
  ["thursday", "Torsdag"],
  ["friday", "Fredag"],
  ["saturday", "Lördag"],
  ["sunday", "Söndag"]
];

const DISHES = [
  {
    name: "Spicy Edamame",
    description: "Edamame med chili, salt och en lätt het kick.",
    category: "Smårätter"
  },
  {
    name: "Po Pia Tod",
    description: "3 st. Friterade hemmagjorda vårrullar fyllda med glasnudlar, kål, morot och torkad svart svamp. Serveras med sweet chilisås.",
    category: "Smårätter",
    price: 65
  },
  {
    name: "Wakame",
    description: "Frisk wakamesallad med sesam och lätt syra.",
    category: "Smårätter"
  },
  {
    name: "Fresh Kimchi",
    description: "Vår hemmagjorda kimchi med kinakål.",
    category: "Smårätter",
    price: 55
  },
  {
    name: "Shrimp Tempura",
    description: "4 st. Friterade tempura räkor, serveras med chili dippsås & chili mayo.",
    category: "Smårätter",
    price: 95
  },
  {
    name: "Som Tam Gai Yang",
    description: "Grön papayasallad med chili, vitlök, morötter, tomater, limesaft, fisksås & jordnötter. Serveras med marinerad Thai grillad kyckling.",
    category: "Smårätter",
    price: 179
  },
  {
    name: "Zesty Lemongrass Tiger Prawns",
    description: "Thai Tiger räkor sallad med citrongräs, färska örter, lök, lime dressing & chili.",
    category: "Smårätter",
    price: 165
  },
  {
    name: "Siam Mussel Salad",
    description: "Grönmusslor i en frisk Thai salladsdressing med färska örter och rostade jordnötter, serveras med wakame-sjögrässallad.",
    category: "Smårätter",
    price: 159
  },
  {
    name: "Larb Gai Grob",
    description: "Isaan smaker – krispigt, friskt & fullt av örter! Krispig kyckling, rostad chili, rispulver, kaffir-limeblad, mynta, koriander, lök, tamarindsås och sesamfrön.",
    category: "Thai Fusion Bowls – Kyckling",
    price: 155
  },
  {
    name: "Cashew Chicken",
    description: "Krispigt, tropiskt & sötsyrligt! Krispig kyckling, sötsursås, cashewnötter, ananas, tomater, lök och sesamfrön.",
    category: "Thai Fusion Bowls – Kyckling",
    price: 159
  },
  {
    name: "Yum Gai Yang",
    description: "Fräsch, smakrik thailändsk grillad kycklingsallad! Grillad kyckling, Thai salladsdressing, tomater, lök, koriander och sesamfrön.",
    category: "Thai Fusion Bowls – Kyckling",
    price: 165
  },
  {
    name: "Krapow Gai Grob",
    description: "Toppat med stekt ägg! Krispig kyckling, rostad chili, vitlök, Thai holy basilikasås, lök och sesamfrön.",
    category: "Thai Fusion Bowls – Kyckling",
    price: 169
  },
  {
    name: "NB Gai Yang",
    description: "Thai grillad kyckling med mjuka nudlar, hemgjord noodlebowl-sås, krossade jordnötter, koriander, salladslök, morot, rödkål, böngroddar, limeklyfta och sesamfrön.",
    category: "Noodle Bowls",
    price: 155
  },
  {
    name: "NB Gai Grob",
    description: "Krispig kyckling med mjuka nudlar, hemgjord noodlebowl-sås, krossade jordnötter, koriander, salladslök, morot, rödkål, böngroddar, limeklyfta och sesamfrön.",
    category: "Noodle Bowls",
    price: 159
  },
  {
    name: "NB Neua",
    description: "Marinerad högrev med mjuka nudlar, hemgjord noodlebowl-sås, krossade jordnötter, koriander, salladslök, morot, rödkål, böngroddar, limeklyfta och sesamfrön.",
    category: "Noodle Bowls",
    price: 169
  },
  {
    name: "NB Goong",
    description: "Tiger räkor med mjuka nudlar, hemgjord noodlebowl-sås, krossade jordnötter, koriander, salladslök, morot, rödkål, böngroddar, limeklyfta och sesamfrön.",
    category: "Noodle Bowls",
    price: 179
  },
  {
    name: "NB Veggie",
    description: "Vegetariskt alternativ med mjuka nudlar, hemgjord noodlebowl-sås, krossade jordnötter, koriander, salladslök, morot, rödkål, böngroddar, limeklyfta och sesamfrön.",
    category: "Noodle Bowls",
    price: 159
  },
  {
    name: "SB Gai Grob",
    description: "Krispig kyckling i salladsbowl med fresh kimchi, wakame, edamame, avokado, ris, mixsallad och sesamfrön.",
    category: "Special Bowls",
    price: 165
  },
  {
    name: "SB Shrimp Tempura",
    description: "Krispig shrimp tempura (går att byta till tiger räkor) med fresh kimchi, wakame, edamame, avokado, ris, mixsallad och sesamfrön.",
    category: "Special Bowls",
    price: 169
  },
  {
    name: "SB Neua",
    description: "Marinerad högrev i salladsbowl med fresh kimchi, wakame, edamame, avokado, ris, mixsallad och sesamfrön.",
    category: "Special Bowls",
    price: 179
  },
  {
    name: "SB Tofu Teriyaki",
    description: "Tofu teriyaki i salladsbowl med fresh kimchi, wakame, edamame, avokado, ris, mixsallad och sesamfrön.",
    category: "Special Bowls",
    price: 169
  },
  {
    name: "Chicken Green Curry",
    description: "Klassisk thailändsk grön curry med kyckling, kokosmjölk, thailändska örter & grönsaker. Serveras med jasminris.",
    category: "Thai Street Food",
    price: 165
  },
  {
    name: "Chicken Red Curry",
    description: "Klassisk thailändsk röd curry med kyckling, kokosmjölk, thailändska örter & grönsaker. Serveras med jasminris.",
    category: "Thai Street Food",
    price: 165
  },
  {
    name: "Krapow Neua Kai Dow",
    description: "Wokat högrev med färsk chili, vitlök, thai holy basilika i vår woksås. Serveras med jasminris, stekt ägg, mixsallad, limeklyfta och chili fisksås.",
    category: "Thai Street Food",
    price: 179
  },
  {
    name: "Goong Pad Prik",
    description: "Wokade tiger räkor med röd curry, thailändska örter och sweet basilika. Serveras med jasminris, mixsallad, limeklyfta och chili fisksås.",
    category: "Thai Street Food",
    price: 185
  },
  {
    name: "Crying Tiger",
    description: "Het grillad marinerad biff i thailändsk stil, blandad med färska örter, rostad chili & rispulver, fisksås, limesaft och tamarindsås.",
    category: "Thai Street Food",
    price: 199
  },
  {
    name: "Mango Sticky Rice",
    description: "Färsk mango, sticky rice och len kokosmjölk.",
    category: "Desserts & Barnmeny"
  },
  {
    name: "Thailändsk pannkaka (Roti)",
    description: "Krispig thailändsk roti-pannkaka, serverad varm.",
    category: "Desserts & Barnmeny"
  },
  {
    name: "Glass i strut",
    description: "Välj smak: vanilj, choklad, jordgubb eller mango. Topping +5 kr.",
    category: "Desserts & Barnmeny",
    price: 20
  },
  {
    name: "Khao Gai Yang",
    description: "Thai grillad kyckling serveras med ris, teriyakisås och toppad med sesamfrön.",
    category: "Desserts & Barnmeny",
    price: 75
  },
  {
    name: "BaMee Gai Grob",
    description: "Stekta äggnudlar med woksås och krispig kyckling. Valfri sås.",
    category: "Desserts & Barnmeny",
    price: 89
  }
];

function priceNumber(value) {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function analyticsSnippet(token) {
  const safe = String(token || "").trim().replace(/["'<>]/g, "");
  if (!safe) return "";
  return `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${safe}"}'></script>`;
}

function menuItemElement(item) {
  const element = { "@type": "MenuItem", name: item.name };
  if (item.description) element.description = item.description;
  if (item.price) {
    element.offers = {
      "@type": "Offer",
      priceCurrency: "SEK",
      price: priceNumber(item.price)
    };
  }
  return element;
}

function buildMenu(config) {
  const lunch = config.lunch || {};
  const sections = [];

  const lunchItems = Array.isArray(lunch.items) ? lunch.items : null;
  if (lunchItems?.length) {
    const lunchSection = {
      "@type": "MenuSection",
      name: "Dagens lunch",
      description: [lunch.title, lunch.hoursLabel].filter(Boolean).join(" · "),
      hasMenuItem: lunchItems.map(menuItemElement)
    };
    const price = priceNumber(lunch.price);
    if (price) {
      lunchSection.offers = {
        "@type": "Offer",
        priceCurrency: "SEK",
        price
      };
    }
    sections.push(lunchSection);
  }

  const categories = [];
  for (const dish of DISHES) {
    if (!categories.some((category) => category.name === dish.category)) {
      categories.push({ name: dish.category, items: [] });
    }
    categories.find((category) => category.name === dish.category).items.push(dish);
  }

  for (const category of categories) {
    sections.push({
      "@type": "MenuSection",
      name: category.name,
      hasMenuItem: category.items.map(menuItemElement)
    });
  }

  return { "@type": "Menu", hasMenuSection: sections };
}

export function buildRestaurantSchema(config, baseUrl, location) {
  const hours = config.hours || {};

  const openingHoursSpecification = [];
  for (const day of DAY_ORDER) {
    const info = hours[day];
    if (!info || info.closed || !info.periods?.length) continue;
    for (const period of info.periods) {
      openingHoursSpecification.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: day[0].toUpperCase() + day.slice(1),
        opens: period.open,
        closes: period.close
      });
    }
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Sinlapa",
    description: "Thai fusion-restaurang i Malmö där autentiska smaker möter modern kreativitet.",
    url: baseUrl,
    image: `${baseUrl}/assets/hero.webp`,
    servesCuisine: ["Thai", "Thai fusion", "Asian fusion"],
    priceRange: "$$",
    telephone: "+46 760 07 75 99",
    email: "info@sinlapa.se",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Amiralsgatan 8K",
      postalCode: "211 55",
      addressLocality: "Malmö",
      addressCountry: "SE"
    },
    openingHoursSpecification,
    acceptsReservations: true,
    menu: `${baseUrl}/#meny`,
    hasMenu: buildMenu(config)
  };

  if (location?.latitude != null && location?.longitude != null) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: location.latitude,
      longitude: location.longitude
    };
  }

  schema.aggregateRating = {
    "@type": "AggregateRating",
    ratingValue: "4.7",
    reviewCount: "137",
    bestRating: "5"
  };

  return schema;
}

function hoursText(config) {
  const hours = config.hours || {};
  const lines = [];
  for (const [key, label] of DAY_LABELS) {
    const day = hours[key];
    lines.push(`- ${label}: ${day?.closed || !day?.periods?.length ? "Stängt" : day.label}`);
  }
  return lines.join("\n");
}

function lunchText(config) {
  const lunch = config.lunch || {};
  const lines = [];
  lines.push(`- Pris: ${lunch.price || "129 kr"}`);
  lines.push(`- Tid: ${lunch.hoursLabel || "Måndag–fredag 11–14"}`);
  if (lunch.title) lines.push(`- Rubrik: ${lunch.title}`);
  if (lunch.included) lines.push(`- Alltid inkluderat: ${lunch.included}`);
  const items = Array.isArray(lunch.items) ? lunch.items : [];
  if (items.length) {
    lines.push("- Dagens rätter:");
    for (const item of items) {
      const core = [item.name, item.description].filter(Boolean).join(" – ");
      const meta = [];
      if (item.tag) meta.push(`Etikett: ${item.tag}`);
      if (item.note) meta.push(`Notering: ${item.note}`);
      const suffix = meta.length ? ` (${meta.join(" · ")})` : "";
      lines.push(`  - ${core}${suffix}`);
    }
  }
  return lines.join("\n");
}

function menuText() {
  const lines = [];
  for (const dish of DISHES) {
    const price = dish.price ? ` – ${dish.price} kr` : "";
    lines.push(`- ${dish.name}${price}: ${dish.description}`);
  }
  return lines.join("\n");
}

export function buildLlmsTxt(config, baseUrl) {
  return [
    "# Sinlapa",
    "",
    "> Autentiska thailändska smaker möter modern kreativitet – Thai fusion i Malmö.",
    "",
    "Sinlapa är en thailändsk fusionrestaurang på Amiralsgatan 8K, 211 55 Malmö, nära Quality Hotel och ett par minuter från Gustav Adolfs torg. Restaurangen serverar vardagslunch (vardagar 11–14), à la carte-meny, catering för sällskap från 10 personer samt avhämtning och beställning.",
    "",
    "## Viktig information",
    "",
    `- Webbplats: ${baseUrl}`,
    "- Telefon: +46 760 07 75 99",
    "- E-post: info@sinlapa.se",
    "- Adress: Amiralsgatan 8K, 211 55 Malmö",
    "- Öppettider: " + (config.hours?.monday?.label || "vardagar 11–14, fre 11–21, lör 12–21"),
    "- Boka bord: via formuläret på webbplatsen (större sällskap ringer).",
    "- Catering: från 10 personer, förfrågan via formuläret på webbplatsen.",
    "- Beställning: avhämtning eller leverans samma dag, se webbplatsen.",
    "",
    `Fullständig information (öppettider, veckolunch, meny, catering) finns i ${baseUrl}/llms-full.txt`,
    ""
  ].join("\n");
}

export function buildLlmsFullTxt(config, baseUrl) {
  const lunch = lunchText(config);
  return [
    "# Sinlapa",
    "",
    "> Autentiska thailändska smaker möter modern kreativitet – Thai fusion i Malmö.",
    "",
    "## Om restaurangen",
    "Sinlapa är en thailändsk fusionrestaurang vid Amiralsgatan 8K, 211 55 Malmö, nära Quality Hotel och ett par minuter från Gustav Adolfs torg. Köket kombinerar traditionella thailändska smaker med modern presentation och varma thailändska smaker. Restaurangen drivs av kocken Kanlaya, som växte upp i Thailand och har över 15 års internationell kockerfarenhet.",
    "",
    "## Kontakt",
    "",
    `- Webbplats: ${baseUrl}`,
    "- Telefon: +46 760 07 75 99",
    "- E-post: info@sinlapa.se",
    "- Adress: Amiralsgatan 8K, 211 55 Malmö, Sverige",
    "",
    "## Öppettider",
    "",
    hoursText(config),
    "",
    "## Veckans lunch",
    "",
    "Lunch serveras vardagar 11–14 på Sinlapa och inkluderar alltid husets soppa, vatten och kaffe.",
    "",
    lunch,
    "",
    "## Meny",
    "",
    "Ett urval av rätterna på menyn (aktuell meny och priser visas på webbplatsen).",
    "",
    menuText(),
    "",
    "## Catering & evenemang",
    "",
    "- Fusion bowls från 139 kr per person",
    "- Bufféförslag för sällskap från 10 personer",
    "- Vegetariska, veganska och allergianpassade alternativ",
    "- Leverans och presentation efter överenskommelse",
    "- Förfrågan görs via formuläret på webbplatsen eller per telefon.",
    "",
    "## Bordsbokning",
    "",
    "- Enkel bokning via formuläret på webbplatsen.",
    "- Bokningen bekräftas av restaurangen.",
    "- Sällskap över 8 personer ringer: +46 760 07 75 99.",
    "",
    "## Beställning & avhämtning",
    "",
    "- Ring restaurangen för avhämtning: +46 760 07 75 99.",
    "- Leverans i Malmö via de partners som visas på webbplatsen (Foodora, Wolt, Uber Eats).",
    "",
    "As a matter of policy, the information in this document is maintained from the restaurant's own admin and reflects current hours, weekly lunch and contact details. Prices and occasional dishes may change; see the website for the latest offer.",
    ""
  ].join("\n");
}
