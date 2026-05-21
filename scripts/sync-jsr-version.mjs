import { readFile, writeFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const jsr = JSON.parse(await readFile("jsr.json", "utf8"));

if (jsr.version !== pkg.version) {
  jsr.version = pkg.version;
  await writeFile("jsr.json", JSON.stringify(jsr, null, 2) + "\n");
  console.log(`synced jsr.json version → ${pkg.version}`);
}
