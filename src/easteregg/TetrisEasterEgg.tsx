import React, { useEffect, useMemo, useRef, useState } from "react";

type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Board = Cell[][];
type PieceKey = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

const W = 10;
const H = 20;
const DROP_MS = 420;
const HIGH_SCORE_KEY = "easteregg_tetris_high_score";

const SHAPES: Record<PieceKey, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [2, 2],
    [2, 2],
  ],
  T: [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  J: [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
};

const COLORS = [
  "transparent",
  "#22d3ee",
  "#facc15",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#60a5fa",
  "#f97316",
];

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

function createBoard(): Board {
  return Array.from({ length: H }, () => Array(W).fill(0 as Cell));
}

function rotate(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const out = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) out[x][rows - 1 - y] = matrix[y][x];
  }
  return out;
}

function randomPiece() {
  const keys = Object.keys(SHAPES) as PieceKey[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { key, shape: SHAPES[key], x: 3, y: 0 };
}

function collides(board: Board, shape: number[][], px: number, py: number) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = px + x;
      const by = py + y;
      if (bx < 0 || bx >= W || by >= H) return true;
      if (by >= 0 && board[by][bx] !== 0) return true;
    }
  }
  return false;
}

function merge(board: Board, shape: number[][], px: number, py: number): Board {
  const next = board.map((r) => [...r]) as Board;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      const v = shape[y][x] as Cell;
      if (!v) continue;
      const by = py + y;
      const bx = px + x;
      if (by >= 0 && by < H && bx >= 0 && bx < W) next[by][bx] = v;
    }
  }
  return next;
}

function clearLines(board: Board) {
  const kept = board.filter((row) => row.some((c) => c === 0));
  const cleared = H - kept.length;
  const newRows = Array.from({ length: cleared }, () => Array(W).fill(0 as Cell));
  return { board: [...newRows, ...kept] as Board, cleared };
}

export default function TetrisEasterEgg() {
  const [open, setOpen] = useState(false);
  const [board, setBoard] = useState<Board>(createBoard);
  const [piece, setPiece] = useState(randomPiece);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  });
  const konamiRef = useRef<string[]>([]);

  const rendered = useMemo(() => {
    if (!open) return board;
    return merge(board, piece.shape, piece.x, piece.y);
  }, [board, piece, open]);

  const reset = () => {
    setBoard(createBoard());
    setPiece(randomPiece());
    setScore(0);
    setGameOver(false);
  };

  const lockAndSpawn = () => {
    const merged = merge(board, piece.shape, piece.x, piece.y);
    const { board: cleaned, cleared } = clearLines(merged);
    setBoard(cleaned);
    if (cleared) setScore((s) => s + cleared * 100);
    const next = randomPiece();
    if (collides(cleaned, next.shape, next.x, next.y)) setGameOver(true);
    else setPiece(next);
  };

  const tick = () => {
    if (!open || gameOver) return;
    if (!collides(board, piece.shape, piece.x, piece.y + 1)) {
      setPiece((p) => ({ ...p, y: p.y + 1 }));
    } else {
      lockAndSpawn();
    }
  };

  useEffect(() => {
    const id = setInterval(tick, DROP_MS);
    return () => clearInterval(id);
  });

  useEffect(() => {
    if (score <= highScore) return;
    setHighScore(score);
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }, [score, highScore]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (!open) {
        konamiRef.current = [...konamiRef.current, key].slice(-KONAMI.length);
        if (KONAMI.every((k, i) => konamiRef.current[i] === k)) {
          setOpen(true);
          reset();
        }
        return;
      }

      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (gameOver) return;

      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === "ArrowLeft" && !collides(board, piece.shape, piece.x - 1, piece.y)) {
        setPiece((p) => ({ ...p, x: p.x - 1 }));
      }
      if (e.key === "ArrowRight" && !collides(board, piece.shape, piece.x + 1, piece.y)) {
        setPiece((p) => ({ ...p, x: p.x + 1 }));
      }
      if (e.key === "ArrowDown") tick();
      if (e.key === "ArrowUp") {
        const r = rotate(piece.shape);
        if (!collides(board, r, piece.x, piece.y)) setPiece((p) => ({ ...p, shape: r }));
      }
      if (e.key === " ") {
        let y = piece.y;
        while (!collides(board, piece.shape, piece.x, y + 1)) y++;
        setPiece((p) => ({ ...p, y }));
        setTimeout(lockAndSpawn, 0);
      }
    };

    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [open, board, piece, gameOver]);

  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>TETRIS EASTER EGG</strong>
          <button onClick={() => setOpen(false)} style={btn}>
            Close (ESC)
          </button>
        </div>
        <div style={{ marginBottom: 8 }}>Score: {score} · High Score: {highScore}</div>
        <div style={grid}>
          {rendered.flat().map((c, i) => (
            <div key={i} style={{ ...cell, background: COLORS[c] }} />
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
          Left/Right move, Up rotate, Down soft drop, Space hard drop
        </div>
        {gameOver && (
          <div style={{ marginTop: 10 }}>
            <strong>Game Over</strong>{" "}
            <button onClick={reset} style={btn}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 9999,
  display: "grid",
  placeItems: "center",
};

const panel: React.CSSProperties = {
  width: 320,
  background: "#111827",
  color: "#f9fafb",
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: `repeat(${W}, 1fr)`,
  gap: 1,
  background: "#0b1220",
  padding: 2,
};

const cell: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 4,
};

const btn: React.CSSProperties = {
  background: "#374151",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
};
