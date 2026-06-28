#!/usr/bin/env node
/* Proxima Trail — frozen-three guard.
 * Extracts the zero-diff functions by brace-matching (string/comment-aware), md5s each.
 *   node scripts/frozen.js                         -> print current md5s (to seed the baseline)
 *   node scripts/frozen.js --check baseline.json   -> FAIL LOUD on drift or missing function
 * Seed once:  node scripts/frozen.js > test/frozen-baseline.json
 * composeEnding is intentionally NOT here — it is golden-locked via the endings_golden harness.
 */
const fs = require("fs"), crypto = require("crypto");
const FROZEN = ["applyOutcome", "resolveCheck", "tryCompose"];
const src = fs.readFileSync("game.js", "utf8").replace(/\r\n?/g, "\n");  // EOL-normalize: md5 stable across Windows(CRLF) + CI(LF)

function bodyAt(name) {
  const re = new RegExp(
    "(?:function\\s+" + name + "\\s*\\(" +
    "|(?:var|let|const)\\s+" + name + "\\s*=\\s*function\\b" +
    "|\\b" + name + "\\s*=\\s*function\\b" +
    "|\\b" + name + "\\s*\\([^)]*\\)\\s*\\{)"
  );
  const m = re.exec(src); if (!m) return null;
  let i = src.indexOf("{", m.index); if (i < 0) return null;
  let depth = 0, inS = null, esc = false, line = false, block = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j], n = src[j + 1];
    if (line)  { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; j++; } continue; }
    if (inS)   { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === inS) inS = null; continue; }
    if (c === "/" && n === "/") { line = true; j++; continue; }
    if (c === "/" && n === "*") { block = true; j++; continue; }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return null;
}

const cur = {}, missing = [];
for (const n of FROZEN) {
  const b = bodyAt(n);
  if (b == null) missing.push(n);
  else cur[n] = crypto.createHash("md5").update(b).digest("hex");
}
if (missing.length) { console.error("FROZEN FAIL: function(s) not found: " + missing.join(", ")); process.exit(1); }

const args = process.argv.slice(2);
if (args[0] === "--check") {
  let base;
  try { base = JSON.parse(fs.readFileSync(args[1], "utf8")); }
  catch (e) { console.error("FROZEN FAIL: cannot read baseline " + args[1]); process.exit(1); }
  const drift = [];
  for (const n of FROZEN) if (base[n] !== cur[n]) drift.push("  " + n + ": " + base[n] + " -> " + cur[n]);
  if (drift.length) { console.error("FROZEN DRIFT:\n" + drift.join("\n")); process.exit(1); }
  console.log("frozen-three intact (" + FROZEN.join(", ") + ")");
} else {
  console.log(JSON.stringify(cur, null, 2));
}
