// main.ts — hands the Leonida Platinum trophy guide in.
// Copies app/ and screenshots/ from this repository to the output directory
// and writes /output/dossier.json with buildDossier from the kit's vendored
// library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
// Node 22+, standard library only; no network, no installs.

import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const appDir = join(outputDir, "app");
const screenshotsDir = join(outputDir, "screenshots");

await mkdir(appDir, { recursive: true });
await mkdir(screenshotsDir, { recursive: true });
await cp(join(repoRoot, "app"), appDir, { recursive: true });
await cp(join(repoRoot, "screenshots"), screenshotsDir, { recursive: true });

// buildDossier takes the output root (which holds app/ and screenshots/)
// and a caps object, and returns the dossier as bytes.
const dossier = await buildDossier(outputDir, { text_max_bytes: 163840 });
await writeFile(join(outputDir, "dossier.json"), dossier);
console.log(`wrote ${join(outputDir, "dossier.json")} (${dossier.length} bytes)`);
