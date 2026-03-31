import React, { useEffect, useMemo, useRef, useState } from "react";
import { getActiveEgg, setActiveEgg } from "./eggState";

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

type Difficulty = {
  id: "beginner" | "intermediate" | "expert";
  label: string;
  rows: number;
  cols: number;
  mines: number;
};

const DIFFICULTIES: Difficulty[] = [
  { id: "beginner", label: "초급", rows: 9, cols: 9, mines: 10 },
  { id: "intermediate", label: "중급", rows: 16, cols: 16, mines: 40 },
  { id: "expert", label: "상급", rows: 20, cols: 20, mines: 72 },
];

const TRIGGER = ["m", "i", "n", "e", "s"];
const FLAG_ICON = "/easteregg/flag.svg";
const BOMB_ICON = "/easteregg/bomb.svg";
const TILE_GAP = 2;
const GRID_PADDING = 2;

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
}

function inBounds(x: number, y: number, rows: number, cols: number) {
  return x >= 0 && x < cols && y >= 0 && y < rows;
}

function neighbors(x: number, y: number, rows: number, cols: number) {
  const points: Array<[number, number]> = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (inBounds(nx, ny, rows, cols)) points.push([nx, ny]);
    }
  }
  return points;
}

function buildBoard(safeX: number, safeY: number, rows: number, cols: number, mines: number): Cell[][] {
  const board = createEmptyBoard(rows, cols);
  const protectedCells = new Set([
    `${safeX},${safeY}`,
    ...neighbors(safeX, safeY, rows, cols).map(([x, y]) => `${x},${y}`),
  ]);

  let placed = 0;
  while (placed < mines) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (board[y][x].mine) continue;
    if (protectedCells.has(`${x},${y}`)) continue;
    board[y][x].mine = true;
    placed++;
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (board[y][x].mine) continue;
      board[y][x].adjacent = neighbors(x, y, rows, cols).reduce(
        (count, [nx, ny]) => count + (board[ny][nx].mine ? 1 : 0),
        0
      );
    }
  }
  return board;
}

function revealFlood(board: Cell[][], startX: number, startY: number, rows: number, cols: number): Cell[][] {
  const next = board.map((row) => row.map((cell) => ({ ...cell })));
  const stack: Array<[number, number]> = [[startX, startY]];

  while (stack.length) {
    const [x, y] = stack.pop()!;
    const cell = next[y][x];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent !== 0 || cell.mine) continue;
    for (const [nx, ny] of neighbors(x, y, rows, cols)) {
      if (!next[ny][nx].revealed && !next[ny][nx].flagged) stack.push([nx, ny]);
    }
  }
  return next;
}

function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell)));
}

function hasWon(board: Cell[][]) {
  return board.every((row) => row.every((cell) => cell.mine || cell.revealed));
}

export default function MinesEasterEgg() {
  const [open, setOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [firstMove, setFirstMove] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [chordPreview, setChordPreview] = useState<string[]>([]);

  const triggerRef = useRef<string[]>([]);
  const chordCenterRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreClickRef = useRef(false);

  const tileSize = useMemo(() => {
    if (!difficulty) return 30;
    if (difficulty.cols >= 30) return 18;
    if (difficulty.cols >= 16) return 24;
    return 32;
  }, [difficulty]);

  const panelWidth = useMemo(() => {
    const base = difficulty ?? DIFFICULTIES.find((d) => d.id === "expert")!;
    const baseTile = base.cols >= 30 ? 18 : base.cols >= 16 ? 24 : 32;
    const boardWidth = base.cols * baseTile + (base.cols - 1) * TILE_GAP + GRID_PADDING * 2;
    return boardWidth + 40;
  }, [difficulty]);

  const flagsUsed = useMemo(
    () => board.reduce((sum, row) => sum + row.filter((cell) => cell.flagged).length, 0),
    [board]
  );

  const close = () => {
    setOpen(false);
    setActiveEgg(null);
  };

  const startDifficulty = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty);
    setBoard(createEmptyBoard(nextDifficulty.rows, nextDifficulty.cols));
    setFirstMove(true);
    setGameOver(false);
    setWon(false);
    setSeconds(0);
    setChordPreview([]);
    chordCenterRef.current = null;
    ignoreClickRef.current = false;
  };

  const reset = () => {
    if (!difficulty) return;
    startDifficulty(difficulty);
  };

  useEffect(() => {
    if (!open || !difficulty || firstMove || gameOver || won) return;
    const id = window.setTimeout(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearTimeout(id);
  }, [open, difficulty, firstMove, gameOver, won, seconds]);

  const openCell = (x: number, y: number) => {
    if (!difficulty || gameOver || won) return;

    let working = board;
    if (firstMove) {
      working = buildBoard(x, y, difficulty.rows, difficulty.cols, difficulty.mines);
      setFirstMove(false);
    }

    const target = working[y][x];
    if (target.flagged || target.revealed) {
      if (firstMove) setBoard(working);
      return;
    }

    if (target.mine) {
      setBoard(revealAllMines(working));
      setGameOver(true);
      return;
    }

    const revealed = revealFlood(working, x, y, difficulty.rows, difficulty.cols);
    setBoard(revealed);
    if (hasWon(revealed)) {
      setWon(true);
      setGameOver(true);
    }
  };

  const toggleFlag = (x: number, y: number) => {
    if (gameOver || won) return;
    const cell = board[y][x];
    if (!cell || cell.revealed) return;
    const next = board.map((row) => row.map((c) => ({ ...c })));
    next[y][x].flagged = !next[y][x].flagged;
    setBoard(next);
  };

  const startChord = (x: number, y: number) => {
    if (!difficulty) return;
    const center = board[y][x];
    if (!center || !center.revealed || center.adjacent === 0) return;
    chordCenterRef.current = { x, y };
    const preview = neighbors(x, y, difficulty.rows, difficulty.cols)
      .filter(([nx, ny]) => !board[ny][nx].revealed && !board[ny][nx].flagged)
      .map(([nx, ny]) => `${nx},${ny}`);
    setChordPreview(preview);
  };

  const resolveChord = (x: number, y: number) => {
    if (!difficulty) return;
    const center = board[y][x];
    if (!center || !center.revealed || center.adjacent === 0) return;

    const around = neighbors(x, y, difficulty.rows, difficulty.cols);
    const flagged = around.reduce((count, [nx, ny]) => count + (board[ny][nx].flagged ? 1 : 0), 0);
    if (flagged !== center.adjacent) return;

    let next = board.map((row) => row.map((cell) => ({ ...cell })));
    let hitMine = false;

    for (const [nx, ny] of around) {
      const cell = next[ny][nx];
      if (cell.revealed || cell.flagged) continue;
      if (cell.mine) {
        hitMine = true;
        cell.revealed = true;
        continue;
      }
      next = revealFlood(next, nx, ny, difficulty.rows, difficulty.cols);
    }

    if (hitMine) {
      setBoard(revealAllMines(next));
      setGameOver(true);
      return;
    }

    setBoard(next);
    if (hasWon(next)) {
      setWon(true);
      setGameOver(true);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (!open) {
        if (getActiveEgg() !== null) return;
        triggerRef.current = [...triggerRef.current, key].slice(-TRIGGER.length);
        if (TRIGGER.every((k, i) => triggerRef.current[i] === k)) {
          setOpen(true);
          setActiveEgg("mines");
          setDifficulty(null);
          setBoard([]);
          setGameOver(false);
          setWon(false);
          setSeconds(0);
        }
        return;
      }

      if (e.key === "Escape") close();
      if (key === "r" && difficulty) reset();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, difficulty, board, gameOver, won, firstMove]);

  useEffect(() => {
    const clearChord = () => {
      chordCenterRef.current = null;
      setChordPreview([]);
    };
    window.addEventListener("mouseup", clearChord);
    return () => window.removeEventListener("mouseup", clearChord);
  }, []);

  useEffect(() => {
    return () => {
      if (open) setActiveEgg(null);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={{ ...panel, width: `${panelWidth}px` }}>
        <div style={header}>
          <strong>MINES EASTER EGG</strong>
          <button style={btn} onClick={close}>
            Close (ESC)
          </button>
        </div>

        {!difficulty ? (
          <div style={levelMenu}>
            <div style={levelTitle}>난이도를 선택하세요</div>
            {DIFFICULTIES.map((d) => (
              <button key={d.id} style={levelBtn} onClick={() => startDifficulty(d)}>
                {d.label} ({d.cols}x{d.rows}, {d.mines} mines)
              </button>
            ))}
          </div>
        ) : (
          <>
            <div style={meta}>
              Level: {difficulty.label} · Mines: {Math.max(0, difficulty.mines - flagsUsed)} · Time: {seconds}s
            </div>
            <div
              style={{
                ...grid,
                gridTemplateColumns: `repeat(${difficulty.cols}, ${tileSize}px)`,
              }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const content = cell.flagged ? (
                    <img src={FLAG_ICON} alt="flag" style={icon} />
                  ) : cell.revealed ? (
                    cell.mine ? <img src={BOMB_ICON} alt="mine" style={icon} /> : cell.adjacent || ""
                  ) : (
                    ""
                  );
                  const key = `${x},${y}`;
                  const isChordPreview = chordPreview.includes(key);
                  const bg = cell.revealed ? "#1f2937" : isChordPreview ? "#475569" : "#334155";
                  return (
                    <button
                      key={`${x}-${y}`}
                      style={{ ...tile, width: tileSize, height: tileSize, background: bg, color: colorByNumber(cell.adjacent) }}
                      onClick={() => {
                        if (ignoreClickRef.current) {
                          ignoreClickRef.current = false;
                          return;
                        }
                        openCell(x, y);
                      }}
                      onMouseDown={(e) => {
                        if (e.buttons === 3) {
                          e.preventDefault();
                          ignoreClickRef.current = true;
                          startChord(x, y);
                        }
                      }}
                      onMouseUp={() => {
                        const center = chordCenterRef.current;
                        if (!center) return;
                        if (center.x === x && center.y === y) resolveChord(x, y);
                        chordCenterRef.current = null;
                        setChordPreview([]);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (ignoreClickRef.current) {
                          ignoreClickRef.current = false;
                          return;
                        }
                        toggleFlag(x, y);
                      }}
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>
            <div style={footer}>
              {won ? "Cleared!" : gameOver ? "Boom!" : "Left click reveal · Right click flag · Both click chord · R restart"}
              <div style={footerActions}>
                <button style={btn} onClick={() => setDifficulty(null)}>
                  Level
                </button>
                {(won || gameOver) && (
                  <button style={btn} onClick={reset}>
                    Retry
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function colorByNumber(n: number) {
  if (n === 1) return "#60a5fa";
  if (n === 2) return "#34d399";
  if (n === 3) return "#f87171";
  if (n >= 4) return "#fbbf24";
  return "#e2e8f0";
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
  background: "#111827",
  color: "#f9fafb",
  borderRadius: 12,
  padding: 14,
  boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const levelMenu: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const levelTitle: React.CSSProperties = {
  fontSize: 14,
  marginBottom: 4,
};

const levelBtn: React.CSSProperties = {
  background: "#334155",
  color: "#fff",
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: 8,
  padding: "8px 10px",
  textAlign: "left",
  cursor: "pointer",
};

const meta: React.CSSProperties = {
  marginBottom: 8,
  fontSize: 13,
};

const grid: React.CSSProperties = {
  display: "grid",
  gap: TILE_GAP,
  background: "#0b1220",
  padding: GRID_PADDING,
  width: "fit-content",
  margin: "0 auto",
};

const tile: React.CSSProperties = {
  border: 0,
  borderRadius: 4,
  fontWeight: 700,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const icon: React.CSSProperties = {
  width: 18,
  height: 18,
  objectFit: "contain",
  pointerEvents: "none",
};

const footer: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  opacity: 0.95,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const footerActions: React.CSSProperties = {
  display: "flex",
  gap: 6,
};

const btn: React.CSSProperties = {
  background: "#374151",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
};
