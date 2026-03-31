# Tetris Easter Egg (React)

Lightweight overlay Tetris component for existing React projects.

## Run locally (demo)

```bash
npm install
npm run dev
```

Then open the local Vite URL (usually `http://localhost:5173`).

## What this includes

- Konami code trigger: `↑ ↑ ↓ ↓ ← → ← → B A`
- Keyboard controls for basic gameplay
- Local high score persistence via `localStorage`
- Single self-contained component (no external game library)

## Install in your existing project

1. Copy `src/easteregg/TetrisEasterEgg.tsx` into your React app.
2. Mount it once near your root layout (for example in `src/App.tsx`).

```tsx
import TetrisEasterEgg from "./easteregg/TetrisEasterEgg";

function App() {
  return (
    <>
      {/* your app */}
      <TetrisEasterEgg />
    </>
  );
}

export default App;
```

## Controls

- `Left / Right`: move
- `Up`: rotate
- `Down`: soft drop
- `Space`: hard drop
- `Esc`: close overlay

## High score storage

- `localStorage` key: `easteregg_tetris_high_score`
- Current score resets each round; high score remains saved.

## Notes

- Designed as an easter egg overlay, not a full-page game route.
- Uses inline styles to avoid collisions with existing app CSS.
