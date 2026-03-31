type EggName = "tetris" | "mines";

let activeEgg: EggName | null = null;

export function getActiveEgg(): EggName | null {
  return activeEgg;
}

export function setActiveEgg(name: EggName | null) {
  activeEgg = name;
}
