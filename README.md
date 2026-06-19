# Proxima Trail

*The Oregon Trail, in space.*

Earth is dying. Humanity has one colony ship and four light-years to cross. Outfit your vessel above a
burning planet, pick your crew, and run the fixed trail from **Earth Orbit** out through the solar
system and across the **Interstellar Void** to **Proxima Centauri b** — keeping fuel in the tanks, air
in the lungs, and your people alive long enough to found a colony.

A green-phosphor terminal homage you open instantly in a browser. No install, no build step.

```
   .      *        .           ·         .     *
      ____  ____  ____ _  _ _ _  _  __ _      .
     (  _ \(  _ \(  _ ( \/ ) ( \/ )(  ( \  *
      ) __/ )   / )   /)  (/ \/ \ /    /     .
     (__)  (_)\_)(_)\_)(_/\_)\_)(_/\_)__)  .   *
              humanity's last voyage
```

## Play it

It's plain static files — no dependencies, no bundler.

- **Easiest:** open `index.html` directly in any modern browser.
- **Recommended (so audio + saves behave like a real site):**

  ```bash
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

## How to play

Every turn you **Continue** along the trail. Manage the squeeze:

- **Fuel** moves the ship · **Oxygen** and **Food** keep the crew · **Parts** repair the hull ·
  **Medicine** cures ailments · **Mining charges** power the asteroid mini-game.
- **Power is the hub.** The reactor's output scales with **hull integrity**, so old damage cascades:
  a cracked hull means less power, which means failing scrubbers, which means a slow suffocation. When
  demand beats output you **brown out** and must shed load — but turning off life support drains air,
  and turning off the drive stops you cold.
- **Thrust** (cruise / burn / overdrive) trades fuel and power for speed. **Rations** (full / reduced /
  survival) trade crew health and morale for food.
- **Crew** are characters with skills, morale, and **bonds**. Low morale leads to breakdowns; a death
  hits the morale of anyone bonded to the fallen. Lose a specialist and you lose their edge in events.
- **Hibernate** crew to save air and food — essential for the long Interstellar Void — but sleepers
  can't help you thread a hazard.
- **Mine** asteroids and **trade** at stations to restock. **Rest & repair** to mend the hull and the
  crew when you can afford the time.

Reach Proxima Centauri b to win, scored Oregon-Trail-style. Ranks climb from **Castaway** to
**Founder of Proxima**. **Death is permanent** — the run autosaves so you can resume, but you can't
undo a loss.

### Keyboard
`Space`/`Enter` continue · `T` thrust · `R` rations · `P` power · `M` mine.

## Project layout

| File | Purpose |
|---|---|
| `index.html` | Screen containers, HUD, overlays |
| `style.css` | Retro CRT terminal theme |
| `game.js` | All game logic (state, power model, events, crew, scoring, save) |
| `audio.js` | Web Audio synthesized SFX (no asset files) |
| `docs/proxima-trail-implementation-plan.md` | Design + implementation plan |
| `docs/dashboard.html` | Interactive project dashboard: sprint tasks + changelog/decision log |

## Development & verification

No test framework — verification is a syntax check plus an automated browser-DOM playthrough:

```bash
node --check game.js
node --check audio.js
```

A `jsdom` harness drives full runs (title → outfit → travel → brownouts → hibernation → events → end
screen) and confirms both the win and loss paths render with no JS errors.

## Credits

Built as a tribute to *The Oregon Trail* (MECC). All art is ASCII/Unicode; all sound is synthesized at
runtime. No external assets.
