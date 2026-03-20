# Exploration: game-2048 Codebase + 502 Root Cause

**Date**: 2026-03-20 | **Scope**: Medium | **Status**: Complete

## 1. Foundation (What exists)

**Tech stack**: React 19.2, Vite 8.0, JavaScript (no TypeScript), ESLint 9
**Architecture**: Single-page React app — minimal component tree, all game logic in one custom hook
**Entry point**: `index.html` -> `src/main.jsx` -> `src/App.jsx` (consumes `src/useGame.js`)
**No CLAUDE.md**: No project-specific instructions found.

### Key files
| File | Role |
|------|------|
| `src/useGame.js` | All game logic: grid state, move engine, score, win/loss, history |
| `src/App.jsx` | UI rendering, keyboard/touch input, ScoreHistory sidebar |
| `src/App.css` | All component styles (720px max-width, CSS grid layout, responsive) |
| `src/index.css` | Base resets only |
| `vite.config.js` | Vite + React plugin; `base` + `port: 5173` + `strictPort: true` |

### Proxy chain (browser → Vite)

```
Browser
  → nginx :80   (/code/* strips prefix → localhost:8080/)
  → code-server :8080  (/ports/5173/* → localhost:5173/)
  → Vite dev server :5173  (base: /code/ports/5173/)
```

**nginx config** (`/etc/nginx/conf.d/code-editor.conf`):
```nginx
location /code/ {
  proxy_pass http://localhost:8080/;
}
```

**code-server** (VS Code web IDE, PID 7121) on port 8080 provides a built-in port proxy:
any request to `/ports/XXXX/path` is forwarded to `localhost:XXXX/path`.
There is NO direct external access to port 5173 — everything goes through this chain.

---

## 2. Patterns (How it's built)

### Game logic (`useGame.js`)
- **Grid**: 4x4, cells are `{ value, state }` where `state` is `'idle' | 'new' | 'merged'`
- **Move algorithm**: Rotate grid to canonical orientation → slide all rows left (`slideLeft`) → rotate back
- **Tile spawn**: `addRandomTile` — 90% chance `2`, 10% chance `4`; sets `state: 'new'`
- **Win**: any cell reaches 2048; "Keep going" sets `keepPlaying=true`
- **History**: recorded on win/loss (in `move()`) and on `restart()` if score > 0; capped at 20 entries in `2048-history` localStorage key; `gameSaved` ref prevents duplicates

### localStorage keys
| Key | Contents |
|-----|----------|
| `2048-grid` | Serialized grid (value only, state reset to idle) |
| `2048-score` | Current score |
| `2048-status` | `'playing' \| 'won' \| 'lost'` |
| `2048-keep-playing` | Boolean |
| `2048-best` | Best score ever |
| `2048-history` | JSON array of `{ score, date (ISO), won }`, max 20 |

### Component pattern (`App.jsx`)
- `App` + `Tile` + `ScoreHistory` — inline, no separate files
- `ScoreHistory` receives `history[]` from `useGame()`, renders scrollable ranked list
- Layout: `.game-layout` CSS grid (game column + 220px sidebar), collapses at 580px

---

## 3. Constraints (What limits decisions)

**Technical**:
- No TypeScript — plain JS throughout
- No test framework installed
- Port 5173 is the **only valid port** — hardcoded in `base` and proxy path; `strictPort: true` enforces this
- `allowedHosts: true` required — requests arrive with CloudFront hostname

**502 Root Cause & Fix**:
- **Cause**: Without `port`/`strictPort`, Vite silently bumped to 5174 when 5173 was held by a stale process. The code-server proxy at `/ports/5173/` still hit the wrong process → 502.
- **Fix** (committed `51678ad`): `port: 5173, strictPort: true` — Vite fails loudly instead of migrating silently.
- **If 502 recurs**: `lsof -i :5173` → kill stale PID → `npm run dev`

**Quality**: No test suite. ESLint is the only quality gate (`npm run lint`).

---

## 4. Reusability (What to leverage)

- `slideLeft` (`useGame.js:36`) — pure function, well-isolated
- `applyMove` (`useGame.js:70`) — pure (grid in, `{ grid, score, moved }` out)
- `loadHistory`/`saveHistory`/`recordEntry` pattern — mirrors `loadState`/`saveState`; reuse for any new persistence needs
- `TILE_COLORS` (`App.jsx:5`) — extend for tiles beyond 2048

---

## 5. Handoff

**For CODE**:
- Dev server: `npm run dev` (requires port 5173 free; kill stale Vite with `kill $(lsof -ti:5173)`)
- Lint: `npm run lint`
- Build: `npm run build`

**For COMMIT**: No pre-commit hooks; `npm run lint` is the only gate.

**Gaps**:
- No process manager — stale Vite processes will recur if `npm run dev` is backgrounded without cleanup
- No test suite
- Two Vite processes currently running (PIDs 72362 on 5174, 73752 on 5173) — the 5174 one is orphaned from an earlier session
