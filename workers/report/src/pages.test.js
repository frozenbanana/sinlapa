import assert from "node:assert/strict";
import test from "node:test";
import { buildTrafficQuery } from "./data.js";
import { canonicalSitePath, pageLabel, selectTopPages } from "./pages.js";

const SEPTEMBER_GROUPS = [
  { path: "/", count: 1290, sampleInterval: 10 },
  { path: "/itm/Bore-Cylinder-53-5mm-Piston-Kit-Fits-Honda-Dio-Vision/676969", count: 40, sampleInterval: 10 },
  { path: "/itm/6-Pin-Tail-Light-Connector-Pigtail-Plug-Fits-2005/634364", count: 40, sampleInterval: 10 },
  { path: "/contact", count: 30, sampleInterval: 10 },
  { path: "/itm/Pazoma-Enduro-LED-Headlight-Fairing-Dirt-Bike-Universal-Fit/1393856", count: 20, sampleInterval: 10 },
  { path: "/itm/Bushing-Fits-Nissan-D21-Pathfinder-Pickup-Direct/634657", count: 20, sampleInterval: 10 }
];

test("september report drops scanner paths and keeps the homepage", () => {
  assert.deepEqual(selectTopPages(SEPTEMBER_GROUPS), [{ path: "/", count: 1290 }]);
});

test("exact thousand counts from one or two coarse samples are dropped", () => {
  const top = selectTopPages([
    { path: "/", count: 8400, sampleInterval: 10 },
    { path: "/erbjudande", count: 1000, sampleInterval: 1000 },
    { path: "/kontakt", count: 2000, sampleInterval: 1000 },
    { path: "/dagens-lunch", count: 50, sampleInterval: 10 }
  ]);
  assert.deepEqual(top, [
    { path: "/", count: 8400 },
    { path: "/dagens-lunch", count: 50 }
  ]);
});

test("the same page is merged across path variants before the sample check", () => {
  const top = selectTopPages([
    { path: "/erbjudande", count: 1000, sampleInterval: 1000 },
    { path: "/erbjudande.html", count: 1000, sampleInterval: 1000 },
    { path: "/erbjudande/", count: 1000, sampleInterval: 1000 }
  ]);
  assert.deepEqual(top, [{ path: "/erbjudande", count: 3000 }]);
});

test("paths are canonicalized before they are labeled", () => {
  assert.equal(canonicalSitePath("/erbjudande.html?utm=kampanj"), "/erbjudande");
  assert.equal(canonicalSitePath("/kontakt/"), "/kontakt");
  assert.equal(canonicalSitePath("/itm/not-a-page"), null);
  assert.equal(pageLabel("/dagens-lunch"), "Lunch");
  assert.equal(pageLabel("/#meny"), "Menyn");
});

test("traffic query asks for real pages, bots excluded, and the sampling rate", () => {
  const query = buildTrafficQuery(
    {
      CF_ACCOUNT_ID: "account",
      RUM_SITE_TAG: "site",
      RUM_HOST_FILTER: "sinlapa.se,www.sinlapa.se"
    },
    { start: "2026-09-01", end: "2026-09-07" }
  );
  assert.match(query, /bot: 0/);
  assert.match(query, /requestHost_in: \["sinlapa\.se", "www\.sinlapa\.se"\]/);
  assert.match(query, /requestPath_in: \["\/", "\/index\.html"/);
  assert.match(query, /avg \{ sampleInterval \}/);
  assert.match(query, /orderBy: \[count_DESC\]/);
  assert.match(query, /pages: rumPageloadEventsAdaptiveGroups\(limit: 40/);
  assert.doesNotMatch(query, /\/itm\//);
  assert.doesNotMatch(query, /\/contact/);
});
