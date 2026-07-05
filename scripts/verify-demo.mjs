import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const runImprove = process.env.RUN_IMPROVE === "1";
const runDestructiveForget = process.env.RUN_DESTRUCTIVE_FORGET === "1";

const presets = [
  { name: "LLMConfig import fails", expectedIssue: "#3774" },
  { name: "deadlock retry inconsistent", expectedIssue: "#3757" },
  { name: "API router error responses", expectedIssue: "#3748" },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runPreset(page, preset) {
  let proofText = "";
  let firstEvidence = "";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.getByRole("button", { name: preset.name }).click();
    await page.waitForFunction(
      (expectedIssue) => document.querySelector(".evidence")?.textContent?.includes(expectedIssue),
      preset.expectedIssue,
      { timeout: 60_000 },
    );
    proofText = await page.locator(".proof-panel").innerText();
    firstEvidence = await page.locator(".evidence").first().innerText();

    if (proofText.includes("RECALL USED\nyes") && firstEvidence.includes("Cognee")) {
      break;
    }
  }

  assert(firstEvidence.includes(preset.expectedIssue), `${preset.name} did not cite ${preset.expectedIssue} first`);
  assert(proofText.includes("CHUNKS"), `${preset.name} did not show CHUNKS recall mode`);
  assert(proofText.includes("RECALL USED\nyes"), `${preset.name} did not use live Cognee recall`);
  assert(firstEvidence.includes("Cognee"), `${preset.name} evidence was not labeled as Cognee`);

  return { preset: preset.name, proofText, firstEvidence };
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.innerText.includes("connected"), null, { timeout: 30_000 });

  const results = [];
  for (const preset of presets) {
    results.push(await runPreset(page, preset));
  }

  if (runImprove) {
    await page.locator(".evidence button").first().click();
    await page.waitForFunction(
      () =>
        document.body.innerText.includes("triage refreshed") ||
        document.body.innerText.includes("Improve unavailable"),
      null,
      { timeout: 60_000 },
    );
  }

  if (runDestructiveForget) {
    await page.getByRole("button", { name: "Forget Dataset" }).click();
    await page.waitForFunction(
      () => document.body.innerText.includes("seed fallback disabled until ingest is run again"),
      null,
      { timeout: 60_000 },
    );
    await page.getByRole("button", { name: "Run Triage" }).click();
    await page.waitForFunction(() => document.body.innerText.includes("Seed fallback disabled"), null, {
      timeout: 60_000,
    });
    assert((await page.locator(".evidence").count()) === 0, "Forget validation still showed evidence");
  }

  console.log(
    JSON.stringify(
      {
        baseUrl,
        presets: results.map((result) => result.preset),
        improveChecked: runImprove,
        destructiveForgetChecked: runDestructiveForget,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
