#!/usr/bin/env python3
"""Render docs/plan-events.jsonl into human artifacts. The jsonl is truth; these are views.

  python render_dashboard.py             -> docs/dashboard.html
  python render_dashboard.py --ledger    -> docs/decision-ledger.md   (mandatory end of full-auto)
  python render_dashboard.py --closeout  -> docs/closeout.md + closeout section in dashboard

Self-contained output, no dependencies. Style is intentionally plain; the information model
(north star, phases/milestones/tasks + DoD, tagged veer log, progress, next-up, stale badge)
is the contract. Restyle freely — never change what information is shown.
"""
import argparse, datetime, html, json, os, pathlib

DOCS = pathlib.Path(os.environ.get("ORCH_DOCS_DIR", "docs"))
LOG = DOCS / "plan-events.jsonl"
HEARTBEAT = DOCS / "heartbeat.txt"
STALE_MIN = 20


def load_events():
    if not LOG.exists():
        return []
    out = []
    for line in LOG.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            out.append({"ts": "?", "type": "corrupt_line", "raw": line[:200]})
    return out


def build_state(events):
    s = {"north": None, "phases": {}, "order": [], "notes": [], "forks": {},
         "divergences": {}, "escalations": [], "closeout": None, "gates": [], "audits": []}
    for e in events:
        t = e.get("type")
        if t == "north_star":
            s["north"] = e
        elif t == "phase_def":
            pid = e.get("phase_id")
            if pid not in s["phases"]:
                s["order"].append(pid)
            s["phases"][pid] = {"def": e, "done": set(), "status": "planned"}
        elif t == "task_done":
            p = s["phases"].get(e.get("phase_id"))
            if p:
                p["done"].add(e.get("task_id"))
        elif t == "phase_status":
            p = s["phases"].get(e.get("phase_id"))
            if p:
                p["status"] = e.get("status", "?")
        elif t == "note":
            s["notes"].append(e)
        elif t == "fork":
            s["forks"][e.get("fork_id")] = {"fork": e, "verdict": None, "ruling": None}
        elif t == "da_verdict":
            f = s["forks"].setdefault(e.get("fork_id"), {"fork": None, "verdict": None, "ruling": None})
            f["verdict"] = e
        elif t == "orchestrator_ruling":
            f = s["forks"].setdefault(e.get("fork_id"), {"fork": None, "verdict": None, "ruling": None})
            f["ruling"] = e
        elif t == "divergence":
            s["divergences"][e.get("divergence_id")] = e
        elif t == "escalation":
            s["escalations"].append(e)
        elif t == "gate":
            s["gates"].append(e)
        elif t == "audit":
            s["audits"].append(e)
        elif t == "closeout":
            s["closeout"] = e
    return s


def progress(state):
    total = done = 0
    for pid in state["order"]:
        p = state["phases"][pid]
        for m in p["def"].get("milestones", []):
            for t in m.get("tasks", []):
                total += 1
                if t.get("id") in p["done"]:
                    done += 1
    return done, total


def next_up(state):
    for pid in state["order"]:
        p = state["phases"][pid]
        for m in p["def"].get("milestones", []):
            for t in m.get("tasks", []):
                if t.get("id") not in p["done"]:
                    return p["def"].get("name", pid), m.get("name", ""), t.get("text", t.get("id"))
    return None


def heartbeat_stale():
    if not HEARTBEAT.exists():
        return None
    try:
        ts = datetime.datetime.fromisoformat(HEARTBEAT.read_text(encoding="utf-8").strip())
        age = datetime.datetime.now().astimezone() - ts
        return age > datetime.timedelta(minutes=STALE_MIN), int(age.total_seconds() // 60)
    except ValueError:
        return None


def esc(x):
    return html.escape(str(x if x is not None else ""))


def render_dashboard(state):
    done, total = progress(state)
    pct = round(done / total * 100) if total else 0
    nxt = next_up(state)
    hb = heartbeat_stale()
    parts = ["""<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Project Dashboard</title><style>
body{background:#111;color:#e8e8e8;font-family:system-ui,sans-serif;max-width:860px;margin:0 auto;padding:2rem 1rem;line-height:1.5}
h1{font-size:19px}.muted{color:#888;font-size:13px}
.card{background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:14px 16px;margin:10px 0}
.bar{height:5px;background:#222;border-radius:3px;overflow:hidden}.fill{height:100%;background:#1D9E75}
.badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:999px;margin-left:8px;text-transform:uppercase;letter-spacing:.06em}
.b-merged{background:#0d3d2a;color:#1D9E75}.b-executing{background:#1a2d3d;color:#378ADD}.b-escalated{background:#3d1a1a;color:#e06050}
.b-planned{background:#2a2a2a;color:#999}.b-auditing{background:#3d2a14;color:#BA7517}.b-gated{background:#2d1a3d;color:#9a8fe0}
details{margin:6px 0}summary{cursor:pointer;font-weight:500}
.task{font-size:13px;padding:2px 0 2px 1.2em}.done{color:#555;text-decoration:line-through}
.note{border-bottom:1px dashed #333;padding:8px 0}.note-date{font-size:11px;color:#BA7517}
.tag{font-size:9px;padding:1px 6px;border-radius:4px;margin-left:6px;text-transform:uppercase}
.t-decision{background:#1a2d3d;color:#378ADD}.t-process{background:#2d1a3d;color:#9a8fe0}.t-gotcha{background:#3d2a14;color:#BA7517}
.t-rescope{background:#3d1a2d;color:#D85A30}.t-shipped{background:#0d3d2a;color:#1D9E75}.t-divergence{background:#3d1a1a;color:#e06050}
.stale{background:#3d1a1a;color:#ff8070;padding:8px 12px;border-radius:8px;font-weight:600}
.dod{font-size:12px;color:#888;margin:4px 0 8px 1.2em}
.fork{font-size:13px;border-left:3px solid #378ADD;padding-left:10px;margin:8px 0}
.overturn{border-left-color:#D85A30}
</style></head><body>"""]
    if hb and hb[0]:
        parts.append(f'<div class="stale">⚠ HEARTBEAT STALE — last activity {hb[1]} min ago (threshold {STALE_MIN})</div>')
    n = state["north"] or {}
    parts.append(f'<h1>Project Dashboard</h1><div class="muted">rendered {esc(datetime.datetime.now().astimezone().isoformat(timespec="seconds"))} · view of docs/plan-events.jsonl — the log is the truth</div>')
    parts.append(f'<div class="card"><b>NORTH STAR</b><div>{esc(n.get("statement","(not yet logged)"))}</div>')
    if n.get("guardrails"):
        parts.append('<div class="muted">Guardrails: ' + " · ".join(esc(g) for g in n["guardrails"]) + "</div>")
    if n.get("acceptance_criteria"):
        parts.append('<div class="muted">Done means: ' + " · ".join(esc(g) for g in n["acceptance_criteria"]) + "</div>")
    parts.append("</div>")
    parts.append(f'<div class="card"><b>{done}/{total} tasks · {pct}%</b><div class="bar"><div class="fill" style="width:{pct}%"></div></div>')
    if nxt:
        parts.append(f'<div class="muted">Next up: <b style="color:#e8e8e8">{esc(nxt[2])}</b> — {esc(nxt[0])} · {esc(nxt[1])}</div>')
    parts.append("</div>")
    if state["escalations"]:
        parts.append('<div class="card"><b>ESCALATIONS (need human)</b>')
        for e in state["escalations"]:
            parts.append(f'<div class="note"><span class="note-date">{esc(e.get("ts"))}</span> — {esc(e.get("what"))} <span class="muted">({esc(e.get("why"))})</span></div>')
        parts.append("</div>")
    # Phases
    for pid in state["order"]:
        p = state["phases"][pid]; d = p["def"]; st = p["status"]
        pt = sum(len(m.get("tasks", [])) for m in d.get("milestones", []))
        pd = len(p["done"])
        parts.append(f'<div class="card"><details open><summary>{esc(d.get("name",pid))} <span class="badge b-{esc(st)}">{esc(st)}</span> <span class="muted">{pd}/{pt}</span></summary>')
        for m in d.get("milestones", []):
            parts.append(f'<details><summary class="muted">{esc(m.get("name"))}</summary>')
            if m.get("dod"):
                parts.append('<div class="dod">DoD: ' + " · ".join(esc(x) for x in m["dod"]) + "</div>")
            for t in m.get("tasks", []):
                cls = "task done" if t.get("id") in p["done"] else "task"
                parts.append(f'<div class="{cls}">{"✔" if t.get("id") in p["done"] else "○"} {esc(t.get("text",t.get("id")))}</div>')
            parts.append("</details>")
        parts.append("</details></div>")
    # Decision & veer log (notes + forks interleaved, newest first)
    entries = []
    for note in state["notes"]:
        entries.append((note.get("ts", ""), "note", note))
    for fid, f in state["forks"].items():
        if f["fork"]:
            entries.append((f["fork"].get("ts", ""), "fork", f))
    entries.sort(key=lambda x: x[0], reverse=True)
    parts.append(f'<div class="card"><details open><summary><b>DECISION &amp; VEER LOG</b> <span class="muted">{len(entries)} entries · newest first</span></summary>')
    for ts, kind, item in entries:
        if kind == "note":
            tag = esc(item.get("tag", "decision"))
            parts.append(f'<div class="note"><span class="note-date">{esc(ts)}</span><span class="tag t-{tag}">{tag}</span><br><b>{esc(item.get("title"))}</b><div class="muted">{esc(item.get("body"))}</div></div>')
        else:
            fk = item["fork"]; v = item["verdict"]; r = item["ruling"]
            over = v and v.get("verdict") == "overturn"
            parts.append(f'<div class="note"><span class="note-date">{esc(ts)}</span><span class="tag t-decision">fork · {esc(fk.get("stage"))}</span>')
            parts.append(f'<div class="fork {"overturn" if over else ""}"><b>{esc(fk.get("fork_id"))}</b>: options {esc(", ".join(fk.get("options",[])))} → chose <b>{esc(fk.get("chosen"))}</b><div class="muted">{esc(fk.get("justification"))}</div>')
            if v:
                parts.append(f'<div class="muted">DA: <b>{esc(v.get("verdict","").upper())}</b> — {esc(v.get("reasoning"))}' + (f' → now <b>{esc(v.get("new_chosen"))}</b>' if v.get("new_chosen") else "") + "</div>")
            if r:
                parts.append(f'<div class="muted">Orchestrator ruling: {esc(r.get("ruling"))} — {esc(r.get("reasoning"))}</div>')
            parts.append("</div></div>")
    parts.append("</details></div>")
    if state["divergences"]:
        openc = sum(1 for d in state["divergences"].values() if d.get("status") == "open")
        parts.append(f'<div class="card"><b>DIVERGENCES</b> <span class="muted">{openc} open / {len(state["divergences"])} total</span>')
        for did, d in state["divergences"].items():
            parts.append(f'<div class="note"><b>{esc(did)}</b> [{esc(d.get("status"))} · {esc(d.get("severity"))}] pass {esc(d.get("pass_n"))}<div class="muted">{esc(d.get("summary"))}</div></div>')
        parts.append("</div>")
    if state["closeout"]:
        c = state["closeout"]
        parts.append(f'<div class="card"><b>CLOSEOUT</b><div>{esc(c.get("summary"))}</div><div class="muted">{esc(c.get("divergence_count"))} divergences over {esc(c.get("passes"))} reconcile pass(es)</div></div>')
    parts.append("</body></html>")
    (DOCS / "dashboard.html").write_text("\n".join(parts), encoding="utf-8")
    print(f"rendered docs/dashboard.html ({done}/{total} tasks, {len(entries)} log entries)")


def render_ledger(state):
    lines = ["# Decision Ledger", "",
             "Every fork this run: options considered, choice, Devil's Advocate verdict,",
             "orchestrator ruling where a dispute was adjudicated. Derived from plan-events.jsonl.", ""]
    forks = sorted(state["forks"].items(), key=lambda kv: (kv[1]["fork"] or {}).get("ts", ""))
    if not forks:
        lines.append("_No forks were disclosed this run — that itself is worth questioning._")
    for fid, f in forks:
        fk = f["fork"] or {}
        lines.append(f"## {fid}  ({fk.get('stage','?')} · {fk.get('ts','?')})")
        lines.append(f"- Options: {', '.join(fk.get('options', []))}")
        lines.append(f"- Chosen: **{fk.get('chosen','?')}** — {fk.get('justification','')}")
        v = f["verdict"]
        if v:
            extra = f" → now **{v.get('new_chosen')}**" if v.get("new_chosen") else ""
            lines.append(f"- DA verdict: **{v.get('verdict','?').upper()}** — {v.get('reasoning','')}{extra}")
        else:
            lines.append("- DA verdict: **MISSING** ← undisclosed-to-DA fork; audit gap")
        r = f["ruling"]
        if r:
            lines.append(f"- Orchestrator ruling: {r.get('ruling','')} — {r.get('reasoning','')}")
        lines.append("")
    (DOCS / "decision-ledger.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"rendered docs/decision-ledger.md ({len(forks)} forks)")


def render_closeout(state):
    n = state["north"] or {}
    divs = state["divergences"]
    passes = max([d.get("pass_n", 0) for d in divs.values()], default=0)
    escd = [d for d in divs.values() if d.get("status") == "escalated"]
    built = [f"- {state['phases'][pid]['def'].get('name',pid)} — {state['phases'][pid]['status']}" for pid in state["order"]] or ["- (no phases logged)"]
    dlines = [f"- **{did}** [{d.get('severity')}] {d.get('summary')} → {d.get('status')}" for did, d in divs.items()] or ["- none"]
    elines = [f"- {d.get('divergence_id')}: {d.get('summary')}" for d in escd] or ["- none"]
    lines = ["# Closeout", "",
             f"**North star:** {n.get('statement','')}", "",
             "## What got built", *built,
             "", f"## Where it diverged ({len(divs)} total, {passes} reconcile pass(es))", *dlines,
             "", "## Escalated to human", *elines,
             "", f"_Derived from plan-events.jsonl on {datetime.datetime.now().astimezone().isoformat(timespec='seconds')}_"]
    (DOCS / "closeout.md").write_text("\n".join(lines), encoding="utf-8")
    print("rendered docs/closeout.md — also log a `closeout` event and re-render the dashboard")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--ledger", action="store_true")
    p.add_argument("--closeout", action="store_true")
    a = p.parse_args()
    state = build_state(load_events())
    if a.ledger:
        render_ledger(state)
    elif a.closeout:
        render_closeout(state)
        render_dashboard(state)
    else:
        render_dashboard(state)


if __name__ == "__main__":
    main()
