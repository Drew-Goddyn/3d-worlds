import * as THREE from "three";

import type {
  CueType,
  MaterialKind,
  SimulationCue,
} from "./types";

const HISTORY_SECONDS = 65;
const MAX_EVENTS = 640;

const DUST_CAPACITY = 480;
const WATER_CAPACITY = 420;
const BRICK_CAPACITY = 220;
const STONE_CAPACITY = 170;
const GLASS_CAPACITY = 280;
const SHOCK_CAPACITY = 20;
const FLASH_CAPACITY = 18;
const WATER_RING_CAPACITY = 15;

const TAU = Math.PI * 2;

type DebrisGroup = "brick" | "stone" | "glass";

interface EffectEvent {
  time: number;
  x: number;
  y: number;
  z: number;
  energy: number;
  intensity: number;
  type: CueType;
  material: MaterialKind;
  seed: number;
}

interface PointPool {
  capacity: number;
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  alphas: Float32Array;
  positionAttribute: THREE.BufferAttribute;
  colorAttribute: THREE.BufferAttribute;
  sizeAttribute: THREE.BufferAttribute;
  alphaAttribute: THREE.BufferAttribute;
}

interface InstancedPool {
  capacity: number;
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function hash32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function random01(seed: number, index: number, channel: number): number {
  const mixed =
    seed ^
    Math.imul(index + 1, 0x9e3779b1) ^
    Math.imul(channel + 1, 0x85ebca6b);
  return hash32(mixed) / 0x100000000;
}

function cueTypeCode(type: CueType): number {
  switch (type) {
    case "impact":
      return 1;
    case "detach":
      return 2;
    case "collapse":
      return 3;
    case "shatter":
      return 4;
    case "dust":
      return 5;
    case "water":
      return 6;
    case "cheer":
      return 7;
  }
}

function materialCode(material: MaterialKind): number {
  switch (material) {
    case "brick":
      return 1;
    case "stone":
      return 2;
    case "glass":
      return 3;
    case "concrete":
      return 4;
    case "steel":
      return 5;
    case "wood":
      return 6;
    case "water":
      return 7;
  }
}

function debrisGroup(material: MaterialKind): DebrisGroup | null {
  switch (material) {
    case "glass":
      return "glass";
    case "brick":
    case "wood":
      return "brick";
    case "stone":
    case "concrete":
    case "steel":
      return "stone";
    case "water":
      return null;
  }
}

function canThrowDebris(event: EffectEvent): boolean {
  return (
    event.type === "impact" ||
    event.type === "detach" ||
    event.type === "collapse" ||
    event.type === "shatter"
  );
}

function canThrowDust(event: EffectEvent): boolean {
  if (event.material === "water" || event.material === "glass") return false;
  return (
    event.type === "dust" ||
    event.type === "impact" ||
    event.type === "detach" ||
    event.type === "collapse"
  );
}

function isWaterEvent(event: EffectEvent): boolean {
  return event.type === "water" || event.material === "water";
}

function createPointPool(
  capacity: number,
  blending: THREE.Blending,
  renderOrder: number,
  softCore: number,
): PointPool {
  const positions = new Float32Array(capacity * 3);
  const colors = new Float32Array(capacity * 3);
  const sizes = new Float32Array(capacity);
  const alphas = new Float32Array(capacity);

  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  const sizeAttribute = new THREE.BufferAttribute(sizes, 1);
  const alphaAttribute = new THREE.BufferAttribute(alphas, 1);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  colorAttribute.setUsage(THREE.DynamicDrawUsage);
  sizeAttribute.setUsage(THREE.DynamicDrawUsage);
  alphaAttribute.setUsage(THREE.DynamicDrawUsage);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("aColor", colorAttribute);
  geometry.setAttribute("aSize", sizeAttribute);
  geometry.setAttribute("aAlpha", alphaAttribute);
  geometry.setDrawRange(0, 0);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSoftCore: { value: softCore },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        float perspective = 300.0 / max(2.0, -viewPosition.z);
        gl_PointSize = clamp(aSize * perspective, 1.0, 150.0);
        gl_Position = projectionMatrix * viewPosition;
        vColor = aColor;
        vAlpha = aAlpha;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uSoftCore;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 centered = gl_PointCoord * 2.0 - 1.0;
        float radius = length(centered);
        if (radius > 1.0) discard;
        float feather = 1.0 - smoothstep(uSoftCore, 1.0, radius);
        float backlight = 1.0 + (1.0 - radius) * 0.38;
        gl_FragColor = vec4(vColor * backlight, vAlpha * feather);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending,
  });
  material.toneMapped = false;

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = renderOrder;

  return {
    capacity,
    points,
    geometry,
    material,
    positions,
    colors,
    sizes,
    alphas,
    positionAttribute,
    colorAttribute,
    sizeAttribute,
    alphaAttribute,
  };
}

function createInstancedPool(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  capacity: number,
  renderOrder: number,
): InstancedPool {
  const mesh = new THREE.InstancedMesh(geometry, material, capacity);
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = renderOrder;
  return { capacity, mesh, geometry, material };
}

/**
 * Timeline-addressable spectacle for structural simulation cues.
 *
 * All motion is evaluated analytically from cue time. No particle integrates
 * forward, so seeking or playing the timeline backward rebuilds the exact
 * earlier visual state without special rewind bookkeeping.
 */
export class CinematicEffects {
  private readonly root = new THREE.Group();
  private readonly events: EffectEvent[] = [];

  private readonly dust = createPointPool(
    DUST_CAPACITY,
    THREE.NormalBlending,
    12,
    0.12,
  );
  private readonly water = createPointPool(
    WATER_CAPACITY,
    THREE.AdditiveBlending,
    15,
    0.38,
  );

  private readonly brickDebris: InstancedPool;
  private readonly stoneDebris: InstancedPool;
  private readonly glassDebris: InstancedPool;
  private readonly shocks: InstancedPool;
  private readonly flashes: InstancedPool;
  private readonly waterRings: InstancedPool;

  private readonly matrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly quaternion = new THREE.Quaternion();
  private readonly scale = new THREE.Vector3();
  private readonly euler = new THREE.Euler();
  private readonly color = new THREE.Color();

  private serial = 1;
  private newestCueTime = Number.NEGATIVE_INFINITY;
  private qualityScale = 1;
  private disposed = false;

  constructor(scene: THREE.Scene) {
    this.root.name = "cinematic-effects";

    const brickMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.02,
      flatShading: true,
      vertexColors: true,
    });
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.06,
      flatShading: true,
      vertexColors: true,
    });
    const glassMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexColors: true,
    });
    glassMaterial.toneMapped = false;

    this.brickDebris = createInstancedPool(
      new THREE.BoxGeometry(0.38, 0.2, 0.24),
      brickMaterial,
      BRICK_CAPACITY,
      8,
    );
    this.stoneDebris = createInstancedPool(
      new THREE.DodecahedronGeometry(0.31, 0),
      stoneMaterial,
      STONE_CAPACITY,
      8,
    );
    this.glassDebris = createInstancedPool(
      new THREE.BoxGeometry(0.17, 0.5, 0.018),
      glassMaterial,
      GLASS_CAPACITY,
      14,
    );

    const shockMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    const waterRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    shockMaterial.toneMapped = false;
    flashMaterial.toneMapped = false;
    waterRingMaterial.toneMapped = false;

    this.shocks = createInstancedPool(
      new THREE.TorusGeometry(1, 0.045, 5, 32),
      shockMaterial,
      SHOCK_CAPACITY,
      16,
    );
    this.flashes = createInstancedPool(
      new THREE.IcosahedronGeometry(1, 1),
      flashMaterial,
      FLASH_CAPACITY,
      17,
    );
    this.waterRings = createInstancedPool(
      new THREE.RingGeometry(0.72, 1, 36),
      waterRingMaterial,
      WATER_RING_CAPACITY,
      16,
    );

    this.root.add(
      this.brickDebris.mesh,
      this.stoneDebris.mesh,
      this.glassDebris.mesh,
      this.dust.points,
      this.water.points,
      this.shocks.mesh,
      this.flashes.mesh,
      this.waterRings.mesh,
    );
    scene.add(this.root);
  }

  push(cues: SimulationCue[], timelineTime: number): void {
    if (this.disposed || cues.length === 0 || !Number.isFinite(timelineTime)) {
      return;
    }

    // New simulation after a rewind is a branch: obsolete future spectacle
    // must not reappear when the new branch advances through that time.
    if (timelineTime < this.newestCueTime - 0.0001) {
      while (
        this.events.length > 0 &&
        this.events[this.events.length - 1].time > timelineTime + 0.0001
      ) {
        this.events.pop();
      }
      this.newestCueTime =
        this.events.length > 0
          ? this.events[this.events.length - 1].time
          : timelineTime;
    }

    for (const cue of cues) {
      if (cue.type === "cheer") continue;

      const energy = Number.isFinite(cue.energy) ? Math.max(0, cue.energy) : 0;
      const x = Number.isFinite(cue.position.x) ? cue.position.x : 0;
      const y = Number.isFinite(cue.position.y) ? cue.position.y : 0;
      const z = Number.isFinite(cue.position.z) ? cue.position.z : 0;
      const intensity = clamp(Math.log2(2 + energy) / 6, 0.18, 1.45);
      const timeBits = Math.round(timelineTime * 1000);
      const spatialBits =
        Math.imul(Math.round(x * 16), 73856093) ^
        Math.imul(Math.round(y * 16), 19349663) ^
        Math.imul(Math.round(z * 16), 83492791);
      const seed = hash32(
        timeBits ^
          spatialBits ^
          Math.imul(cueTypeCode(cue.type), 0x27d4eb2d) ^
          Math.imul(materialCode(cue.material), 0x165667b1) ^
          this.serial++,
      );

      this.events.push({
        time: timelineTime,
        x,
        y,
        z,
        energy,
        intensity,
        type: cue.type,
        material: cue.material,
        seed,
      });
    }

    this.newestCueTime = Math.max(this.newestCueTime, timelineTime);
    this.pruneHistory();
  }

  renderAt(timelineTime: number, delta: number): void {
    if (this.disposed || !Number.isFinite(timelineTime)) return;

    // Delta is deliberately unused. Timeline time alone defines every pose,
    // which is what makes arbitrary forward/backward scrubbing lossless.
    void delta;

    this.renderDust(timelineTime);
    this.renderDebris(timelineTime, "brick", this.brickDebris);
    this.renderDebris(timelineTime, "stone", this.stoneDebris);
    this.renderDebris(timelineTime, "glass", this.glassDebris);
    this.renderShockwaves(timelineTime);
    this.renderWater(timelineTime);
  }

  setQuality(mode: "cinematic" | "balanced" | "performance"): void {
    this.qualityScale =
      mode === "cinematic" ? 1 : mode === "balanced" ? 0.68 : 0.42;
  }

  reset(): void {
    this.events.length = 0;
    this.serial = 1;
    this.newestCueTime = Number.NEGATIVE_INFINITY;

    this.finishPoints(this.dust, 0);
    this.finishPoints(this.water, 0);
    this.finishInstances(this.brickDebris, 0);
    this.finishInstances(this.stoneDebris, 0);
    this.finishInstances(this.glassDebris, 0);
    this.finishInstances(this.shocks, 0);
    this.finishInstances(this.flashes, 0);
    this.finishInstances(this.waterRings, 0);
  }

  dispose(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
    this.root.removeFromParent();

    this.dust.geometry.dispose();
    this.dust.material.dispose();
    this.water.geometry.dispose();
    this.water.material.dispose();

    this.disposeInstances(this.brickDebris);
    this.disposeInstances(this.stoneDebris);
    this.disposeInstances(this.glassDebris);
    this.disposeInstances(this.shocks);
    this.disposeInstances(this.flashes);
    this.disposeInstances(this.waterRings);
  }

  private pruneHistory(): void {
    const cutoff = this.newestCueTime - HISTORY_SECONDS;
    let discard = 0;
    while (
      discard < this.events.length &&
      this.events[discard].time < cutoff
    ) {
      discard += 1;
    }
    if (discard > 0) this.events.splice(0, discard);
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS);
    }
  }

  private renderDust(time: number): void {
    let cursor = 0;

    for (const event of this.events) {
      if (!canThrowDust(event)) continue;
      const age = time - event.time;
      const duration = 11 + event.intensity * 5 + random01(event.seed, 0, 9) * 2;
      if (age < 0 || age > duration) continue;

      let amount = 12 + Math.floor(event.intensity * 35);
      if (event.type === "dust") amount += 20;
      if (event.type === "collapse") amount += 18;
      if (event.type === "impact") amount = Math.floor(amount * 0.58);
      amount = Math.max(1, Math.floor(amount * this.qualityScale));

      for (let i = 0; i < amount && cursor < this.dust.capacity; i += 1) {
        const delay = random01(event.seed, i, 0) * 0.6;
        const localAge = age - delay;
        if (localAge < 0) continue;

        const life = clamp(localAge / duration, 0, 1);
        const directionBucket = Math.floor(random01(event.seed, i, 1) * 4);
        const angle =
          directionBucket * (Math.PI * 0.5) +
          (random01(event.seed, i, 2) - 0.5) * 0.8;
        const spread = 0.34 + random01(event.seed, i, 3) * 0.9;
        const roll = 1 - Math.exp(-localAge * (0.42 + event.intensity * 0.12));
        const distance =
          roll * (3.5 + event.intensity * 10) * spread +
          Math.sin(localAge * 1.4 + i) * 0.18;
        const sourceHeight = Math.max(0, event.y - 0.2);
        const settlingHeight = sourceHeight * Math.exp(-localAge * 0.72);
        const billow =
          (0.28 + random01(event.seed, i, 4) * 2.5) *
          (0.35 + Math.sin(localAge * 1.1 + i * 2.17) * 0.12);
        const x =
          event.x +
          Math.cos(angle) * distance +
          (random01(event.seed, i, 5) - 0.5) * 1.6;
        const z =
          event.z +
          Math.sin(angle) * distance +
          (random01(event.seed, i, 6) - 0.5) * 1.6;
        const y = 0.22 + settlingHeight + billow * (0.5 + roll);

        const fadeIn = smoothstep(0, 0.055, life);
        const fadeOut = 1 - smoothstep(0.48, 1, life);
        const alpha =
          fadeIn *
          fadeOut *
          (0.18 + random01(event.seed, i, 7) * 0.28) *
          clamp(event.intensity, 0.35, 1.2);
        const size =
          (0.8 + random01(event.seed, i, 8) * 1.65) *
          (0.5 + roll * (1.25 + event.intensity * 0.45));
        const warmth = random01(event.seed, i, 10);

        this.writePoint(
          this.dust,
          cursor++,
          x,
          y,
          z,
          0.96,
          0.54 + warmth * 0.22,
          0.19 + warmth * 0.15,
          size,
          alpha,
        );
      }

      if (cursor >= this.dust.capacity) break;
    }

    this.finishPoints(this.dust, cursor);
  }

  private renderDebris(
    time: number,
    group: DebrisGroup,
    pool: InstancedPool,
  ): void {
    let cursor = 0;

    for (const event of this.events) {
      if (!canThrowDebris(event) || debrisGroup(event.material) !== group) {
        continue;
      }

      const age = time - event.time;
      const duration = group === "glass" ? 8.5 : 10.5;
      if (age < 0 || age > duration) continue;

      let amount =
        group === "glass"
          ? 16 + Math.floor(event.intensity * 36)
          : 8 + Math.floor(event.intensity * 22);
      if (event.type === "shatter") amount += group === "glass" ? 34 : 10;
      if (event.type === "collapse") amount += group === "glass" ? 12 : 16;
      if (event.type === "detach") amount = Math.floor(amount * 0.55);
      amount = Math.max(1, Math.floor(amount * this.qualityScale));

      for (let i = 0; i < amount && cursor < pool.capacity; i += 1) {
        const delay = random01(event.seed, i, 20) * 0.22;
        const localAge = age - delay;
        if (localAge < 0) continue;

        this.writeDebrisInstance(pool, cursor++, event, i, localAge, duration);
      }

      if (cursor >= pool.capacity) break;
    }

    this.finishInstances(pool, cursor);
  }

  private writeDebrisInstance(
    pool: InstancedPool,
    index: number,
    event: EffectEvent,
    particle: number,
    age: number,
    duration: number,
  ): void {
    const angle = random01(event.seed, particle, 21) * TAU;
    const radialRandom = random01(event.seed, particle, 22);
    const verticalRandom = random01(event.seed, particle, 23);
    const group = debrisGroup(event.material);

    let speed = 2;
    let verticalSpeed = 2;
    let gravity = 9.8;
    if (event.material === "glass") {
      speed = 4.5 + radialRandom * 8.5 + event.intensity * 2.2;
      verticalSpeed = 3.2 + verticalRandom * 8;
      gravity = 6.2;
    } else if (event.material === "brick") {
      speed = 2.6 + radialRandom * 5.8 + event.intensity * 1.5;
      verticalSpeed = 2.2 + verticalRandom * 5.8;
      gravity = 9.8;
    } else if (event.material === "steel") {
      speed = 3.2 + radialRandom * 6.5;
      verticalSpeed = 3 + verticalRandom * 6.5;
      gravity = 8.2;
    } else if (event.material === "wood") {
      speed = 3.8 + radialRandom * 6.2;
      verticalSpeed = 3 + verticalRandom * 7;
      gravity = 7.1;
    } else {
      speed = 1.7 + radialRandom * 4.1 + event.intensity;
      verticalSpeed = 1.6 + verticalRandom * 4.4;
      gravity = 11.4;
    }

    const sideways = (random01(event.seed, particle, 24) - 0.5) * 0.8;
    const vx = Math.cos(angle) * speed - Math.sin(angle) * sideways;
    const vz = Math.sin(angle) * speed + Math.cos(angle) * sideways;
    const originX =
      event.x + (random01(event.seed, particle, 25) - 0.5) * 1.1;
    const originY = Math.max(
      0.12,
      event.y + (random01(event.seed, particle, 26) - 0.5) * 1.2,
    );
    const originZ =
      event.z + (random01(event.seed, particle, 27) - 0.5) * 1.1;
    const impactTime =
      (verticalSpeed +
        Math.sqrt(verticalSpeed * verticalSpeed + 2 * gravity * originY)) /
      gravity;

    let x: number;
    let y: number;
    let z: number;
    if (age <= impactTime) {
      x = originX + vx * age;
      y = originY + verticalSpeed * age - 0.5 * gravity * age * age;
      z = originZ + vz * age;
    } else {
      const after = age - impactTime;
      const slide = (1 - Math.exp(-after * 1.45)) * 0.72;
      const bounce =
        Math.abs(
          Math.sin(after * (7.5 + random01(event.seed, particle, 28) * 5)),
        ) *
        Math.exp(-after * 1.85) *
        (0.25 + verticalRandom * 0.8);
      x = originX + vx * impactTime + vx * slide;
      y = 0.08 + bounce;
      z = originZ + vz * impactTime + vz * slide;
    }

    const life = clamp(age / duration, 0, 1);
    const shrink = 1 - smoothstep(0.78, 1, life);
    const variation = 0.62 + random01(event.seed, particle, 29) * 1.25;
    let sx = variation;
    let sy = variation;
    let sz = variation;
    if (group === "glass") {
      const sparkle = 0.38 + Math.abs(Math.sin(age * 16 + particle)) * 1.15;
      sx *= sparkle;
      sy *= 0.7 + random01(event.seed, particle, 30) * 1.8;
      sz *= 0.7;
    } else if (event.material === "steel") {
      sx *= 0.45;
      sy *= 2.2;
      sz *= 0.42;
    } else if (event.material === "wood") {
      sx *= 0.65;
      sy *= 1.8;
      sz *= 0.6;
    } else if (event.material === "stone") {
      sx *= 1.35;
      sy *= 1.05;
      sz *= 1.2;
    }

    this.position.set(x, y, z);
    this.euler.set(
      age * (4 + random01(event.seed, particle, 31) * 13),
      age * (3 + random01(event.seed, particle, 32) * 11),
      age * (5 + random01(event.seed, particle, 33) * 15),
    );
    this.quaternion.setFromEuler(this.euler);
    this.scale.set(sx * shrink, sy * shrink, sz * shrink);
    this.matrix.compose(this.position, this.quaternion, this.scale);
    pool.mesh.setMatrixAt(index, this.matrix);

    const shade = random01(event.seed, particle, 34);
    switch (event.material) {
      case "brick":
        this.color.setRGB(0.62 + shade * 0.28, 0.16 + shade * 0.14, 0.055);
        break;
      case "stone":
        this.color.setRGB(0.82 + shade * 0.18, 0.67 + shade * 0.19, 0.45 + shade * 0.17);
        break;
      case "glass": {
        const sparkle = 0.65 + Math.abs(Math.sin(age * 18 + particle)) * 0.35;
        this.color.setRGB(0.42 * sparkle, 0.85 * sparkle, 1.0 * sparkle);
        break;
      }
      case "concrete":
        this.color.setRGB(0.58 + shade * 0.2, 0.56 + shade * 0.17, 0.5 + shade * 0.16);
        break;
      case "steel":
        this.color.setRGB(0.58 + shade * 0.35, 0.72 + shade * 0.25, 0.86 + shade * 0.14);
        break;
      case "wood":
        this.color.setRGB(0.5 + shade * 0.25, 0.24 + shade * 0.16, 0.07);
        break;
      case "water":
        this.color.setRGB(0.2, 0.75, 1);
        break;
    }
    pool.mesh.setColorAt(index, this.color);
  }

  private renderShockwaves(time: number): void {
    let ringCursor = 0;
    let flashCursor = 0;

    for (const event of this.events) {
      if (
        event.type !== "impact" &&
        event.type !== "collapse" &&
        event.type !== "shatter"
      ) {
        continue;
      }

      const age = time - event.time;
      if (age >= 0 && age <= 1.65 && ringCursor < this.shocks.capacity) {
        const waveCount = event.type === "collapse" ? 2 : 1;
        for (
          let wave = 0;
          wave < waveCount && ringCursor < this.shocks.capacity;
          wave += 1
        ) {
          const waveAge = age - wave * 0.18;
          if (waveAge < 0) continue;
          const life = clamp(waveAge / 1.65, 0, 1);
          const radius =
            0.12 +
            (1 - Math.exp(-waveAge * 3.1)) *
              (2.4 + event.intensity * 4.8 + wave * 1.1);
          const thickness = 0.75 + (1 - life) * 0.8;

          this.position.set(event.x, Math.max(0.12, event.y), event.z);
          this.euler.set(Math.PI * 0.5, 0, 0);
          this.quaternion.setFromEuler(this.euler);
          this.scale.set(radius, radius, thickness);
          this.matrix.compose(this.position, this.quaternion, this.scale);
          this.shocks.mesh.setMatrixAt(ringCursor, this.matrix);
          this.color.setRGB(
            (1 - life) * 1.0,
            (1 - life) * 0.56,
            (1 - life) * 0.18,
          );
          this.shocks.mesh.setColorAt(ringCursor++, this.color);
        }
      }

      if (age >= 0 && age <= 0.72 && flashCursor < this.flashes.capacity) {
        const life = clamp(age / 0.72, 0, 1);
        const radius =
          0.06 +
          (1 - Math.exp(-age * 9)) * (0.8 + event.intensity * 1.65);
        const brightness = 1 - smoothstep(0.08, 1, life);

        this.position.set(event.x, event.y, event.z);
        this.quaternion.identity();
        this.scale.setScalar(radius);
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.flashes.mesh.setMatrixAt(flashCursor, this.matrix);
        this.color.setRGB(brightness, brightness * 0.72, brightness * 0.3);
        this.flashes.mesh.setColorAt(flashCursor++, this.color);
      }
    }

    this.finishInstances(this.shocks, ringCursor);
    this.finishInstances(this.flashes, flashCursor);
  }

  private renderWater(time: number): void {
    let cursor = 0;
    let ringCursor = 0;

    for (const event of this.events) {
      if (!isWaterEvent(event)) continue;
      const age = time - event.time;
      const duration = 7.5;
      if (age < 0 || age > duration) continue;

      const amount = Math.max(
        12,
        Math.floor((95 + Math.floor(event.intensity * 105)) * this.qualityScale),
      );
      for (let i = 0; i < amount && cursor < this.water.capacity; i += 1) {
        const delay = random01(event.seed, i, 40) * 0.32;
        const localAge = age - delay;
        if (localAge < 0) continue;

        const angle = random01(event.seed, i, 41) * TAU;
        const outward = 4.5 + random01(event.seed, i, 42) * 8.5;
        const upward = 3.5 + random01(event.seed, i, 43) * 10.5;
        const gravity = 8.4;
        const originY = Math.max(0.15, event.y);
        const impactTime =
          (upward + Math.sqrt(upward * upward + 2 * gravity * originY)) /
          gravity;
        const vx = Math.cos(angle) * outward;
        const vz = Math.sin(angle) * outward;

        let x: number;
        let y: number;
        let z: number;
        if (localAge <= impactTime) {
          x = event.x + vx * localAge;
          y = originY + upward * localAge - 0.5 * gravity * localAge * localAge;
          z = event.z + vz * localAge;
        } else {
          const after = localAge - impactTime;
          const run = (1 - Math.exp(-after * 0.72)) * 7.5;
          x = event.x + vx * impactTime + Math.cos(angle) * run;
          y =
            0.08 +
            Math.abs(Math.sin(after * (8 + (i % 5)))) *
              Math.exp(-after * 2.2) *
              0.42;
          z = event.z + vz * impactTime + Math.sin(angle) * run;
        }

        const life = clamp(localAge / duration, 0, 1);
        const alpha =
          smoothstep(0, 0.025, life) *
          (1 - smoothstep(0.55, 1, life)) *
          (0.42 + random01(event.seed, i, 44) * 0.5);
        const size =
          (0.07 + random01(event.seed, i, 45) * 0.18) *
          (1 + smoothstep(0.2, 0.9, life) * 2.2);
        const glint = random01(event.seed, i, 46);

        this.writePoint(
          this.water,
          cursor++,
          x,
          y,
          z,
          0.18 + glint * 0.28,
          0.68 + glint * 0.28,
          0.96 + glint * 0.04,
          size,
          alpha,
        );
      }

      for (
        let wave = 0;
        wave < 3 && ringCursor < this.waterRings.capacity;
        wave += 1
      ) {
        const waveAge = age - wave * 0.23;
        if (waveAge < 0 || waveAge > 3.2) continue;
        const life = waveAge / 3.2;
        const radius =
          0.15 + (1 - Math.exp(-waveAge * 1.5)) * (4 + event.intensity * 5);
        const brightness = (1 - life) * (0.8 - wave * 0.12);

        this.position.set(event.x, Math.max(0.1, event.y), event.z);
        this.euler.set(-Math.PI * 0.5, 0, wave * 0.42);
        this.quaternion.setFromEuler(this.euler);
        this.scale.set(radius, radius, 1);
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.waterRings.mesh.setMatrixAt(ringCursor, this.matrix);
        this.color.setRGB(
          0.14 * brightness,
          0.72 * brightness,
          1.0 * brightness,
        );
        this.waterRings.mesh.setColorAt(ringCursor++, this.color);
      }

      if (cursor >= this.water.capacity && ringCursor >= this.waterRings.capacity) {
        break;
      }
    }

    this.finishPoints(this.water, cursor);
    this.finishInstances(this.waterRings, ringCursor);
  }

  private writePoint(
    pool: PointPool,
    index: number,
    x: number,
    y: number,
    z: number,
    red: number,
    green: number,
    blue: number,
    size: number,
    alpha: number,
  ): void {
    const offset = index * 3;
    pool.positions[offset] = x;
    pool.positions[offset + 1] = y;
    pool.positions[offset + 2] = z;
    pool.colors[offset] = red;
    pool.colors[offset + 1] = green;
    pool.colors[offset + 2] = blue;
    pool.sizes[index] = size;
    pool.alphas[index] = alpha;
  }

  private finishPoints(pool: PointPool, count: number): void {
    pool.geometry.setDrawRange(0, count);
    if (count === 0) return;
    pool.positionAttribute.needsUpdate = true;
    pool.colorAttribute.needsUpdate = true;
    pool.sizeAttribute.needsUpdate = true;
    pool.alphaAttribute.needsUpdate = true;
  }

  private finishInstances(pool: InstancedPool, count: number): void {
    pool.mesh.count = count;
    if (count === 0) return;
    pool.mesh.instanceMatrix.needsUpdate = true;
    if (pool.mesh.instanceColor) pool.mesh.instanceColor.needsUpdate = true;
  }

  private disposeInstances(pool: InstancedPool): void {
    pool.geometry.dispose();
    pool.material.dispose();
  }
}
