import * as THREE from "three";

export type MaterialKind =
  | "brick"
  | "stone"
  | "glass"
  | "concrete"
  | "steel"
  | "wood"
  | "water";

export type PieceKind =
  | "column"
  | "beam"
  | "floor"
  | "facade"
  | "cornice"
  | "roof"
  | "tank"
  | "detail";

export interface StructuralPiece {
  id: number;
  object: THREE.Object3D;
  buildingId: string;
  floor: number;
  kind: PieceKind;
  material: MaterialKind;
  size: THREE.Vector3;
  radius: number;
  mass: number;
  strength: number;
  damage: number;
  homePosition: THREE.Vector3;
  homeQuaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  collapseBias: THREE.Vector3;
  detached: boolean;
  sleeping: boolean;
  sleepClock: number;
  collapseDelay: number;
  impactCooldown: number;
}

export interface BuildingAssembly {
  id: string;
  label: string;
  pieces: StructuralPiece[];
  center: THREE.Vector3;
  footprint: THREE.Vector2;
  topFloor: number;
  primaryMaterial: MaterialKind;
  stability: number;
  collapseStarted: boolean;
  collapseClock: number;
  waterTower: boolean;
}

export interface ScenicActor {
  object: THREE.Object3D;
  homePosition: THREE.Vector3;
  phase: number;
}

export interface DistrictScene {
  root: THREE.Group;
  destructibleRoot: THREE.Group;
  buildings: BuildingAssembly[];
  pieces: StructuralPiece[];
  pigeons: ScenicActor[];
  spectators: ScenicActor[];
  warningLights: THREE.PointLight[];
  cars: THREE.Object3D[];
  trees: THREE.Object3D[];
  cranePivot: THREE.Group;
  boomTip: THREE.Object3D;
  cable: THREE.Line;
  ball: THREE.Mesh;
  waterTankPiece: StructuralPiece | null;
}

export type CueType =
  | "impact"
  | "detach"
  | "collapse"
  | "shatter"
  | "dust"
  | "water"
  | "cheer";

export interface SimulationCue {
  type: CueType;
  position: THREE.Vector3;
  energy: number;
  material: MaterialKind;
  buildingId?: string;
}

export interface SimulationFrameReport {
  cues: SimulationCue[];
  tonnage: number;
  chainMultiplier: number;
  detachedCount: number;
  headline: string;
}

export interface ChargePlacement {
  id: number;
  pieceId: number;
  position: THREE.Vector3;
  object: THREE.Group;
  armed: boolean;
}

export interface RecordedFrame {
  time: number;
  transforms: Float32Array;
  flags: Uint8Array;
  tonnage: number;
  chainMultiplier: number;
  headlineIndex: number;
}

export const HEADLINES = [
  "DISTRICT STANDING BY",
  "THAT LEFT A MARK",
  "CLEAN BREAK",
  "STRUCTURAL POETRY",
  "CHAIN REACTION",
  "PERFECT PANCAKE",
  "ABSOLUTE CINEMA",
  "CITY RESTORED",
] as const;
