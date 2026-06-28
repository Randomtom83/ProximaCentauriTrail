#!/usr/bin/env python3
"""Proxima Trail — local handoff bootstrap.

Run once after downloading the repo:

    python handoff.py

It (1) restores the private/dev files from docs/to-be-deleted/ back to their normal
working locations (CLAUDE.md -> repo root, the dev docs + screenshots -> docs/), so a
local Claude Code session auto-loads the project memory, then (2) serves the game at
http://localhost:8000 and opens it in your browser.

Cross-platform (Windows / macOS / Linux). Re-running is safe — restore steps are skipped
if already done. Pass --no-serve to only restore, or --port N to change the port.
"""
import argparse
import os
import shutil
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STAGE = ROOT / "docs" / "to-be-deleted"

# (source relative to STAGE) -> (destination relative to ROOT)
MOVES = [
    ("CLAUDE.md", "CLAUDE.md"),
    ("proxima-trail-implementation-plan.md", "docs/proxima-trail-implementation-plan.md"),
    ("dashboard.html", "docs/dashboard.html"),
    ("consequence-ledger.md", "docs/consequence-ledger.md"),
    ("ui-inventory.md", "docs/ui-inventory.md"),
    ("screenshots", "docs/screenshots"),
]


def restore():
    if not STAGE.exists():
        print("• Nothing to restore (docs/to-be-deleted/ not present) — layout already normal.")
        return
    moved = 0
    for src_rel, dst_rel in MOVES:
        src, dst = STAGE / src_rel, ROOT / dst_rel
        if not src.exists():
            continue
        if dst.exists():
            print(f"  skip  {dst_rel} already in place")
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dst))
        print(f"  moved {src_rel}  ->  {dst_rel}")
        moved += 1
    # remove the staging folder if it is now empty
    try:
        if STAGE.exists() and not any(STAGE.iterdir()):
            STAGE.rmdir()
            print("• Removed empty docs/to-be-deleted/.")
    except OSError:
        pass
    print(f"• Restore complete ({moved} item(s) moved). CLAUDE.md at the repo root enables "
          f"project memory for a local Claude Code session.")


def serve(port):
    import http.server
    import socketserver
    os.chdir(ROOT)
    handler = http.server.SimpleHTTPRequestHandler
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            url = f"http://localhost:{port}"
            print(f"\n▶ Serving Proxima Trail at {url}  (Ctrl+C to stop)")
            try:
                webbrowser.open(url)
            except Exception:
                pass
            httpd.serve_forever()
    except OSError as e:
        print(f"\n! Could not bind port {port}: {e}\n  Try:  python handoff.py --port 8080")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n• Server stopped.")


def main():
    ap = argparse.ArgumentParser(description="Restore the dev layout and host Proxima Trail.")
    ap.add_argument("--no-serve", action="store_true", help="restore files only, do not start the server")
    ap.add_argument("--port", type=int, default=8000, help="port for the local server (default 8000)")
    args = ap.parse_args()

    print("Proxima Trail — local handoff\n" + "-" * 30)
    restore()
    if args.no_serve:
        print("\n• --no-serve: skipping the web server. Start it later with: python handoff.py")
        return
    serve(args.port)


if __name__ == "__main__":
    main()
