#!/usr/bin/env python3
"""Sole writer of docs/plan-events.jsonl. Every event also refreshes docs/heartbeat.txt.

Usage:
  python log_event.py --type note --actor orchestrator \
      --data '{"tag":"decision","title":"...","body":"..."}'
  python log_event.py --type heartbeat --actor orchestrator --data '{"detail":"phase 2 executing"}'

Rules this script enforces:
- Append-only. Never truncates, never rewrites.
- Atomic-ish append with an exclusive lock (Windows msvcrt / POSIX fcntl) so parallel
  invocations cannot interleave partial lines.
- Timestamps are added here, not by callers.
"""
import argparse, json, os, sys, datetime, pathlib

DOCS = pathlib.Path(os.environ.get("ORCH_DOCS_DIR", "docs"))
LOG = DOCS / "plan-events.jsonl"
HEARTBEAT = DOCS / "heartbeat.txt"

VALID_TYPES = {
    "north_star", "phase_def", "task_done", "phase_status", "note", "fork",
    "da_verdict", "orchestrator_ruling", "gate", "audit", "divergence",
    "escalation", "heartbeat", "closeout",
}
VALID_ACTORS = {
    "orchestrator", "planner", "plan-reviewer", "devils-advocate", "executor",
    "auditor", "reverse-intent", "reconciler", "human",
}


def _locked_append(path: pathlib.Path, line: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(f.fileno(), msvcrt.LK_LOCK, 1)
                f.write(line)
                f.flush()
                f.seek(0, 2)
                # unlock requires seeking back to the locked byte; safest is to
                # rely on close() releasing the region on Windows.
            else:
                import fcntl
                fcntl.flock(f, fcntl.LOCK_EX)
                f.write(line)
                f.flush()
                fcntl.flock(f, fcntl.LOCK_UN)
        except OSError:
            # Lock unavailable is worse than an unlocked append only if two
            # writers race; still append rather than silently dropping history.
            f.write(line)
            f.flush()


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--type", required=True, choices=sorted(VALID_TYPES))
    p.add_argument("--actor", required=True, choices=sorted(VALID_ACTORS))
    p.add_argument("--data", default="{}", help="JSON payload for the event")
    a = p.parse_args()

    try:
        payload = json.loads(a.data)
        if not isinstance(payload, dict):
            raise ValueError("payload must be a JSON object")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"REJECTED: --data is not a JSON object: {e}", file=sys.stderr)
        return 2

    event = {
        "ts": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
        "type": a.type,
        "actor": a.actor,
        **payload,
    }
    _locked_append(LOG, json.dumps(event, ensure_ascii=False) + "\n")

    # Heartbeat refresh on EVERY event — liveness is a side effect of activity.
    HEARTBEAT.parent.mkdir(parents=True, exist_ok=True)
    HEARTBEAT.write_text(event["ts"] + "\n", encoding="utf-8")
    print(f"logged {a.type} @ {event['ts']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
