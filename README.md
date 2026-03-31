# Tetris Easter Egg (React)

Lightweight overlay Tetris component for existing React projects.

## Run locally (demo)

```bash
npm install
npm run dev
```

Then open the local Vite URL (usually `http://localhost:5173`).

## What this includes

- Easy triggers: type `T E T R I S` or `M I N E S`
- Keyboard controls for basic gameplay
- Local high score persistence via `localStorage`
- Lightweight Tetris + Mines overlays

## Install in your existing project

1. Copy `src/easteregg/TetrisEasterEgg.tsx`, `src/easteregg/MinesEasterEgg.tsx`, and `src/easteregg/eggState.ts` into your React app.
2. Mount overlays once near your root layout (for example in `src/App.tsx`).

```tsx
import TetrisEasterEgg from "./easteregg/TetrisEasterEgg";
import MinesEasterEgg from "./easteregg/MinesEasterEgg";

function App() {
  return (
    <>
      {/* your app */}
      <TetrisEasterEgg />
      <MinesEasterEgg />
    </>
  );
}

export default App;
```

## Controls

### Tetris

- `Left / Right`: move
- `Up`: rotate
- `Down`: soft drop
- `Space`: hard drop
- `Esc`: close overlay

### Mines

- Type `M I N E S` to open
- Left click: reveal cell
- Right click: flag cell
- `R`: restart
- `Esc`: close overlay

## High score storage

- `localStorage` key: `easteregg_tetris_high_score`
- Current score resets each round; high score remains saved.

## Notes

- Designed as an easter egg overlay, not a full-page game route.
- Uses inline styles to avoid collisions with existing app CSS.
