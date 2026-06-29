#!/usr/bin/env node
/* ============================================================================
   AgenticOS/graphify.js — the graphify pipeline step.

   Single source of truth: AgenticOS/graph-state.json. From it this script:
     1) rewrites the GRAPH-DATA block inside AgenticOS/index.html (only the
        `const GRAPH = {...};` assignment between the markers — both comment
        markers are preserved, and the inline <script> stays valid JS);
     2) writes docs/remediation-graph.md (a Mermaid graph + per-track tables);
     3) writes ObsidianVault/ — an index MOC note + one note per graph node.

   Run from anywhere:  node AgenticOS/graphify.js
   Paths resolve from __dirname, not cwd. Idempotent — re-running reproduces
   the same outputs (modulo the local date stamp).
   ============================================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const HERE = __dirname;                          // .../AgenticOS
const ROOT = path.resolve(HERE, "..");           // repo root
const STATE_FILE = path.join(HERE, "graph-state.json");
const HTML_FILE = path.join(HERE, "index.html");
const DOCS_MD = path.join(ROOT, "docs", "remediation-graph.md");
const VAULT = path.join(ROOT, "ObsidianVault");

// ---- local date stamp (YYYY-MM-DD, LOCAL time, not UTC) ----
function localYMD(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
const TODAY = localYMD(new Date());

// ---- track + state vocab (kept in sync with index.html's renderer) ----
const TRACK_LABEL = {
  PIPE: "pipeline", INT: "milestone",
  A: "Track A · code", B: "Track B · UX", C: "Track C · design",
};
const TRACK_ORDER = ["PIPE", "INT", "A", "B", "C"];
const STATE_ORDER = ["done", "active", "pending", "fenced", "deferred"];
const STATE_COLOR = {
  done: "#46f0a6", active: "#5fd8ff", pending: "#3f86e0",
  fenced: "#ff4d5e", deferred: "#46588a",
};

// ---- load + validate state ----
const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
if (!Array.isArray(state.nodes) || !Array.isArray(state.edges)) {
  console.error("graphify FAIL: graph-state.json missing nodes/edges arrays");
  process.exit(1);
}
state.meta = state.meta || {};
state.meta.generated = TODAY;                    // stamp the real local date
const NODES = state.nodes;
const EDGES = state.edges;
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

// sanity: every edge endpoint must resolve (a dangling edge would crash the viewer's filter silently)
for (const e of EDGES) {
  if (!byId[e.s] || !byId[e.t]) {
    console.error("graphify FAIL: edge references unknown node: " + e.s + " -> " + e.t);
    process.exit(1);
  }
}

/* ---------------------------------------------------------------------------
   1) Rewrite the GRAPH-DATA block in index.html
   Replace ONLY the assignment between `const GRAPH =` and `/* GRAPH-DATA-END `.
   Both comment markers stay; JSON is valid JS, so node --check still passes.
   --------------------------------------------------------------------------- */
function rewriteHtml() {
  const src = fs.readFileSync(HTML_FILE, "utf8");
  const startTok = "const GRAPH =";
  const endTok = "/* GRAPH-DATA-END */";
  const startIdx = src.indexOf(startTok);
  const endIdx = src.indexOf(endTok);
  if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
    console.error("graphify FAIL: GRAPH-DATA markers not found in index.html");
    process.exit(1);
  }
  const json = JSON.stringify({ meta: state.meta, nodes: NODES, edges: EDGES }, null, 2);
  const block = "const GRAPH = " + json + ";\n\n";
  const out = src.slice(0, startIdx) + block + src.slice(endIdx);
  fs.writeFileSync(HTML_FILE, out);
  return out;
}

/* ---------------------------------------------------------------------------
   2) docs/remediation-graph.md — Mermaid graph + per-track tables
   --------------------------------------------------------------------------- */
function mermaidId(id) { return id.replace(/[^A-Za-z0-9_]/g, "_"); } // mermaid-safe node id

function writeDocsMd() {
  const L = [];
  L.push("# Proxima Trail — Remediation Graph");
  L.push("");
  L.push("> Generated " + TODAY + " by `AgenticOS/graphify.js` from `AgenticOS/graph-state.json`. Do not hand-edit — edit the state file (or the roadmap) and re-run `node AgenticOS/graphify.js`.");
  L.push("");
  L.push("- **Branch:** `" + (state.meta.branch || "—") + "`");
  if (state.meta.audit) L.push("- **Audit:** " + state.meta.audit);
  const items = NODES.filter((n) => n.kind === "item");
  const done = items.filter((n) => n.state === "done").length;
  const denom = items.filter((n) => n.state !== "deferred").length;
  L.push("- **Progress:** " + done + " / " + denom + " items done (excluding deferred)");
  L.push("");

  // ---- Mermaid ----
  L.push("```mermaid");
  L.push("flowchart TD");
  for (const n of NODES) {
    const shapeOpen = n.kind === "agent" ? "([" : "[";
    const shapeClose = n.kind === "agent" ? "])" : "]";
    L.push("  " + mermaidId(n.id) + shapeOpen + '"' + n.label + '"' + shapeClose + ":::" + n.state);
  }
  for (const e of EDGES) {
    const arrow = e.type === "loop" ? "-.->" : e.type === "same" ? "---" : "-->";
    const lbl = "|" + e.type + "|";
    L.push("  " + mermaidId(e.s) + " " + arrow + lbl + " " + mermaidId(e.t));
  }
  for (const s of STATE_ORDER) {
    L.push("  classDef " + s + " fill:" + STATE_COLOR[s] + "22,stroke:" + STATE_COLOR[s] + ",color:#d8e6ff;");
  }
  L.push("```");
  L.push("");

  // ---- per-track tables ----
  for (const tr of TRACK_ORDER) {
    const rows = NODES.filter((n) => n.track === tr);
    if (!rows.length) continue;
    L.push("## " + (TRACK_LABEL[tr] || tr));
    L.push("");
    L.push("| id | label | state | owner | sha | note |");
    L.push("|----|-------|-------|-------|-----|------|");
    for (const n of rows) {
      const cell = (s) => String(s == null || s === "" ? "—" : s).replace(/\|/g, "\\|");
      L.push("| `" + n.id + "` | " + cell(n.label) + " | " + cell(n.state) + " | " +
        cell(n.owner) + " | " + (n.sha ? "`" + n.sha + "`" : "—") + " | " + cell(n.note) + " |");
    }
    L.push("");
  }

  fs.mkdirSync(path.dirname(DOCS_MD), { recursive: true });
  fs.writeFileSync(DOCS_MD, L.join("\n"));
}

/* ---------------------------------------------------------------------------
   3) ObsidianVault/ — index MOC + one note per node, YAML frontmatter dated TODAY
   --------------------------------------------------------------------------- */
function neighbors(id) {
  const out = [], inc = [];
  for (const e of EDGES) {
    if (e.s === id) out.push({ id: e.t, type: e.type });
    if (e.t === id) inc.push({ id: e.s, type: e.type });
  }
  return { out, inc };
}

function writeVault() {
  fs.mkdirSync(VAULT, { recursive: true });
  // clean stale notes graphify owns (*.md in the vault root) so the count stays exact
  for (const f of fs.readdirSync(VAULT)) {
    if (f.endsWith(".md")) fs.unlinkSync(path.join(VAULT, f));
  }

  // ---- per-node notes ----
  for (const n of NODES) {
    const { out, inc } = neighbors(n.id);
    const fm = [
      "---",
      "id: " + n.id,
      'label: "' + n.label + '"',
      "kind: " + n.kind,
      "track: " + n.track,
      "state: " + n.state,
      'owner: "' + (n.owner || "—") + '"',
      "sha: " + (n.sha ? n.sha : '""'),
      "date: " + TODAY,
      "tags: [proxima-trail, remediation, track-" + n.track.toLowerCase() +
        ", state-" + n.state + ", kind-" + n.kind + "]",
      "---",
      "",
    ];
    const body = [
      "# " + n.label + "  (`" + n.id + "`)",
      "",
      "- **State:** " + n.state,
      "- **Track:** " + (TRACK_LABEL[n.track] || n.track),
      "- **Owner:** " + (n.owner || "—"),
      "- **SHA:** " + (n.sha ? "`" + n.sha + "`" : "—"),
      "",
      "## Notes",
      "",
      n.note || "—",
      "",
      "## Links",
      "",
    ];
    if (out.length) out.forEach((e) => body.push("- → [[" + e.id + "]] _(" + e.type + ")_"));
    if (inc.length) inc.forEach((e) => body.push("- ← [[" + e.id + "]] _(" + e.type + ")_"));
    if (!out.length && !inc.length) body.push("- _(no links)_");
    body.push("");
    body.push("---");
    body.push("_Generated " + TODAY + " by AgenticOS/graphify.js from graph-state.json._");
    fs.writeFileSync(path.join(VAULT, n.id + ".md"), fm.join("\n") + body.join("\n") + "\n");
  }

  // ---- index MOC ----
  const items = NODES.filter((n) => n.kind === "item");
  const done = items.filter((n) => n.state === "done").length;
  const denom = items.filter((n) => n.state !== "deferred").length;
  const idx = [
    "---",
    'title: "Proxima Trail — Remediation Graph"',
    "date: " + TODAY,
    "branch: " + (state.meta.branch || "—"),
    "tags: [proxima-trail, remediation, index, MOC]",
    "---",
    "",
    "# Proxima Trail — Remediation Graph (MOC)",
    "",
    "Generated " + TODAY + " from `AgenticOS/graph-state.json` by `AgenticOS/graphify.js`. " +
      "Open the live viewer at `AgenticOS/index.html`; the Mermaid mirror is `docs/remediation-graph.md`.",
    "",
    "**Progress:** " + done + " / " + denom + " items done (excluding deferred). " +
      "**Nodes:** " + NODES.length + ".",
  ];
  if (state.meta.audit) idx.push("", "> " + state.meta.audit);
  idx.push("", "## Pipeline", "", "[[planner]] → [[builder]] → [[gate]] → [[auditor]] ↺ (loop back to [[planner]])", "");
  for (const tr of TRACK_ORDER) {
    const rows = NODES.filter((n) => n.track === tr);
    if (!rows.length) continue;
    idx.push("## " + (TRACK_LABEL[tr] || tr), "");
    for (const n of rows) {
      idx.push("- [[" + n.id + "]] — **" + n.state + "** — " + (n.label || n.id) +
        (n.owner && n.owner !== "—" ? " _(" + n.owner + ")_" : ""));
    }
    idx.push("");
  }
  fs.writeFileSync(path.join(VAULT, "index.md"), idx.join("\n") + "\n");
}

// ---- run ----
rewriteHtml();
writeDocsMd();
writeVault();

const noteCount = fs.readdirSync(VAULT).filter((f) => f.endsWith(".md") && f !== "index.md").length;
console.log("graphify OK — " + TODAY);
console.log("  index.html GRAPH-DATA block rewritten (" + NODES.length + " nodes, " + EDGES.length + " edges)");
console.log("  docs/remediation-graph.md written");
console.log("  ObsidianVault/: index.md + " + noteCount + " node notes");
