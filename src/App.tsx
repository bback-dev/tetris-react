import TetrisEasterEgg from "./easteregg/TetrisEasterEgg";

export default function App() {
  return (
    <main className="app">
      <h1>Tetris Easter Egg Demo</h1>
      <p>Enter the Konami code to open the overlay:</p>
      <code>↑ ↑ ↓ ↓ ← → ← → B A</code>
      <p className="hint">Press ESC to close the game.</p>
      <TetrisEasterEgg />
    </main>
  );
}
