// Lists YouCam hair-transfer v2.1 templates so catalog entries can be pinned to real template ids.
// Usage: npm run templates            (prints id, category, title, thumb)
//        npm run templates -- --json  (writes scripts/templates.json)
import { readFileSync, writeFileSync } from "node:fs";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const key = process.env.YOUCAM_API_KEY?.trim();
const base = process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com";
if (!key) {
  console.error("YOUCAM_API_KEY is not set in .env.local");
  process.exit(1);
}

const all = [];
let token;
for (let i = 0; i < 20; i++) {
  const qs = new URLSearchParams({ page_size: "20" });
  if (token) qs.set("starting_token", token);
  const res = await fetch(`${base}/s2s/v2.1/task/template/hair-transfer?${qs}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`Request failed: ${res.status} ${body?.error_code || ""}`);
    process.exit(1);
  }
  all.push(...(body?.data?.templates || []));
  token = body?.data?.next_token;
  if (!token) break;
}

if (process.argv.includes("--json")) {
  writeFileSync("scripts/templates.json", JSON.stringify(all, null, 2));
  console.log(`Wrote ${all.length} templates to scripts/templates.json`);
} else {
  for (const t of all) console.log([t.id, t.category_name, t.title, t.keep_users_color, t.thumb].join(" | "));
  console.log(`${all.length} templates`);
}
