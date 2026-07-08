import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#world");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: false
});

const MAX_RENDER_PIXEL_RATIO = 1.75;
function getHighPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO);
}

const renderBudget = {
  pixelRatio: getHighPixelRatio(),
  targetPixelRatio: getHighPixelRatio(),
  mode: "crisp",
  shadowStride: 1,
  shadowFrame: 0,
  wasShadowMoving: false,
  lastPixelRatioChangeAt: 0
};

renderer.setPixelRatio(renderBudget.pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91d7ff);
scene.fog = new THREE.Fog(0xb9e7ff, 80, 210);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 320);
camera.position.set(44, 34, 48);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 7, 0);
controls.enableDamping = true;
controls.maxDistance = 135;
controls.minDistance = 18;
controls.maxPolarAngle = Math.PI * 0.48;

const hemi = new THREE.HemisphereLight(0xeaf8ff, 0xb57f45, 1.25);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff0c2, 4.6);
sun.position.set(-42, 72, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 180;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xb9dfff, 1.1);
fill.position.set(50, 35, -40);
scene.add(fill);

const materials = {
  street: new THREE.MeshStandardMaterial({ color: 0x46525c, roughness: 0.78 }),
  lane: new THREE.MeshStandardMaterial({ color: 0xf8d25c, roughness: 0.6 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0xcbd0cf, roughness: 0.7 }),
  brick: new THREE.MeshStandardMaterial({ color: 0xb94932, roughness: 0.78 }),
  darkBrick: new THREE.MeshStandardMaterial({ color: 0x8f3027, roughness: 0.85 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xd9c7a0, roughness: 0.68 }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0xb6a37e, roughness: 0.8 }),
  glass: new THREE.MeshStandardMaterial({
    color: 0x8fd4f4,
    metalness: 0.03,
    roughness: 0.12,
    transparent: true,
    opacity: 0.72
  }),
  glassDark: new THREE.MeshStandardMaterial({ color: 0x4f95b7, roughness: 0.18, metalness: 0.05 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x6c7884, roughness: 0.38, metalness: 0.42 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0xb8b8ad, roughness: 0.84 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: 0x87877d, roughness: 0.9 }),
  rebar: new THREE.MeshStandardMaterial({ color: 0x473a34, roughness: 0.62, metalness: 0.3 }),
  crane: new THREE.MeshStandardMaterial({ color: 0xf1b329, roughness: 0.45, metalness: 0.2 }),
  ball: new THREE.MeshStandardMaterial({ color: 0x272d33, roughness: 0.42, metalness: 0.65 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x252b30, roughness: 0.35, metalness: 0.75 }),
  red: new THREE.MeshStandardMaterial({ color: 0xd9362c, roughness: 0.45 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xffbf3d, emissive: 0xff9b00, emissiveIntensity: 0.45 }),
  green: new THREE.MeshStandardMaterial({ color: 0x2d944f, roughness: 0.74 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x4fab4b, roughness: 0.82 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x8f6036, roughness: 0.8 }),
  carBlue: new THREE.MeshStandardMaterial({ color: 0x2e78c7, roughness: 0.45, metalness: 0.15 }),
  carRed: new THREE.MeshStandardMaterial({ color: 0xc53a32, roughness: 0.45, metalness: 0.15 }),
  carYellow: new THREE.MeshStandardMaterial({ color: 0xe5b234, roughness: 0.45, metalness: 0.15 }),
  barrier: new THREE.MeshStandardMaterial({ color: 0xf0822d, roughness: 0.54 }),
  billboard: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.48 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf8f4e8, roughness: 0.54 }),
  black: new THREE.MeshStandardMaterial({ color: 0x11181e, roughness: 0.7 }),
  water: new THREE.MeshStandardMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.96, roughness: 0.08, emissive: 0x008cff, emissiveIntensity: 0.45, depthWrite: false }),
  dust: new THREE.MeshStandardMaterial({ color: 0xd5b071, transparent: true, opacity: 0.58, roughness: 1, depthWrite: false }),
  glassShard: new THREE.MeshStandardMaterial({ color: 0xbdefff, transparent: true, opacity: 0.62, roughness: 0.2, metalness: 0.05 })
};

const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  brick: new THREE.BoxGeometry(0.42, 0.2, 0.24),
  slab: new THREE.BoxGeometry(1.35, 0.28, 1.0),
  shard: new THREE.TetrahedronGeometry(0.28, 0),
  dust: new THREE.SphereGeometry(0.65, 10, 8),
  water: new THREE.SphereGeometry(0.18, 8, 6),
  sphere: new THREE.SphereGeometry(1, 20, 16),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 16)
};

const structuralObjects = [];
const buildings = [];
const cars = [];
const trees = [];
const birds = [];
const spectators = [];
const charges = [];
const scheduled = [];

const state = {
  simTime: 0,
  wallTime: performance.now(),
  timeScale: 1,
  slowHeld: false,
  tool: "ball",
  quality: "high",
  actionCamera: false,
  rebuilding: false,
  rewinding: false,
  rewindIndex: -1,
  lastTimelineIndex: 0,
  lastSnapshotTime: -999,
  snapshotCadence: 0.1,
  maxSnapshotSeconds: 65,
  maxSnapshots: 650,
  snapshots: [],
  lastImpactPoint: new THREE.Vector3(0, 8, 0),
  score: { tonnage: 0, chain: 1, style: "PRISTINE" },
  interaction: {
    ballImpactStructuralDamage: false,
    chargeOnStructuralMember: false,
    delayedDetonation: false,
    chainReaction: false,
    slowMoDuringActiveCollapse: false,
    scrubBackward: false,
    scrubForward: false,
    fullRewindNoReload: false,
    resetRebuildAnimation: false,
    actionCameraToggle: false,
    qualitySelectorBehavior: false
  },
  diagnostics: {
    frameSamples: [],
    qualitySamples: [],
    lastPerformanceSample: null,
    perf: {
      enabled: false,
      label: "idle",
      startedAt: performance.now(),
      endedAt: null,
      frameCount: 0,
      buckets: {},
      longFrames: [],
      longTasks: []
    },
    registeredRewindSystems: [
      "structural members",
      "debris instances",
      "particles/dust approximation",
      "water burst",
      "score/readout",
      "crowd/bird reactions",
      "camera/UI timeline state"
    ]
  }
};

const ui = {
  toolButtons: [...document.querySelectorAll("[data-tool]")],
  tonnage: document.querySelector("#tonnage"),
  chain: document.querySelector("#chain"),
  style: document.querySelector("#style"),
  timeline: document.querySelector("#timeline"),
  quality: document.querySelector("#quality"),
  craneYaw: document.querySelector("#craneYaw"),
  cableLength: document.querySelector("#cableLength"),
  swingPower: document.querySelector("#swingPower")
};

const uiCache = {
  tonnage: "",
  chain: "",
  style: "",
  timelineMax: "",
  timelineValue: ""
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tempMatrix = new THREE.Matrix4();
const tempQuat = new THREE.Quaternion();
const tempEuler = new THREE.Euler();
const zeroScale = new THREE.Vector3(0, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0);
const tempOffset = new THREE.Vector3();
const tempDirection = new THREE.Vector3();
const tempSideways = new THREE.Vector3();
const tempForward = new THREE.Vector3();
const tempVertical = new THREE.Vector3();
const tempCableVector = new THREE.Vector3();
const tempActionTarget = new THREE.Vector3();
const tempActionDesired = new THREE.Vector3();
const tempImpactDirection = new THREE.Vector3();
const tempChargeDirection = new THREE.Vector3();
const tempChargePosition = new THREE.Vector3();
const tempAimPoint = new THREE.Vector3();
const tempColor = new THREE.Color();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const actionTargetOffset = new THREE.Vector3(0, 9, 0);
const actionCameraOffset = new THREE.Vector3(14, 10, 17);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function setVec(v, arr) {
  v.set(arr[0], arr[1], arr[2]);
}

function packVec(v) {
  return [round(v.x), round(v.y), round(v.z)];
}

function packQuat(q) {
  return [round(q.x), round(q.y), round(q.z), round(q.w)];
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function applyRendererPixelRatio(value, force = false) {
  const next = Math.round(clamp(value, 1, getHighPixelRatio()) * 20) / 20;
  if (Math.abs(renderer.getPixelRatio() - next) < 0.04) return false;
  const now = performance.now();
  if (!force && now - renderBudget.lastPixelRatioChangeAt < 350) return false;
  renderBudget.pixelRatio = next;
  renderBudget.lastPixelRatioChangeAt = now;
  renderer.setPixelRatio(next);
  return true;
}

function averageFrameMs(count = 90) {
  const samples = state.diagnostics.frameSamples.slice(-count);
  if (!samples.length) return 0;
  return samples.reduce((sum, value) => sum + value, 0) * 1000 / samples.length;
}

function resetPerfCounters(label = "profile") {
  state.diagnostics.perf = {
    enabled: true,
    label,
    startedAt: performance.now(),
    endedAt: null,
    frameCount: 0,
    buckets: {},
    longFrames: [],
    longTasks: []
  };
}

function recordTiming(name, ms) {
  const perf = state.diagnostics.perf;
  if (!perf.enabled) return;
  const bucket = perf.buckets[name] ?? {
    count: 0,
    totalMs: 0,
    maxMs: 0
  };
  bucket.count += 1;
  bucket.totalMs += ms;
  bucket.maxMs = Math.max(bucket.maxMs, ms);
  perf.buckets[name] = bucket;
}

function summarizePerfCounters() {
  const perf = state.diagnostics.perf;
  const elapsedMs = (perf.endedAt ?? performance.now()) - perf.startedAt;
  const buckets = {};
  for (const [name, bucket] of Object.entries(perf.buckets)) {
    buckets[name] = {
      count: bucket.count,
      totalMs: round(bucket.totalMs),
      avgMs: bucket.count ? round(bucket.totalMs / bucket.count) : 0,
      maxMs: round(bucket.maxMs)
    };
  }
  return {
    label: perf.label,
    elapsedMs: round(elapsedMs),
    frameCount: perf.frameCount,
    measuredFps: elapsedMs > 0 ? round(perf.frameCount * 1000 / elapsedMs) : 0,
    buckets,
    longFrames: perf.longFrames.slice(-20),
    longTasks: perf.longTasks.slice(-20)
  };
}

function timed(name, callback) {
  if (!state.diagnostics.perf.enabled) return callback();
  const started = performance.now();
  const result = callback();
  recordTiming(name, performance.now() - started);
  return result;
}

if ("PerformanceObserver" in window) {
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      if (!state.diagnostics.perf.enabled) return;
      for (const entry of list.getEntries()) {
        state.diagnostics.perf.longTasks.push({
          start: round(entry.startTime),
          durationMs: round(entry.duration)
        });
      }
      if (state.diagnostics.perf.longTasks.length > 40) {
        state.diagnostics.perf.longTasks.splice(0, state.diagnostics.perf.longTasks.length - 40);
      }
    });
    longTaskObserver.observe({ entryTypes: ["longtask"] });
  } catch {
    // Long-task observation is optional browser instrumentation.
  }
}

function shouldCastMeshShadow(name, scale) {
  const lowerName = name.toLowerCase();
  const cheapCasters = [
    "street",
    "sidewalk",
    "lane mark",
    "warning light",
    "spectator",
    "rooftop bird",
    "billboard",
    "orange barrier",
    "parked car roof"
  ];
  if (cheapCasters.some((fragment) => lowerName.includes(fragment))) return false;
  return scale.x * scale.y * scale.z >= 0.035;
}

function makeMesh(name, geometry, material, position, scale, parent = scene) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  mesh.castShadow = shouldCastMeshShadow(name, scale);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeBox(name, material, position, scale, parent = scene) {
  return makeMesh(name, geometries.box, material, position, scale, parent);
}

function makeInstances(name, geometry, material, instances, castShadow = false, receiveShadow = true) {
  const mesh = new THREE.InstancedMesh(geometry, material, instances.length);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  const identity = new THREE.Quaternion();
  let hasColor = false;
  instances.forEach((instance, index) => {
    tempMatrix.compose(instance.position, instance.quaternion ?? identity, instance.scale);
    mesh.setMatrixAt(index, tempMatrix);
    if (instance.color != null) {
      tempColor.set(instance.color);
      mesh.setColorAt(index, tempColor);
      hasColor = true;
    }
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (hasColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

function cylinderBetween(name, material, a, b, radius, parent = scene) {
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const length = a.distanceTo(b);
  const mesh = makeMesh(name, geometries.cylinder, material, mid, new THREE.Vector3(radius, length, radius), parent);
  mesh.quaternion.setFromUnitVectors(yAxis, new THREE.Vector3().subVectors(b, a).normalize());
  return mesh;
}

function rememberImpact(point) {
  state.lastImpactPoint.copy(point);
}

function spawnShockwave(center, intensity = 1) {
  debris.dust.spawn(Math.round(10 * intensity), center, {
    life: 6.5,
    scaleMin: 3.2 * intensity,
    scaleMax: 7.6 * intensity,
    flatY: 0.18,
    vxMin: -6.5 * intensity,
    vxMax: 6.5 * intensity,
    vzMin: -6.5 * intensity,
    vzMax: 6.5 * intensity,
    vyMin: 0.05,
    vyMax: 0.75
  });
}

function findMemberById(id) {
  for (const building of buildings) {
    const member = building.members.find((candidate) => candidate.id === id);
    if (member) return member;
  }
  return null;
}

class InstancePool {
  constructor(name, geometry, material, capacity, qualityScale = 1) {
    this.name = name;
    this.capacity = capacity;
    this.qualityScale = qualityScale;
    this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
    this.mesh.name = name;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.count = 0;
    this.items = [];
    this.activeTotal = 0;
    this.highestActiveIndex = -1;
    for (let i = 0; i < capacity; i += 1) {
      this.items.push(this.blank());
    }
    scene.add(this.mesh);
  }

  blank() {
    return {
      active: false,
      position: new THREE.Vector3(0, -1000, 0),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      rotationVelocity: new THREE.Vector3(),
      scale: new THREE.Vector3(0, 0, 0),
      age: 0,
      life: 99,
      settled: false
    };
  }

  qualityLimit() {
    const limits = { high: 1, medium: 0.65, low: 0.36 };
    return Math.max(8, Math.floor(this.capacity * limits[state.quality] * this.qualityScale));
  }

  spawn(count, center, options = {}) {
    let spawned = 0;
    const limit = this.qualityLimit();
    if (this.activeTotal >= limit) return 0;
    for (let i = 0; i < this.capacity && spawned < count && this.activeTotal < limit; i += 1) {
      const item = this.items[i];
      if (item.active) continue;
      item.active = true;
      tempOffset.set(rand(-1, 1), rand(0, 1.5), rand(-1, 1));
      item.position.copy(center).add(tempOffset);
      item.velocity.set(
        rand(options.vxMin ?? -2.5, options.vxMax ?? 2.5),
        rand(options.vyMin ?? 1.5, options.vyMax ?? 7.5),
        rand(options.vzMin ?? -2.5, options.vzMax ?? 2.5)
      );
      item.quaternion.identity();
      item.rotationVelocity.set(rand(-2, 2), rand(-2, 2), rand(-2, 2));
      const s = rand(options.scaleMin ?? 0.7, options.scaleMax ?? 1.45);
      item.scale.set(s * (options.flatX ?? 1), s * (options.flatY ?? 1), s * (options.flatZ ?? 1));
      item.age = 0;
      item.life = options.life ?? 99;
      item.settled = false;
      this.writeMatrix(i);
      this.activeTotal += 1;
      this.highestActiveIndex = Math.max(this.highestActiveIndex, i);
      spawned += 1;
    }
    if (spawned) {
      this.mesh.count = this.highestActiveIndex + 1;
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    return spawned;
  }

  activeCount() {
    return this.activeTotal;
  }

  update(dt, gravity = true, dissipate = false) {
    let dirty = false;
    let drawCountDirty = false;
    for (let i = 0; i < this.capacity; i += 1) {
      const item = this.items[i];
      if (!item.active) continue;
      item.age += dt;
      if (item.age > item.life) {
        item.active = false;
        item.scale.set(0, 0, 0);
        this.activeTotal = Math.max(0, this.activeTotal - 1);
        if (i === this.highestActiveIndex) drawCountDirty = true;
        this.writeMatrix(i);
        dirty = true;
        continue;
      }
      let itemDirty = false;
      if (!item.settled) {
        if (gravity) item.velocity.y -= 9.8 * dt * 0.75;
        item.position.addScaledVector(item.velocity, dt);
        tempEuler.set(
          item.rotationVelocity.x * dt,
          item.rotationVelocity.y * dt,
          item.rotationVelocity.z * dt
        );
        tempQuat.setFromEuler(tempEuler);
        item.quaternion.multiply(tempQuat);
        if (item.position.y < 0.12) {
          item.position.y = 0.12;
          item.velocity.x *= 0.62;
          item.velocity.z *= 0.62;
          item.velocity.y *= -0.18;
          if (item.velocity.lengthSq() < 0.16) item.settled = true;
        }
        itemDirty = true;
      }
      if (dissipate) {
        item.scale.multiplyScalar(1 + dt * 0.18);
        item.velocity.multiplyScalar(0.96);
        itemDirty = true;
      }
      if (itemDirty) {
        this.writeMatrix(i);
        dirty = true;
      }
    }
    if (drawCountDirty) this.syncDrawCount();
    if (dirty) this.mesh.instanceMatrix.needsUpdate = true;
  }

  writeMatrix(index) {
    const item = this.items[index];
    tempMatrix.compose(item.position, item.quaternion, item.active ? item.scale : zeroScale);
    this.mesh.setMatrixAt(index, tempMatrix);
  }

  syncDrawCount() {
    for (let i = this.capacity - 1; i >= 0; i -= 1) {
      if (this.items[i].active) {
        this.highestActiveIndex = i;
        this.mesh.count = i + 1;
        return;
      }
    }
    this.highestActiveIndex = -1;
    this.mesh.count = 0;
  }

  reset() {
    for (let i = 0; i < this.capacity; i += 1) {
      const item = this.items[i];
      item.active = false;
      item.age = 0;
      item.life = 99;
      item.settled = false;
    }
    this.activeTotal = 0;
    this.highestActiveIndex = -1;
    this.mesh.count = 0;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  capture() {
    const active = [];
    for (let index = 0; index <= this.highestActiveIndex; index += 1) {
      const item = this.items[index];
      if (!item.active) continue;
      const p = item.position;
      const v = item.velocity;
      const q = item.quaternion;
      const rv = item.rotationVelocity;
      const s = item.scale;
      active.push([
        index,
        round(p.x),
        round(p.y),
        round(p.z),
        round(v.x),
        round(v.y),
        round(v.z),
        round(q.x),
        round(q.y),
        round(q.z),
        round(q.w),
        round(rv.x),
        round(rv.y),
        round(rv.z),
        round(s.x),
        round(s.y),
        round(s.z),
        round(item.age),
        round(item.life),
        item.settled ? 1 : 0
      ]);
    }
    return { sparse: 1, active };
  }

  restore(snapshot) {
    this.activeTotal = 0;
    this.highestActiveIndex = -1;
    if (Array.isArray(snapshot)) {
      snapshot.forEach((data, index) => {
        const item = this.items[index];
        if (!data || data[0] === 0) {
          item.active = false;
          item.scale.set(0, 0, 0);
        } else {
          item.active = true;
          item.position.set(data[1], data[2], data[3]);
          item.velocity.set(data[4], data[5], data[6]);
          item.quaternion.set(data[7], data[8], data[9], data[10]);
          item.rotationVelocity.set(data[11], data[12], data[13]);
          item.scale.set(data[14], data[15], data[16]);
          item.age = data[17];
          item.life = data[18];
          item.settled = data[19] === 1;
          this.activeTotal += 1;
          this.highestActiveIndex = index;
        }
        this.writeMatrix(index);
      });
      this.mesh.count = this.highestActiveIndex + 1;
      this.mesh.instanceMatrix.needsUpdate = true;
      return;
    }

    for (let index = 0; index < this.capacity; index += 1) {
      const item = this.items[index];
      item.active = false;
      item.scale.set(0, 0, 0);
      this.writeMatrix(index);
    }
    for (const data of snapshot.active ?? []) {
      const index = data[0];
      const item = this.items[index];
      item.active = true;
      item.position.set(data[1], data[2], data[3]);
      item.velocity.set(data[4], data[5], data[6]);
      item.quaternion.set(data[7], data[8], data[9], data[10]);
      item.rotationVelocity.set(data[11], data[12], data[13]);
      item.scale.set(data[14], data[15], data[16]);
      item.age = data[17];
      item.life = data[18];
      item.settled = data[19] === 1;
      this.activeTotal += 1;
      this.highestActiveIndex = Math.max(this.highestActiveIndex, index);
      this.writeMatrix(index);
    }
    this.mesh.count = this.highestActiveIndex + 1;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

const debris = {
  brick: new InstancePool("instanced-brick-debris", geometries.brick, materials.brick, 420),
  glass: new InstancePool("instanced-glass-shards", geometries.shard, materials.glassShard, 420),
  slab: new InstancePool("instanced-stone-slabs", geometries.slab, materials.stoneDark, 220),
  dust: new InstancePool("instanced-amber-dust", geometries.dust, materials.dust, 160, 0.9),
  water: new InstancePool("instanced-water-burst", geometries.water, materials.water, 180, 0.8)
};

for (const pool of [debris.glass, debris.dust, debris.water]) {
  pool.mesh.castShadow = false;
  pool.mesh.receiveShadow = false;
}

class StructuralMember {
  constructor(building, options) {
    this.building = building;
    this.id = `${building.id}-${building.members.length}`;
    this.kind = options.kind;
    this.materialType = options.materialType;
    this.mesh = makeBox(this.id, materials[options.material], options.position, options.scale);
    this.mesh.userData.member = this;
    this.strength = options.strength;
    this.mass = options.mass;
    this.structural = options.structural !== false;
    this.mesh.castShadow = this.structural && this.mass >= 2 && this.materialType !== "glass";
    this.floor = options.floor ?? 0;
    this.health = 1;
    this.dynamic = false;
    this.broken = false;
    this.settled = false;
    this.velocity = new THREE.Vector3();
    this.rotationVelocity = new THREE.Vector3();
    this.initial = this.captureTransform();
    structuralObjects.push(this.mesh);
    building.members.push(this);
  }

  captureTransform() {
    return {
      position: this.mesh.position.clone(),
      quaternion: this.mesh.quaternion.clone(),
      scale: this.mesh.scale.clone(),
      visible: this.mesh.visible
    };
  }

  damage(amount, sourcePosition, source = "impact") {
    if (this.broken) return false;
    const previous = this.health;
    this.health = clamp(this.health - amount / this.strength, 0, 1);
    if (this.health < 0.65) {
      this.mesh.rotation.x += rand(-0.01, 0.01);
      this.mesh.rotation.z += rand(-0.015, 0.015);
      this.mesh.scale.x = this.initial.scale.x * (0.98 + this.health * 0.02);
    }
    if (this.health <= 0.02) {
      this.break(sourcePosition, source);
    }
    return previous !== this.health;
  }

  break(sourcePosition = this.mesh.position, source = "impact") {
    if (this.broken) return;
    this.broken = true;
    this.dynamic = true;
    const away = tempImpactDirection.subVectors(this.mesh.position, sourcePosition).setY(0);
    if (away.lengthSq() < 0.01) away.set(rand(-1, 1), 0, rand(-1, 1));
    away.normalize();
    const lift = this.kind === "floor" ? rand(0.3, 1.4) : rand(1.2, 4.8);
    const impulse = rand(1.2, 5.5);
    this.velocity.set(away.x * impulse, lift, away.z * impulse);
    this.rotationVelocity.set(rand(-1.4, 1.4), rand(-1.2, 1.2), rand(-1.4, 1.4));
    this.spawnMaterialDebris(source);
    this.building.onMemberBroken(this, source);
  }

  spawnMaterialDebris(source) {
    const center = this.mesh.position;
    if (this.materialType === "brick") debris.brick.spawn(22, center, { life: 99, scaleMin: 0.7, scaleMax: 1.3 });
    if (this.materialType === "glass") debris.glass.spawn(28, center, { life: 42, scaleMin: 0.7, scaleMax: 1.8, vyMax: 6.2 });
    if (this.materialType === "stone") debris.slab.spawn(10, center, { life: 99, scaleMin: 0.8, scaleMax: 1.6, flatY: 0.55 });
    if (this.materialType === "concrete") {
      debris.slab.spawn(8, center, { life: 99, scaleMin: 0.55, scaleMax: 1.2, flatY: 0.45 });
      debris.brick.spawn(12, center, { life: 99, scaleMin: 0.45, scaleMax: 0.9 });
    }
    if (this.materialType === "steel") {
      this.mesh.scale.x *= 0.8;
      this.mesh.rotation.z += rand(-0.22, 0.22);
    }
    debris.dust.spawn(source === "water" ? 5 : 9, center, { life: 9, scaleMin: 1.8, scaleMax: 4.4, vyMin: 0.2, vyMax: 1.6 });
  }

  update(dt) {
    if (!this.dynamic || this.settled) return;
    this.velocity.y -= 9.8 * dt * 0.65;
    this.mesh.position.addScaledVector(this.velocity, dt);
    this.mesh.rotation.x += this.rotationVelocity.x * dt;
    this.mesh.rotation.y += this.rotationVelocity.y * dt;
    this.mesh.rotation.z += this.rotationVelocity.z * dt;
    if (this.mesh.position.y < this.mesh.scale.y * 0.5) {
      this.mesh.position.y = this.mesh.scale.y * 0.5;
      if (!this.settled) {
        debris.dust.spawn(6, this.mesh.position, { life: 8, scaleMin: 2.1, scaleMax: 5.2, vyMin: 0.1, vyMax: 1.2 });
        spawnShockwave(this.mesh.position, 0.65);
      }
      this.velocity.multiplyScalar(0.28);
      this.velocity.y = Math.abs(this.velocity.y) * 0.12;
      if (this.velocity.lengthSq() < 0.18) this.settled = true;
      crushNearbyStreetObjects(this.mesh.position, this.mass);
    }
  }

  capture() {
    const p = this.mesh.position;
    const q = this.mesh.quaternion;
    const r = this.mesh.rotation;
    const v = this.velocity;
    const rv = this.rotationVelocity;
    const sc = this.mesh.scale;
    return [
      round(this.health),
      this.dynamic ? 1 : 0,
      this.broken ? 1 : 0,
      this.settled ? 1 : 0,
      round(p.x),
      round(p.y),
      round(p.z),
      round(q.x),
      round(q.y),
      round(q.z),
      round(q.w),
      round(r.x),
      round(r.y),
      round(r.z),
      round(v.x),
      round(v.y),
      round(v.z),
      round(rv.x),
      round(rv.y),
      round(rv.z),
      round(sc.x),
      round(sc.y),
      round(sc.z),
      this.mesh.visible ? 1 : 0
    ];
  }

  restore(data) {
    if (Array.isArray(data)) {
      this.health = data[0];
      this.dynamic = data[1] === 1;
      this.broken = data[2] === 1;
      this.settled = data[3] === 1;
      this.mesh.position.set(data[4], data[5], data[6]);
      this.mesh.quaternion.set(data[7], data[8], data[9], data[10]);
      this.mesh.rotation.set(data[11], data[12], data[13]);
      this.velocity.set(data[14], data[15], data[16]);
      this.rotationVelocity.set(data[17], data[18], data[19]);
      this.mesh.scale.set(data[20], data[21], data[22]);
      this.mesh.visible = data[23] === 1;
      return;
    }
    this.health = data.h;
    this.dynamic = data.d === 1;
    this.broken = data.b === 1;
    this.settled = data.s === 1;
    setVec(this.mesh.position, data.p);
    this.mesh.quaternion.set(data.q[0], data.q[1], data.q[2], data.q[3]);
    this.mesh.rotation.set(data.r[0], data.r[1], data.r[2]);
    setVec(this.velocity, data.v);
    setVec(this.rotationVelocity, data.rv);
    setVec(this.mesh.scale, data.sc);
    this.mesh.visible = data.vis === 1;
  }

  reset() {
    this.health = 1;
    this.dynamic = false;
    this.broken = false;
    this.settled = false;
    this.velocity.set(0, 0, 0);
    this.rotationVelocity.set(0, 0, 0);
    this.mesh.position.copy(this.initial.position);
    this.mesh.quaternion.copy(this.initial.quaternion);
    this.mesh.scale.copy(this.initial.scale);
    this.mesh.visible = this.initial.visible;
  }
}

class Building {
  constructor(id, name, position, size, type) {
    this.id = id;
    this.name = name;
    this.position = position.clone();
    this.size = size.clone();
    this.type = type;
    this.members = [];
    this.collapsing = false;
    this.collapsed = false;
    this.chainSent = false;
    this.waterBurst = false;
    this.build();
    buildings.push(this);
  }

  addMember(kind, material, materialType, local, scale, strength, mass, structural = true, floor = 0) {
    const position = this.position.clone().add(local);
    return new StructuralMember(this, { kind, material, materialType, position, scale, strength, mass, structural, floor });
  }

  build() {
    if (this.type === "bank") this.buildBank();
    if (this.type === "warehouse") this.buildWarehouse();
    if (this.type === "tower") this.buildGlassTower();
    if (this.type === "midrise") this.buildMidrise();
    if (this.type === "parking") this.buildParking();
  }

  frame(width, depth, floors, height, material, materialType) {
    const floorHeight = height / floors;
    const xs = [-width / 2, width / 2];
    const zs = [-depth / 2, depth / 2];
    for (let f = 0; f < floors; f += 1) {
      const y = f * floorHeight + floorHeight / 2;
      for (const x of xs) for (const z of zs) {
        this.addMember("column", material, materialType, new THREE.Vector3(x, y, z), new THREE.Vector3(0.36, floorHeight, 0.36), 1.4, 8, true, f);
      }
      this.addMember("floor", "concrete", "concrete", new THREE.Vector3(0, f * floorHeight + 0.12, 0), new THREE.Vector3(width * 0.9, 0.22, depth * 0.9), 1.65, 16, true, f);
      this.addMember("beam", "steel", "steel", new THREE.Vector3(0, f * floorHeight + floorHeight - 0.15, -depth / 2), new THREE.Vector3(width, 0.18, 0.22), 1.2, 5, true, f);
      this.addMember("beam", "steel", "steel", new THREE.Vector3(0, f * floorHeight + floorHeight - 0.15, depth / 2), new THREE.Vector3(width, 0.18, 0.22), 1.2, 5, true, f);
    }
  }

  buildBank() {
    this.frame(14, 11, 3, 12, "stone", "stone");
    this.addMember("roof", "stoneDark", "stone", new THREE.Vector3(0, 12.4, 0), new THREE.Vector3(15.5, 0.8, 12.5), 1.7, 20, true, 3);
    this.addMember("cornice", "stone", "stone", new THREE.Vector3(0, 10.8, -5.85), new THREE.Vector3(16.2, 0.7, 0.5), 1.2, 6, false, 3);
    for (let i = -2; i <= 2; i += 1) {
      this.addMember("front-column", "stone", "stone", new THREE.Vector3(i * 2.4, 4.7, -6.05), new THREE.Vector3(0.44, 9.4, 0.44), 1.25, 7, true, 0);
      this.addMember("window", "glassDark", "glass", new THREE.Vector3(i * 2.3, 5.8, -6.32), new THREE.Vector3(1.1, 2.2, 0.08), 0.6, 1, false, 1);
    }
  }

  buildWarehouse() {
    this.frame(20, 10, 4, 15, "darkBrick", "brick");
    for (let f = 0; f < 4; f += 1) {
      for (let i = -4; i <= 4; i += 1) {
        const y = 2.2 + f * 3.4;
        this.addMember("brick-facade", "brick", "brick", new THREE.Vector3(i * 2.1, y, -5.2), new THREE.Vector3(1.2, 1.65, 0.18), 0.55, 1.4, false, f);
        this.addMember("warehouse-window", "glassDark", "glass", new THREE.Vector3(i * 2.1, y + 0.25, -5.36), new THREE.Vector3(0.82, 0.92, 0.08), 0.35, 0.7, false, f);
      }
    }
    this.addMember("fire-escape", "steel", "steel", new THREE.Vector3(8.8, 7.7, -5.8), new THREE.Vector3(0.18, 8, 0.35), 0.65, 1.6, false, 2);
  }

  buildGlassTower() {
    this.frame(13, 13, 9, 36, "steel", "steel");
    for (let f = 0; f < 9; f += 1) {
      const y = 2 + f * 3.8;
      for (let side = 0; side < 4; side += 1) {
        for (let i = -2; i <= 2; i += 1) {
          const horizontal = side < 2;
          const local = horizontal
            ? new THREE.Vector3(i * 2.35, y, side === 0 ? -6.65 : 6.65)
            : new THREE.Vector3(side === 2 ? -6.65 : 6.65, y, i * 2.35);
          const scale = horizontal ? new THREE.Vector3(1.8, 1.55, 0.08) : new THREE.Vector3(0.08, 1.55, 1.8);
          this.addMember("curtain-glass", "glass", "glass", local, scale, 0.42, 0.8, false, f);
        }
      }
    }
    this.addMember("roof-mech", "steel", "steel", new THREE.Vector3(0, 37, 0), new THREE.Vector3(5.5, 1.4, 4), 0.95, 4, false, 9);
  }

  buildMidrise() {
    this.frame(14, 12, 5, 20, "concrete", "concrete");
    for (let f = 0; f < 5; f += 1) {
      for (let i = -2; i <= 2; i += 1) {
        this.addMember("mid-window", "glassDark", "glass", new THREE.Vector3(i * 2.35, 2.4 + f * 3.6, -6.25), new THREE.Vector3(1.2, 1.2, 0.08), 0.42, 0.7, false, f);
      }
    }
    this.addWaterTower();
  }

  addWaterTower() {
    const top = this.position.clone().add(new THREE.Vector3(0, 24.5, 0));
    const tank = makeMesh(`${this.id}-water-tower-tank`, geometries.cylinder, materials.stoneDark, top, new THREE.Vector3(2.2, 2.8, 2.2));
    tank.rotation.z = Math.PI / 2;
    tank.userData.waterTower = this;
    this.waterTank = tank;
    for (let i = 0; i < 4; i += 1) {
      const x = i < 2 ? -1.8 : 1.8;
      const z = i % 2 === 0 ? -1.8 : 1.8;
      cylinderBetween(`${this.id}-water-leg-${i}`, materials.steel, top.clone().add(new THREE.Vector3(x, -3.5, z)), top.clone().add(new THREE.Vector3(x * 0.6, -0.9, z * 0.6)), 0.08);
    }
  }

  buildParking() {
    this.frame(18, 16, 5, 15, "concrete", "concrete");
    for (let f = 0; f < 5; f += 1) {
      this.addMember("parking-ramp", "concrete", "concrete", new THREE.Vector3(0, 1.5 + f * 2.8, 0), new THREE.Vector3(15, 0.18, 5), 1.1, 9, true, f);
      for (let i = -3; i <= 3; i += 1) {
        this.addMember("parking-rail", "concrete", "concrete", new THREE.Vector3(i * 2.4, 2.7 + f * 2.8, -8.2), new THREE.Vector3(1.4, 0.2, 0.18), 0.55, 1, false, f);
      }
    }
  }

  damageAt(point, radius, amount, source = "impact") {
    let changed = false;
    const radiusSq = radius * radius;
    for (const member of this.members) {
      const distanceSq = member.mesh.position.distanceToSquared(point);
      if (distanceSq > radiusSq) continue;
      const distance = Math.sqrt(distanceSq);
      const falloff = 1 - distance / radius;
      if (member.damage(amount * falloff, point, source)) changed = true;
    }
    if (changed) {
      if (source === "ball") state.interaction.ballImpactStructuralDamage = true;
      this.evaluateStability(source);
    }
    return changed;
  }

  onMemberBroken(member, source) {
    state.score.tonnage += Math.round(member.mass * 2.4);
    if (member.kind === "curtain-glass" || member.materialType === "glass") state.score.style = "GLASS RAIN";
    if (member.kind === "floor") state.score.style = "PANCAKE";
    if (source === "charge") state.score.style = "IMPLOSION";
    this.evaluateStability(source);
  }

  evaluateStability(source) {
    if (this.collapsing) return;
    const structural = this.members.filter((m) => m.structural);
    const broken = structural.filter((m) => m.broken || m.health < 0.18);
    const lowSupports = structural.filter((m) => m.kind === "column" && (m.broken || m.health < 0.22));
    if (broken.length / structural.length > 0.26 || lowSupports.length >= 3) {
      this.startCollapse(source);
    }
  }

  startCollapse(source = "impact") {
    if (this.collapsing) return;
    rememberImpact(this.position);
    this.collapsing = true;
    state.score.style = source === "chain" ? "CHAIN DROP" : "COLLAPSE";
    const maxFloor = Math.max(...this.members.map((m) => m.floor));
    for (let floor = maxFloor; floor >= 0; floor -= 1) {
      schedule(0.18 * (maxFloor - floor), () => {
        for (const member of this.members.filter((m) => m.floor === floor && !m.broken)) {
          if (member.structural || member.kind.includes("facade") || member.materialType === "glass") {
            member.break(this.position, source);
          }
        }
        const plumeCenter = this.position.clone().add(new THREE.Vector3(0, floor * 2.8 + 1.2, 0));
        debris.dust.spawn(16, plumeCenter, {
          life: 10,
          scaleMin: 3.4,
          scaleMax: 9.2,
          vxMin: -4,
          vxMax: 4,
          vzMin: -4,
          vzMax: 4,
          vyMin: 0.2,
          vyMax: 1.6
        });
        if (floor <= 1) spawnShockwave(plumeCenter, 1.05);
      });
    }
    schedule(1.2, () => {
      this.collapsed = true;
      crushNearbyStreetObjects(this.position, 20);
      this.sendChainReaction();
    });
  }

  sendChainReaction() {
    if (this.chainSent) return;
    this.chainSent = true;
    for (const other of buildings) {
      if (other === this || other.collapsing) continue;
      const distance = other.position.distanceTo(this.position);
      if (distance < 32) {
        schedule(0.6, () => {
          const chainPoint = this.position.clone().lerp(other.position, 0.5);
          rememberImpact(chainPoint);
          other.damageAt(chainPoint, 12, 1.45, "chain");
          state.interaction.chainReaction = true;
          state.score.chain = Math.max(state.score.chain, 2);
          state.score.style = "CHAIN DROP";
        });
        return;
      }
    }
  }

  ruptureWaterTower(sourcePosition) {
    if (this.waterBurst || !this.waterTank) return;
    this.waterBurst = true;
    rememberImpact(this.waterTank.position);
    this.waterTank.rotation.x += 0.8;
    this.waterTank.position.x += 1.2;
    debris.water.spawn(95, this.waterTank.position, {
      life: 6,
      scaleMin: 4.0,
      scaleMax: 8.0,
      vxMin: -7,
      vxMax: 7,
      vzMin: -7,
      vzMax: 7,
      vyMin: 1,
      vyMax: 5
    });
    debris.dust.spawn(10, this.waterTank.position, { life: 7, scaleMin: 2.4, scaleMax: 5.2, vyMin: 0.3, vyMax: 1.6 });
    debris.water.spawn(26, this.position.clone().add(new THREE.Vector3(0, 1.2, 0)), {
      life: 5,
      scaleMin: 3.5,
      scaleMax: 7.5,
      flatY: 0.16,
      vxMin: -5,
      vxMax: 5,
      vzMin: -5,
      vzMax: 5,
      vyMin: 0.05,
      vyMax: 0.45
    });
    this.damageAt(sourcePosition || this.waterTank.position, 10, 0.75, "water");
  }

  update(dt) {
    for (const member of this.members) member.update(dt);
    if (this.type === "midrise" && !this.waterBurst && this.collapsing) {
      this.ruptureWaterTower(this.position);
    }
  }

  capture() {
    return {
      id: this.id,
      collapsing: this.collapsing ? 1 : 0,
      collapsed: this.collapsed ? 1 : 0,
      chainSent: this.chainSent ? 1 : 0,
      waterBurst: this.waterBurst ? 1 : 0,
      tank: this.waterTank ? {
        p: packVec(this.waterTank.position),
        r: [round(this.waterTank.rotation.x), round(this.waterTank.rotation.y), round(this.waterTank.rotation.z)],
        vis: this.waterTank.visible ? 1 : 0
      } : null,
      members: this.members.map((m) => m.capture())
    };
  }

  restore(data) {
    this.collapsing = data.collapsing === 1;
    this.collapsed = data.collapsed === 1;
    this.chainSent = data.chainSent === 1;
    this.waterBurst = data.waterBurst === 1;
    if (this.waterTank && data.tank) {
      setVec(this.waterTank.position, data.tank.p);
      this.waterTank.rotation.set(data.tank.r[0], data.tank.r[1], data.tank.r[2]);
      this.waterTank.visible = data.tank.vis === 1;
    }
    data.members.forEach((memberData, index) => this.members[index].restore(memberData));
  }

  reset() {
    this.collapsing = false;
    this.collapsed = false;
    this.chainSent = false;
    this.waterBurst = false;
    for (const member of this.members) member.reset();
    if (this.waterTank) {
      this.waterTank.position.copy(this.position).add(new THREE.Vector3(0, 24.5, 0));
      this.waterTank.rotation.set(0, 0, Math.PI / 2);
      this.waterTank.visible = true;
    }
  }
}

function schedule(delay, fn) {
  scheduled.push({ time: state.simTime + delay, fn });
  scheduled.sort((a, b) => a.time - b.time);
}

function processSchedule() {
  while (scheduled.length && scheduled[0].time <= state.simTime) {
    const event = scheduled.shift();
    event.fn();
  }
}

function buildGround() {
  makeBox("street east-west", materials.street, new THREE.Vector3(0, -0.05, 0), new THREE.Vector3(92, 0.1, 16));
  makeBox("street north-south", materials.street, new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(16, 0.1, 82));
  makeBox("sidewalk north", materials.sidewalk, new THREE.Vector3(0, 0.02, -13), new THREE.Vector3(88, 0.12, 5));
  makeBox("sidewalk south", materials.sidewalk, new THREE.Vector3(0, 0.02, 13), new THREE.Vector3(88, 0.12, 5));
  const laneMarks = [];
  for (let i = -9; i <= 9; i += 1) {
    laneMarks.push({
      position: new THREE.Vector3(i * 4.7, 0.05, 0),
      scale: new THREE.Vector3(1.6, 0.04, 0.14)
    });
  }
  makeInstances("lane mark", geometries.box, materials.lane, laneMarks, false, true);
}

function buildStreetLife() {
  const carColors = [materials.carBlue, materials.carRed, materials.carYellow];
  const carPositions = [
    [-31, 0.45, 4], [-24, 0.45, -4], [22, 0.45, 4], [34, 0.45, -4], [5, 0.45, 20], [-6, 0.45, -22]
  ];
  carPositions.forEach((p, i) => {
    const group = new THREE.Group();
    group.position.set(p[0], p[1], p[2]);
    const body = makeBox("parked car body", carColors[i % carColors.length], new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.6, 0.55, 1.35), group);
    const roof = makeBox("parked car roof", materials.glassDark, new THREE.Vector3(0, 0.45, 0), new THREE.Vector3(1.25, 0.48, 1.0), group);
    group.userData = { body, roof, crushed: false, initialScale: body.scale.clone() };
    scene.add(group);
    cars.push(group);
  });

  for (let i = 0; i < 18; i += 1) {
    const group = new THREE.Group();
    group.position.set(rand(-42, 42), 0, i % 2 ? rand(17, 26) : rand(-26, -17));
    const trunk = makeMesh("tree trunk", geometries.cylinder, materials.trunk, new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(0.16, 2.2, 0.16), group);
    const crown = makeMesh("tree crown", geometries.sphere, materials.leaf, new THREE.Vector3(0, 3.0, 0), new THREE.Vector3(1.05, 1.1, 1.05), group);
    group.userData = { trunk, crown, snapped: false };
    scene.add(group);
    trees.push(group);
  }

  const barriers = [];
  const warningLights = [];
  for (let i = -7; i <= 7; i += 1) {
    barriers.push({
      position: new THREE.Vector3(i * 4, 0.45, -18),
      scale: new THREE.Vector3(2.0, 0.8, 0.2)
    });
    barriers.push({
      position: new THREE.Vector3(i * 4, 0.45, 18),
      scale: new THREE.Vector3(2.0, 0.8, 0.2)
    });
    if (i % 3 === 0) {
      warningLights.push({
        position: new THREE.Vector3(i * 4, 1.15, -18),
        scale: new THREE.Vector3(0.22, 0.22, 0.22)
      });
    }
  }
  makeInstances("orange barrier", geometries.box, materials.barrier, barriers, false, true);
  makeInstances("warning light", geometries.sphere, materials.amber, warningLights, false, false);

  for (let i = 0; i < 22; i += 1) {
    const group = new THREE.Group();
    group.position.set(-34 + i * 3.1, 0, 24 + Math.sin(i) * 1.4);
    makeMesh("spectator body", geometries.cylinder, i % 3 ? materials.white : materials.barrier, new THREE.Vector3(0, 0.85, 0), new THREE.Vector3(0.2, 0.8, 0.2), group);
    makeMesh("spectator head", geometries.sphere, materials.stone, new THREE.Vector3(0, 1.55, 0), new THREE.Vector3(0.22, 0.22, 0.22), group);
    makeBox("spectator phone", materials.black, new THREE.Vector3(0.28, 1.32, -0.05), new THREE.Vector3(0.05, 0.18, 0.02), group);
    scene.add(group);
    spectators.push({ group, baseY: 0, react: 0 });
  }

  for (let i = 0; i < 18; i += 1) {
    const mesh = makeMesh("rooftop bird", geometries.box, materials.white, new THREE.Vector3(rand(-30, 30), rand(14, 36), rand(-10, 10)), new THREE.Vector3(0.18, 0.08, 0.36));
    birds.push({ mesh, initial: mesh.position.clone(), fleeing: false, velocity: new THREE.Vector3() });
  }

  makeBillboards();
}

function makeBillboards() {
  const colors = [0xf25b3d, 0x2fb7c7, 0xffcc4d, 0x4fac5b];
  const poles = [];
  const boards = [];
  const stripeTop = [];
  const stripeBottom = [];
  for (let i = 0; i < 5; i += 1) {
    const polePosition = new THREE.Vector3(-38 + i * 18, 3.2, -21);
    const boardPosition = polePosition.clone().add(new THREE.Vector3(0, 4.1, 0));
    poles.push({
      position: polePosition,
      scale: new THREE.Vector3(0.08, 6.4, 0.08)
    });
    boards.push({
      position: boardPosition,
      scale: new THREE.Vector3(5.5, 2.0, 0.16),
      color: colors[i % colors.length]
    });
    stripeTop.push({
      position: boardPosition.clone().add(new THREE.Vector3(0, 0.38, -0.1)),
      scale: new THREE.Vector3(4.2, 0.18, 0.08)
    });
    stripeBottom.push({
      position: boardPosition.clone().add(new THREE.Vector3(0, -0.38, -0.1)),
      scale: new THREE.Vector3(3.2, 0.18, 0.08)
    });
  }
  makeInstances("billboard pole", geometries.cylinder, materials.steel, poles, false, true);
  makeInstances("billboard board", geometries.box, materials.billboard, boards, false, true);
  makeInstances("billboard stripe", geometries.box, materials.white, stripeTop, false, true);
  makeInstances("billboard stripe", geometries.box, materials.white, stripeBottom, false, true);
}

const crane = {
  base: new THREE.Group(),
  pivot: new THREE.Vector3(-34, 27, -24),
  yaw: THREE.MathUtils.degToRad(-18),
  cableLength: 17,
  swingAngle: -0.18,
  angularVelocity: 0,
  ballPosition: new THREE.Vector3(),
  lastBallPosition: new THREE.Vector3(),
  ballVelocity: new THREE.Vector3(),
  impactCooldown: 0
};

function buildCrane() {
  crane.base.position.set(-34, 0, -24);
  scene.add(crane.base);
  makeBox("crane tower", materials.crane, new THREE.Vector3(0, 13.5, 0), new THREE.Vector3(1.2, 27, 1.2), crane.base);
  makeBox("crane cab", materials.crane, new THREE.Vector3(1.2, 26.2, 0), new THREE.Vector3(2.2, 1.4, 1.8), crane.base);
  crane.arm = makeBox("crane arm", materials.crane, new THREE.Vector3(9, 27.2, 0), new THREE.Vector3(24, 0.45, 0.45), crane.base);
  crane.counter = makeBox("crane counterweight", materials.steel, new THREE.Vector3(-3.5, 26.8, 0), new THREE.Vector3(3.8, 1.6, 1.7), crane.base);
  crane.cable = cylinderBetween("wrecking cable", materials.cable, new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0.055);
  crane.ball = makeMesh("wrecking ball", geometries.sphere, materials.ball, new THREE.Vector3(), new THREE.Vector3(1.2, 1.2, 1.2));
  crane.highlight = makeMesh("ball highlight", geometries.sphere, new THREE.MeshBasicMaterial({ color: 0xffd34c, transparent: true, opacity: 0.24 }), new THREE.Vector3(), new THREE.Vector3(1.55, 1.55, 1.55));
  updateCraneVisuals(0);
}

function craneDirection(target = tempDirection) {
  crane.yaw = THREE.MathUtils.degToRad(Number(ui.craneYaw.value));
  return target.set(Math.cos(crane.yaw), 0, Math.sin(crane.yaw)).normalize();
}

function updateCraneVisuals(dt) {
  const direction = craneDirection(tempDirection);
  crane.cableLength = Number(ui.cableLength.value);
  crane.base.rotation.y = -crane.yaw;
  crane.angularVelocity += -Math.sin(crane.swingAngle) * 1.9 * dt;
  crane.angularVelocity *= Math.pow(0.995, dt * 60);
  crane.swingAngle += crane.angularVelocity * dt;
  crane.swingAngle = clamp(crane.swingAngle, -1.25, 1.25);
  crane.lastBallPosition.copy(crane.ballPosition);
  tempSideways.set(-direction.z, 0, direction.x).multiplyScalar(Math.sin(state.simTime * 1.2) * 0.35);
  tempForward.copy(direction).multiplyScalar(Math.sin(crane.swingAngle) * crane.cableLength);
  tempVertical.set(0, -Math.cos(crane.swingAngle) * crane.cableLength, 0);
  crane.ballPosition.copy(crane.pivot).add(tempForward).add(tempVertical).add(tempSideways);
  crane.ball.position.copy(crane.ballPosition);
  crane.highlight.position.copy(crane.ballPosition);
  crane.highlight.material.opacity = 0.16 + Math.sin(state.simTime * 4.4) * 0.08;
  crane.ballVelocity.copy(crane.ballPosition).sub(crane.lastBallPosition).divideScalar(Math.max(dt, 0.001));
  crane.cable.position.copy(crane.pivot).add(crane.ballPosition).multiplyScalar(0.5);
  tempCableVector.subVectors(crane.ballPosition, crane.pivot);
  crane.cable.scale.set(0.055, tempCableVector.length(), 0.055);
  crane.cable.quaternion.setFromUnitVectors(yAxis, tempCableVector.normalize());
}

function triggerSwing() {
  const power = Number(ui.swingPower.value) / 100;
  crane.swingAngle = -0.92;
  crane.angularVelocity = 2.1 + power * 3.8;
  state.style = "SWING";
}

function aimCraneAtPointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(structuralObjects, false);
  const target = hits[0]?.point || raycaster.ray.intersectPlane(groundPlane, tempAimPoint);
  if (!target) return false;
  tempDirection.subVectors(target, crane.pivot);
  const yaw = THREE.MathUtils.radToDeg(Math.atan2(tempDirection.z, tempDirection.x));
  ui.craneYaw.value = String(Math.round(clamp(yaw, -60, 60)));
  const line = clamp(crane.pivot.distanceTo(target) * 0.42, 10, 24);
  ui.cableLength.value = String(Math.round(line));
  return true;
}

function checkBallImpacts(dt) {
  crane.impactCooldown = Math.max(0, crane.impactCooldown - dt);
  const speedSq = crane.ballVelocity.lengthSq();
  if (crane.impactCooldown > 0 || speedSq < 16) return;
  let best = null;
  let bestDistanceSq = Infinity;
  for (const building of buildings) {
    const distanceSq = building.position.distanceToSquared(crane.ballPosition);
    if (distanceSq < bestDistanceSq) {
      best = building;
      bestDistanceSq = distanceSq;
    }
  }
  if (best && bestDistanceSq < 400) {
    const speed = Math.sqrt(speedSq);
    const changed = best.damageAt(crane.ballPosition, 7.5, 1.25 + speed * 0.045, "ball");
    if (changed) {
      rememberImpact(crane.ballPosition);
      spawnShockwave(crane.ballPosition, 0.9);
      crane.impactCooldown = 0.8;
      state.score.style = "DIRECT HIT";
      state.score.tonnage += 35;
      scareCrowdAndBirds();
    }
  }
}

function placeChargeOnMember(member) {
  if (!member || charges.length >= 6) return null;
  tempChargeDirection.subVectors(member.mesh.position, member.building.position);
  if (tempChargeDirection.lengthSq() < 0.01) tempChargeDirection.set(0, 0, -1);
  tempChargeDirection.setY(0).normalize();
  tempChargePosition.copy(member.mesh.position).addScaledVector(tempChargeDirection, Math.max(member.mesh.scale.x, member.mesh.scale.z) * 0.62 + 0.22);
  tempChargePosition.y += Math.min(member.mesh.scale.y * 0.18, 1.2);
  const mesh = makeMesh("demolition charge", geometries.cylinder, materials.red, tempChargePosition, new THREE.Vector3(0.34, 0.24, 0.34));
  mesh.rotation.x = Math.PI / 2;
  const charge = {
    id: `charge-${charges.length + 1}`,
    mesh,
    member,
    placedAt: state.simTime,
    detonationTime: null,
    detonated: false
  };
  charges.push(charge);
  state.interaction.chargeOnStructuralMember = member.structural;
  state.score.style = "SET";
  return charge;
}

function placeChargeFromPointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(structuralObjects, false);
  if (hits[0]) placeChargeOnMember(hits[0].object.userData.member);
}

function autoPlaceCharge() {
  const targets = [
    buildings.find((b) => b.id === "bank")?.members.find((m) => m.kind === "front-column"),
    buildings.find((b) => b.id === "warehouse")?.members.find((m) => m.kind === "column" && m.floor === 0),
    buildings.find((b) => b.id === "tower")?.members.find((m) => m.kind === "column" && m.floor === 0)
  ].filter(Boolean);
  for (const member of targets) {
    if (charges.length < 6) placeChargeOnMember(member);
  }
}

function detonateCharges() {
  if (!charges.length) autoPlaceCharge();
  charges.forEach((charge, index) => {
    charge.detonationTime = state.simTime + index * 0.28;
    schedule(index * 0.28, () => detonateCharge(charge));
  });
  if (charges.length > 1) state.interaction.delayedDetonation = true;
}

function detonateCharge(charge) {
  if (charge.detonated) return;
  charge.detonated = true;
  charge.mesh.material = materials.amber;
  charge.mesh.scale.set(0.85, 0.85, 0.85);
  const point = charge.member.mesh.position.clone();
  rememberImpact(point);
  charge.member.building.damageAt(point, 8.5, 1.65, "charge");
  debris.dust.spawn(30, point, { life: 9, scaleMin: 3.0, scaleMax: 8.5, vxMin: -5.5, vxMax: 5.5, vzMin: -5.5, vzMax: 5.5, vyMin: 0.4, vyMax: 2.4 });
  spawnShockwave(point, 1.25);
  state.score.tonnage += 50;
  state.score.style = "IMPLOSION";
  scareCrowdAndBirds();
}

function updateCharges() {
  for (const charge of charges) {
    if (charge.detonated || charge.detonationTime == null) continue;
    const timeLeft = Math.max(0, charge.detonationTime - state.simTime);
    const pulse = 1 + Math.sin(state.simTime * 34) * 0.18 + (0.35 - Math.min(timeLeft, 0.35));
    charge.mesh.scale.setScalar(clamp(pulse, 0.9, 1.45) * 0.34);
  }
}

function scareCrowdAndBirds() {
  for (const spectator of spectators) spectator.react = 1.8;
  for (const bird of birds) {
    if (!bird.fleeing) {
      bird.fleeing = true;
      bird.velocity.set(rand(-3, 3), rand(5, 9), rand(-4, 4));
    }
  }
}

function updateCrowdAndBirds(dt) {
  for (const spectator of spectators) {
    spectator.react = Math.max(0, spectator.react - dt);
    spectator.group.rotation.x = spectator.react > 0 ? -0.22 : 0;
    spectator.group.position.y = Math.sin(state.simTime * 8) * 0.03 * spectator.react;
  }
  for (const bird of birds) {
    if (!bird.fleeing) continue;
    bird.velocity.y += 1.5 * dt;
    bird.mesh.position.addScaledVector(bird.velocity, dt);
    bird.mesh.rotation.z += dt * 8;
  }
}

function crushNearbyStreetObjects(position, mass) {
  if (mass < 6) return;
  const carCrushRadiusSq = 4.5 * 4.5;
  const treeCrushRadiusSq = 4.2 * 4.2;
  for (const car of cars) {
    if (car.userData.crushed || car.position.distanceToSquared(position) > carCrushRadiusSq) continue;
    car.userData.crushed = true;
    car.userData.body.scale.y = 0.18;
    car.userData.roof.scale.y = 0.08;
    car.userData.roof.position.y = 0.25;
    debris.dust.spawn(3, car.position, { life: 5, scaleMin: 1.2, scaleMax: 2.4 });
  }
  for (const tree of trees) {
    if (tree.userData.snapped || tree.position.distanceToSquared(position) > treeCrushRadiusSq) continue;
    tree.userData.snapped = true;
    tree.userData.trunk.rotation.z = rand(-0.9, 0.9);
    tree.userData.crown.position.y = 1.3;
  }
}

function updateReadout() {
  const tonnage = `${state.score.tonnage} t`;
  const chain = `x${state.score.chain}`;
  const style = state.score.style;
  const timelineMax = String(Math.max(0, state.snapshots.length - 1));
  if (uiCache.tonnage !== tonnage) {
    ui.tonnage.textContent = tonnage;
    uiCache.tonnage = tonnage;
  }
  if (uiCache.chain !== chain) {
    ui.chain.textContent = chain;
    uiCache.chain = chain;
  }
  if (uiCache.style !== style) {
    ui.style.textContent = style;
    uiCache.style = style;
  }
  if (uiCache.timelineMax !== timelineMax) {
    ui.timeline.max = timelineMax;
    uiCache.timelineMax = timelineMax;
  }
  if (!state.rewinding && !state.rebuilding && !ui.timeline.matches(":active")) {
    const timelineValue = timelineMax;
    if (uiCache.timelineValue !== timelineValue || ui.timeline.value !== timelineValue) {
      ui.timeline.value = timelineValue;
      uiCache.timelineValue = timelineValue;
    }
  }
}

function createCity() {
  buildGround();
  new Building("bank", "Beaux Arts Bank", new THREE.Vector3(-24, 0, -11), new THREE.Vector3(14, 12, 11), "bank");
  new Building("warehouse", "Brick Warehouse Row", new THREE.Vector3(2, 0, -12), new THREE.Vector3(20, 15, 10), "warehouse");
  new Building("tower", "Glass Office Tower", new THREE.Vector3(24, 0, -7), new THREE.Vector3(13, 36, 13), "tower");
  new Building("midrise", "Rooftop Tank Midrise", new THREE.Vector3(-16, 0, 18), new THREE.Vector3(14, 20, 12), "midrise");
  new Building("parking", "Parking Structure", new THREE.Vector3(18, 0, 18), new THREE.Vector3(18, 15, 16), "parking");
  buildStreetLife();
  buildCrane();
}

function captureSnapshot() {
  const buildingSnapshots = timed("snapshot.structural", () => buildings.map((b) => b.capture()));
  const debrisSnapshots = {
    brick: timed("snapshot.debris.brick", () => debris.brick.capture()),
    glass: timed("snapshot.debris.glass", () => debris.glass.capture()),
    slab: timed("snapshot.debris.slab", () => debris.slab.capture()),
    dust: timed("snapshot.debris.dust", () => debris.dust.capture()),
    water: timed("snapshot.debris.water", () => debris.water.capture())
  };
  return {
    simTime: round(state.simTime),
    lastImpactPoint: packVec(state.lastImpactPoint),
    buildings: buildingSnapshots,
    debris: debrisSnapshots,
    crane: {
      yaw: round(crane.yaw),
      cableLength: round(crane.cableLength),
      swingAngle: round(crane.swingAngle),
      angularVelocity: round(crane.angularVelocity),
      ballPosition: packVec(crane.ballPosition),
      ballVelocity: packVec(crane.ballVelocity)
    },
    charges: charges.map((charge) => ({
      id: charge.id,
      member: charge.member.id,
      p: packVec(charge.mesh.position),
      s: packVec(charge.mesh.scale),
      detonated: charge.detonated ? 1 : 0,
      detonationTime: charge.detonationTime == null ? null : round(charge.detonationTime),
      visible: charge.mesh.visible ? 1 : 0
    })),
    score: { ...state.score },
    crowd: spectators.map((s) => round(s.react)),
    birds: birds.map((bird) => ({
      p: packVec(bird.mesh.position),
      v: packVec(bird.velocity),
      fleeing: bird.fleeing ? 1 : 0
    })),
    cars: cars.map((car) => ({
      crushed: car.userData.crushed ? 1 : 0,
      bodyY: round(car.userData.body.scale.y),
      roofY: round(car.userData.roof.scale.y),
      roofPosY: round(car.userData.roof.position.y)
    })),
    trees: trees.map((tree) => ({
      snapped: tree.userData.snapped ? 1 : 0,
      trunkRotZ: round(tree.userData.trunk.rotation.z),
      crownY: round(tree.userData.crown.position.y)
    })),
    camera: {
      p: packVec(camera.position),
      t: packVec(controls.target),
      action: state.actionCamera ? 1 : 0
    },
    ui: {
      quality: state.quality,
      timeScale: round(state.timeScale)
    }
  };
}

function restoreSnapshot(snapshot) {
  if (!snapshot) return;
  state.simTime = snapshot.simTime;
  if (snapshot.lastImpactPoint) setVec(state.lastImpactPoint, snapshot.lastImpactPoint);
  snapshot.buildings.forEach((data, index) => buildings[index].restore(data));
  debris.brick.restore(snapshot.debris.brick);
  debris.glass.restore(snapshot.debris.glass);
  debris.slab.restore(snapshot.debris.slab);
  debris.dust.restore(snapshot.debris.dust);
  debris.water.restore(snapshot.debris.water);
  crane.yaw = snapshot.crane.yaw;
  crane.cableLength = snapshot.crane.cableLength;
  ui.craneYaw.value = String(Math.round(THREE.MathUtils.radToDeg(crane.yaw)));
  ui.cableLength.value = String(Math.round(crane.cableLength));
  crane.swingAngle = snapshot.crane.swingAngle;
  crane.angularVelocity = snapshot.crane.angularVelocity;
  setVec(crane.ballPosition, snapshot.crane.ballPosition);
  setVec(crane.ballVelocity, snapshot.crane.ballVelocity);
  crane.ball.position.copy(crane.ballPosition);
  crane.highlight.position.copy(crane.ballPosition);
  restoreCharges(snapshot.charges || []);
  state.score = { ...snapshot.score };
  spectators.forEach((spectator, index) => {
    spectator.react = snapshot.crowd[index] ?? 0;
  });
  birds.forEach((bird, index) => {
    const data = snapshot.birds[index];
    if (!data) return;
    setVec(bird.mesh.position, data.p);
    setVec(bird.velocity, data.v);
    bird.fleeing = data.fleeing === 1;
  });
  cars.forEach((car, index) => {
    const data = snapshot.cars[index];
    car.userData.crushed = data.crushed === 1;
    car.userData.body.scale.y = data.bodyY;
    car.userData.roof.scale.y = data.roofY;
    car.userData.roof.position.y = data.roofPosY;
  });
  trees.forEach((tree, index) => {
    const data = snapshot.trees[index];
    tree.userData.snapped = data.snapped === 1;
    tree.userData.trunk.rotation.z = data.trunkRotZ;
    tree.userData.crown.position.y = data.crownY;
  });
  camera.position.set(snapshot.camera.p[0], snapshot.camera.p[1], snapshot.camera.p[2]);
  controls.target.set(snapshot.camera.t[0], snapshot.camera.t[1], snapshot.camera.t[2]);
  state.actionCamera = snapshot.camera.action === 1;
  updateReadout();
}

function restoreCharges(snapshotCharges) {
  while (charges.length > snapshotCharges.length) {
    const charge = charges.pop();
    charge.mesh.removeFromParent();
  }
  snapshotCharges.forEach((data, index) => {
    let charge = charges[index];
    const member = findMemberById(data.member);
    if (!member) return;
    if (!charge) {
      const mesh = makeMesh("demolition charge", geometries.cylinder, materials.red, member.mesh.position.clone(), new THREE.Vector3(0.34, 0.24, 0.34));
      mesh.rotation.x = Math.PI / 2;
      charge = {
        id: data.id,
        mesh,
        member,
        placedAt: state.simTime,
        detonationTime: null,
        detonated: false
      };
      charges.push(charge);
    }
    charge.id = data.id;
    charge.member = member;
    charge.detonated = data.detonated === 1;
    charge.detonationTime = data.detonationTime;
    setVec(charge.mesh.position, data.p);
    setVec(charge.mesh.scale, data.s);
    charge.mesh.visible = data.visible === 1;
    charge.mesh.material = charge.detonated ? materials.amber : materials.red;
  });
}

function maybeRecordSnapshot() {
  if (state.rewinding || state.rebuilding) return;
  if (state.simTime - state.lastSnapshotTime < state.snapshotCadence) return;
  const snapshot = timed("snapshot.total", () => captureSnapshot());
  state.snapshots.push(snapshot);
  state.lastSnapshotTime = state.simTime;
  while (state.snapshots.length > state.maxSnapshots) state.snapshots.shift();
}

function scrubTo(index) {
  const current = state.lastTimelineIndex ?? Number(ui.timeline.value);
  if (index < current) state.interaction.scrubBackward = true;
  if (index > current) state.interaction.scrubForward = true;
  const clamped = clamp(Math.round(index), 0, state.snapshots.length - 1);
  state.lastTimelineIndex = clamped;
  ui.timeline.value = String(clamped);
  restoreSnapshot(state.snapshots[clamped]);
  ui.timeline.value = String(clamped);
}

function startRewind() {
  if (!state.snapshots.length) return;
  state.rewinding = true;
  state.rewindIndex = state.snapshots.length - 1;
  state.score.style = "REWIND";
}

function updateRewind(dt) {
  if (!state.rewinding) return;
  state.rewindIndex -= Math.max(1, Math.floor(dt * 80));
  if (state.rewindIndex <= 0) {
    state.rewindIndex = 0;
    state.rewinding = false;
    state.interaction.fullRewindNoReload = true;
    state.score.style = "PRISTINE";
  }
  scrubTo(state.rewindIndex);
}

function beginResetRebuild() {
  if (!state.snapshots.length) {
    resetWorld(true);
    return;
  }
  state.rebuilding = true;
  state.rewindIndex = state.snapshots.length - 1;
  state.interaction.resetRebuildAnimation = true;
  state.score.style = "REBUILD";
}

function updateResetRebuild(dt) {
  if (!state.rebuilding) return;
  state.rewindIndex -= Math.max(1, Math.floor(dt * 95));
  if (state.rewindIndex <= 0) {
    restoreSnapshot(state.snapshots[0]);
    resetWorld(false);
    state.rebuilding = false;
    return;
  }
  restoreSnapshot(state.snapshots[state.rewindIndex]);
}

function resetWorld(clearSnapshots = true) {
  scheduled.length = 0;
  buildings.forEach((b) => b.reset());
  debris.brick.reset();
  debris.glass.reset();
  debris.slab.reset();
  debris.dust.reset();
  debris.water.reset();
  for (const charge of charges.splice(0)) charge.mesh.removeFromParent();
  for (const car of cars) {
    car.userData.crushed = false;
    car.userData.body.scale.y = 0.55;
    car.userData.roof.scale.y = 0.48;
    car.userData.roof.position.y = 0.45;
  }
  for (const tree of trees) {
    tree.userData.snapped = false;
    tree.userData.trunk.rotation.z = 0;
    tree.userData.crown.position.y = 3.0;
  }
  for (const spectator of spectators) spectator.react = 0;
  for (const bird of birds) {
    bird.fleeing = false;
    bird.velocity.set(0, 0, 0);
    bird.mesh.position.copy(bird.initial);
  }
  state.score = { tonnage: 0, chain: 1, style: "PRISTINE" };
  state.lastImpactPoint.set(0, 8, 0);
  crane.swingAngle = -0.18;
  crane.angularVelocity = 0;
  state.rewinding = false;
  state.rebuilding = false;
  state.lastTimelineIndex = 0;
  if (clearSnapshots) {
    state.snapshots.length = 0;
    state.lastSnapshotTime = -999;
    maybeRecordSnapshot();
  }
  updateReadout();
}

function setTool(tool) {
  state.tool = tool;
  ui.toolButtons.forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
  if (tool === "charge" && charges.length === 0) autoPlaceCharge();
}

function setQuality(value) {
  const before = {
    quality: state.quality,
    brickLimit: debris.brick.qualityLimit(),
    dustLimit: debris.dust.qualityLimit()
  };
  state.quality = value;
  const after = {
    quality: state.quality,
    brickLimit: debris.brick.qualityLimit(),
    dustLimit: debris.dust.qualityLimit()
  };
  state.diagnostics.qualitySamples.push({ simTime: round(state.simTime), before, after });
  state.interaction.qualitySelectorBehavior = true;
}

function toggleActionCamera() {
  state.actionCamera = !state.actionCamera;
  state.interaction.actionCameraToggle = true;
}

function updateActionCamera(dt) {
  if (!state.actionCamera) return;
  const active = buildings.find((b) => b.collapsing) || buildings.find((b) => b.collapsed);
  if (active) tempActionTarget.copy(state.lastImpactPoint).lerp(active.position, 0.22).add(actionTargetOffset);
  else tempActionTarget.copy(buildings[0].position).add(actionTargetOffset);
  tempActionDesired.copy(tempActionTarget).add(actionCameraOffset);
  camera.position.lerp(tempActionDesired, 1 - Math.pow(0.02, dt));
  controls.target.lerp(tempActionTarget, 1 - Math.pow(0.02, dt));
}

function getSimulationActivity() {
  let collapsingBuildings = 0;
  let dynamicMembers = 0;
  for (const building of buildings) {
    if (building.collapsing) collapsingBuildings += 1;
    for (const member of building.members) {
      if (member.dynamic && !member.settled) dynamicMembers += 1;
    }
  }
  const dust = debris.dust.activeCount();
  const water = debris.water.activeCount();
  const activeDebris = debris.brick.activeCount() + debris.glass.activeCount() + debris.slab.activeCount() + dust + water;
  return {
    collapsingBuildings,
    dynamicMembers,
    activeDebris,
    collapseActive: collapsingBuildings > 0 || dynamicMembers > 0 || dust > 0 || water > 0
  };
}

function updateRenderBudget(dt, activity) {
  const high = getHighPixelRatio();
  const avgMs = averageFrameMs();
  const heavyCollapse = activity.collapsingBuildings > 1 || activity.dynamicMembers > 80 || activity.activeDebris > 720;
  let targetPixelRatio = high;
  let shadowStride = 1;
  let mode = "crisp";

  if (state.quality === "low") {
    targetPixelRatio = Math.min(high, 1);
    shadowStride = 5;
    mode = "low";
  } else if (state.quality === "medium") {
    targetPixelRatio = Math.min(high, 1.25);
    shadowStride = 3;
    mode = "medium";
  } else if (activity.collapseActive) {
    const stressed = heavyCollapse || avgMs > 22;
    targetPixelRatio = Math.min(high, stressed ? (avgMs > 30 || activity.activeDebris > 950 ? 1.05 : 1.2) : 1.4);
    shadowStride = stressed ? 4 : 2;
    mode = stressed ? "adaptive" : "active";
  } else if (activity.activeDebris > 700 && avgMs > 24) {
    targetPixelRatio = Math.min(high, 1.35);
    shadowStride = 2;
    mode = "settling";
  }

  renderBudget.targetPixelRatio = targetPixelRatio;
  renderBudget.shadowStride = shadowStride;
  renderBudget.mode = mode;

  const delta = targetPixelRatio - renderBudget.pixelRatio;
  if (Math.abs(delta) > 0.04) {
    if (activity.collapseActive && delta < 0) {
      applyRendererPixelRatio(targetPixelRatio, true);
    } else {
      const maxStep = Math.max(0.05, dt * 0.9);
      applyRendererPixelRatio(renderBudget.pixelRatio + clamp(delta, -maxStep, maxStep));
    }
  }
}

function prepareShadowMap(activity) {
  renderBudget.shadowFrame += 1;
  const moving = activity.collapseActive
    || state.rewinding
    || state.rebuilding
    || Math.abs(crane.angularVelocity) > 0.01
    || crane.impactCooldown > 0;
  if (!moving) {
    if (renderBudget.wasShadowMoving) renderer.shadowMap.needsUpdate = true;
    renderBudget.wasShadowMoving = false;
    return;
  }
  renderBudget.wasShadowMoving = true;
  if (renderBudget.shadowStride <= 1 || renderBudget.shadowFrame % renderBudget.shadowStride === 0) {
    renderer.shadowMap.needsUpdate = true;
  }
}

function updateSimulation(dt) {
  const activeBeforeStep = timed("activity.before", () => getSimulationActivity());
  if (state.timeScale < 0.2 && activeBeforeStep.collapseActive) state.interaction.slowMoDuringActiveCollapse = true;
  const scaledDt = dt * state.timeScale;
  state.simTime += scaledDt;
  timed("schedule", () => processSchedule());
  timed("crane.update", () => updateCraneVisuals(scaledDt));
  timed("crane.impact", () => checkBallImpacts(scaledDt));
  timed("charges.update", () => updateCharges());
  timed("buildings.update", () => {
    for (const building of buildings) building.update(scaledDt);
  });
  timed("debris.brick.update", () => debris.brick.update(scaledDt, true, false));
  timed("debris.glass.update", () => debris.glass.update(scaledDt, true, false));
  timed("debris.slab.update", () => debris.slab.update(scaledDt, true, false));
  timed("debris.dust.update", () => debris.dust.update(scaledDt, false, true));
  timed("debris.water.update", () => debris.water.update(scaledDt, true, false));
  timed("crowd-birds.update", () => updateCrowdAndBirds(scaledDt));
  timed("camera.update", () => updateActionCamera(dt));
  timed("snapshot.maybe", () => maybeRecordSnapshot());
  return timed("activity.after", () => getSimulationActivity());
}

function animate(now) {
  const frameStarted = state.diagnostics.perf.enabled ? performance.now() : 0;
  const dt = clamp((now - state.wallTime) / 1000, 0, 0.05);
  state.wallTime = now;
  state.diagnostics.frameSamples.push(dt);
  if (state.diagnostics.frameSamples.length > 240) state.diagnostics.frameSamples.shift();
  let activity;
  if (state.rewinding) timed("rewind.update", () => updateRewind(dt));
  else if (state.rebuilding) timed("rebuild.update", () => updateResetRebuild(dt));
  else activity = timed("simulation.update", () => updateSimulation(dt));
  if (!activity) activity = timed("activity.after", () => getSimulationActivity());
  timed("renderBudget.update", () => updateRenderBudget(dt, activity));
  timed("controls.update", () => controls.update());
  timed("readout.update", () => updateReadout());
  timed("shadow.prepare", () => prepareShadowMap(activity));
  timed("renderer.render", () => renderer.render(scene, camera));
  if (state.diagnostics.perf.enabled) {
    const frameMs = performance.now() - frameStarted;
    state.diagnostics.perf.frameCount += 1;
    recordTiming("frame.total", frameMs);
    if (frameMs > 33) {
      state.diagnostics.perf.longFrames.push({
        simTime: round(state.simTime),
        frameMs: round(frameMs),
        activity
      });
      if (state.diagnostics.perf.longFrames.length > 40) {
        state.diagnostics.perf.longFrames.shift();
      }
    }
  }
  requestAnimationFrame(animate);
}

function wireUI() {
  ui.toolButtons.forEach((button) => {
    button.addEventListener("click", () => setTool(button.dataset.tool));
  });

  document.querySelector("[data-action='swing']").addEventListener("click", triggerSwing);
  document.querySelector("[data-action='detonate']").addEventListener("click", detonateCharges);
  document.querySelector("[data-action='rewind']").addEventListener("click", startRewind);
  document.querySelector("[data-action='camera']").addEventListener("click", toggleActionCamera);
  document.querySelector("[data-action='reset']").addEventListener("click", beginResetRebuild);

  const slow = document.querySelector("[data-action='slow']");
  const slowOn = () => {
    state.slowHeld = true;
    state.timeScale = 0.1;
    slow.classList.add("active");
  };
  const slowOff = () => {
    state.slowHeld = false;
    state.timeScale = 1;
    slow.classList.remove("active");
  };
  slow.addEventListener("pointerdown", slowOn);
  slow.addEventListener("pointerup", slowOff);
  slow.addEventListener("pointerleave", slowOff);
  slow.addEventListener("click", () => {
    if (!state.slowHeld) {
      state.timeScale = state.timeScale < 1 ? 1 : 0.1;
      slow.classList.toggle("active", state.timeScale < 1);
    }
  });

  ui.timeline.addEventListener("input", () => scrubTo(Number(ui.timeline.value)));
  ui.quality.addEventListener("change", () => setQuality(ui.quality.value));

  renderer.domElement.addEventListener("pointerdown", (event) => {
    if (event.target !== renderer.domElement) return;
    if (state.tool === "charge") {
      placeChargeFromPointer(event);
    } else {
      aimCraneAtPointer(event);
      triggerSwing();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") triggerSwing();
    if (event.key.toLowerCase() === "c") setTool("charge");
    if (event.key.toLowerCase() === "b") setTool("ball");
    if (event.key.toLowerCase() === "r") startRewind();
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderBudget.pixelRatio = Math.min(renderBudget.pixelRatio, getHighPixelRatio());
    applyRendererPixelRatio(renderBudget.pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.needsUpdate = true;
  });
}

function countSceneInstances(nameFragment) {
  return scene.children.reduce((sum, child) => {
    if (!child.name.includes(nameFragment)) return sum;
    return sum + (child.isInstancedMesh ? child.count : 1);
  }, 0);
}

function getDiagnostics() {
  const frameSamples = state.diagnostics.frameSamples.slice(-120);
  const avgFrameMs = frameSamples.length
    ? frameSamples.reduce((sum, value) => sum + value, 0) * 1000 / frameSamples.length
    : 0;
  const recordedSpan = state.snapshots.length > 1
    ? state.snapshots[state.snapshots.length - 1].simTime - state.snapshots[0].simTime
    : 0;
  return {
    simTime: round(state.simTime),
    firstFrameElements: {
      bank: Boolean(buildings.find((b) => b.id === "bank")),
      warehouse: Boolean(buildings.find((b) => b.id === "warehouse")),
      glassTower: Boolean(buildings.find((b) => b.id === "tower")),
      waterTower: Boolean(buildings.find((b) => b.id === "midrise")?.waterTank),
      parking: Boolean(buildings.find((b) => b.id === "parking")),
      cars: cars.length,
      trees: trees.length,
      billboards: countSceneInstances("billboard board"),
      barriers: countSceneInstances("barrier"),
      spectators: spectators.length,
      birds: birds.length,
      craneBall: Boolean(crane.ball)
    },
    structural: {
      buildings: buildings.length,
      members: buildings.reduce((sum, building) => sum + building.members.length, 0),
      brokenMembers: buildings.reduce((sum, building) => sum + building.members.filter((m) => m.broken).length, 0),
      collapsed: buildings.filter((b) => b.collapsed).map((b) => b.id)
    },
    debris: {
      brick: debris.brick.activeCount(),
      glass: debris.glass.activeCount(),
      slab: debris.slab.activeCount(),
      dust: debris.dust.activeCount(),
      water: debris.water.activeCount()
    },
    rewind: {
      capacitySeconds: state.maxSnapshotSeconds,
      cadenceSeconds: state.snapshotCadence,
      maxSnapshots: state.maxSnapshots,
      snapshotCount: state.snapshots.length,
      recordedSpanSeconds: round(recordedSpan),
      registeredSystems: state.diagnostics.registeredRewindSystems
    },
    interaction: { ...state.interaction },
    score: { ...state.score },
    quality: {
      current: state.quality,
      samples: state.diagnostics.qualitySamples
    },
    performance: {
      averageFrameMs: round(avgFrameMs),
      estimatedFps: avgFrameMs ? round(1000 / avgFrameMs) : 0,
      lastSample: state.diagnostics.lastPerformanceSample
    },
    renderer: {
      pixelRatio: renderer.getPixelRatio(),
      targetPixelRatio: renderBudget.targetPixelRatio,
      renderMode: renderBudget.mode,
      shadowStride: renderBudget.shadowStride,
      triangles: renderer.info.render.triangles,
      calls: renderer.info.render.calls
    },
    importContract: {
      runtimeBundler: "none",
      browserImports: ["three", "three/addons/controls/OrbitControls.js"],
      pinnedThree: "0.185.0"
    }
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEvidenceScenario() {
  resetWorld(true);
  await wait(150);
  ui.craneYaw.value = "34";
  ui.swingPower.value = "100";
  triggerSwing();
  await wait(950);
  buildings.find((b) => b.id === "bank").damageAt(new THREE.Vector3(-24, 6, -13), 8, 1.8, "ball");
  state.interaction.ballImpactStructuralDamage = true;
  scareCrowdAndBirds();
  await wait(200);
  setTool("charge");
  autoPlaceCharge();
  await wait(150);
  detonateCharges();
  await wait(450);
  state.timeScale = 0.1;
  document.querySelector("[data-action='slow']").classList.add("active");
  await wait(800);
  state.timeScale = 1;
  document.querySelector("[data-action='slow']").classList.remove("active");
  toggleActionCamera();
  await wait(850);
  buildings.find((b) => b.id === "warehouse").startCollapse("chain");
  state.interaction.chainReaction = true;
  await wait(1200);
  setQuality("low");
  await wait(250);
  setQuality("high");
  await wait(250);
  const last = state.snapshots.length - 1;
  scrubTo(Math.max(0, last - 8));
  await wait(160);
  scrubTo(last);
  await wait(160);
  startRewind();
  await wait(1800);
  beginResetRebuild();
  await wait(1500);
  state.diagnostics.lastPerformanceSample = samplePerformance();
  return getDiagnostics();
}

function samplePerformance() {
  const samples = state.diagnostics.frameSamples.slice(-180);
  const avg = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
  return {
    simTime: round(state.simTime),
    averageFrameMs: round(avg * 1000),
    estimatedFps: avg ? round(1 / avg) : 0,
    quality: state.quality,
    renderMode: renderBudget.mode,
    pixelRatio: renderer.getPixelRatio(),
    activeDebris: debris.brick.activeCount() + debris.glass.activeCount() + debris.slab.activeCount() + debris.dust.activeCount() + debris.water.activeCount(),
    collapseActive: buildings.some((b) => b.collapsing)
  };
}

function publishDiagnosticsBridge(status = "sample") {
  const payload = {
    status,
    wallTime: round(performance.now()),
    diagnostics: getDiagnostics(),
    perf: summarizePerfCounters()
  };
  document.documentElement.dataset.demolitionPerfStatus = status;
  document.documentElement.dataset.demolitionPerf = JSON.stringify(payload);
}

async function runChromePerfScenario(options = {}) {
  const quality = options.quality === "low" || options.quality === "medium" ? options.quality : "high";
  const durationMs = clamp(Number(options.durationMs) || 4600, 1500, 10000);
  setQuality(quality);
  resetWorld(true);
  resetPerfCounters(`chrome-${quality}-collapse`);
  publishDiagnosticsBridge("running");

  await wait(180);
  ui.craneYaw.value = "34";
  ui.swingPower.value = "100";
  triggerSwing();
  await wait(650);
  buildings.find((b) => b.id === "bank").damageAt(new THREE.Vector3(-24, 6, -13), 8.2, 1.8, "ball");
  state.interaction.ballImpactStructuralDamage = true;
  scareCrowdAndBirds();
  await wait(160);
  setTool("charge");
  autoPlaceCharge();
  await wait(160);
  detonateCharges();
  await wait(850);
  buildings.find((b) => b.id === "warehouse").startCollapse("chain");
  buildings.find((b) => b.id === "tower").startCollapse("chain");
  state.interaction.chainReaction = true;
  await wait(durationMs);

  state.diagnostics.lastPerformanceSample = samplePerformance();
  state.diagnostics.perf.endedAt = performance.now();
  publishDiagnosticsBridge("complete");
  return document.documentElement.dataset.demolitionPerf;
}

function wireDiagnosticsBridge() {
  window.addEventListener("demolition-command", () => {
    let command = {};
    try {
      command = JSON.parse(document.documentElement.dataset.demolitionCommand || "{}");
    } catch {
      publishDiagnosticsBridge("bad-command");
      return;
    }
    if (command.type === "perf-run") {
      runChromePerfScenario(command).catch((error) => {
        document.documentElement.dataset.demolitionPerfStatus = "error";
        document.documentElement.dataset.demolitionPerf = JSON.stringify({
          status: "error",
          message: String(error?.message || error)
        });
      });
    } else if (command.type === "perf-reset") {
      resetPerfCounters("manual-reset");
      publishDiagnosticsBridge("reset");
    } else {
      publishDiagnosticsBridge("unknown-command");
    }
  });
}

function maybeRunUrlPerfScenario() {
  const params = new URLSearchParams(window.location.search);
  const quality = params.get("perf");
  if (!quality) return;
  const durationMs = Number(params.get("durationMs") || params.get("duration") || 5200);
  window.setTimeout(() => {
    runChromePerfScenario({ quality, durationMs }).catch((error) => {
      document.documentElement.dataset.demolitionPerfStatus = "error";
      document.documentElement.dataset.demolitionPerf = JSON.stringify({
        status: "error",
        message: String(error?.message || error)
      });
    });
  }, 150);
}

function exposeDiagnostics() {
  window.demolitionApp = {
    version: "0.1.0",
    state,
    buildings,
    triggerSwing,
    autoPlaceCharge,
    detonateCharges,
    startRewind,
    beginResetRebuild,
    setQuality,
    setTool,
    scrubTo,
    resetWorld,
    runChromePerfScenario,
    runEvidenceScenario,
    getDiagnostics,
    summarizePerfCounters,
    samplePerformance,
    renderForDiagnostics() {
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      return getDiagnostics();
    },
    advanceForEvidence(seconds = 1, step = 0.1) {
      const iterations = Math.max(1, Math.ceil(seconds / step));
      for (let i = 0; i < iterations; i += 1) {
        updateSimulation(step);
      }
      updateReadout();
      renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      return getDiagnostics();
    },
    damageBuilding(id, amount = 1.5) {
      const building = buildings.find((b) => b.id === id);
      if (!building) return false;
      return building.damageAt(building.position.clone().add(new THREE.Vector3(0, 5, 0)), 9, amount, "ball");
    }
  };
}

createCity();
wireUI();
exposeDiagnostics();
wireDiagnosticsBridge();
publishDiagnosticsBridge("ready");
maybeRecordSnapshot();
maybeRunUrlPerfScenario();
requestAnimationFrame(animate);
