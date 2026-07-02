# Decision Ledger

Every fork this run: options considered, choice, Devil's Advocate verdict,
orchestrator ruling where a dispute was adjudicated. Derived from plan-events.jsonl.

## F-A  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — Grid minmax(0,1fr) + internal log scroll is the canonical fit pattern; harder options pay negative (scale blurs text/breaks touch targets; accordion adds logic).

## F-B  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — dvh is the purpose-built primitive for the iOS URL-bar bug, broad support since 2023, graceful vh fallback; JS path barred by presentation-only anyway.

## F-C  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — Grid-pinned commands keep log+actions co-visible with zero markup reorder and no toggle state; sticky/fixed have iOS toolbar quirks; tabs hide one of the two things that must both be visible.

## F-D  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — Single-emission .bridge scoping is sufficient and safest; a class hook crosses the logic line for no added isolation.

## F-F  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — Node static harness keeps the gate dependency-free; constructs-not-pixels blind spot closed by mandatory live screenshots.

## F-E  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **OVERTURN** — Global 44px min-height is cheap-flavored: monotonic-floor argument is false for layout (min-height bumps can force wraps/overflow/blown row math on flex-grid rows of two screens this phase never visually verifies); node harness blind + zero markup diff proves nothing about CSS reflow. → now **E1 travel-only, UNLESS colony+voyage <=900px screenshots are added to the DoD evidence**
- Orchestrator ruling: Keep E2 (global 44px floor) WITH the DA's condition satisfied: colony and voyage <=900px live screenshots become mandatory DoD evidence alongside the travel screenshots. — The DA's overturn was conditional; the condition (real layout evidence for the two unverified screens) costs two extra screenshots in an evidence pass the orchestrator is already running. Accessibility payoff retained, blast radius now verified instead of argued.

## F-G  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — G1 conditional kills the redundant travel line, preserves non-redundant title info, CSS-only, honest degradation path; premise gated on real 390x844 evidence
- Orchestrator ruling: T1.4 premise gate FAILED at 390x844: chips visible (3/3) but vs-foot (distance readout) clipped 92px below the capped viewscreen (bottom 322 vs viewscreen 230). G1 must not ship - executor flips to G3 (delete the :has(.bridge) hide; keep the one-line ellipsis floor). — Per the plan conditional: hiding the topbar line when the viewscreen copy does not survive would delete the only remaining distance readout on mobile travel.

## F-H  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — H3 is the more-work option chosen because each cheaper single mechanism is non-deterministic; H4 rightly rejected for gambling a hard AC

## F-I  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — Uniform shared-grid fix is correct (defect is in the shared grid, reproduces at all 3 call sites); voyage-only would be partial repair in a scoping costume; all 3 sites screenshot-verified

## F-J  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — One authoritative layout pinner; unpinned :has() rule would invite silent regression with no gate failure

## FORK-D1b  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — Both single-lever options proven insufficient against immovable touch floors; combining is the minimum change clearing the 150px target; raising the log floor directly rightly declined (threatens the phase-1 no-page-scroll guarantee).

## F-K  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — 4a lands the number in the one location with measured 3/3 survival, reusing existing expressions; 4b is a pixel gamble against evidence; 4c needlessly escalates a fork with a proven answer.

## F-L  (? · ?)
- Options: 
- Chosen: **?** — 
- DA verdict: **UPHOLD** — Mobile-only chip avoids a 40px-apart duplicate on desktop and avoids churning a working element; least-work and correct coincide.

## F-SETUP-1  (plan · 2026-07-01T22:21:47-04:00)
- Options: Render orchestration dashboard to docs/dashboard.html per skill default (overwrites the curated game changelog dashboard), Set ORCH_DOCS_DIR=docs/orchestration so event log / heartbeat / orchestration dashboard live beside, not over, the curated one
- Chosen: **docs/orchestration via the ORCH_DOCS_DIR env seam** — docs/dashboard.html is a CLAUDE.md-protected curated artifact (game changelog + milestone status); the skill adopt-never-overwrite law forbids clobbering it. The env seam is provided by the script itself, zero code modification. Not the cheap path (cheap = let it overwrite); chosen for correctness.
- DA verdict: **UPHOLD** — S2 is the non-cheap, correct path: protects the curated dashboard via a zero-code env seam.

## None  (? · 2026-07-02T08:51:36-04:00)
- Options: a, b, c
- Chosen: **?** — Neither mechanism alone reaches the ~150px log target (a: ~120px, b: ~124-140px); c clears it with margin (~188px by arithmetic). Splitting the reclaim keeps each cost moderate: stations keep internal scroll and a 96px floor (header + ~2 rows visible before scrolling), and the commands compression only trims paddings/gaps/font — the 44/48px touch floors are untouched and the harness now pins the 48px primary floor so compression can never silently eat the touch target. Cheap-vs-right, honestly: the CHEAPEST fix was (a) alone with a brutal cap (~10vh) — rejected because it buries the crew/supply glance to buy the last 30px; the 'rightest' fix would let the log row participate directly in the bridge slack (e.g. raising the minmax log floor), but the bridge console row is minmax(min-content,1fr) — a bigger log floor inflates min-content and risks re-opening page scroll on shorter phones (<=700px tall), gambling the Phase-1 no-scroll guarantee, which a remediation must not do. c stays entirely inside the plan's existing internal-scroll pattern and the <=900px block. VERIFICATION HONESTY: this executor has no browser; the ~188px figure is arithmetic from the orchestrator's measured numbers, and the orchestrator's T4.3 evidence pass owns confirming log >= ~150px live. Also shipped in the same commit, per the coordinator's direction and plan T1.4 (not part of this fork): the G3 flip — the #crt:has(.bridge) #topbar-status display:none rule deleted, ellipsis floor kept, harness (h2) now REQUIRES the hide's absence, dashboard/Addendum record the fallback.
- DA verdict: **MISSING** ← undisclosed-to-DA fork; audit gap
