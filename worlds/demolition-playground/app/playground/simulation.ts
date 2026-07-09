import * as THREE from "three";

import {
  HEADLINES,
  type BuildingAssembly,
  type DistrictScene,
  type MaterialKind,
  type SimulationCue,
  type SimulationFrameReport,
  type StructuralPiece,
} from "./types";

const FIXED_STEP = 1 / 90;
const SNAPSHOT_STEP = 1 / 12;
const HISTORY_WINDOW = 65;
const MAX_FIXED_STEPS = 10;
const MAX_CUES_PER_FRAME = 64;
const BALL_MASS = 28;
const BALL_RADIUS = 1.5;
const GRAVITY = 9.81;
const GROUND_Y = 0;

const PIECE_STRIDE = 20;
const BUILDING_STRIDE = 7;

const enum PieceFlag {
  Detached = 1 << 0,
  Sleeping = 1 << 1,
  Shattered = 1 << 2,
  Visible = 1 << 3,
}

const enum BuildingFlag {
  CollapseStarted = 1 << 0,
  CollapseAwarded = 1 << 1,
  WaterRuptured = 1 << 2,
  CompletionCheered = 1 << 3,
}

interface MaterialProfile {
  damageScale: number;
  failureRatio: number;
  restitution: number;
  friction: number;
  airDrag: number;
  angularDrag: number;
  makesDust: boolean;
}

const MATERIAL: Record<MaterialKind, MaterialProfile> = {
  brick: {
    damageScale: 1.15,
    failureRatio: 0.9,
    restitution: 0.22,
    friction: 0.74,
    airDrag: 0.055,
    angularDrag: 0.12,
    makesDust: true,
  },
  stone: {
    damageScale: 0.84,
    failureRatio: 0.98,
    restitution: 0.13,
    friction: 0.82,
    airDrag: 0.04,
    angularDrag: 0.15,
    makesDust: true,
  },
  glass: {
    damageScale: 1.9,
    failureRatio: 0.38,
    restitution: 0.08,
    friction: 0.54,
    airDrag: 0.11,
    angularDrag: 0.08,
    makesDust: false,
  },
  concrete: {
    damageScale: 0.9,
    failureRatio: 1,
    restitution: 0.12,
    friction: 0.8,
    airDrag: 0.045,
    angularDrag: 0.14,
    makesDust: true,
  },
  steel: {
    damageScale: 0.62,
    failureRatio: 1.25,
    restitution: 0.2,
    friction: 0.64,
    airDrag: 0.035,
    angularDrag: 0.09,
    makesDust: false,
  },
  wood: {
    damageScale: 1.24,
    failureRatio: 0.8,
    restitution: 0.27,
    friction: 0.68,
    airDrag: 0.065,
    angularDrag: 0.1,
    makesDust: true,
  },
  water: {
    damageScale: 1,
    failureRatio: 0.72,
    restitution: 0.05,
    friction: 0.52,
    airDrag: 0.06,
    angularDrag: 0.1,
    makesDust: false,
  },
};

interface PieceRuntime {
  homeWorld: THREE.Vector3;
  initialScale: THREE.Vector3;
  initialVisible: boolean;
  shattered: boolean;
}

interface BuildingRuntime {
  assembly: BuildingAssembly;
  pieceIndices: number[];
  floors: number[];
  floorHeights: number[];
  baseColumnIndices: number[];
  cornerInitial: [number, number, number, number];
  initialStability: number;
  structuralWeightTotal: number;
  maxY: number;
  sagX: number;
  sagZ: number;
  sagClock: number;
  sagStage: number;
  releasedFloors: number;
  collapseAwarded: boolean;
  waterRuptured: boolean;
  completionCheered: boolean;
}

interface Snapshot {
  time: number;
  pieces: Float32Array;
  pieceFlags: Uint8Array;
  buildings: Float32Array;
  buildingFlags: Uint8Array;
  ball: Float32Array;
  tonnage: number;
  chainMultiplier: number;
  headlineIndex: number;
  hasActivity: boolean;
  firstImpact: boolean;
  lastCollapseTime: number;
  collapsedBuildingCount: number;
  nextCheerTonnage: number;
}

type ImpactCause = "ball" | "impact" | "blast" | "chain" | "collapse";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function kindDamageScale(piece: StructuralPiece): number {
  switch (piece.kind) {
    case "column":
      return 0.78;
    case "beam":
      return 0.88;
    case "floor":
      return 0.76;
    case "facade":
      return 1.25;
    case "cornice":
      return 1.32;
    case "detail":
      return 1.4;
    case "tank":
      return 1.16;
    case "roof":
    default:
      return 0.96;
  }
}

function structuralWeight(piece: StructuralPiece): number {
  switch (piece.kind) {
    case "column":
      return 3;
    case "floor":
      return 2;
    case "beam":
      return 1.7;
    case "roof":
      return 0.9;
    case "tank":
      return 0.7;
    case "facade":
      return 0.32;
    case "cornice":
      return 0.2;
    case "detail":
    default:
      return 0.12;
  }
}

function deterministicUnit(id: number): number {
  let value = id | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

/**
 * Coarse structural demolition simulation. Visual brick, shard and dust pools are
 * deliberately driven through cues; only structural members become simulated bodies.
 */
export class DemolitionSimulation {
  private readonly district: DistrictScene;
  private readonly pieces: StructuralPiece[];
  private readonly pieceRuntime: PieceRuntime[];
  private readonly buildingRuntime: BuildingRuntime[];
  private readonly buildingById = new Map<string, BuildingRuntime>();
  private readonly pieceIndex = new Map<StructuralPiece, number>();
  private readonly touchedBuildings = new Set<BuildingRuntime>();
  private readonly pendingCues: SimulationCue[] = [];
  private readonly history: Snapshot[] = [];
  private readonly initialBall = new Float32Array(10);

  private simulationTime = 0;
  private accumulator = 0;
  private snapshotAccumulator = 0;
  private structuralAccumulator = 0;
  private collisionAccumulator = 0;
  private playbackTime = 0;
  private scrubbed = false;
  private _tonnage = 0;
  private _chainMultiplier = 1;
  private _headlineIndex = 0;
  private _hasActivity = false;
  private firstImpact = false;
  private lastCollapseTime = -Infinity;
  private collapsedBuildingCount = 0;
  private nextCheerTonnage = 180;
  private hasLastBallPosition = false;
  private readonly lastBallPosition = new THREE.Vector3();

  private readonly v0 = new THREE.Vector3();
  private readonly v1 = new THREE.Vector3();
  private readonly v2 = new THREE.Vector3();
  private readonly v3 = new THREE.Vector3();
  private readonly q0 = new THREE.Quaternion();
  private readonly q1 = new THREE.Quaternion();
  private readonly q2 = new THREE.Quaternion();

  constructor(district: DistrictScene) {
    this.district = district;
    this.pieces = district.pieces;
    district.root.updateMatrixWorld(true);

    this.pieceRuntime = this.pieces.map((piece, index) => {
      this.pieceIndex.set(piece, index);
      return {
        homeWorld: piece.object.getWorldPosition(new THREE.Vector3()),
        initialScale: piece.object.scale.clone(),
        initialVisible: piece.object.visible,
        shattered: false,
      };
    });

    this.buildingRuntime = district.buildings.map((assembly) =>
      this.createBuildingRuntime(assembly),
    );
    for (const runtime of this.buildingRuntime) {
      this.buildingById.set(runtime.assembly.id, runtime);
    }

    this.writeObjectTransform(district.ball, this.initialBall, 0);
    this.captureSnapshot(0);
  }

  get historySeconds(): number {
    if (this.history.length < 2) return 0;
    return this.history[this.history.length - 1].time - this.history[0].time;
  }

  get playheadNormalized(): number {
    if (this.history.length < 2) return 1;
    const oldest = this.history[0].time;
    const latest = this.history[this.history.length - 1].time;
    if (latest <= oldest) return 1;
    return clamp((this.playbackTime - oldest) / (latest - oldest), 0, 1);
  }

  get tonnage(): number {
    return this._tonnage;
  }

  get chainMultiplier(): number {
    return this._chainMultiplier;
  }

  get headline(): string {
    return HEADLINES[this._headlineIndex] ?? HEADLINES[0];
  }

  get hasActivity(): boolean {
    return this._hasActivity;
  }

  update(
    delta: number,
    ballPosition: THREE.Vector3,
    ballVelocity: THREE.Vector3,
  ): SimulationFrameReport {
    if (this.scrubbed) {
      this.pendingCues.length = 0;
      return this.makeReport(false);
    }

    const safeDelta = clamp(Number.isFinite(delta) ? delta : 0, 0, 0.1);
    this.detectBallCollision(ballPosition, ballVelocity);
    this.accumulator += safeDelta;

    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_FIXED_STEPS) {
      this.fixedUpdate(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (steps === MAX_FIXED_STEPS) this.accumulator = Math.min(this.accumulator, FIXED_STEP);

    this.lastBallPosition.copy(ballPosition);
    this.hasLastBallPosition = true;
    this.playbackTime = this.history.length
      ? this.history[this.history.length - 1].time
      : this.simulationTime;
    return this.makeReport(true);
  }

  applyImpact(position: THREE.Vector3, impulse: THREE.Vector3, radius: number): void {
    if (this.scrubbed) this.resumeFromHistory();
    this.damageRadius(
      position,
      impulse,
      clamp(radius, 0.25, 20),
      "impact",
      undefined,
      false,
    );
  }

  applyBlast(position: THREE.Vector3, energy = 175): void {
    if (this.scrubbed) this.resumeFromHistory();
    const blastEnergy = clamp(Number.isFinite(energy) ? energy : 175, 20, 500);
    const radius = 4.5 + blastEnergy * 0.02;
    this.touchedBuildings.clear();
    let affected = 0;

    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      this.getWorldPosition(piece, this.v0);
      const distance = this.distanceToPiece(position, piece);
      if (distance > radius) continue;

      const normalized = 1 - distance / radius;
      const falloff = normalized * normalized;
      if (falloff <= 0.005) continue;
      this.v1.subVectors(this.v0, position);
      if (this.v1.lengthSq() < 0.0001) {
        const angle = deterministicUnit(piece.id) * Math.PI * 2;
        this.v1.set(Math.cos(angle), 0.35, Math.sin(angle));
      }
      this.v1.normalize();
      this.v1.y += 0.24;
      this.v1.normalize().multiplyScalar(blastEnergy * 0.72 * falloff);

      const profile = MATERIAL[piece.material];
      const damage =
        blastEnergy * 1.05 * falloff * profile.damageScale * kindDamageScale(piece);
      this.damagePiece(piece, index, damage, this.v1, position, "blast", true);
      piece.impactCooldown = Math.max(piece.impactCooldown, 0.12);
      const runtime = this.buildingById.get(piece.buildingId);
      if (runtime) this.touchedBuildings.add(runtime);
      affected += 1;
    }

    if (affected > 0) {
      this.markActivity(position, blastEnergy, "concrete");
      this.emitCue("impact", position, blastEnergy, "concrete");
      this.emitCue("dust", position, blastEnergy * 0.9, "concrete");
      for (const runtime of this.touchedBuildings) {
        this.assessBuilding(runtime, "blast", position);
      }
    }
  }

  setPlaybackNormalized(value: number): SimulationFrameReport {
    if (this.history.length === 0) return this.makeReport(false);
    const normalized = clamp(Number.isFinite(value) ? value : 1, 0, 1);
    const oldest = this.history[0].time;
    const latest = this.history[this.history.length - 1].time;
    this.playbackTime = THREE.MathUtils.lerp(oldest, latest, normalized);
    this.restoreAtTime(this.playbackTime);
    this.scrubbed = normalized < 1 - 1e-6;
    this.hasLastBallPosition = false;
    this.pendingCues.length = 0;
    return this.makeReport(false);
  }

  stepRewind(delta: number): SimulationFrameReport {
    if (this.history.length === 0) return this.makeReport(false);
    const amount = Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (!this.scrubbed) {
      this.playbackTime = this.history[this.history.length - 1].time;
    }
    this.playbackTime = Math.max(this.history[0].time, this.playbackTime - amount);
    this.restoreAtTime(this.playbackTime);
    this.scrubbed = this.playbackTime < this.history[this.history.length - 1].time - 1e-6;
    this.hasLastBallPosition = false;
    this.pendingCues.length = 0;
    return this.makeReport(false);
  }

  resumeFromHistory(): void {
    if (!this.scrubbed) return;
    this.restoreAtTime(this.playbackTime);

    while (
      this.history.length > 0 &&
      this.history[this.history.length - 1].time >= this.playbackTime - 1e-6
    ) {
      this.history.pop();
    }
    this.simulationTime = this.playbackTime;
    this.captureSnapshot(this.simulationTime);
    this.accumulator = 0;
    this.snapshotAccumulator = 0;
    this.structuralAccumulator = 0;
    this.collisionAccumulator = 0;
    this.scrubbed = false;
    this.hasLastBallPosition = false;
    this.pendingCues.length = 0;
  }

  reset(): SimulationFrameReport {
    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      const runtime = this.pieceRuntime[index];
      piece.object.position.copy(piece.homePosition);
      piece.object.quaternion.copy(piece.homeQuaternion);
      piece.object.scale.copy(runtime.initialScale);
      piece.object.visible = runtime.initialVisible;
      piece.velocity.set(0, 0, 0);
      piece.angularVelocity.set(0, 0, 0);
      piece.damage = 0;
      piece.detached = false;
      piece.sleeping = false;
      piece.sleepClock = 0;
      piece.collapseDelay = 0;
      piece.impactCooldown = 0;
      runtime.shattered = false;
    }

    for (const runtime of this.buildingRuntime) {
      const assembly = runtime.assembly;
      assembly.stability = runtime.initialStability;
      assembly.collapseStarted = false;
      assembly.collapseClock = 0;
      runtime.sagX = 0;
      runtime.sagZ = 0;
      runtime.sagClock = 0;
      runtime.sagStage = 0;
      runtime.releasedFloors = 0;
      runtime.collapseAwarded = false;
      runtime.waterRuptured = false;
      runtime.completionCheered = false;
    }

    this.readObjectTransform(this.district.ball, this.initialBall, 0);
    this.district.root.updateMatrixWorld(true);
    this.simulationTime = 0;
    this.playbackTime = 0;
    this.accumulator = 0;
    this.snapshotAccumulator = 0;
    this.structuralAccumulator = 0;
    this.collisionAccumulator = 0;
    this._tonnage = 0;
    this._chainMultiplier = 1;
    this._headlineIndex = 7;
    this._hasActivity = false;
    this.firstImpact = false;
    this.lastCollapseTime = -Infinity;
    this.collapsedBuildingCount = 0;
    this.nextCheerTonnage = 180;
    this.scrubbed = false;
    this.hasLastBallPosition = false;
    this.pendingCues.length = 0;
    this.history.length = 0;
    this.captureSnapshot(0);
    return this.makeReport(false);
  }

  private fixedUpdate(delta: number): void {
    this.simulationTime += delta;
    this.snapshotAccumulator += delta;
    this.structuralAccumulator += delta;
    this.collisionAccumulator += delta;

    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      piece.impactCooldown = Math.max(0, piece.impactCooldown - delta);

      const runtime = this.buildingById.get(piece.buildingId);
      if (runtime?.assembly.collapseStarted && !piece.detached) {
        piece.collapseDelay -= delta;
        if (piece.collapseDelay <= 0) {
          this.v0.copy(piece.collapseBias);
          if (this.v0.lengthSq() < 0.001) {
            this.v0.set(runtime.sagX, -0.4, runtime.sagZ);
            if (this.v0.lengthSq() < 0.001) {
              const angle = deterministicUnit(piece.id) * Math.PI * 2;
              this.v0.set(Math.cos(angle), -0.4, Math.sin(angle));
            }
          }
          this.v0.normalize().multiplyScalar(Math.max(piece.mass, 1) * 1.8);
          this.getWorldPosition(piece, this.v1);
          this.detachPiece(piece, index, this.v0, this.v1, "collapse");
        }
      }

      if (piece.detached && !piece.sleeping) this.integratePiece(piece, index, delta);
    }

    for (const runtime of this.buildingRuntime) {
      if (runtime.sagX !== 0 || runtime.sagZ !== 0) this.updateSag(runtime, delta);
      if (runtime.assembly.collapseStarted) this.updateCollapse(runtime, delta);
    }

    if (this.structuralAccumulator >= 0.1) {
      this.structuralAccumulator %= 0.1;
      for (const runtime of this.buildingRuntime) {
        this.assessBuilding(runtime, "impact", runtime.assembly.center);
      }
    }

    if (this.collisionAccumulator >= 0.075) {
      this.collisionAccumulator %= 0.075;
      this.resolveCoarseBuildingImpacts();
    }

    if (this.snapshotAccumulator >= SNAPSHOT_STEP) {
      this.snapshotAccumulator %= SNAPSHOT_STEP;
      this.captureSnapshot(this.simulationTime);
    }
  }

  private integratePiece(piece: StructuralPiece, index: number, delta: number): void {
    const profile = MATERIAL[piece.material];
    piece.velocity.y -= GRAVITY * delta;
    piece.velocity.multiplyScalar(Math.exp(-profile.airDrag * delta));
    piece.angularVelocity.multiplyScalar(Math.exp(-profile.angularDrag * delta));

    piece.object.position.addScaledVector(piece.velocity, delta);
    const angularSpeed = piece.angularVelocity.length();
    if (angularSpeed > 0.0001) {
      this.v0.copy(piece.angularVelocity).multiplyScalar(1 / angularSpeed);
      this.q0.setFromAxisAngle(this.v0, angularSpeed * delta);
      piece.object.quaternion.premultiply(this.q0).normalize();
    }

    piece.object.updateWorldMatrix(true, false);
    this.getWorldPosition(piece, this.v0);
    const worldMatrix = piece.object.matrixWorld.elements;
    const supportHeight = Math.max(
      0.06,
      Math.abs(worldMatrix[1]) * piece.size.x * 0.5 +
        Math.abs(worldMatrix[5]) * piece.size.y * 0.5 +
        Math.abs(worldMatrix[9]) * piece.size.z * 0.5,
    );
    const bottom = this.v0.y - supportHeight;
    if (bottom >= GROUND_Y) {
      piece.sleepClock = 0;
      return;
    }

    this.v0.y += GROUND_Y - bottom;
    this.setWorldPosition(piece.object, this.v0);
    const downwardSpeed = Math.max(0, -piece.velocity.y);
    const impactEnergy = downwardSpeed * Math.max(piece.mass, 1);
    if (piece.velocity.y < 0) piece.velocity.y = -piece.velocity.y * profile.restitution;
    const groundFriction = Math.pow(profile.friction, delta * 60);
    piece.velocity.x *= groundFriction;
    piece.velocity.z *= groundFriction;
    piece.angularVelocity.multiplyScalar(Math.pow(0.72, delta * 60));

    if (impactEnergy > 18 && piece.impactCooldown <= 0) {
      this.emitCue("impact", this.v0, impactEnergy, piece.material, piece.buildingId);
      if (profile.makesDust && impactEnergy > 48) {
        this.emitCue("dust", this.v0, impactEnergy, piece.material, piece.buildingId);
      }
      piece.impactCooldown = 0.18;
    }

    const horizontalSpeedSq = piece.velocity.x ** 2 + piece.velocity.z ** 2;
    if (
      Math.abs(piece.velocity.y) < 0.24 &&
      horizontalSpeedSq < 0.11 &&
      piece.angularVelocity.lengthSq() < 0.16
    ) {
      piece.sleepClock += delta;
      if (piece.sleepClock >= 0.72) {
        piece.sleeping = true;
        piece.velocity.set(0, 0, 0);
        piece.angularVelocity.set(0, 0, 0);
      }
    } else {
      piece.sleepClock = 0;
    }

    if (piece.material === "water" || piece.kind === "tank") {
      const runtime = this.buildingById.get(piece.buildingId);
      if (runtime && impactEnergy > 28) this.ruptureWater(runtime, this.v0, impactEnergy);
    }

    void index;
  }

  private detectBallCollision(ballPosition: THREE.Vector3, ballVelocity: THREE.Vector3): void {
    if (!this.hasLastBallPosition) {
      this.lastBallPosition.copy(ballPosition);
      this.hasLastBallPosition = true;
      return;
    }
    const speed = ballVelocity.length();
    if (speed < 2.4) return;

    this.v0.subVectors(ballPosition, this.lastBallPosition);
    const segmentLengthSq = this.v0.lengthSq();
    let bestIndex = -1;
    let bestScore = Infinity;
    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      if (piece.impactCooldown > 0 || piece.sleeping) continue;
      this.getWorldPosition(piece, this.v1);
      let along = 0;
      if (segmentLengthSq > 0.0001) {
        along = clamp(
          this.v2.subVectors(this.v1, this.lastBallPosition).dot(this.v0) / segmentLengthSq,
          0,
          1,
        );
      }
      this.v2.copy(this.lastBallPosition).addScaledVector(this.v0, along);
      const broadReach = BALL_RADIUS + piece.radius;
      if (this.v2.distanceToSquared(this.v1) > broadReach * broadReach) continue;
      piece.object.worldToLocal(this.v3.copy(this.v2));
      const dx = Math.max(Math.abs(this.v3.x) - piece.size.x * 0.5, 0);
      const dy = Math.max(Math.abs(this.v3.y) - piece.size.y * 0.5, 0);
      const dz = Math.max(Math.abs(this.v3.z) - piece.size.z * 0.5, 0);
      const narrowDistanceSq = dx * dx + dy * dy + dz * dz;
      const score = narrowDistanceSq / (BALL_RADIUS * BALL_RADIUS);
      if (score <= 1 && score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    if (bestIndex < 0) return;
    const impulseMagnitude = clamp(BALL_MASS * speed, 45, 680);
    this.v1.copy(ballVelocity).normalize().multiplyScalar(impulseMagnitude);
    this.damageRadius(ballPosition, this.v1, BALL_RADIUS + 1.35, "ball", undefined, false);
  }

  private damageRadius(
    position: THREE.Vector3,
    impulse: THREE.Vector3,
    radius: number,
    cause: ImpactCause,
    onlyBuilding?: BuildingRuntime,
    ignoreCooldown = false,
  ): number {
    const impactPosition = position.clone();
    const baseImpulse = impulse.clone();
    const impulseMagnitude = clamp(baseImpulse.length(), 0, 720);
    if (impulseMagnitude < 0.1) return 0;
    this.touchedBuildings.clear();
    let affected = 0;

    const indices = onlyBuilding?.pieceIndices;
    const count = indices?.length ?? this.pieces.length;
    for (let cursor = 0; cursor < count; cursor += 1) {
      const index = indices ? indices[cursor] : cursor;
      const piece = this.pieces[index];
      if (!ignoreCooldown && piece.impactCooldown > 0) continue;
      const reach = radius + Math.min(piece.radius, 2) * 0.25;
      const distance = this.distanceToPiece(impactPosition, piece);
      if (distance > reach) continue;
      const normalized = clamp(1 - distance / Math.max(reach, 0.001), 0, 1);
      const falloff = 0.18 + normalized * normalized * 0.82;
      const profile = MATERIAL[piece.material];
      const damage =
        impulseMagnitude * 0.22 * falloff * profile.damageScale * kindDamageScale(piece);
      this.v1.copy(baseImpulse).setLength(impulseMagnitude * falloff);
      this.damagePiece(piece, index, damage, this.v1, impactPosition, cause, true);
      piece.impactCooldown = Math.max(piece.impactCooldown, cause === "ball" ? 0.2 : 0.12);
      const runtime = this.buildingById.get(piece.buildingId);
      if (runtime) this.touchedBuildings.add(runtime);
      affected += 1;
    }

    if (affected > 0) {
      const material = this.pieces[onlyBuilding?.pieceIndices[0] ?? 0]?.material ?? "concrete";
      this.markActivity(impactPosition, impulseMagnitude, material);
      this.emitCue("impact", impactPosition, impulseMagnitude, material);
      for (const runtime of this.touchedBuildings) {
        this.assessBuilding(runtime, cause, impactPosition);
      }
    }
    return affected;
  }

  private damagePiece(
    piece: StructuralPiece,
    index: number,
    damage: number,
    impulse: THREE.Vector3,
    contact: THREE.Vector3,
    cause: ImpactCause,
    propagate: boolean,
  ): void {
    if (damage <= 0) return;
    const impulseX = impulse.x;
    const impulseY = impulse.y;
    const impulseZ = impulse.z;
    const contactX = contact.x;
    const contactY = contact.y;
    const contactZ = contact.z;
    const priorDamage = piece.damage;
    piece.damage = Math.min(piece.strength * 2, piece.damage + damage);
    const threshold = piece.strength * MATERIAL[piece.material].failureRatio;

    if (piece.material === "glass" && piece.damage >= piece.strength * 0.24) {
      this.v3.set(contactX, contactY, contactZ);
      this.shatterPiece(piece, index, this.v3, damage);
    }

    if (!piece.detached && piece.damage >= threshold) {
      this.v2.set(impulseX, impulseY, impulseZ);
      this.v3.set(contactX, contactY, contactZ);
      this.detachPiece(piece, index, this.v2, this.v3, cause);
    } else if (
      !piece.detached &&
      piece.material === "steel" &&
      priorDamage < piece.strength * 0.65 &&
      piece.damage >= piece.strength * 0.65
    ) {
      piece.angularVelocity.addScaledVector(
        this.v2.set(impulseX, impulseY, impulseZ),
        0.001 / Math.max(piece.mass, 1),
      );
      this.emitCue(
        "impact",
        this.v3.set(contactX, contactY, contactZ),
        damage * 0.8,
        "steel",
        piece.buildingId,
      );
    }

    if (propagate && (piece.kind === "column" || piece.kind === "beam" || piece.kind === "floor")) {
      this.propagateDamage(
        piece,
        index,
        damage,
        this.v2.set(impulseX, impulseY, impulseZ),
        this.v3.set(contactX, contactY, contactZ),
        cause,
      );
    }

    if (piece.kind === "tank" || piece.material === "water") {
      const runtime = this.buildingById.get(piece.buildingId);
      if (runtime && piece.damage >= piece.strength * 0.42) {
        this.ruptureWater(runtime, this.v3.set(contactX, contactY, contactZ), damage);
      }
    }
  }

  private propagateDamage(
    source: StructuralPiece,
    sourceIndex: number,
    damage: number,
    impulse: THREE.Vector3,
    contact: THREE.Vector3,
    cause: ImpactCause,
  ): void {
    const impulseX = impulse.x;
    const impulseY = impulse.y;
    const impulseZ = impulse.z;
    const contactX = contact.x;
    const contactY = contact.y;
    const contactZ = contact.z;
    const runtime = this.buildingById.get(source.buildingId);
    if (!runtime) return;
    const sourceHome = this.pieceRuntime[sourceIndex].homeWorld;
    const range = 2.4 + Math.min(source.radius, 2.5);
    for (const index of runtime.pieceIndices) {
      if (index === sourceIndex) continue;
      const piece = this.pieces[index];
      if (piece.detached || Math.abs(piece.floor - source.floor) > 1) continue;
      const distance = sourceHome.distanceTo(this.pieceRuntime[index].homeWorld);
      if (distance > range) continue;
      let connection = 1;
      if (source.kind === "column" && (piece.kind === "beam" || piece.kind === "floor")) {
        connection = 1.35;
      } else if (source.kind === "floor" && piece.kind === "facade") {
        connection = 1.2;
      }
      const transfer = damage * 0.085 * connection * (1 - distance / range);
      if (transfer <= 0.2) continue;
      this.v2.set(impulseX, impulseY, impulseZ).multiplyScalar(0.12);
      this.v3.set(contactX, contactY, contactZ);
      this.damagePiece(piece, index, transfer, this.v2, this.v3, cause, false);
    }
  }

  private detachPiece(
    piece: StructuralPiece,
    index: number,
    impulse: THREE.Vector3,
    contact: THREE.Vector3,
    cause: ImpactCause,
  ): void {
    const impulseX = impulse.x;
    const impulseY = impulse.y;
    const impulseZ = impulse.z;
    const contactX = contact.x;
    const contactY = contact.y;
    const contactZ = contact.z;
    this.v2.set(impulseX, impulseY, impulseZ);
    this.v3.set(contactX, contactY, contactZ);
    if (piece.detached) {
      piece.velocity.addScaledVector(this.v2, 0.18 / Math.max(piece.mass, 1));
      this.limitVector(piece.velocity, 26);
      return;
    }
    piece.detached = true;
    piece.sleeping = false;
    piece.sleepClock = 0;
    piece.collapseDelay = 0;
    piece.velocity.addScaledVector(this.v2, 1 / Math.max(piece.mass, 1));
    this.limitVector(piece.velocity, 26);

    this.getWorldPosition(piece, this.v0);
    this.v1.subVectors(this.v3, this.v0).cross(this.v2);
    const inertia = Math.max(piece.mass * Math.max(piece.radius * piece.radius, 0.25), 1);
    piece.angularVelocity.addScaledVector(this.v1, 0.32 / inertia);
    if (piece.angularVelocity.lengthSq() < 0.08) {
      const spin = (deterministicUnit(piece.id) - 0.5) * 3.5;
      piece.angularVelocity.set(spin * 0.45, spin, -spin * 0.3);
    }
    this.limitVector(piece.angularVelocity, 12);

    this._tonnage += Math.max(0, piece.mass);
    this._headlineIndex = cause === "collapse" ? 3 : 2;
    const impulseMagnitude = this.v2.length();
    this.emitCue("detach", this.v0, impulseMagnitude, piece.material, piece.buildingId);
    if (MATERIAL[piece.material].makesDust && impulseMagnitude > 35) {
      this.emitCue("dust", this.v0, impulseMagnitude * 0.65, piece.material, piece.buildingId);
    }
    if (piece.material === "glass") {
      this.shatterPiece(piece, index, this.v0, impulseMagnitude);
    }

    if (this._tonnage >= this.nextCheerTonnage) {
      this.emitCue("cheer", this.v0, this._tonnage, piece.material, piece.buildingId);
      this.nextCheerTonnage += 260;
    }
  }

  private shatterPiece(
    piece: StructuralPiece,
    index: number,
    position: THREE.Vector3,
    energy: number,
  ): void {
    const runtime = this.pieceRuntime[index];
    if (runtime.shattered) return;
    runtime.shattered = true;
    this.emitCue("shatter", position, energy, "glass", piece.buildingId);
  }

  private ruptureWater(
    runtime: BuildingRuntime,
    position: THREE.Vector3,
    energy: number,
  ): void {
    if (runtime.waterRuptured) return;
    runtime.waterRuptured = true;
    this.emitCue("water", position, Math.max(energy, 80), "water", runtime.assembly.id);
    this._headlineIndex = 6;
  }

  private assessBuilding(
    runtime: BuildingRuntime,
    cause: ImpactCause,
    contact: THREE.Vector3,
  ): void {
    const assembly = runtime.assembly;
    let weightedDamage = 0;
    let floorTotal = 0;
    let floorLost = 0;
    let baseSupport = 0;
    const cornerSupport: [number, number, number, number] = [0, 0, 0, 0];

    for (const index of runtime.pieceIndices) {
      const piece = this.pieces[index];
      const weight = structuralWeight(piece);
      const health = piece.detached
        ? 0
        : clamp(1 - piece.damage / Math.max(piece.strength * MATERIAL[piece.material].failureRatio, 1), 0, 1);
      weightedDamage += weight * (1 - health);
      if (piece.kind === "floor") {
        floorTotal += 1;
        floorLost += 1 - health;
      }
    }

    for (const index of runtime.baseColumnIndices) {
      const piece = this.pieces[index];
      const health = piece.detached
        ? 0
        : clamp(1 - piece.damage / Math.max(piece.strength, 1), 0, 1);
      baseSupport += health;
      cornerSupport[this.cornerFor(runtime, index)] += health;
    }

    const baseRatio = runtime.baseColumnIndices.length
      ? baseSupport / runtime.baseColumnIndices.length
      : 1;
    const damageRatio = weightedDamage / Math.max(runtime.structuralWeightTotal, 1);
    const floorRatio = floorTotal ? floorLost / floorTotal : 0;
    assembly.stability = clamp(
      runtime.initialStability - (1 - baseRatio) * 0.62 - damageRatio * 0.3 - floorRatio * 0.16,
      0,
      1,
    );

    let worstCorner = -1;
    let worstRatio = 1;
    for (let corner = 0; corner < 4; corner += 1) {
      const initial = runtime.cornerInitial[corner];
      if (initial <= 0) continue;
      const ratio = cornerSupport[corner] / initial;
      if (ratio < worstRatio) {
        worstRatio = ratio;
        worstCorner = corner;
      }
    }

    if (!assembly.collapseStarted && worstCorner >= 0 && worstRatio < 0.46) {
      runtime.sagX = worstCorner & 1 ? 1 : -1;
      runtime.sagZ = worstCorner & 2 ? 1 : -1;
      if (runtime.sagClock === 0) {
        runtime.sagClock = 0.001;
        this.emitCue("dust", contact, 55, assembly.primaryMaterial, assembly.id);
      }
    }

    const severeCorner = worstCorner >= 0 && worstRatio < 0.2;
    if (
      !assembly.collapseStarted &&
      (baseRatio < 0.38 || assembly.stability < 0.34 || (runtime.sagStage >= 2 && severeCorner))
    ) {
      this.beginCollapse(runtime, cause, contact);
    }
  }

  private updateSag(runtime: BuildingRuntime, delta: number): void {
    if (runtime.assembly.collapseStarted) return;
    runtime.sagClock += delta;
    const progress = clamp(runtime.sagClock / 1.05, 0, 1);
    this.v0.set(-runtime.sagZ, 0, runtime.sagX).normalize();
    this.q0.setFromAxisAngle(this.v0, progress * 0.055);

    for (const index of runtime.pieceIndices) {
      const piece = this.pieces[index];
      if (piece.detached || !this.isInSagCorner(runtime, index)) continue;
      const heightFactor = clamp(piece.floor / Math.max(runtime.assembly.topFloor, 1), 0.18, 1);
      const targetY = piece.homePosition.y - progress * (0.2 + heightFactor * 0.75);
      piece.object.position.y = THREE.MathUtils.lerp(
        piece.object.position.y,
        targetY,
        1 - Math.exp(-delta * 5),
      );
      this.q1.copy(this.q0).multiply(piece.homeQuaternion);
      piece.object.quaternion.slerp(this.q1, 1 - Math.exp(-delta * 3.5));
    }

    if (runtime.sagStage < 1 && runtime.sagClock >= 0.34) {
      runtime.sagStage = 1;
      this.peelSagCorner(runtime, 0.12);
    }
    if (runtime.sagStage < 2 && runtime.sagClock >= 0.78) {
      runtime.sagStage = 2;
      this.peelSagCorner(runtime, 0.32);
      this.assessBuilding(runtime, "collapse", runtime.assembly.center);
    }
  }

  private peelSagCorner(runtime: BuildingRuntime, fraction: number): void {
    for (const index of runtime.pieceIndices) {
      const piece = this.pieces[index];
      if (piece.detached || !this.isInSagCorner(runtime, index)) continue;
      if (piece.kind !== "facade" && piece.kind !== "cornice" && piece.kind !== "beam") continue;
      const damage = piece.strength * fraction * (0.75 + deterministicUnit(piece.id) * 0.5);
      this.v0.set(runtime.sagX, -0.3, runtime.sagZ).normalize().multiplyScalar(piece.mass * 1.2);
      this.getWorldPosition(piece, this.v1);
      this.damagePiece(piece, index, damage, this.v0, this.v1, "collapse", false);
    }
  }

  private beginCollapse(
    runtime: BuildingRuntime,
    cause: ImpactCause,
    contact: THREE.Vector3,
  ): void {
    const assembly = runtime.assembly;
    if (assembly.collapseStarted) return;
    assembly.collapseStarted = true;
    assembly.collapseClock = 0;
    runtime.releasedFloors = 0;

    for (const index of runtime.pieceIndices) {
      const piece = this.pieces[index];
      if (piece.detached) continue;
      const floorRank = Math.max(0, runtime.floors.indexOf(piece.floor));
      let delay = 0.08 + floorRank * 0.17;
      if (piece.kind === "column" && floorRank <= 1) delay *= 0.35;
      if (piece.kind === "facade" || piece.kind === "cornice") {
        delay += deterministicUnit(piece.id) * 0.16;
      }
      if (piece.kind === "tank") delay += 0.2;
      piece.collapseDelay = Math.max(0.02, delay);
    }

    if (this.simulationTime - this.lastCollapseTime <= 6) {
      this._chainMultiplier = Math.min(8, this._chainMultiplier + 1);
      this._headlineIndex = this._chainMultiplier >= 3 ? 6 : 4;
      this.emitCue("cheer", contact, 120 * this._chainMultiplier, assembly.primaryMaterial, assembly.id);
    } else {
      this._chainMultiplier = 1;
      this._headlineIndex = 3;
    }
    this.lastCollapseTime = this.simulationTime;
    this.collapsedBuildingCount += 1;
    runtime.collapseAwarded = true;
    this.emitCue("collapse", contact, 160, assembly.primaryMaterial, assembly.id);
    this.emitCue("dust", contact, 110, assembly.primaryMaterial, assembly.id);
    if (cause === "chain") this._headlineIndex = 4;
  }

  private updateCollapse(runtime: BuildingRuntime, delta: number): void {
    const assembly = runtime.assembly;
    assembly.collapseClock += delta;
    while (
      runtime.releasedFloors < runtime.floors.length &&
      assembly.collapseClock >= 0.08 + runtime.releasedFloors * 0.17
    ) {
      const floorCursor = runtime.releasedFloors;
      runtime.releasedFloors += 1;
      this.v0.set(
        assembly.center.x,
        runtime.floorHeights[floorCursor] ?? assembly.center.y,
        assembly.center.z,
      );
      this.emitCue("collapse", this.v0, 90 + floorCursor * 12, assembly.primaryMaterial, assembly.id);
      this.emitCue("dust", this.v0, 70 + floorCursor * 10, assembly.primaryMaterial, assembly.id);
      if (runtime.releasedFloors >= Math.min(3, runtime.floors.length)) {
        this._headlineIndex = this._chainMultiplier >= 3 ? 6 : 5;
      }
    }

    if (
      !runtime.completionCheered &&
      runtime.releasedFloors >= runtime.floors.length &&
      assembly.collapseClock >= 0.08 + runtime.floors.length * 0.17 + 0.45
    ) {
      runtime.completionCheered = true;
      this.emitCue("cheer", assembly.center, 180 * this._chainMultiplier, assembly.primaryMaterial, assembly.id);
    }
  }

  private resolveCoarseBuildingImpacts(): void {
    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      if (
        !piece.detached ||
        piece.sleeping ||
        piece.impactCooldown > 0 ||
        piece.mass < 12 ||
        piece.velocity.lengthSq() < 9
      ) {
        continue;
      }
      this.getWorldPosition(piece, this.v0);
      const contactX = this.v0.x;
      const contactY = this.v0.y;
      const contactZ = this.v0.z;
      for (const runtime of this.buildingRuntime) {
        const assembly = runtime.assembly;
        if (assembly.id === piece.buildingId) continue;
        const halfX = assembly.footprint.x * 0.5 + Math.min(piece.radius, 2);
        const halfZ = assembly.footprint.y * 0.5 + Math.min(piece.radius, 2);
        if (
          Math.abs(this.v0.x - assembly.center.x) > halfX ||
          Math.abs(this.v0.z - assembly.center.z) > halfZ ||
          this.v0.y < GROUND_Y ||
          this.v0.y > runtime.maxY
        ) {
          continue;
        }

        this.v1.copy(piece.velocity).multiplyScalar(clamp(piece.mass, 12, 90) * 0.55);
        const affected = this.damageRadius(
          this.v0.set(contactX, contactY, contactZ),
          this.v1,
          Math.min(5, piece.radius + 2.1),
          "chain",
          runtime,
          false,
        );
        if (affected > 0) {
          piece.impactCooldown = 0.28;
          this.v2.set(contactX - assembly.center.x, 0, contactZ - assembly.center.z);
          if (this.v2.lengthSq() < 0.001) this.v2.set(1, 0, 0);
          this.v2.normalize();
          const intoSurface = piece.velocity.dot(this.v2);
          if (intoSurface < 0) piece.velocity.addScaledVector(this.v2, -intoSurface * 1.25);
          piece.velocity.multiplyScalar(0.48);
          this.v0.set(contactX, contactY, contactZ);
          this.assessBuilding(runtime, "chain", this.v0);
          break;
        }
      }
    }
  }

  private markActivity(position: THREE.Vector3, energy: number, material: MaterialKind): void {
    this._hasActivity = true;
    if (!this.firstImpact) {
      this.firstImpact = true;
      this._headlineIndex = 1;
      this.emitCue("impact", position, energy, material);
    }
  }

  private emitCue(
    type: SimulationCue["type"],
    position: THREE.Vector3,
    energy: number,
    material: MaterialKind,
    buildingId?: string,
  ): void {
    if (this.pendingCues.length >= MAX_CUES_PER_FRAME) return;
    this.pendingCues.push({
      type,
      position: position.clone(),
      energy: Math.max(0, energy),
      material,
      ...(buildingId ? { buildingId } : {}),
    });
  }

  private createBuildingRuntime(assembly: BuildingAssembly): BuildingRuntime {
    const pieceIndices: number[] = [];
    const floorSet = new Set<number>();
    let maxY = assembly.center.y;
    let minFloor = Infinity;
    let structuralWeightTotal = 0;
    for (const piece of assembly.pieces) {
      const index = this.pieceIndex.get(piece);
      if (index === undefined) continue;
      pieceIndices.push(index);
      floorSet.add(piece.floor);
      minFloor = Math.min(minFloor, piece.floor);
      maxY = Math.max(maxY, this.pieceRuntime[index].homeWorld.y + piece.size.y * 0.5);
      structuralWeightTotal += structuralWeight(piece);
    }
    const floors = [...floorSet].sort((a, b) => a - b);
    const floorHeights = floors.map((floor) => {
      let sum = 0;
      let count = 0;
      for (const index of pieceIndices) {
        if (this.pieces[index].floor !== floor) continue;
        sum += this.pieceRuntime[index].homeWorld.y;
        count += 1;
      }
      return count ? sum / count : assembly.center.y;
    });
    if (!Number.isFinite(minFloor)) minFloor = 0;
    const baseColumnIndices = pieceIndices.filter((index) => {
      const piece = this.pieces[index];
      return piece.kind === "column" && piece.floor <= minFloor + 1;
    });
    const runtime: BuildingRuntime = {
      assembly,
      pieceIndices,
      floors,
      floorHeights,
      baseColumnIndices,
      cornerInitial: [0, 0, 0, 0],
      initialStability: clamp(assembly.stability || 1, 0.05, 1),
      structuralWeightTotal,
      maxY,
      sagX: 0,
      sagZ: 0,
      sagClock: 0,
      sagStage: 0,
      releasedFloors: 0,
      collapseAwarded: false,
      waterRuptured: false,
      completionCheered: false,
    };
    for (const index of baseColumnIndices) runtime.cornerInitial[this.cornerFor(runtime, index)] += 1;
    return runtime;
  }

  private cornerFor(runtime: BuildingRuntime, pieceIndex: number): number {
    const position = this.pieceRuntime[pieceIndex].homeWorld;
    let corner = position.x >= runtime.assembly.center.x ? 1 : 0;
    if (position.z >= runtime.assembly.center.z) corner |= 2;
    return corner;
  }

  private isInSagCorner(runtime: BuildingRuntime, pieceIndex: number): boolean {
    const position = this.pieceRuntime[pieceIndex].homeWorld;
    const dx = position.x - runtime.assembly.center.x;
    const dz = position.z - runtime.assembly.center.z;
    return dx * runtime.sagX >= -0.1 && dz * runtime.sagZ >= -0.1;
  }

  private captureSnapshot(time: number): void {
    const pieces = new Float32Array(this.pieces.length * PIECE_STRIDE);
    const pieceFlags = new Uint8Array(this.pieces.length);
    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      const offset = index * PIECE_STRIDE;
      pieces[offset] = piece.object.position.x;
      pieces[offset + 1] = piece.object.position.y;
      pieces[offset + 2] = piece.object.position.z;
      pieces[offset + 3] = piece.object.quaternion.x;
      pieces[offset + 4] = piece.object.quaternion.y;
      pieces[offset + 5] = piece.object.quaternion.z;
      pieces[offset + 6] = piece.object.quaternion.w;
      pieces[offset + 7] = piece.object.scale.x;
      pieces[offset + 8] = piece.object.scale.y;
      pieces[offset + 9] = piece.object.scale.z;
      pieces[offset + 10] = piece.velocity.x;
      pieces[offset + 11] = piece.velocity.y;
      pieces[offset + 12] = piece.velocity.z;
      pieces[offset + 13] = piece.angularVelocity.x;
      pieces[offset + 14] = piece.angularVelocity.y;
      pieces[offset + 15] = piece.angularVelocity.z;
      pieces[offset + 16] = piece.damage;
      pieces[offset + 17] = piece.sleepClock;
      pieces[offset + 18] = piece.collapseDelay;
      pieces[offset + 19] = piece.impactCooldown;
      pieceFlags[index] =
        (piece.detached ? PieceFlag.Detached : 0) |
        (piece.sleeping ? PieceFlag.Sleeping : 0) |
        (this.pieceRuntime[index].shattered ? PieceFlag.Shattered : 0) |
        (piece.object.visible ? PieceFlag.Visible : 0);
    }

    const buildings = new Float32Array(this.buildingRuntime.length * BUILDING_STRIDE);
    const buildingFlags = new Uint8Array(this.buildingRuntime.length);
    for (let index = 0; index < this.buildingRuntime.length; index += 1) {
      const runtime = this.buildingRuntime[index];
      const offset = index * BUILDING_STRIDE;
      buildings[offset] = runtime.assembly.stability;
      buildings[offset + 1] = runtime.assembly.collapseClock;
      buildings[offset + 2] = runtime.sagX;
      buildings[offset + 3] = runtime.sagZ;
      buildings[offset + 4] = runtime.sagClock;
      buildings[offset + 5] = runtime.sagStage;
      buildings[offset + 6] = runtime.releasedFloors;
      buildingFlags[index] =
        (runtime.assembly.collapseStarted ? BuildingFlag.CollapseStarted : 0) |
        (runtime.collapseAwarded ? BuildingFlag.CollapseAwarded : 0) |
        (runtime.waterRuptured ? BuildingFlag.WaterRuptured : 0) |
        (runtime.completionCheered ? BuildingFlag.CompletionCheered : 0);
    }

    const ball = new Float32Array(10);
    this.writeObjectTransform(this.district.ball, ball, 0);
    this.history.push({
      time,
      pieces,
      pieceFlags,
      buildings,
      buildingFlags,
      ball,
      tonnage: this._tonnage,
      chainMultiplier: this._chainMultiplier,
      headlineIndex: this._headlineIndex,
      hasActivity: this._hasActivity,
      firstImpact: this.firstImpact,
      lastCollapseTime: this.lastCollapseTime,
      collapsedBuildingCount: this.collapsedBuildingCount,
      nextCheerTonnage: this.nextCheerTonnage,
    });

    const maxFrames = Math.ceil(HISTORY_WINDOW / SNAPSHOT_STEP) + 2;
    while (this.history.length > maxFrames) this.history.shift();
    this.playbackTime = time;
  }

  private restoreAtTime(time: number): void {
    if (this.history.length === 0) return;
    let upper = this.history.length - 1;
    if (time <= this.history[0].time) upper = 0;
    else if (time >= this.history[upper].time) upper = this.history.length - 1;
    else {
      let low = 0;
      let high = upper;
      while (low + 1 < high) {
        const middle = (low + high) >>> 1;
        if (this.history[middle].time <= time) low = middle;
        else high = middle;
      }
      upper = high;
    }

    const lower = Math.max(0, upper - 1);
    const a = this.history[lower];
    const b = this.history[upper];
    const alpha = a === b ? 0 : clamp((time - a.time) / Math.max(b.time - a.time, 1e-6), 0, 1);
    const discrete = alpha < 0.5 ? a : b;

    for (let index = 0; index < this.pieces.length; index += 1) {
      const piece = this.pieces[index];
      const offset = index * PIECE_STRIDE;
      piece.object.position.set(
        THREE.MathUtils.lerp(a.pieces[offset], b.pieces[offset], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 1], b.pieces[offset + 1], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 2], b.pieces[offset + 2], alpha),
      );
      this.q0.fromArray(a.pieces, offset + 3);
      this.q1.fromArray(b.pieces, offset + 3);
      piece.object.quaternion.copy(this.q0).slerp(this.q1, alpha).normalize();
      piece.object.scale.set(
        THREE.MathUtils.lerp(a.pieces[offset + 7], b.pieces[offset + 7], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 8], b.pieces[offset + 8], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 9], b.pieces[offset + 9], alpha),
      );
      piece.velocity.set(
        THREE.MathUtils.lerp(a.pieces[offset + 10], b.pieces[offset + 10], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 11], b.pieces[offset + 11], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 12], b.pieces[offset + 12], alpha),
      );
      piece.angularVelocity.set(
        THREE.MathUtils.lerp(a.pieces[offset + 13], b.pieces[offset + 13], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 14], b.pieces[offset + 14], alpha),
        THREE.MathUtils.lerp(a.pieces[offset + 15], b.pieces[offset + 15], alpha),
      );
      piece.damage = THREE.MathUtils.lerp(a.pieces[offset + 16], b.pieces[offset + 16], alpha);
      piece.sleepClock = THREE.MathUtils.lerp(a.pieces[offset + 17], b.pieces[offset + 17], alpha);
      piece.collapseDelay = THREE.MathUtils.lerp(a.pieces[offset + 18], b.pieces[offset + 18], alpha);
      piece.impactCooldown = THREE.MathUtils.lerp(a.pieces[offset + 19], b.pieces[offset + 19], alpha);
      const flags = discrete.pieceFlags[index];
      piece.detached = (flags & PieceFlag.Detached) !== 0;
      piece.sleeping = (flags & PieceFlag.Sleeping) !== 0;
      piece.object.visible = (flags & PieceFlag.Visible) !== 0;
      this.pieceRuntime[index].shattered = (flags & PieceFlag.Shattered) !== 0;
    }

    for (let index = 0; index < this.buildingRuntime.length; index += 1) {
      const runtime = this.buildingRuntime[index];
      const offset = index * BUILDING_STRIDE;
      runtime.assembly.stability = THREE.MathUtils.lerp(
        a.buildings[offset],
        b.buildings[offset],
        alpha,
      );
      runtime.assembly.collapseClock = THREE.MathUtils.lerp(
        a.buildings[offset + 1],
        b.buildings[offset + 1],
        alpha,
      );
      runtime.sagX = discrete.buildings[offset + 2];
      runtime.sagZ = discrete.buildings[offset + 3];
      runtime.sagClock = THREE.MathUtils.lerp(
        a.buildings[offset + 4],
        b.buildings[offset + 4],
        alpha,
      );
      runtime.sagStage = discrete.buildings[offset + 5];
      runtime.releasedFloors = discrete.buildings[offset + 6];
      const flags = discrete.buildingFlags[index];
      runtime.assembly.collapseStarted = (flags & BuildingFlag.CollapseStarted) !== 0;
      runtime.collapseAwarded = (flags & BuildingFlag.CollapseAwarded) !== 0;
      runtime.waterRuptured = (flags & BuildingFlag.WaterRuptured) !== 0;
      runtime.completionCheered = (flags & BuildingFlag.CompletionCheered) !== 0;
    }

    this.interpolateObjectTransform(this.district.ball, a.ball, b.ball, alpha);
    this._tonnage = THREE.MathUtils.lerp(a.tonnage, b.tonnage, alpha);
    this._chainMultiplier = THREE.MathUtils.lerp(a.chainMultiplier, b.chainMultiplier, alpha);
    this._headlineIndex = discrete.headlineIndex;
    this._hasActivity = discrete.hasActivity;
    this.firstImpact = discrete.firstImpact;
    this.lastCollapseTime = discrete.lastCollapseTime;
    this.collapsedBuildingCount = discrete.collapsedBuildingCount;
    this.nextCheerTonnage = discrete.nextCheerTonnage;
    this.simulationTime = time;
    this.district.root.updateMatrixWorld(true);
  }

  private writeObjectTransform(object: THREE.Object3D, target: Float32Array, offset: number): void {
    target[offset] = object.position.x;
    target[offset + 1] = object.position.y;
    target[offset + 2] = object.position.z;
    target[offset + 3] = object.quaternion.x;
    target[offset + 4] = object.quaternion.y;
    target[offset + 5] = object.quaternion.z;
    target[offset + 6] = object.quaternion.w;
    target[offset + 7] = object.scale.x;
    target[offset + 8] = object.scale.y;
    target[offset + 9] = object.scale.z;
  }

  private readObjectTransform(object: THREE.Object3D, source: Float32Array, offset: number): void {
    object.position.fromArray(source, offset);
    object.quaternion.fromArray(source, offset + 3).normalize();
    object.scale.fromArray(source, offset + 7);
  }

  private interpolateObjectTransform(
    object: THREE.Object3D,
    a: Float32Array,
    b: Float32Array,
    alpha: number,
  ): void {
    object.position.set(
      THREE.MathUtils.lerp(a[0], b[0], alpha),
      THREE.MathUtils.lerp(a[1], b[1], alpha),
      THREE.MathUtils.lerp(a[2], b[2], alpha),
    );
    this.q0.fromArray(a, 3);
    this.q1.fromArray(b, 3);
    object.quaternion.copy(this.q0).slerp(this.q1, alpha).normalize();
    object.scale.set(
      THREE.MathUtils.lerp(a[7], b[7], alpha),
      THREE.MathUtils.lerp(a[8], b[8], alpha),
      THREE.MathUtils.lerp(a[9], b[9], alpha),
    );
  }

  private getWorldPosition(piece: StructuralPiece, target: THREE.Vector3): THREE.Vector3 {
    piece.object.updateWorldMatrix(true, false);
    return piece.object.getWorldPosition(target);
  }

  private distanceToPiece(position: THREE.Vector3, piece: StructuralPiece): number {
    piece.object.updateWorldMatrix(true, false);
    piece.object.worldToLocal(this.v3.copy(position));
    const dx = Math.max(Math.abs(this.v3.x) - piece.size.x * 0.5, 0);
    const dy = Math.max(Math.abs(this.v3.y) - piece.size.y * 0.5, 0);
    const dz = Math.max(Math.abs(this.v3.z) - piece.size.z * 0.5, 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private setWorldPosition(object: THREE.Object3D, position: THREE.Vector3): void {
    if (!object.parent) {
      object.position.copy(position);
      return;
    }
    object.parent.updateWorldMatrix(true, false);
    object.position.copy(position);
    object.parent.worldToLocal(object.position);
  }

  private limitVector(vector: THREE.Vector3, maximum: number): void {
    const lengthSq = vector.lengthSq();
    if (lengthSq > maximum * maximum) vector.multiplyScalar(maximum / Math.sqrt(lengthSq));
  }

  private makeReport(drainCues: boolean): SimulationFrameReport {
    const cues = drainCues ? this.pendingCues.splice(0) : [];
    return {
      cues,
      tonnage: this._tonnage,
      chainMultiplier: this._chainMultiplier,
      detachedCount: this.countDetached(),
      headline: this.headline,
    };
  }

  private countDetached(): number {
    let count = 0;
    for (const piece of this.pieces) if (piece.detached) count += 1;
    return count;
  }
}
