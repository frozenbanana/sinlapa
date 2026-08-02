import { json, readConfig } from "../lib/config.js";

export async function onRequestGet(context) {
  const config = await readConfig(context.env);
  return json(config, 200, {
    "cache-control": "public, max-age=30"
  });
}
