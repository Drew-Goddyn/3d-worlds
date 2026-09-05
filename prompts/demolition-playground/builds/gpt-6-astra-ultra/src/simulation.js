import * as THREE from 'three';
import { BankPhysics } from './bank-physics.js';

const MATERIALS = ['brick', 'stone', 'glass', 'concrete', 'steel', 'water'];
const MATERIAL_INDEX = Object.fromEntries(MATERIALS.map((name, i) => [name, i]));
const MAX_DEBRIS = 1400;
const MAX_DUST = 160;
const D = 20;
const U = 13;
const FLOOR_STRIDE = 22;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const _dummy = new THREE.Object3D();
const _point = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _matrix = new THREE.Matrix4();

/** Coarse floor/column assemblies drive pooled, material-specific visual fragments. */
export class Simulation {
  constructor(city, scene) {
    this.city = city;
    this.scene = scene;
    this.time = 0;
    this.seed = 0x47a38b19;
    this.lastImpact = new THREE.Vector3(0, 4, 0);
    this.onEvent = null;
    this.quality = 'high';
    this.camera = null;
    this.debrisBudget = MAX_DEBRIS;
    this.dustBudget = MAX_DUST;
    this.debris = new Float32Array(MAX_DEBRIS * D);
    for (let i = 0; i < MAX_DEBRIS; i++) this.debris[i * D] = -1;
    this.dust = new Float32Array(MAX_DUST * U);
    this.debrisCursor = 0;
    this.dustCursor = 0;
    this.debrisExtent = 0;
    this.dustExtent = 0;
    this.tonnage = 0;
    this.chain = 1;
    this.chainTime = -99;
    this.collapsedCount = 0;
    this.lastCollapseBuilding = -1;
    this.crowdReaction = 0;
    this.cheerUntil = -1;
    this.flockStart = -1;
    this.collisionPairs = new Set();
    this.floors = [];
    this.buildingStates = [];
    this.pieces = [];
    this.hiddenPieces = new Set();
    this.hiddenSnapshot = new Uint32Array(0);
    this.hiddenDirty = false;
    this.charges = [];
    this.chargeId = 0;
    this.chargeMeshes = [];
    this.props = [];
    this.tanks = [];
    this.effects = new THREE.Group();
    this.effects.name = 'Demolition effects';
    this.scene.add(this.effects);
    this._createEffects();
    for (const building of city.buildings) {
      const bs = { building, floors: [], collapsed: false, waterBurst: false };
      this.buildingStates.push(bs);
      for (const floor of building.floors) {
        const columns = floor.columns?.length ? floor.columns : [
          { x: -building.width * .4, z: -building.depth * .4 },
          { x: building.width * .4, z: -building.depth * .4 },
          { x: -building.width * .4, z: building.depth * .4 },
          { x: building.width * .4, z: building.depth * .4 },
        ];
        const f = {
          floor, building, bs, columns, strength: new Float32Array(columns.length).fill(1),
          baseX: floor.group.position.x, baseY: floor.group.position.y, baseZ: floor.group.position.z,
          x: floor.group.position.x, y: floor.group.position.y, z: floor.group.position.z,
          rx: 0, rz: 0, vx: 0, vy: 0, vz: 0, wx: 0, wz: 0,
          state: 0, strain: 0, fallAge: 0, squash: 1, targetSquash: 1,
          shed: 0, impact: 0, support: 1, scored: false, born: -1, dustTimer: 0,
          index: this.floors.length, pieces: [],
        };
        for (const piece of floor.pieces || []) {
          const mesh = piece.mesh || piece;
          if (!mesh?.isObject3D) continue;
          mesh.geometry?.computeBoundingBox();
          const bounds = mesh.geometry?.boundingBox;
          const size = bounds ? bounds.getSize(new THREE.Vector3()) : new THREE.Vector3(1, 1, 1);
          // Material batches can cover a whole facade; they remain part of the
          // coarse assembly instead of disappearing into one little fragment.
          const batch = size.x > 2.5 || size.y > 3.8 || size.z > 2.5;
          const fractureUnits = mesh.userData.fractureUnits;
          if (fractureUnits?.length) {
            const positions = mesh.geometry.attributes.position;
            positions.setUsage(THREE.DynamicDrawUsage);
            for (const unit of fractureUnits) {
              const start = unit.start * 3, count = unit.count * 3;
              const p = {
                mesh, material: 'glass', floor: f, index: this.pieces.length, batch: false, unit,
                original: positions.array.slice(start, start + count),
                center: new THREE.Vector3().fromArray(unit.center),
                size: new THREE.Vector3().fromArray(unit.size),
              };
              f.pieces.push(p); this.pieces.push(p);
            }
            continue;
          }
          const p = { mesh, material: piece.material || building.kind, floor: f, index: this.pieces.length, batch };
          f.pieces.push(p);
          this.pieces.push(p);
        }
        bs.floors.push(f);
        this.floors.push(f);
      }
      bs.floors.sort((a, b) => a.baseY - b.baseY);
      for (let i = 0; i < bs.floors.length; i++) {
        bs.floors[i].below = bs.floors[i - 1] || null;
        bs.floors[i].above = bs.floors[i + 1] || null;
      }
      const tank = building.waterTower?.group || building.waterTower || building.tank?.group || building.tank;
      if (tank?.isObject3D) this.tanks.push({ group: tank, bs, parent: tank.parent, base: tank.position.clone(), rotation: tank.rotation.clone(), state: 0, x: 0, y: 0, z: 0, rx: 0, rz: 0, vx: 0, vy: 0, vz: 0, age: 0, burst: false });
    }
    this.bank = city.buildings.find(b => b.bank)?.bank;
    this.bank = this.bank ? new BankPhysics(this.bank, this) : null;
    for (const prop of city.props || []) {
      const group = prop.group || prop;
      if (!group?.isObject3D) continue;
      this.props.push({ prop, group, baseScale: group.scale.clone(), baseRotation: group.rotation.clone(), state: 0, squash: 1, rx: 0, rz: 0, targetRx: 0, targetRz: 0 });
    }
    const crowd = Array.isArray(city.crowd) ? city.crowd : city.crowd?.children || [];
    this.crowd = crowd.map((person, i) => ({ person, group: person.group || person, phase: i * 1.93, baseY: (person.group || person).position.y, scale: (person.group || person).scale.y }));
    const pigeons = Array.isArray(city.pigeons) ? city.pigeons : city.pigeons?.children || [];
    this.pigeons = pigeons.map((bird, i) => ({ bird, group: bird.group || bird, base: (bird.group || bird).position.clone(), rotation: (bird.group || bird).rotation.clone(), phase: i * 2.4, direction: (i * 2.399 + .8) % (Math.PI * 2) }));
    this.render();
  }

  random() {
    let x = this.seed | 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed / 4294967296;
  }

  _createEffects() {
    const geometries = [new THREE.BoxGeometry(1, 1, 1), new THREE.DodecahedronGeometry(.68, 0), new THREE.BoxGeometry(1, .045, 1), new THREE.DodecahedronGeometry(.68, 0), new THREE.BoxGeometry(1, 1, 1), new THREE.IcosahedronGeometry(.6, 0)];
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xba6244, roughness: .88 }),
      new THREE.MeshStandardMaterial({ color: 0xe6d7bd, roughness: .82 }),
      new THREE.MeshStandardMaterial({ color: 0x9fdae0, roughness: .08, metalness: .72, transparent: true, opacity: .84 }),
      new THREE.MeshStandardMaterial({ color: 0xa4a59c, roughness: .9 }),
      new THREE.MeshStandardMaterial({ color: 0x596967, roughness: .57, metalness: .68 }),
      new THREE.MeshStandardMaterial({ color: 0x70d9e7, roughness: .08, metalness: .22, transparent: true, opacity: .65 }),
    ];
    this.debrisMeshes = geometries.map((g, i) => {
      const m = new THREE.InstancedMesh(g, materials[i], MAX_DEBRIS);
      m.name = `${MATERIALS[i]} fragments`;
      m.count = 0;
      m.castShadow = i !== 5;
      m.receiveShadow = true;
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.effects.add(m);
      return m;
    });
    const farGeometry = new THREE.BufferGeometry();
    this.farPositions = new THREE.BufferAttribute(new Float32Array(MAX_DEBRIS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.farColors = new THREE.BufferAttribute(new Float32Array(MAX_DEBRIS * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.farSizes = new THREE.BufferAttribute(new Float32Array(MAX_DEBRIS), 1).setUsage(THREE.DynamicDrawUsage);
    this.farTypes = new THREE.BufferAttribute(new Float32Array(MAX_DEBRIS), 1).setUsage(THREE.DynamicDrawUsage);
    farGeometry.setAttribute('position', this.farPositions);
    farGeometry.setAttribute('color', this.farColors);
    farGeometry.setAttribute('pointSize', this.farSizes);
    farGeometry.setAttribute('fragmentType', this.farTypes);
    farGeometry.setDrawRange(0, 0);
    this.farMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: true, vertexColors: true,
      uniforms: { viewportScale: { value: 650 } },
      vertexShader: `
        attribute float pointSize;
        attribute float fragmentType;
        uniform float viewportScale;
        varying vec3 vColor;
        varying float vType;
        void main() {
          vColor = color; vType = fragmentType;
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          gl_PointSize = clamp(pointSize * viewportScale / max(1., -mv.z), 1., 15.);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vType;
        void main() {
          vec2 p = gl_PointCoord - .5;
          float edge = 1. - smoothstep(.34, .5, max(abs(p.x), abs(p.y)));
          if (edge < .02) discard;
          float glint = vType == 2. ? pow(max(0., 1. - abs(p.x + p.y) * 3.), 5.) * .6 : 0.;
          gl_FragColor = vec4(vColor * (.82 + gl_PointCoord.y*.25) + glint, edge);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.farDebris = new THREE.Points(farGeometry, this.farMaterial);
    this.farDebris.name = 'Distant rubble impostors';
    this.farDebris.frustumCulled = false;
    this.effects.add(this.farDebris);
    this.rebarMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 4), materials[4], 2048);
    this.rebarMesh.name = 'Kinked reinforcement and exposed steel';
    this.rebarMesh.count = 0; this.rebarMesh.frustumCulled = false;
    this.rebarMesh.castShadow = true;
    this.rebarMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.effects.add(this.rebarMesh);
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.dustAlphas = new THREE.InstancedBufferAttribute(new Float32Array(MAX_DUST), 1);
    geometry.setAttribute('cloudAlpha', this.dustAlphas);
    const dustMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { color: { value: new THREE.Color(0xe9c9a4) } },
      vertexShader: `
        attribute float cloudAlpha;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          vUv = uv; vAlpha = cloudAlpha;
          vec4 center = modelViewMatrix * instanceMatrix * vec4(0., 0., 0., 1.);
          center.xy += position.xy * vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
          gl_Position = projectionMatrix * center;
        }`,
      fragmentShader: `
        uniform vec3 color;
        varying vec2 vUv;
        varying float vAlpha;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hash(i), hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y); }
        void main() {
          vec2 p = vUv - .5;
          float n = noise(vUv * 5.) * .5 + noise(vUv * 11.) * .25 + noise(vUv * 23.) * .12;
          float edge = 1. - smoothstep(.22, .52, length(p) + (n - .4)*.1);
          float a = edge * vAlpha * (.5 + n*.55);
          if (a < .006) discard;
          gl_FragColor = vec4(color * (.90 + n*.19 + vUv.y*.10), a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.dustMesh = new THREE.InstancedMesh(geometry, dustMaterial, MAX_DUST);
    this.dustMesh.name = 'Sunlit rolling dust';
    this.dustMesh.count = 0;
    this.dustMesh.frustumCulled = false;
    this.dustMesh.renderOrder = 2;
    this.effects.add(this.dustMesh);
    const chargeGeo = new THREE.CylinderGeometry(.13, .13, .44, 8);
    const chargeMaterial = new THREE.MeshStandardMaterial({ color: 0xe94d36, roughness: .4, emissive: 0x511209 });
    const lightGeo = new THREE.SphereGeometry(.055, 6, 4);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffd692 });
    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      const sticks = new THREE.Mesh(chargeGeo, chargeMaterial);
      sticks.rotation.z = Math.PI / 2;
      group.add(sticks);
      const lamp = new THREE.Mesh(lightGeo, lightMat); lamp.position.set(.24, 0, 0); group.add(lamp);
      group.visible = false;
      this.effects.add(group);
      this.chargeMeshes.push(group);
    }
  }

  setQuality(quality) {
    this.quality = quality;
    this.debrisBudget = quality === 'low' ? 500 : quality === 'medium' ? 900 : MAX_DEBRIS;
    this.dustBudget = quality === 'low' ? 60 : quality === 'medium' ? 105 : MAX_DUST;
    this.debrisMeshes.forEach(m => { m.castShadow = quality !== 'low' && m.name !== 'water fragments'; });
  }

  setCamera(camera) { this.camera = camera; }

  _setPieceHidden(piece, hidden) {
    if (!piece.unit) { piece.mesh.visible = !hidden; return; }
    const positions = piece.mesh.geometry.attributes.position;
    const start = piece.unit.start * 3;
    if (hidden) positions.array.fill(0, start, start + piece.unit.count * 3);
    else positions.array.set(piece.original, start);
    positions.addUpdateRange(start, piece.unit.count * 3);
    positions.needsUpdate = true;
  }

  _emit(type, point, extras = {}) {
    this.onEvent?.({ type, point: point.clone(), ...extras });
  }

  _nearestFloor(point, buildingId, floorIndex) {
    let nearest = null, score = Infinity;
    for (const f of this.floors) {
      if (buildingId != null && f.building.id !== buildingId) continue;
      if (floorIndex != null && f.floor.index !== floorIndex) continue;
      const dx = Math.max(0, Math.abs(point.x - f.x) - f.building.width / 2);
      const dz = Math.max(0, Math.abs(point.z - f.z) - f.building.depth / 2);
      const dy = Math.max(0, Math.abs(point.y - (f.y + f.floor.height * .5)) - f.floor.height * .5);
      const d = dx * dx + dy * dy + dz * dz;
      if (d < score) { score = d; nearest = f; }
    }
    return score < 49 ? nearest : null;
  }

  impact(point, power = 50, direction = new THREE.Vector3(0, 0, -1)) {
    if (!point || !Number.isFinite(power) || power <= 0) return false;
    const f = this._nearestFloor(point);
    this.lastImpact.copy(point);
    this.crowdReaction = Math.max(this.crowdReaction, Math.min(1, power / 75));
    if (this.flockStart < 0) this.flockStart = this.time;
    if (!f) {
      this._emitDust(point, 4, power * .025);
      this._affectProps(point, 2, power, direction);
      this._emit('impact', point, { power });
      return false;
    }
    this._damageFloor(f, point, power, direction, false);
    this._emit('impact', point, { power, buildingId: f.building.id, material: f.building.kind });
    return true;
  }

  _damageFloor(f, point, power, direction, blast) {
    if (f.building.bank) { this.bank.damage(point, power, direction, blast); return; }
    const radius = blast ? 7 : 4.7;
    let minDist = Infinity, nearest = 0;
    for (let i = 0; i < f.columns.length; i++) {
      const col = f.columns[i];
      const distance = Math.hypot(f.x + col.x - point.x, f.z + col.z - point.z);
      if (distance < minDist) { minDist = distance; nearest = i; }
      const influence = blast ? .85 + Math.max(0, 1 - distance / radius) * .35 : .14 + Math.max(0, 1 - distance / radius) ** 1.5;
      const resistance = f.building.kind === 'stone' ? 1.2 : f.building.kind === 'glass' ? .83 : 1;
      f.strength[i] = Math.max(0, f.strength[i] - power / (86 * resistance) * influence);
    }
    if (!blast) f.strength[nearest] = Math.max(0, f.strength[nearest] - power / 140);
    f.impact += power;
    f.vx += direction.x * power * .018;
    f.vz += direction.z * power * .018;
    f.wx += direction.z * power * .0008;
    f.wz -= direction.x * power * .0008;
    this._shedPieces(f, point, 2 + power * .045, Math.ceil(power * .75), direction);
    this._emitDust(point, Math.ceil(power / 12), 1.2 + power / 65);
    this._affectProps(point, 2.3, power, direction);
    this._assessSupport(f);
  }

  _assessSupport(f) {
    f.support = f.strength.reduce((sum, value) => sum + value, 0) / f.strength.length;
    if (f.state < 2 && f.support < .56) this._startFall(f);
  }

  _startFall(f, inherited = null) {
    if (f.state >= 2) return;
    f.state = 2;
    f.born = this.time;
    f.fallAge = 0;
    if (inherited) {
      // Angular momentum at the failed storey carries the next slab laterally.
      f.vx += inherited.vx * .78 - inherited.wz * f.floor.height * 1.3;
      f.vz += inherited.vz * .78 + inherited.wx * f.floor.height * 1.3;
      f.wx += inherited.wx * .9;
      f.wz += inherited.wz * .9;
      f.rx += inherited.rx * .4;
      f.rz += inherited.rz * .4;
    }
    // The broken corner sets the direction; otherwise the implosion stays vertical.
    let weakX = 0, weakZ = 0;
    for (let i = 0; i < f.columns.length; i++) {
      weakX += f.columns[i].x * (1 - f.strength[i]);
      weakZ += f.columns[i].z * (1 - f.strength[i]);
    }
    f.wx += weakZ * .009;
    f.wz -= weakX * .009;
    f.vy = Math.min(-.25, f.vy);
    _point.set(f.x, f.y + 1, f.z);
    this._shedPieces(f, _point, f.building.width, f.building.kind === 'glass' ? 80 : 42, _direction.set(f.vx, .2, f.vz));
    this._emitDust(_point, 9, 2.7);
    this.lastImpact.copy(_point);
    this.crowdReaction = 1;
    if (this.flockStart < 0) this.flockStart = this.time;
    this._emit('collapse', _point, { buildingId: f.building.id, floor: f.floor.index, material: f.building.kind });
    if (this.lastCollapseBuilding !== f.building.id && this.time - this.chainTime < 7) {
      this.chain++;
      this._emit('chain', _point, { multiplier: this.chain, buildingId: f.building.id });
    }
    this.lastCollapseBuilding = f.building.id;
    this.chainTime = this.time;
  }

  placeCharge(point, buildingId, floorIndex, bankBodyId=null) {
    if (this.charges.length >= 6) return false;
    const f = this._nearestFloor(point, buildingId, floorIndex);
    if (!f || f.state === 3) return false;
    f.floor.group.updateWorldMatrix(true, false);
    const selected = f.building.bank && bankBodyId!=null ? this.bank.bodies[bankBodyId] : null;
    // The rendered roof panel or retained rubble under the pointer carries
    // its own charge, even if another structural member is nearby.
    const bankBody = f.building.bank ? (selected&&!selected.fixed&&!selected.content ? selected : this.bank.nearest(point, floorIndex)) : null;
    if (f.building.bank && !bankBody) return false;
    const local = bankBody ? point.clone().applyMatrix4(this.bank.bodyMatrix(bankBody).invert()) : f.floor.group.worldToLocal(point.clone());
    this.charges.push({ id: this.chargeId++, floor: f.index, x: local.x, y: local.y, z: local.z, when: -1, ...(bankBody ? {bankBody: bankBody.id} : {}) });
    this.render();
    return true;
  }

  detonate() {
    const unfired = this.charges.filter(c => c.when < 0);
    unfired.forEach((c, i) => { c.when = this.time + .04 + i * .19; });
    return unfired.length;
  }

  _spawnDebris(material, point, velocity, size, life = 0) {
    const i = this.debrisCursor++ % MAX_DEBRIS;
    const p = i * D;
    this.debrisExtent = Math.max(this.debrisExtent, i + 1);
    const type = MATERIAL_INDEX[material] ?? 3;
    const d = this.debris;
    d[p] = type;
    d[p + 1] = point.x; d[p + 2] = Math.max(.15, point.y); d[p + 3] = point.z;
    d[p + 4] = velocity.x; d[p + 5] = velocity.y; d[p + 6] = velocity.z;
    d[p + 7] = this.random() * 6; d[p + 8] = this.random() * 6; d[p + 9] = this.random() * 6;
    d[p + 10] = (this.random() - .5) * 7; d[p + 11] = (this.random() - .5) * 7; d[p + 12] = (this.random() - .5) * 7;
    d[p + 13] = size.x; d[p + 14] = size.y; d[p + 15] = size.z;
    d[p + 16] = 0; d[p + 17] = 0; d[p + 18] = life; d[p + 19] = 0;
  }

  _shedPieces(f, point, radius, count, direction) {
    count = Math.ceil(count);
    let hidden = 0;
    f.floor.group.updateWorldMatrix(true, true);
    const velocity = new THREE.Vector3(), size = new THREE.Vector3(), spawnPoint = new THREE.Vector3();
    for (const p of f.pieces) {
      if (hidden >= Math.ceil(count / 3)) break;
      if (p.batch) continue;
      if (this.hiddenPieces.has(p.index)) continue;
      if (p.unit) spawnPoint.copy(p.center).applyMatrix4(p.mesh.matrixWorld);
      else p.mesh.getWorldPosition(spawnPoint);
      if (spawnPoint.distanceTo(point) > radius) continue;
      this.hiddenPieces.add(p.index);
      this._setPieceHidden(p, true);
      this.hiddenDirty = true;
      hidden++;
      p.mesh.getWorldScale(_scale);
      if (p.unit) size.copy(p.size).multiply(_scale);
      else size.set(clamp(_scale.x, .25, 1.5), clamp(_scale.y, .16, .8), clamp(_scale.z, .18, 1.1));
      // Glass fragments use a horizontal sheet primitive, so the original pane's
      // longest two sides become the tumbling sheet's wide axes.
      if (p.unit) size.set(Math.max(size.x, size.z), .6, size.y);
      velocity.set((this.random() - .5) * 5 + direction.x, this.random() * 4 + .4, (this.random() - .5) * 5 + direction.z);
      this._spawnDebris(p.material, spawnPoint, velocity, size);
    }
    for (let i = 0; i < count; i++) {
      const angle = this.random() * Math.PI * 2;
      const spread = this.random() * Math.min(radius, 4.2);
      spawnPoint.set(point.x + Math.cos(angle) * spread, point.y + this.random() * Math.min(2.5, f.floor.height), point.z + Math.sin(angle) * spread);
      velocity.set(Math.cos(angle) * (2 + this.random() * 5) + direction.x, this.random() * 5 + .5, Math.sin(angle) * (2 + this.random() * 5) + direction.z);
      const r = .2 + this.random() * .55;
      if (f.building.kind === 'glass') size.set(r * 1.65, r, r * .7);
      else if (f.building.kind === 'brick') size.set(r * 1.5, r * .6, r * .74);
      else size.set(r * 1.6, r * .74, r);
      this._spawnDebris(i % 14 === 0 ? 'steel' : f.building.kind, spawnPoint, velocity, size);
    }
    f.shed += hidden;
  }

  _emitDust(point, count = 8, spread = 2) {
    count = Math.ceil(count);
    for (let n = 0; n < count; n++) {
      const i = this.dustCursor++ % MAX_DUST, p = i * U, d = this.dust;
      this.dustExtent = Math.max(this.dustExtent, i + 1);
      const angle = this.random() * Math.PI * 2, r = this.random() * spread;
      const avenue = this.random() < .5;
      d[p] = 1;
      d[p + 1] = point.x + Math.cos(angle) * r;
      d[p + 2] = Math.max(.5, point.y + this.random() * spread * .4);
      d[p + 3] = point.z + Math.sin(angle) * r;
      d[p + 4] = Math.cos(angle) * (avenue ? 2.8 : .9);
      d[p + 5] = .3 + this.random() * .6;
      d[p + 6] = Math.sin(angle) * (avenue ? .9 : 2.8);
      d[p + 7] = 0;
      d[p + 8] = 6 + this.random() * 7;
      d[p + 9] = 1.3 + this.random() * spread * 1.7;
      d[p + 10] = .23 + this.random() * .15;
      d[p + 11] = this.random() * 6.28;
      d[p + 12] = this.random();
    }
  }

  _affectProps(point, radius, power, direction) {
    if (power < 25 || point.y > 5) return;
    for (const p of this.props) {
      const x = p.prop.x ?? p.group.position.x, z = p.prop.z ?? p.group.position.z;
      if (Math.hypot(x - point.x, z - point.z) > radius + 1.2) continue;
      p.state = 1;
      if (p.prop.kind === 'tree') {
        p.targetRx = direction.z * 1.25 || .35;
        p.targetRz = -direction.x * 1.25 || 1.1;
      }
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    let remaining = Math.min(dt, .25);
    while (remaining > 1e-7) {
      const step = Math.min(remaining, 1 / 60);
      this._step(step);
      remaining -= step;
    }
    this.render();
  }

  _step(dt) {
    this.time += dt;
    this.crowdReaction = Math.max(0, this.crowdReaction - dt * .7);
    for (let i = this.charges.length - 1; i >= 0; i--) {
      const c = this.charges[i];
      if (c.when < 0 || c.when > this.time) continue;
      const f = this.floors[c.floor];
      f.floor.group.updateWorldMatrix(true, false);
      const point = c.bankBody != null ? this.bank.chargePoint(c) : f.floor.group.localToWorld(new THREE.Vector3(c.x, c.y, c.z));
      this.lastImpact.copy(point);
      this._damageFloor(f, point, 118, new THREE.Vector3(), true);
      this._emit('blast', point, { power: 118, buildingId: f.building.id });
      this.crowdReaction = 1;
      if (this.flockStart < 0) this.flockStart = this.time;
      this.charges.splice(i, 1);
    }
    this.bank?.step(dt);
    for (const f of this.floors) {
      if (f.building.bank) continue;
      if (f.state < 2) {
        this._assessSupport(f);
        if (f.below?.state >= 2) {
          const below = f.below;
          const supportsGone = below.support < .56 || below.state === 3;
          const fractureArrived = this.time - below.born > .13;
          const gapOpened = below.baseY - below.y > .22 + (f.floor.index % 3) * .06;
          if (gapOpened || (supportsGone && fractureArrived)) this._startFall(f, below);
        }
        if (f.state < 2 && f.support < .82) {
          f.state = 1;
          f.strain += dt * (.82 - f.support) * (1.1 + f.building.height / 18);
          if (f.strain > .62) this._startFall(f);
          let weakX = 0, weakZ = 0;
          for (let i = 0; i < f.columns.length; i++) {
            weakX += f.columns[i].x * (1 - f.strength[i]);
            weakZ += f.columns[i].z * (1 - f.strength[i]);
          }
          f.rx = lerp(f.rx, weakZ * .0035 * (1 + f.strain), dt * 2);
          f.rz = lerp(f.rz, -weakX * .0035 * (1 + f.strain), dt * 2);
          f.y = f.baseY - (1 - f.support) * .32 - f.strain * .3;
        }
      }
      if (f.state === 2) {
        f.fallAge += dt;
        f.vy -= 13 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.z += f.vz * dt;
        f.rx = clamp(f.rx + f.wx * dt, -.7, .7);
        f.rz = clamp(f.rz + f.wz * dt, -.7, .7);
        f.vx *= Math.exp(-dt * .18);
        f.vz *= Math.exp(-dt * .18);
        f.dustTimer += dt;
        if (f.dustTimer > .33 && f.fallAge < 2.5) {
          f.dustTimer = 0;
          _point.set(f.x + (this.random() - .5) * f.building.width, f.y + .5, f.z + (this.random() - .5) * f.building.depth);
          this._emitDust(_point, 3, 2);
          if (f.building.kind === 'glass') this._shedPieces(f, new THREE.Vector3(f.x, f.y + f.floor.height * .5, f.z), Math.max(f.building.width, f.building.depth), 45, _direction.set(f.vx, 0, f.vz));
        }
        const below = f.below;
        const overlapsBelow = below && Math.abs(f.x - below.x) < f.building.width * .83 && Math.abs(f.z - below.z) < f.building.depth * .83;
        const ground = overlapsBelow ? Math.max(.23, below.y + .52) : .23;
        if (f.y <= ground) {
          const speed = Math.abs(f.vy - (below?.vy || 0));
          f.y = ground;
          f.targetSquash = .16 + (f.floor.index % 3) * .035;
          if (below && overlapsBelow && below.state < 2) {
            const load = .58 + speed * .065;
            for (let i = 0; i < below.strength.length; i++) below.strength[i] = Math.max(0, below.strength[i] - load);
            below.vx += f.vx * .4; below.vz += f.vz * .4;
            this._assessSupport(below);
          }
          if ((!below || !overlapsBelow || below.state === 3) && f.fallAge > .18) {
            f.state = 3; f.vy = 0;
            f.vx *= .2; f.vz *= .2;
            if (!f.scored) { f.scored = true; this.tonnage += f.building.width * f.building.depth * .52; }
          } else f.vy = below?.vy || 0;
          if (speed > 1.1) {
            _point.set(f.x, Math.max(.5, f.y), f.z);
            this._emitDust(_point, 12, Math.max(3, f.building.width * .5));
            this._shedPieces(f, _point, Math.max(f.building.width, f.building.depth), 18, _direction.set(f.vx, 0, f.vz));
            this._affectProps(_point, f.building.width * .58, speed * 15, _direction.set(f.vx || 1, 0, f.vz || .4).normalize());
          }
        }
        if (f.fallAge > .2) this._checkNeighbors(f);
      }
      if (f.state === 3) {
        f.x += f.vx * dt; f.z += f.vz * dt;
        f.vx *= Math.exp(-dt * 5); f.vz *= Math.exp(-dt * 5);
      }
      f.squash = lerp(f.squash, f.targetSquash, Math.min(1, dt * 14));
    }
    for (const bs of this.buildingStates) {
      if (!bs.collapsed && bs.floors.filter(f => f.state >= 2).length >= Math.ceil(bs.floors.length * .65)) {
        bs.collapsed = true;
        this.collapsedCount++;
        this.cheerUntil = this.time + 4;
        if (bs.floors.every(f => Math.hypot(f.x - f.baseX, f.z - f.baseZ) < 2.5)) {
          _point.set(bs.building.x, 3, bs.building.z);
          this._emit('implosion', _point, { buildingId: bs.building.id, bonus: 'CLEAN IMPLOSION' });
        }
      }
    }
    this._updateDebris(dt);
    this._updateDust(dt);
    this._updateTanks(dt);
    for (const p of this.props) {
      if (!p.state) continue;
      if (p.prop.kind === 'car') p.squash = lerp(p.squash, .3, Math.min(1, dt * 9));
      else if (p.prop.kind === 'tree') {
        p.rx = lerp(p.rx, p.targetRx, Math.min(1, dt * 4));
        p.rz = lerp(p.rz, p.targetRz, Math.min(1, dt * 4));
      }
    }
  }

  _checkNeighbors(f) {
    if (Math.hypot(f.x - f.baseX, f.z - f.baseZ) < .4) return;
    for (const bs of this.buildingStates) {
      if (bs === f.bs) continue;
      const b = bs.building;
      if (Math.abs(f.x - b.x) > (f.building.width + b.width) * .5 || Math.abs(f.z - b.z) > (f.building.depth + b.depth) * .5) continue;
      const other = bs.floors.find(o => o.state < 2 && Math.abs(o.y - f.y) < Math.max(2.5, o.floor.height));
      if (!other) continue;
      const pair = f.index * 2048 + other.index;
      if (this.collisionPairs.has(pair)) continue;
      this.collisionPairs.add(pair);
      const energy = 55 + Math.abs(f.vy) * 5 + Math.hypot(f.vx, f.vz) * 12;
      const point = new THREE.Vector3((f.x + other.x) * .5, other.y + 1, (f.z + other.z) * .5);
      const direction = new THREE.Vector3(f.vx, 0, f.vz).normalize();
      this._damageFloor(other, point, energy, direction, true);
      this._emit('chain', point, { multiplier: this.chain, buildingId: other.building.id });
      f.vx *= .55; f.vz *= .55;
    }
  }

  _updateDebris(dt) {
    const d = this.debris;
    for (let i = 0; i < this.debrisExtent; i++) {
      const p = i * D;
      if (d[p] < 0 || d[p + 16]) continue;
      d[p + 17] += dt;
      if (d[p + 18] && d[p + 17] > d[p + 18]) { d[p] = -1; continue; }
      const water = d[p] === 5;
      d[p + 5] -= (water ? 11 : 15) * dt;
      d[p + 1] += d[p + 4] * dt; d[p + 2] += d[p + 5] * dt; d[p + 3] += d[p + 6] * dt;
      d[p + 7] += d[p + 10] * dt; d[p + 8] += d[p + 11] * dt; d[p + 9] += d[p + 12] * dt;
      const ground = .08 + Math.min(d[p + 13], d[p + 14], d[p + 15]) * .42;
      if (d[p + 2] <= ground) {
        const speed = Math.abs(d[p + 5]);
        d[p + 2] = ground;
        d[p + 5] = speed * (water ? .05 : d[p] === 1 ? .18 : .27);
        d[p + 4] *= water ? .92 : .63; d[p + 6] *= water ? .92 : .63;
        d[p + 10] *= .5; d[p + 11] *= .5; d[p + 12] *= .5;
        d[p + 19]++;
        if (!water && d[p + 19] === 1 && speed > 5 && i % 19 === 0) {
          _point.set(d[p + 1], .35, d[p + 3]);
          this._emitDust(_point, 1, .75);
          if (d[p + 13] > .65) this._affectProps(_point, .8, speed * 9, _direction.set(d[p + 4], 0, d[p + 6]).normalize());
        }
        if (!water && (speed < .9 || d[p + 19] > 8)) {
          d[p + 16] = 1;
          d[p + 4] = d[p + 5] = d[p + 6] = 0;
          d[p + 10] = d[p + 11] = d[p + 12] = 0;
        }
        if (water) { d[p + 14] *= .72; d[p + 13] *= 1.05; d[p + 15] *= 1.05; }
      }
    }
  }

  _updateDust(dt) {
    const d = this.dust;
    for (let i = 0; i < this.dustExtent; i++) {
      const p = i * U;
      if (!d[p]) continue;
      d[p + 7] += dt;
      if (d[p + 7] > d[p + 8]) { d[p] = 0; continue; }
      d[p + 1] += d[p + 4] * dt;
      d[p + 2] += d[p + 5] * dt;
      d[p + 3] += d[p + 6] * dt;
      d[p + 4] *= Math.exp(-dt * .2); d[p + 6] *= Math.exp(-dt * .2);
      d[p + 5] *= Math.exp(-dt * .12);
    }
  }

  _updateTanks(dt) {
    for (const t of this.tanks) {
      const top = t.bs.floors[t.bs.floors.length - 1];
      if (t.state === 0 && top.state === 2 && top.fallAge > .3) {
        t.group.updateWorldMatrix(true, false);
        t.group.getWorldPosition(_point);
        t.x = _point.x; t.y = _point.y; t.z = _point.z;
        t.vx = top.vx + 1.7; t.vy = top.vy; t.vz = top.vz + .7;
        t.state = 1;
        this.effects.attach(t.group);
      }
      if (!t.state) continue;
      t.age += dt;
      if (t.state === 1) {
        t.vy -= dt * 12;
        t.x += t.vx * dt; t.y += t.vy * dt; t.z += t.vz * dt;
        t.rx += dt * .7; t.rz += dt * .45;
        if (t.y < 1.2) { t.y = 1.2; t.state = 2; t.vx = t.vy = t.vz = 0; }
      }
      if (!t.burst && (t.age > .7 || t.state === 2)) {
        t.burst = true; t.bs.waterBurst = true;
        const point = new THREE.Vector3(t.x, t.y + 1, t.z), velocity = new THREE.Vector3(), size = new THREE.Vector3();
        for (let i = 0; i < 180; i++) {
          const a = this.random() * Math.PI * 2, speed = 4 + this.random() * 9;
          velocity.set(Math.cos(a) * speed, this.random() * 7, Math.sin(a) * speed);
          const r = .08 + this.random() * .2; size.set(r, r * 1.8, r);
          this._spawnDebris('water', point, velocity, size, 4 + this.random() * 3);
        }
        for (let i = 0; i < this.debrisExtent; i++) {
          const p = i * D;
          if (this.debris[p] < 0 || this.debris[p] === 5) continue;
          const dx = this.debris[p + 1] - t.x, dz = this.debris[p + 3] - t.z, distance = Math.hypot(dx, dz);
          if (distance > 6 || distance < .1) continue;
          this.debris[p + 16] = 0;
          this.debris[p + 4] += dx / distance * 3;
          this.debris[p + 6] += dz / distance * 3;
          this.debris[p + 5] += 1;
        }
        this._emit('water', point, { buildingId: t.bs.building.id });
      }
    }
  }

  capture() {
    if (this.hiddenDirty) {
      this.hiddenSnapshot = Uint32Array.from(this.hiddenPieces);
      this.hiddenDirty = false;
    }
    const floors = new Float64Array(this.floors.length * FLOOR_STRIDE);
    let columnCount = 0;
    for (const f of this.floors) columnCount += f.strength.length;
    const strengths = new Float32Array(columnCount);
    let col = 0;
    for (let i = 0; i < this.floors.length; i++) {
      const f = this.floors[i], p = i * FLOOR_STRIDE;
      floors.set([f.x, f.y, f.z, f.rx, f.rz, f.vx, f.vy, f.vz, f.wx, f.wz, f.state, f.strain, f.fallAge, f.squash, f.targetSquash, f.shed, f.impact, f.support, +f.scored, f.born, f.dustTimer, 0], p);
      strengths.set(f.strength, col); col += f.strength.length;
    }
    return {
      version: 1, time: this.time, seed: this.seed,
      ...(this.bank ? {bank: this.bank.capture()} : {}),
      floors, strengths, debris: this.debris.slice(0, this.debrisExtent * D), dust: this.dust.slice(0, this.dustExtent * U),
      debrisCursor: this.debrisCursor, dustCursor: this.dustCursor,
      hidden: this.hiddenSnapshot,
      charges: this.charges.map(c => ({ ...c })), chargeId: this.chargeId,
      props: this.props.map(p => [p.state, p.squash, p.rx, p.rz, p.targetRx, p.targetRz]),
      tanks: this.tanks.map(t => [t.state, t.x, t.y, t.z, t.rx, t.rz, t.vx, t.vy, t.vz, t.age, +t.burst]),
      buildings: this.buildingStates.map(bs => [+bs.collapsed, +bs.waterBurst]),
      tonnage: this.tonnage, chain: this.chain, chainTime: this.chainTime, collapsed: this.collapsedCount,
      lastCollapseBuilding: this.lastCollapseBuilding, lastImpact: this.lastImpact.toArray(),
      crowdReaction: this.crowdReaction, cheerUntil: this.cheerUntil, flockStart: this.flockStart,
      collisionPairs: Array.from(this.collisionPairs),
    };
  }

  restore(a, b = null, alpha = 0) {
    if (!a) return;
    const t = b ? clamp(alpha, 0, 1) : 0;
    this.time = a.time;
    this.seed = a.seed;
    this.debrisCursor = a.debrisCursor; this.dustCursor = a.dustCursor;
    this.debrisExtent = a.debris.length / D; this.dustExtent = a.dust.length / U;
    this.debris.fill(0);
    for (let i = 0; i < MAX_DEBRIS; i++) this.debris[i * D] = -1;
    this.debris.set(a.debris);
    this.dust.fill(0); this.dust.set(a.dust);
    let col = 0;
    for (let i = 0; i < this.floors.length; i++) {
      const f = this.floors[i], p = i * FLOOR_STRIDE, s = a.floors;
      [f.x, f.y, f.z, f.rx, f.rz, f.vx, f.vy, f.vz, f.wx, f.wz, f.state, f.strain, f.fallAge, f.squash, f.targetSquash, f.shed, f.impact, f.support] = s.subarray(p, p + 18);
      f.scored = !!s[p + 18]; f.born = s[p + 19]; f.dustTimer = s[p + 20];
      f.strength.set(a.strengths.subarray(col, col + f.strength.length)); col += f.strength.length;
    }
    for (const index of this.hiddenPieces) this._setPieceHidden(this.pieces[index], false);
    this.hiddenPieces = new Set(a.hidden);
    for (const index of this.hiddenPieces) this._setPieceHidden(this.pieces[index], true);
    this.hiddenSnapshot = a.hidden; this.hiddenDirty = false;
    this.charges = a.charges.map(c => ({ ...c })); this.chargeId = a.chargeId;
    a.props.forEach((s, i) => { const p = this.props[i]; [p.state, p.squash, p.rx, p.rz, p.targetRx, p.targetRz] = s; });
    a.tanks.forEach((s, i) => { const tank = this.tanks[i]; [tank.state, tank.x, tank.y, tank.z, tank.rx, tank.rz, tank.vx, tank.vy, tank.vz, tank.age] = s; tank.burst = !!s[10]; });
    a.buildings.forEach((s, i) => { this.buildingStates[i].collapsed = !!s[0]; this.buildingStates[i].waterBurst = !!s[1]; });
    this.tonnage = a.tonnage; this.chain = a.chain; this.chainTime = a.chainTime; this.collapsedCount = a.collapsed;
    this.lastCollapseBuilding = a.lastCollapseBuilding; this.lastImpact.fromArray(a.lastImpact);
    this.crowdReaction = a.crowdReaction; this.cheerUntil = a.cheerUntil; this.flockStart = a.flockStart;
    this.collisionPairs = new Set(a.collisionPairs);
    if (this.bank && a.bank) this.bank.restore(a.bank);
    this.render(b, t);
  }

  render(next = null, alpha = 0) {
    this.presentation = { next, alpha };
    for (let i = 0; i < this.floors.length; i++) {
      const f = this.floors[i], group = f.floor.group, p = i * FLOOR_STRIDE;
      group.position.set(next ? lerp(f.x, next.floors[p], alpha) : f.x, next ? lerp(f.y, next.floors[p + 1], alpha) : f.y, next ? lerp(f.z, next.floors[p + 2], alpha) : f.z);
      group.rotation.x = next ? lerp(f.rx, next.floors[p + 3], alpha) : f.rx;
      group.rotation.z = next ? lerp(f.rz, next.floors[p + 4], alpha) : f.rz;
      group.scale.y = next ? lerp(f.squash, next.floors[p + 13], alpha) : f.squash;
    }
    this.bank?.render(next?.bank, alpha);
    this._renderReinforcement();
    const counts = new Uint16Array(6), d = this.debris;
    const cameraPosition = this.camera ? this.camera.getWorldPosition(new THREE.Vector3()) : null;
    const lodDistance = this.quality === 'low' ? 28 : this.quality === 'medium' ? 43 : 62;
    let farCount = 0, nearCount = 0;
    if (typeof window !== 'undefined') this.farMaterial.uniforms.viewportScale.value = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2) * .6;
    for (let i = 0; i < this.debrisExtent; i++) {
      const p = i * D, kind = d[p];
      if (kind < 0) continue;
      const n = next?.debris;
      const blend = n && p < n.length && n[p] === kind && n[p + 17] >= d[p + 17] && n[p + 17] - d[p + 17] < .2 ? alpha : 0;
      const disappearing = next && (!n || p >= n.length || n[p] < 0);
      _dummy.position.set(blend ? lerp(d[p + 1], n[p + 1], blend) : d[p + 1], blend ? lerp(d[p + 2], n[p + 2], blend) : d[p + 2], blend ? lerp(d[p + 3], n[p + 3], blend) : d[p + 3]);
      _dummy.rotation.set(blend ? lerp(d[p + 7], n[p + 7], blend) : d[p + 7], blend ? lerp(d[p + 8], n[p + 8], blend) : d[p + 8], blend ? lerp(d[p + 9], n[p + 9], blend) : d[p + 9]);
      const visibility = disappearing ? 1 - alpha : 1;
      _dummy.scale.set(d[p + 13] * visibility, d[p + 14] * visibility, d[p + 15] * visibility);
      if (visibility > 0 && cameraPosition && (_dummy.position.distanceToSquared(cameraPosition) > lodDistance * lodDistance || nearCount >= this.debrisBudget)) {
        const color = this.debrisMeshes[kind].material.color;
        this.farPositions.setXYZ(farCount, _dummy.position.x, _dummy.position.y, _dummy.position.z);
        this.farColors.setXYZ(farCount, color.r, color.g, color.b);
        this.farSizes.setX(farCount, Math.max(d[p + 13], d[p + 14], d[p + 15]) * visibility);
        this.farTypes.setX(farCount, kind);
        farCount++;
        continue;
      }
      _dummy.updateMatrix();
      this.debrisMeshes[kind].setMatrixAt(counts[kind]++, _dummy.matrix);
      nearCount++;
    }
    this.debrisMeshes.forEach((mesh, i) => { mesh.count = counts[i]; mesh.instanceMatrix.needsUpdate = true; });
    this.farDebris.geometry.setDrawRange(0, farCount);
    this.farPositions.needsUpdate = this.farColors.needsUpdate = this.farSizes.needsUpdate = this.farTypes.needsUpdate = true;
    let dustCount = 0;
    for (let i = 0; i < this.dustExtent; i++) {
      const p = i * U, s = this.dust;
      if (!s[p]) continue;
      if (((i * 53) % MAX_DUST) >= this.dustBudget) continue;
      const n = next?.dust, blend = n && p < n.length && n[p] && n[p + 7] >= s[p + 7] ? alpha : 0;
      const age = blend ? lerp(s[p + 7], n[p + 7], blend) : s[p + 7];
      const life = s[p + 8];
      const expansion = 1 + age * .22;
      _dummy.position.set(blend ? lerp(s[p + 1], n[p + 1], blend) : s[p + 1], blend ? lerp(s[p + 2], n[p + 2], blend) : s[p + 2], blend ? lerp(s[p + 3], n[p + 3], blend) : s[p + 3]);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.set(s[p + 9] * expansion, s[p + 9] * expansion * .88, 1);
      _dummy.updateMatrix();
      this.dustMesh.setMatrixAt(dustCount, _dummy.matrix);
      const visibility = next && (!n || p >= n.length || !n[p]) ? 1 - alpha : 1;
      this.dustAlphas.setX(dustCount, visibility * s[p + 10] * Math.min(1, age * 4) * Math.max(0, 1 - age / life) ** 1.3);
      dustCount++;
    }
    this.dustMesh.count = dustCount;
    this.dustMesh.instanceMatrix.needsUpdate = true;
    this.dustAlphas.needsUpdate = true;
    for (let i = 0; i < this.chargeMeshes.length; i++) {
      const mesh = this.chargeMeshes[i], charge = this.charges[i];
      mesh.visible = !!charge;
      if (!charge) continue;
      const f = this.floors[charge.floor];
      f.floor.group.updateWorldMatrix(true, false);
      mesh.position.copy(charge.bankBody != null ? _point.set(charge.x,charge.y,charge.z).applyMatrix4(this.bank.presentationMatrices[charge.bankBody]) : f.floor.group.localToWorld(_point.set(charge.x, charge.y, charge.z)));
      mesh.scale.setScalar(1 + Math.sin(this.time * 9 + i) * .07);
    }
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i], n = next?.props[i];
      p.group.scale.copy(p.baseScale); p.group.scale.y *= n ? lerp(p.squash, n[1], alpha) : p.squash;
      p.group.rotation.copy(p.baseRotation);
      p.group.rotation.x += n ? lerp(p.rx, n[2], alpha) : p.rx;
      p.group.rotation.z += n ? lerp(p.rz, n[3], alpha) : p.rz;
    }
    for (let i = 0; i < this.tanks.length; i++) {
      const t = this.tanks[i], n = next?.tanks[i];
      if (!t.state && (!n || !n[0] || !alpha)) {
        if (t.group.parent !== t.parent) t.parent.add(t.group);
        t.group.position.copy(t.base); t.group.rotation.copy(t.rotation);
      } else {
        if (t.group.parent !== this.effects) this.effects.add(t.group);
        const source = t.state ? new THREE.Vector3(t.x, t.y, t.z) : this._tankAttachedPosition(t);
        const target = !n ? source : n[0] ? new THREE.Vector3(n[1], n[2], n[3]) : this._tankAttachedPosition(t, next);
        t.group.position.lerpVectors(source, target, n ? alpha : 0);
        const top = t.bs.floors.at(-1), p = top.index * FLOOR_STRIDE;
        const fromRx = t.state ? t.rx : top.rx + t.rotation.x;
        const fromRz = t.state ? t.rz : top.rz + t.rotation.z;
        const toRx = !n ? fromRx : n[0] ? n[4] : next.floors[p + 3] + t.rotation.x;
        const toRz = !n ? fromRz : n[0] ? n[5] : next.floors[p + 4] + t.rotation.z;
        t.group.rotation.set(lerp(fromRx, toRx, alpha), t.rotation.y, lerp(fromRz, toRz, alpha));
      }
    }
    const viewTime = next ? lerp(this.time, next.time, alpha) : this.time;
    for (const p of this.crowd) {
      const cheering = viewTime < this.cheerUntil;
      p.group.scale.y = p.scale * (1 - this.crowdReaction * .24);
      p.group.position.y = p.baseY + (cheering ? Math.max(0, Math.sin(viewTime * 8 + p.phase)) * .16 : 0);
      const arms = p.person.arms || p.group.userData.arms;
      if (arms) arms.forEach((arm, i) => { arm.rotation.z = cheering ? Math.sin(viewTime * 6 + p.phase) * .25 + (i ? -1.8 : 1.8) : (i ? -.16 : .16); });
    }
    for (const p of this.pigeons) {
      const elapsed = this.flockStart < 0 ? -1 : Math.max(0, viewTime - this.flockStart - (p.phase % .35));
      p.group.visible = elapsed < 10;
      if (elapsed < 0) { p.group.position.copy(p.base); p.group.rotation.copy(p.rotation); continue; }
      const speed = Math.min(elapsed * 3, 6);
      p.group.position.set(p.base.x + Math.cos(p.direction) * elapsed * speed, p.base.y + Math.min(elapsed * 3, 18) + Math.sin(elapsed * 3 + p.phase) * .3, p.base.z + Math.sin(p.direction) * elapsed * speed);
      p.group.rotation.y = -p.direction;
      const wings = p.bird.wings || p.group.userData.wings;
      if (wings) wings.forEach((wing, i) => { wing.rotation.z = Math.sin(viewTime * 32 + p.phase) * 1.1 * (i ? -1 : 1); });
    }
  }

  _tankAttachedPosition(tank, snapshot = null) {
    const floor = tank.bs.floors.at(-1), p = floor.index * FLOOR_STRIDE, s = snapshot?.floors;
    _point.set(s ? s[p] : floor.x, s ? s[p + 1] : floor.y, s ? s[p + 2] : floor.z);
    _quaternion.setFromEuler(_euler.set(s ? s[p + 3] : floor.rx, 0, s ? s[p + 4] : floor.rz));
    _scale.set(1, s ? s[p + 13] : floor.squash, 1);
    _matrix.compose(_point, _quaternion, _scale);
    return tank.base.clone().applyMatrix4(_matrix);
  }

  _renderReinforcement() {
    let count = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const direction = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const f of this.floors) {
      if (f.building.bank || f.state === 0 && f.support > .9) continue;
      f.floor.group.updateWorldMatrix(true, false);
      for (let i = 0; i < f.columns.length; i++) {
        const damage = f.state >= 2 ? Math.max(.65, 1 - f.strength[i]) : 1 - f.strength[i];
        if (damage < .18) continue;
        const column = f.columns[i];
        const thickness = f.building.kind === 'glass' ? .055 : .029;
        const bendX = (column.x < 0 ? -1 : 1) * damage * .55;
        const bendZ = (column.z < 0 ? -1 : 1) * damage * .28;
        for (let rod = 0; rod < 2; rod++) {
          const offset = rod ? .17 : -.17;
          a.set(column.x + offset, .1, column.z + .23).applyMatrix4(f.floor.group.matrixWorld);
          b.set(column.x + offset + bendX, f.floor.height * .55, column.z + .23 + bendZ).applyMatrix4(f.floor.group.matrixWorld);
          c.set(column.x + offset - bendX * .35, f.floor.height * .95, column.z + .23 + bendZ * .25).applyMatrix4(f.floor.group.matrixWorld);
          for (const [from, to] of [[a, b], [b, c]]) {
            if (count >= 2048) break;
            direction.subVectors(to, from);
            const length = direction.length();
            _dummy.position.addVectors(from, to).multiplyScalar(.5);
            _dummy.quaternion.setFromUnitVectors(up, direction.normalize());
            _dummy.scale.set(thickness, length, thickness);
            _dummy.updateMatrix();
            this.rebarMesh.setMatrixAt(count++, _dummy.matrix);
          }
        }
      }
    }
    this.rebarMesh.count = count;
    this.rebarMesh.instanceMatrix.needsUpdate = true;
  }

  get stats() {
    let pieces = 0;
    for (let i = 0; i < this.debrisExtent; i++) if (this.debris[i * D] >= 0) pieces++;
    return { tonnage: Math.round(this.tonnage), chain: this.chain, collapsed: this.collapsedCount, charges: this.charges.length, pieces, ...(this.bank ? {bank: this.bank.stats} : {}) };
  }
}
