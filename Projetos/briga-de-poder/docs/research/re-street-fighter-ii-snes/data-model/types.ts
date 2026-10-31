// Modelo de dados para o BRIGA DE PODER derivado do estudo. One exported type per E-### entity file.
export type GuardLevel = "high" | "mid" | "low" | "unblockable";
export type Knockdown = "none" | "soft" | "hard";
export interface Rect { x: number; y: number; w: number; h: number }
export interface Attack {
  id: string; startup: number; active: number; recovery: number;
  damage: number; chip_damage: number; hitstun: number; blockstun: number;
  hitstop: number; pushback: number; hitboxes: Rect[][]; guard: GuardLevel;
  knockdown: Knockdown; cancel_into: string[]; input: string;
}
export type FighterStateName = "idle" | "walk" | "crouch" | "jump" | "block" | "attack" |
  "hitstun" | "blockstun" | "knockdown" | "wakeup" | "dizzy" | "thrown";
export interface Fighter {
  health: number; position: [number, number]; velocity: [number, number]; facing: -1 | 1;
  state: FighterStateName; state_frame: number; current_attack?: string; combo_count: number;
  stun_meter: number; charge_frames: Record<string, number>; input_history: number[];
}
export interface Match {
  round: number; max_rounds: number; wins: [number, number]; timer_frames: number;
  frame: number; rng_seed: number; result?: "p1" | "p2" | "draw" | "both_lose";
}
export interface InputFrame { frame: number; bits: number }
