// End-to-end walk through ManeRoute in a real browser (Chrome or Edge via playwright-core).
// Uses REAL YouCam calls through the running app: a full run spends about 9 units.
//
//   npm run dev                       (in another terminal)
//   npm run e2e -- --size=phone       (or --size=laptop; add --scan-fail to exercise the texture-check error path)
//   BASE_URL=https://your-deploy.vercel.app npm run e2e
//
// Checks: landing → start (consent + upload) → pick (length runs in background) → try on two cuts →
// compare → plan (extra previews) → REFRESH restores the session without new YouCam calls →
// BACK/FORWARD stay inside the flow → card (custom question + note) → save to My plans → 404.
// Screenshots land in tests/e2e/shots/ (gitignored).
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const size = args.size || "phone";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));
const OUT = fileURLToPath(new URL("./shots/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const browserPath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && existsSync(p));
if (!browserPath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");

const vp = size === "phone" ? { width: 390, height: 844 } : { width: 1366, height: 768 };
const browser = await chromium.launch({
  executablePath: browserPath,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const ctx = await browser.newContext({ viewport: vp, isMobile: size === "phone", hasTouch: size === "phone", permissions: ["camera"] });
const page = await ctx.newPage();
const errors = [];
const youcamCalls = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
page.on("request", (r) => {
  const path = new URL(r.url()).pathname;
  if (r.method() === "POST" && /^\/api\/(photo|length|vto|extend|texture)$/.test(path)) youcamCalls.push(path);
});
let n = 0;
const shot = (name) => page.screenshot({ path: `${OUT}${size}-${String(++n).padStart(2, "0")}-${name}.png`, fullPage: true });
const step = (msg) => console.log(`· ${msg}`);
const waitForTryOn = () => page.waitForSelector(".compare", { timeout: 180000 });
const expect = (cond, msg) => {
  if (!cond) {
    errors.push(`EXPECTATION FAILED: ${msg}`);
    console.error(`✗ ${msg}`);
  }
};

step("landing");
await page.goto(BASE, { waitUntil: "networkidle" });
await shot("landing");
await page.getByRole("link", { name: "Start your route" }).first().click();
await page.waitForURL("**/consult**");

step("start: consent + photo");
await shot("start");
await page.getByRole("checkbox").check();
await page.locator("input[type=file]").setInputFiles(`${FIX}front.jpg`);
await page.getByRole("button", { name: "Use this photo" }).click();

step("pick (length check runs in the background)");
await page.getByRole("tab", { name: /^Men's/ }).click();
await shot("pick-loading");
await page.waitForSelector(".tree-row.done", { timeout: 90000 });
await page.waitForTimeout(800);
await shot("pick");

step("try on #1 (real YouCam)");
await page.getByRole("button", { name: /^Grown-out waves\./ }).click();
await page.getByRole("button", { name: "Try it on" }).click();
await page.waitForTimeout(1500);
await shot("tryon-waiting");
await waitForTryOn();
await shot("tryon-1");

step("try on #2 and compare");
await page.getByRole("button", { name: "Try another cut" }).click();
await page.getByRole("button", { name: /^Buzz cut\./ }).click();
await page.getByRole("button", { name: "Try it on" }).click();
await waitForTryOn();
await page.waitForTimeout(500);
await shot("tryon-2");
expect((await page.locator(".look-grid button.look-tile:not(.add)").count()) === 2, "both looks kept in the lookbook");

step("plan");
await page.locator(".look-grid button.look-tile", { hasText: "Grown-out waves" }).click();
await page.getByRole("button", { name: "Calculate my route" }).click();
await page.getByText("What matters to you.").waitFor();
if ("scan-fail" in args) {
  // Two copies of the front photo aren't side views: YouCam rejects them, exercising the error path.
  await page.locator("input[type=file][multiple]").setInputFiles([`${FIX}front.jpg`, `${FIX}front.jpg`]);
  await page.getByText("Texture not read.").waitFor({ timeout: 90000 });
  await shot("texture-failed");
}
await page.waitForFunction(() => !/Rendering…|Measuring your starting point/i.test(document.body.innerText), null, { timeout: 240000 });
await page.waitForTimeout(500);
await shot("plan");

step("refresh restores the session without new YouCam calls");
const before = youcamCalls.length;
await page.reload({ waitUntil: "networkidle" });
await page.getByText("What matters to you.").waitFor({ timeout: 15000 });
await page.waitForTimeout(1500);
expect(youcamCalls.length === before, `no new YouCam calls after refresh (saw ${youcamCalls.length - before})`);
await shot("plan-after-refresh");

step("back / forward stay inside the flow");
await page.goBack();
await page.waitForTimeout(600);
expect(page.url().includes("/consult"), "back stays in /consult");
expect((await page.locator(".compare").count()) === 1, "back returns to the try-on");
await page.goForward();
await page.getByText("What matters to you.").waitFor();

step("card");
await page.getByRole("button", { name: "Build the document" }).click();
await page.waitForSelector(".doc", { timeout: 30000 });
await page.getByPlaceholder("Add your own question").fill("Can we keep the sides tidy while the top grows");
await page.getByRole("button", { name: "Add", exact: true }).click();
await page.locator("#stylist-note").fill("I have a wedding in six weeks.");
await page.waitForTimeout(1200);
await shot("card");
await page.getByRole("button", { name: "Share" }).waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "Save to My plans" }).click();
await page.getByText("Saved to My plans").waitFor();

step("my plans + 404");
await page.goto(`${BASE}/plans`, { waitUntil: "networkidle" });
await shot("plans");
await page.locator(".archive-row").first().click();
await page.waitForTimeout(800);
await shot("saved-document");
await page.goto(`${BASE}/nowhere`, { waitUntil: "networkidle" });
await shot("not-found");

await browser.close();
console.log(`YouCam-spending requests: ${youcamCalls.length} (${[...new Set(youcamCalls)].join(", ")})`);
if (errors.length) {
  console.error("Problems:\n" + errors.join("\n"));
  process.exit(1);
}
console.log(`✓ ${size} flow passed. Screenshots in tests/e2e/shots/`);
