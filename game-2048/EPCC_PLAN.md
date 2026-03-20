# Plan: Tile Appearance Animations

**Created**: 2026-03-20 | **Effort**: ~2h | **Complexity**: Simple

## 1. Objective

**Goal**: Add pop-in animation for newly spawned tiles and a pulse animation for merged tiles.
**Why**: The game currently has no visual feedback for tile events — tiles simply appear or change value. Animations make merges feel satisfying and spawns feel intentional.
**Success**:
- New tiles scale from 0 → 1.1 → 1 on spawn
- Merged tiles scale from 1 → 1.2 → 1 briefly after a merge
- Existing game behavior (score, win/loss, controls) is unchanged

---

## 2. Approach

**From EPCC_EXPLORE.md**: Grid is `number[][]` in `useGame.js`. No tile identity exists today. The `Tile` component in `App.jsx` is purely presentational (receives `value`, renders color + number).

**Strategy**: Extend grid cells from raw numbers to small objects `{ value, state }` where `state` is `'idle' | 'new' | 'merged'`. On each move, `useGame.js` computes which cells are new (just spawned) or merged (just doubled). `App.jsx` maps `state` to a CSS class. Two `@keyframes` in `App.css` handle the animations. State resets to `'idle'` on the next move so animations don't replay.

**Trade-off**: Keeping tile state inside the grid object (vs. a separate `Map<position, state>`) keeps the `useGame` API surface minimal — callers still iterate `grid.flat()` in the same way.

**Integration points**: Only `useGame.js`, `App.jsx`, and `App.css` change. No new dependencies.

---

## 3. Tasks

**Phase 1: Game logic** (~45m)
1. **Extend cell type** (15m) — Change `createEmptyGrid`, `addRandomTile`, `initGrid` to use `{ value, state }` objects instead of plain numbers. Update all grid reads/writes (`grid[r][c]` → `grid[r][c].value`). | Deps: None | Risk: L
2. **Track merged cells in `slideLeft`** (15m) — Return which output indices result from a merge so callers can mark those cells `state: 'merged'`. | Deps: Task 1 | Risk: L
3. **Mark new tile in `addRandomTile`** (10m) — Set `state: 'new'` on the spawned cell. | Deps: Task 1 | Risk: L
4. **Reset states on move entry** (5m) — At the start of each `applyMove`, set all cell states to `'idle'` so prior animation classes are cleared. | Deps: Tasks 1-3 | Risk: L

**Phase 2: UI wiring** (~30m)
5. **Update `Tile` component** (15m) — Accept `state` prop, apply `.tile--new` or `.tile--merged` CSS class accordingly. Update `App.jsx` grid render from `val` to `{ value, state }`. | Deps: Phase 1 | Risk: L
6. **Add CSS keyframes** (15m) — Add `@keyframes tileAppear` (scale 0 → 1.1 → 1) and `@keyframes tileMerge` (scale 1 → 1.2 → 1) with short durations (~150ms). Apply to `.tile--new` and `.tile--merged`. | Deps: None | Risk: L

**Total**: ~75m

---

## 4. Quality Strategy

**Validation**:
- Spawn a game, verify new tiles pop in on every move
- Force a merge (easy with two adjacent equal tiles), verify merged tile pulses
- Verify `npm run lint` passes (no new ESLint errors)
- Verify win/loss overlays still trigger correctly
- Verify "New Game" resets cleanly with no stale animation state

**Edge cases**:
- Multiple merges in one move: each merged cell should independently pulse
- Two tiles merge and result lands on a cell that is also new (can't happen — new tile spawns after merge, in a previously empty cell)
- Rapid key presses: state resets at move start, so no animation accumulation

---

## 5. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `slideLeft` refactor breaks merge logic | M | Pure function — easy to verify output manually; existing game rules are unchanged |
| Animation duration feels too fast/slow | L | Start with 150ms; trivially tunable in CSS |

**Assumptions**:
- `state` field is only used for animation — no game logic reads it
- Resetting state to `'idle'` at move start is sufficient (no need for a timed reset)

**Out of scope**: Slide movement animations, localStorage persistence, test suite setup.
