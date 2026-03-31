import MinesEasterEgg from "./easteregg/MinesEasterEgg";
import TetrisEasterEgg from "./easteregg/TetrisEasterEgg";

export default function App() {
  return (
    <main className="app">
      <h1>Tetris Easter Egg Demo</h1>
      <p>Type this to open an overlay game:</p>
      <code>T E T R I S</code> <code>M I N E S</code>
      <p className="hint">Press ESC to close the game.</p>
      <TetrisEasterEgg />
      <MinesEasterEgg />
    </main>
  );
}
