import * as THREE from "three";

import type {
  BuildingAssembly,
  DistrictScene,
  MaterialKind,
  PieceKind,
  ScenicActor,
  StructuralPiece,
} from "./types";

type Facing = "north" | "south" | "east" | "west";

interface PieceOptions {
  floor: number;
  kind: PieceKind;
  material: MaterialKind;
  size: THREE.Vector3;
  position: THREE.Vector3;
  mass: number;
  strength: number;
  collapseBias?: THREE.Vector3;
  quaternion?: THREE.Quaternion;
}

interface InstanceTransform {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  quaternion?: THREE.Quaternion;
  color?: THREE.Color;
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const setFarDetail = <T extends THREE.Object3D>(object: T): T => {
  object.userData.farDetail = true;
  return object;
};

export function createDistrict(): DistrictScene {
  const root = new THREE.Group();
  root.name = "District 08 — demolition playground";

  const destructibleRoot = new THREE.Group();
  destructibleRoot.name = "Identity structural simulation root";
  root.add(destructibleRoot);

  const buildings: BuildingAssembly[] = [];
  const pieces: StructuralPiece[] = [];
  const pigeons: ScenicActor[] = [];
  const spectators: ScenicActor[] = [];
  const warningLights: THREE.PointLight[] = [];
  const cars: THREE.Object3D[] = [];
  const trees: THREE.Object3D[] = [];
  let nextPieceId = 1;
  let waterTankPiece: StructuralPiece | null = null;

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
  const unitSphere = new THREE.SphereGeometry(1, 12, 8);
  const unitWheel = new THREE.CylinderGeometry(1, 1, 1, 12);

  const materials = {
    asphalt: new THREE.MeshStandardMaterial({ color: 0x4c5358, roughness: 0.92 }),
    asphaltLight: new THREE.MeshStandardMaterial({ color: 0x626a6f, roughness: 0.92 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xc8c3b5, roughness: 0.92 }),
    sidewalkEdge: new THREE.MeshStandardMaterial({ color: 0xddd6c4, roughness: 0.88 }),
    lane: new THREE.MeshStandardMaterial({ color: 0xf2d36b, roughness: 0.7 }),
    whitePaint: new THREE.MeshStandardMaterial({ color: 0xf6f2df, roughness: 0.75 }),
    grass: new THREE.MeshStandardMaterial({ color: 0x77a85b, roughness: 0.96 }),
    bankStone: new THREE.MeshStandardMaterial({ color: 0xe4cda4, roughness: 0.72 }),
    bankStoneLight: new THREE.MeshStandardMaterial({ color: 0xf1dfbc, roughness: 0.68 }),
    bankStoneDark: new THREE.MeshStandardMaterial({ color: 0xb99f76, roughness: 0.8 }),
    brick: new THREE.MeshStandardMaterial({ color: 0xa94731, roughness: 0.88 }),
    brickWarm: new THREE.MeshStandardMaterial({ color: 0xc45a38, roughness: 0.86 }),
    brickDark: new THREE.MeshStandardMaterial({ color: 0x783125, roughness: 0.9 }),
    mortar: new THREE.MeshStandardMaterial({ color: 0xd2b39a, roughness: 0.92 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xb7b5aa, roughness: 0.91 }),
    concreteDark: new THREE.MeshStandardMaterial({ color: 0x777b78, roughness: 0.93 }),
    concreteWarm: new THREE.MeshStandardMaterial({ color: 0xc9bda7, roughness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x2e89ba,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
    glassLight: new THREE.MeshStandardMaterial({
      color: 0x79cae8,
      roughness: 0.08,
      metalness: 0.22,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
    }),
    glassDark: new THREE.MeshStandardMaterial({
      color: 0x164968,
      metalness: 0.2,
      roughness: 0.2,
    }),
    steel: new THREE.MeshStandardMaterial({ color: 0x4d5b61, metalness: 0.72, roughness: 0.31 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x252f35, metalness: 0.77, roughness: 0.29 }),
    galvanized: new THREE.MeshStandardMaterial({ color: 0x9ca9aa, metalness: 0.62, roughness: 0.32 }),
    craneYellow: new THREE.MeshStandardMaterial({ color: 0xf2b61f, roughness: 0.42, metalness: 0.22 }),
    craneDark: new THREE.MeshStandardMaterial({ color: 0x30363a, roughness: 0.68, metalness: 0.35 }),
    hazardOrange: new THREE.MeshStandardMaterial({ color: 0xf36d22, roughness: 0.55 }),
    hazardWhite: new THREE.MeshStandardMaterial({ color: 0xfff4d6, roughness: 0.58 }),
    lampGlow: new THREE.MeshStandardMaterial({
      color: 0xffd77f,
      emissive: 0xffb43e,
      emissiveIntensity: 1.6,
      roughness: 0.25,
    }),
    warningGlow: new THREE.MeshStandardMaterial({
      color: 0xff9d26,
      emissive: 0xff6a00,
      emissiveIntensity: 2.2,
      roughness: 0.22,
    }),
    treeTrunk: new THREE.MeshStandardMaterial({ color: 0x704b32, roughness: 0.96 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x3c9955, roughness: 0.88 }),
    foliageLight: new THREE.MeshStandardMaterial({ color: 0x6dbb55, roughness: 0.86 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8d5d35, roughness: 0.88 }),
    waterTank: new THREE.MeshStandardMaterial({ color: 0x8a6442, roughness: 0.84 }),
    waterTankLight: new THREE.MeshStandardMaterial({ color: 0xb18a5d, roughness: 0.82 }),
    hydrant: new THREE.MeshStandardMaterial({ color: 0xe7492e, roughness: 0.6, metalness: 0.15 }),
    black: new THREE.MeshStandardMaterial({ color: 0x161b1e, roughness: 0.72 }),
    tire: new THREE.MeshStandardMaterial({ color: 0x15191b, roughness: 0.94 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xaeb9ba, roughness: 0.22, metalness: 0.84 }),
    hardHat: new THREE.MeshStandardMaterial({ color: 0xffd62f, roughness: 0.46 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xb97852, roughness: 0.82 }),
    denim: new THREE.MeshStandardMaterial({ color: 0x275783, roughness: 0.83 }),
    safetyVest: new THREE.MeshStandardMaterial({ color: 0xe9f233, roughness: 0.58 }),
    pigeon: new THREE.MeshStandardMaterial({ color: 0x62727a, roughness: 0.85 }),
    pigeonWing: new THREE.MeshStandardMaterial({ color: 0x394b55, roughness: 0.87 }),
    billboardBlue: new THREE.MeshStandardMaterial({ color: 0x176ba3, roughness: 0.57 }),
    billboardCoral: new THREE.MeshStandardMaterial({ color: 0xeb6044, roughness: 0.57 }),
  };

  const makeBox = (
    material: THREE.Material,
    size: THREE.Vector3,
    position = new THREE.Vector3(),
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.copy(size);
    mesh.position.copy(position);
    return mesh;
  };

  const makeCylinder = (
    material: THREE.Material,
    radius: number,
    height: number,
    position = new THREE.Vector3(),
  ) => {
    const mesh = new THREE.Mesh(unitCylinder, material);
    mesh.scale.set(radius, height, radius);
    mesh.position.copy(position);
    return mesh;
  };

  const instancedBoxes = (
    material: THREE.Material,
    transforms: InstanceTransform[],
    farDetail = true,
  ) => {
    const mesh = new THREE.InstancedMesh(unitBox, material, transforms.length);
    const matrix = new THREE.Matrix4();
    const identity = new THREE.Quaternion();
    transforms.forEach((transform, index) => {
      matrix.compose(
        transform.position,
        transform.quaternion ?? identity,
        transform.scale,
      );
      mesh.setMatrixAt(index, matrix);
      if (transform.color) mesh.setColorAt(index, transform.color);
    });
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    if (farDetail) setFarDetail(mesh);
    return mesh;
  };

  const beamBetween = (
    material: THREE.Material,
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
  ) => {
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const direction = end.clone().sub(start);
    const mesh = makeCylinder(material, radius, direction.length(), midpoint);
    mesh.quaternion.setFromUnitVectors(v3(0, 1, 0), direction.normalize());
    return mesh;
  };

  const applyShadows = (object: THREE.Object3D, cast = true) => {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
      let cursor: THREE.Object3D | null = child;
      let shadowExcluded = false;
      while (cursor) {
        if (cursor.userData.farDetail || cursor.userData.noShadow) {
          shadowExcluded = true;
          break;
        }
        if (cursor === object) break;
        cursor = cursor.parent;
      }
      child.castShadow = cast && !shadowExcluded && !childMaterials.some((material) => material.transparent);
      child.receiveShadow = true;
    });
  };

  const createAssembly = (
    id: string,
    label: string,
    center: THREE.Vector3,
    footprint: THREE.Vector2,
    topFloor: number,
    primaryMaterial: MaterialKind,
    waterTower = false,
  ) => {
    const assembly: BuildingAssembly = {
      id,
      label,
      pieces: [],
      center: center.clone(),
      footprint: footprint.clone(),
      topFloor,
      primaryMaterial,
      stability: 1,
      collapseStarted: false,
      collapseClock: 0,
      waterTower,
    };
    buildings.push(assembly);
    return assembly;
  };

  const addPiece = (
    assembly: BuildingAssembly,
    object: THREE.Object3D,
    options: PieceOptions,
  ) => {
    object.position.copy(options.position);
    if (options.quaternion) object.quaternion.copy(options.quaternion);
    object.name = `${assembly.id} · ${options.kind} · ${nextPieceId}`;
    object.userData.pieceId = nextPieceId;
    object.userData.buildingId = assembly.id;
    object.userData.materialKind = options.material;
    destructibleRoot.add(object);
    applyShadows(object, true);

    const outward = options.position.clone().sub(assembly.center);
    outward.y = 0;
    if (outward.lengthSq() < 0.05) {
      outward.set(
        Math.sin(nextPieceId * 2.13),
        0,
        Math.cos(nextPieceId * 1.77),
      );
    }
    outward.normalize();

    let defaultCollapseBias: THREE.Vector3;
    switch (options.kind) {
      case "floor":
      case "roof":
        defaultCollapseBias = outward.multiplyScalar(0.15).add(v3(0, -1, 0));
        break;
      case "facade":
        defaultCollapseBias = outward.add(v3(0, -0.42, 0));
        break;
      case "column":
        defaultCollapseBias = outward.multiplyScalar(0.28).add(v3(0, -1, 0));
        break;
      case "beam":
        defaultCollapseBias = outward.multiplyScalar(0.48).add(v3(0, -0.78, 0));
        break;
      case "cornice":
        defaultCollapseBias = outward.multiplyScalar(0.78).add(v3(0, -0.62, 0));
        break;
      case "tank":
        defaultCollapseBias = outward.multiplyScalar(0.6).add(v3(0, -0.5, 0));
        break;
      default:
        defaultCollapseBias = outward.multiplyScalar(0.45).add(v3(0, -0.72, 0));
    }
    defaultCollapseBias.normalize();

    const piece: StructuralPiece = {
      id: nextPieceId,
      object,
      buildingId: assembly.id,
      floor: options.floor,
      kind: options.kind,
      material: options.material,
      size: options.size.clone(),
      radius: Math.max(0.45, options.size.length() * 0.48),
      mass: THREE.MathUtils.clamp(options.mass, 2, 90),
      strength: options.strength,
      damage: 0,
      homePosition: options.position.clone(),
      homeQuaternion: object.quaternion.clone(),
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
      collapseBias: options.collapseBias?.clone().normalize() ?? defaultCollapseBias,
      detached: false,
      sleeping: false,
      sleepClock: 0,
      collapseDelay: 0,
      impactCooldown: 0,
    };
    nextPieceId += 1;
    assembly.pieces.push(piece);
    pieces.push(piece);
    return piece;
  };

  const addWindowGrid = (
    panel: THREE.Group,
    size: THREE.Vector3,
    facing: Facing,
    columns: number,
    rows: number,
    glassMaterial: THREE.Material,
    frameMaterial: THREE.Material,
    inset = 0.16,
  ) => {
    const horizontalLength = facing === "north" || facing === "south" ? size.x : size.z;
    const cellWidth = horizontalLength / columns;
    const cellHeight = size.y / rows;
    const windowWidth = Math.max(0.42, cellWidth * 0.64);
    const windowHeight = Math.max(0.55, cellHeight * 0.61);
    const sign = facing === "north" || facing === "east" ? 1 : -1;
    const windows: InstanceTransform[] = [];
    const frames: InstanceTransform[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const u = -horizontalLength / 2 + cellWidth * (column + 0.5);
        const y = -size.y / 2 + cellHeight * (row + 0.5);
        if (facing === "north" || facing === "south") {
          const z = sign * (size.z / 2 + 0.035);
          windows.push({ position: v3(u, y, z), scale: v3(windowWidth, windowHeight, 0.09) });
          frames.push(
            { position: v3(u, y - windowHeight / 2, z + sign * inset), scale: v3(windowWidth + 0.2, 0.12, 0.12) },
            { position: v3(u, y + windowHeight / 2, z + sign * inset), scale: v3(windowWidth + 0.2, 0.12, 0.12) },
            { position: v3(u - windowWidth / 2, y, z + sign * inset), scale: v3(0.12, windowHeight, 0.12) },
            { position: v3(u + windowWidth / 2, y, z + sign * inset), scale: v3(0.12, windowHeight, 0.12) },
          );
        } else {
          const x = sign * (size.x / 2 + 0.035);
          windows.push({ position: v3(x, y, u), scale: v3(0.09, windowHeight, windowWidth) });
          frames.push(
            { position: v3(x + sign * inset, y - windowHeight / 2, u), scale: v3(0.12, 0.12, windowWidth + 0.2) },
            { position: v3(x + sign * inset, y + windowHeight / 2, u), scale: v3(0.12, 0.12, windowWidth + 0.2) },
            { position: v3(x + sign * inset, y, u - windowWidth / 2), scale: v3(0.12, windowHeight, 0.12) },
            { position: v3(x + sign * inset, y, u + windowWidth / 2), scale: v3(0.12, windowHeight, 0.12) },
          );
        }
      }
    }
    panel.add(instancedBoxes(glassMaterial, windows));
    panel.add(instancedBoxes(frameMaterial, frames));
  };

  const addBrickCourses = (
    panel: THREE.Group,
    size: THREE.Vector3,
    facing: Facing,
    material: THREE.Material,
  ) => {
    const horizontalLength = facing === "north" || facing === "south" ? size.x : size.z;
    const rows = Math.max(5, Math.floor(size.y / 0.38));
    const columns = Math.max(5, Math.floor(horizontalLength / 0.8));
    const sign = facing === "north" || facing === "east" ? 1 : -1;
    const bricks: InstanceTransform[] = [];
    for (let row = 0; row < rows; row += 1) {
      const brickWidth = horizontalLength / columns;
      const offset = row % 2 === 0 ? 0 : brickWidth * 0.5;
      for (let column = -1; column <= columns; column += 1) {
        const u = -horizontalLength / 2 + brickWidth * (column + 0.5) + offset;
        if (Math.abs(u) > horizontalLength / 2 - brickWidth * 0.28) continue;
        const y = -size.y / 2 + ((row + 0.5) * size.y) / rows;
        const color = new THREE.Color(row % 3 === 0 ? 0xb64c32 : row % 3 === 1 ? 0x9b3d2a : 0xc25735);
        if (facing === "north" || facing === "south") {
          bricks.push({
            position: v3(u, y, sign * (size.z / 2 + 0.035)),
            scale: v3(brickWidth * 0.88, size.y / rows - 0.045, 0.085),
            color,
          });
        } else {
          bricks.push({
            position: v3(sign * (size.x / 2 + 0.035), y, u),
            scale: v3(0.085, size.y / rows - 0.045, brickWidth * 0.88),
            color,
          });
        }
      }
    }
    panel.add(instancedBoxes(material, bricks));
  };

  const addRebarEdge = (group: THREE.Group, size: THREE.Vector3, alongX: boolean) => {
    const rods: InstanceTransform[] = [];
    for (let index = -2; index <= 2; index += 1) {
      if (alongX) {
        rods.push({ position: v3((size.x / 5) * index, 0, size.z / 2 + 0.24), scale: v3(0.055, 0.055, 0.72) });
      } else {
        rods.push({ position: v3(size.x / 2 + 0.24, 0, (size.z / 5) * index), scale: v3(0.72, 0.055, 0.055) });
      }
    }
    group.add(instancedBoxes(materials.steelDark, rods));
  };

  const addScenicBox = (
    size: THREE.Vector3,
    position: THREE.Vector3,
    material: THREE.Material,
    cast = false,
  ) => {
    const mesh = makeBox(material, size, position);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };

  // A green outer verge prevents the procedural city from feeling like a floating gray slab.
  addScenicBox(v3(112, 0.8, 92), v3(0, -0.65, 0), materials.grass);
  addScenicBox(v3(96, 0.65, 72), v3(0, -0.28, 0), materials.asphalt);

  const lotPads = [
    { center: v3(-23, 0.06, -16), size: v3(24, 0.32, 21) },
    { center: v3(9.5, 0.06, -17), size: v3(23, 0.32, 21) },
    { center: v3(-24, 0.06, 19), size: v3(29, 0.32, 20) },
    { center: v3(4.5, 0.06, 19), size: v3(23, 0.32, 20) },
    { center: v3(27, 0.06, 19), size: v3(20, 0.32, 20) },
  ];
  lotPads.forEach(({ center, size }) => addScenicBox(size, center, materials.sidewalk, false));

  // Roads, lane paint, and two broad zebra crossings read clearly from the hero camera.
  addScenicBox(v3(92, 0.08, 9.2), v3(0, 0.08, 1.8), materials.asphaltLight);
  addScenicBox(v3(8.5, 0.08, 70), v3(-7.5, 0.09, 0), materials.asphaltLight);
  const laneMarks: InstanceTransform[] = [];
  for (let x = -43; x <= 43; x += 7.5) {
    laneMarks.push({ position: v3(x, 0.155, 1.8), scale: v3(3.8, 0.025, 0.12) });
  }
  for (let z = -31; z <= 31; z += 7.5) {
    laneMarks.push({ position: v3(-7.5, 0.16, z), scale: v3(0.12, 0.025, 3.8) });
  }
  const laneMesh = instancedBoxes(materials.lane, laneMarks, false);
  laneMesh.receiveShadow = true;
  root.add(laneMesh);

  const crosswalks: InstanceTransform[] = [];
  for (let stripe = -4; stripe <= 4; stripe += 1) {
    crosswalks.push(
      { position: v3(-2.2 + stripe * 0.65, 0.17, 1.8), scale: v3(0.38, 0.03, 7.4) },
      { position: v3(-7.5, 0.17, -3.6 + stripe * 0.65), scale: v3(7.2, 0.03, 0.38) },
    );
  }
  root.add(instancedBoxes(materials.whitePaint, crosswalks, false));

  const buildBank = () => {
    const center = v3(-23, 0, -16);
    const width = 20;
    const depth = 17;
    const floorHeight = 4.2;
    const floors = 3;
    const bank = createAssembly(
      "bank",
      "First Metropolitan Bank",
      center,
      new THREE.Vector2(width, depth),
      floors,
      "stone",
    );

    for (let floor = 0; floor < floors; floor += 1) {
      const y = 0.32 + floor * floorHeight + floorHeight / 2;
      for (const xSign of [-1, 1]) {
        for (const zSign of [-1, 1]) {
          const column = new THREE.Group();
          column.add(
            makeBox(materials.bankStoneDark, v3(1.15, floorHeight - 0.3, 1.15)),
            makeBox(materials.bankStoneLight, v3(1.48, 0.32, 1.48), v3(0, -(floorHeight - 0.3) / 2 + 0.15, 0)),
            makeBox(materials.bankStoneLight, v3(1.5, 0.34, 1.5), v3(0, (floorHeight - 0.3) / 2 - 0.16, 0)),
          );
          addPiece(bank, column, {
            floor,
            kind: "column",
            material: "stone",
            size: v3(1.5, floorHeight, 1.5),
            position: v3(
              center.x + xSign * (width / 2 - 0.75),
              y,
              center.z + zSign * (depth / 2 - 0.75),
            ),
            mass: 44,
            strength: 154,
          });
        }
      }

      const floorSlab = new THREE.Group();
      floorSlab.add(makeBox(materials.concreteWarm, v3(width - 1.1, 0.48, depth - 1.1)));
      if (floor === 1) addRebarEdge(floorSlab, v3(width - 1.1, 0.48, depth - 1.1), true);
      addPiece(bank, floorSlab, {
        floor,
        kind: "floor",
        material: "concrete",
        size: v3(width - 1.1, 0.48, depth - 1.1),
        position: v3(center.x, 0.32 + (floor + 1) * floorHeight, center.z),
        mass: 88,
        strength: 118,
      });

      const beamY = 0.32 + (floor + 1) * floorHeight - 0.42;
      const beamSpecs = [
        { size: v3(width - 1.4, 0.68, 0.58), position: v3(center.x, beamY, center.z + depth / 2 - 0.55) },
        { size: v3(width - 1.4, 0.68, 0.58), position: v3(center.x, beamY, center.z - depth / 2 + 0.55) },
        { size: v3(0.58, 0.68, depth - 1.4), position: v3(center.x + width / 2 - 0.55, beamY, center.z) },
        { size: v3(0.58, 0.68, depth - 1.4), position: v3(center.x - width / 2 + 0.55, beamY, center.z) },
      ];
      beamSpecs.forEach((spec) => {
        addPiece(bank, makeBox(materials.bankStoneDark, spec.size), {
          floor,
          kind: "beam",
          material: "stone",
          size: spec.size,
          position: spec.position,
          mass: 29,
          strength: 132,
        });
      });

      const panelHeight = floorHeight - 0.78;
      const panelY = 0.32 + floor * floorHeight + floorHeight / 2;
      const panelSpecs: Array<{ facing: Facing; size: THREE.Vector3; position: THREE.Vector3 }> = [
        { facing: "north", size: v3(width - 2.15, panelHeight, 0.42), position: v3(center.x, panelY, center.z + depth / 2 - 0.3) },
        { facing: "south", size: v3(width - 2.15, panelHeight, 0.42), position: v3(center.x, panelY, center.z - depth / 2 + 0.3) },
        { facing: "east", size: v3(0.42, panelHeight, depth - 2.15), position: v3(center.x + width / 2 - 0.3, panelY, center.z) },
        { facing: "west", size: v3(0.42, panelHeight, depth - 2.15), position: v3(center.x - width / 2 + 0.3, panelY, center.z) },
      ];
      panelSpecs.forEach(({ facing, size, position }) => {
        const panel = new THREE.Group();
        panel.add(makeBox(floor === 0 ? materials.bankStone : materials.bankStoneLight, size));
        addWindowGrid(
          panel,
          size,
          facing,
          facing === "north" || facing === "south" ? 5 : 4,
          1,
          materials.glassDark,
          materials.bankStoneDark,
          0.11,
        );
        if (floor === 0 && facing === "north") {
          const porch = new THREE.Group();
          porch.position.set(0, -0.05, size.z / 2 + 0.48);
          const door = makeBox(materials.glassDark, v3(2.8, 2.8, 0.18), v3(0, -0.2, 0));
          porch.add(door);
          for (const x of [-2.35, 2.35]) {
            porch.add(makeCylinder(materials.bankStoneLight, 0.36, 3.25, v3(x, -0.02, 0.35)));
            porch.add(makeBox(materials.bankStoneLight, v3(0.9, 0.24, 0.9), v3(x, -1.53, 0.35)));
            porch.add(makeBox(materials.bankStoneLight, v3(0.88, 0.22, 0.88), v3(x, 1.5, 0.35)));
          }
          porch.add(makeBox(materials.bankStoneLight, v3(6.2, 0.5, 1.1), v3(0, 1.68, 0.34)));
          const steps: InstanceTransform[] = [];
          for (let step = 0; step < 3; step += 1) {
            steps.push({ position: v3(0, -1.56 + step * 0.13, 0.7 + step * 0.35), scale: v3(6.8 - step * 0.65, 0.15, 0.42) });
          }
          porch.add(instancedBoxes(materials.bankStone, steps, false));
          panel.add(porch);
        }
        addPiece(bank, panel, {
          floor,
          kind: "facade",
          material: "stone",
          size,
          position,
          mass: 30,
          strength: 71,
        });
      });
    }

    const corniceY = 0.32 + floors * floorHeight + 0.34;
    const cornices = [
      { size: v3(width + 1.1, 0.78, 0.95), position: v3(center.x, corniceY, center.z + depth / 2) },
      { size: v3(width + 1.1, 0.78, 0.95), position: v3(center.x, corniceY, center.z - depth / 2) },
      { size: v3(0.95, 0.78, depth - 0.8), position: v3(center.x + width / 2, corniceY, center.z) },
      { size: v3(0.95, 0.78, depth - 0.8), position: v3(center.x - width / 2, corniceY, center.z) },
    ];
    cornices.forEach((spec, index) => {
      const group = new THREE.Group();
      group.add(makeBox(materials.bankStoneLight, spec.size));
      const count = index < 2 ? 18 : 13;
      const dentils: InstanceTransform[] = [];
      for (let item = 0; item < count; item += 1) {
        const t = item / (count - 1) - 0.5;
        dentils.push({
          position: index < 2 ? v3(t * (spec.size.x - 0.7), -0.47, 0) : v3(0, -0.47, t * (spec.size.z - 0.7)),
          scale: index < 2 ? v3(0.42, 0.28, 0.82) : v3(0.82, 0.28, 0.42),
        });
      }
      group.add(instancedBoxes(materials.bankStoneDark, dentils));
      addPiece(bank, group, {
        floor: floors,
        kind: "cornice",
        material: "stone",
        size: spec.size,
        position: spec.position,
        mass: 22,
        strength: 63,
      });
    });
  };

  const buildWarehouse = () => {
    const center = v3(-24, 0, 19);
    const width = 25.5;
    const depth = 13.2;
    const floorHeight = 5.6;
    const floors = 2;
    const warehouse = createAssembly(
      "warehouse",
      "Mercer Warehouse Row",
      center,
      new THREE.Vector2(width, depth),
      floors,
      "brick",
    );
    const xStations = [-width / 2 + 0.5, -width / 6, width / 6, width / 2 - 0.5];

    xStations.forEach((x, index) => {
      for (const zSign of [-1, 1]) {
        const group = new THREE.Group();
        group.add(makeBox(index % 2 ? materials.brickDark : materials.brick, v3(0.76, floorHeight * floors - 0.35, 0.76)));
        group.add(makeBox(materials.concreteWarm, v3(1.08, 0.34, 1.08), v3(0, -floorHeight * floors / 2 + 0.2, 0)));
        addPiece(warehouse, group, {
          floor: 0,
          kind: "column",
          material: "brick",
          size: v3(1.08, floorHeight * floors, 1.08),
          position: v3(center.x + x, 0.32 + floorHeight * floors / 2, center.z + zSign * (depth / 2 - 0.5)),
          mass: 58,
          strength: 148,
        });
      }
    });

    for (let floor = 0; floor < floors; floor += 1) {
      const slabY = 0.32 + (floor + 1) * floorHeight;
      for (let bay = 0; bay < 3; bay += 1) {
        const bayWidth = width / 3;
        const group = new THREE.Group();
        group.add(makeBox(materials.concreteWarm, v3(bayWidth - 0.18, 0.5, depth - 1.15)));
        if (floor === 0 && bay === 2) addRebarEdge(group, v3(bayWidth - 0.18, 0.5, depth - 1.15), true);
        if (floor === 1) {
          const skylights: InstanceTransform[] = [];
          for (let z = -1; z <= 1; z += 1) {
            skylights.push({ position: v3(0, 0.38, z * 2.4), scale: v3(bayWidth * 0.52, 0.24, 1.05) });
          }
          const lights = instancedBoxes(materials.glassLight, skylights);
          lights.rotation.z = bay % 2 === 0 ? 0.07 : -0.07;
          group.add(lights);
        }
        addPiece(warehouse, group, {
          floor,
          kind: floor === floors - 1 ? "roof" : "floor",
          material: "concrete",
          size: v3(bayWidth - 0.18, 0.5, depth - 1.15),
          position: v3(center.x - width / 2 + bayWidth * (bay + 0.5), slabY, center.z),
          mass: 60,
          strength: floor === floors - 1 ? 98 : 112,
        });
      }

      for (const zSign of [-1, 1]) {
        const size = v3(width - 0.8, 0.7, 0.58);
        addPiece(warehouse, makeBox(materials.steelDark, size), {
          floor,
          kind: "beam",
          material: "steel",
          size,
          position: v3(center.x, slabY - 0.42, center.z + zSign * (depth / 2 - 0.48)),
          mass: 27,
          strength: 139,
        });
      }
      xStations.forEach((x) => {
        const size = v3(0.58, 0.68, depth - 0.9);
        addPiece(warehouse, makeBox(materials.steelDark, size), {
          floor,
          kind: "beam",
          material: "steel",
          size,
          position: v3(center.x + x, slabY - 0.42, center.z),
          mass: 18,
          strength: 131,
        });
      });

      const panelHeight = floorHeight - 0.8;
      const panelY = 0.32 + floor * floorHeight + floorHeight / 2;
      for (let bay = 0; bay < 3; bay += 1) {
        const bayWidth = width / 3 - 0.28;
        for (const [facing, zSign] of [["north", 1], ["south", -1]] as const) {
          const size = v3(bayWidth, panelHeight, 0.36);
          const panel = new THREE.Group();
          panel.add(makeBox(bay % 3 === 0 ? materials.brickWarm : bay % 3 === 1 ? materials.brick : materials.brickDark, size));
          addBrickCourses(panel, size, facing, materials.brickWarm);
          addWindowGrid(panel, size, facing, 3, 2, materials.glassDark, materials.mortar, 0.09);
          if (floor === 0 && facing === "south") {
            const loadingDoor = makeBox(materials.steelDark, v3(bayWidth * 0.46, 3.25, 0.16), v3(0, -0.5, -0.29));
            panel.add(loadingDoor);
            const slats: InstanceTransform[] = [];
            for (let slat = -4; slat <= 4; slat += 1) {
              slats.push({ position: v3(0, -0.5 + slat * 0.34, -0.39), scale: v3(bayWidth * 0.43, 0.055, 0.05) });
            }
            panel.add(instancedBoxes(materials.galvanized, slats));
          }
          addPiece(warehouse, panel, {
            floor,
            kind: "facade",
            material: "brick",
            size,
            position: v3(center.x - width / 2 + (width / 3) * (bay + 0.5), panelY, center.z + zSign * (depth / 2 - 0.3)),
            mass: 23,
            strength: 68 + bay * 4,
          });
        }
      }

      for (const [facing, xSign] of [["east", 1], ["west", -1]] as const) {
        const size = v3(0.36, panelHeight, depth - 1.1);
        const panel = new THREE.Group();
        panel.add(makeBox(materials.brick, size));
        addBrickCourses(panel, size, facing, materials.brickWarm);
        addWindowGrid(panel, size, facing, 3, 2, materials.glassDark, materials.mortar, 0.09);
        if (facing === "east") {
          const escape = setFarDetail(new THREE.Group());
          const x = size.x / 2 + 0.48;
          escape.add(makeBox(materials.steelDark, v3(0.62, 0.16, 4.5), v3(x, -0.55, 0)));
          for (const z of [-1.8, -0.9, 0, 0.9, 1.8]) {
            escape.add(makeBox(materials.steelDark, v3(0.6, 0.08, 0.08), v3(x + 0.25, -1.35 + (z + 1.8) * 0.44, z)));
          }
          escape.add(makeBox(materials.steelDark, v3(0.08, 2.3, 0.08), v3(x + 0.5, -0.18, -1.8)));
          escape.add(makeBox(materials.steelDark, v3(0.08, 2.3, 0.08), v3(x + 0.5, -0.18, 1.8)));
          panel.add(escape);
        }
        addPiece(warehouse, panel, {
          floor,
          kind: "facade",
          material: "brick",
          size,
          position: v3(center.x + xSign * (width / 2 - 0.3), panelY, center.z),
          mass: 24,
          strength: 73,
        });
      }
    }
  };

  const buildGlassTower = () => {
    const center = v3(9.5, 0, -17);
    const width = 18;
    const depth = 17.5;
    const floors = 9;
    const floorHeight = 4.1;
    const height = floors * floorHeight;
    const tower = createAssembly(
      "glass-tower",
      "Aster Glass House",
      center,
      new THREE.Vector2(width, depth),
      floors,
      "glass",
    );

    for (let segment = 0; segment < 2; segment += 1) {
      const segmentHeight = height / 2;
      for (const xSign of [-1, 1]) {
        for (const zSign of [-1, 1]) {
          const group = new THREE.Group();
          group.add(makeBox(materials.steel, v3(0.72, segmentHeight - 0.3, 0.72)));
          group.add(makeBox(materials.chrome, v3(0.92, 0.32, 0.92), v3(0, segmentHeight / 2 - 0.22, 0)));
          addPiece(tower, group, {
            floor: segment * 4,
            kind: "column",
            material: "steel",
            size: v3(0.92, segmentHeight, 0.92),
            position: v3(
              center.x + xSign * (width / 2 - 0.62),
              0.32 + segment * segmentHeight + segmentHeight / 2,
              center.z + zSign * (depth / 2 - 0.62),
            ),
            mass: 62,
            strength: 176,
          });
        }
      }
    }

    for (let floor = 0; floor < floors; floor += 1) {
      const group = new THREE.Group();
      group.add(makeBox(materials.concrete, v3(width - 1.2, 0.42, depth - 1.2)));
      const edge = makeBox(materials.chrome, v3(width - 0.7, 0.14, depth - 0.7));
      edge.position.y = 0.22;
      group.add(edge);
      if (floor === 4) addRebarEdge(group, v3(width - 1.2, 0.42, depth - 1.2), false);
      addPiece(tower, group, {
        floor,
        kind: "floor",
        material: "concrete",
        size: v3(width - 1.2, 0.42, depth - 1.2),
        position: v3(center.x, 0.32 + (floor + 1) * floorHeight, center.z),
        mass: 90,
        strength: 124,
      });
    }

    const bandFloors = [1, 3, 5, 7, 9];
    bandFloors.forEach((floor) => {
      const y = 0.32 + floor * floorHeight - 0.28;
      const specs = [
        { size: v3(width - 1.1, 0.48, 0.42), position: v3(center.x, y, center.z + depth / 2 - 0.48) },
        { size: v3(width - 1.1, 0.48, 0.42), position: v3(center.x, y, center.z - depth / 2 + 0.48) },
        { size: v3(0.42, 0.48, depth - 1.1), position: v3(center.x + width / 2 - 0.48, y, center.z) },
        { size: v3(0.42, 0.48, depth - 1.1), position: v3(center.x - width / 2 + 0.48, y, center.z) },
      ];
      specs.forEach((spec) => addPiece(tower, makeBox(materials.steel, spec.size), {
        floor: floor - 1,
        kind: "beam",
        material: "steel",
        size: spec.size,
        position: spec.position,
        mass: 25,
        strength: 144,
      }));
    });

    const zones = 5;
    const zoneHeight = height / zones - 0.25;
    for (let zone = 0; zone < zones; zone += 1) {
      const y = 0.32 + zone * (height / zones) + height / zones / 2;
      const specs: Array<{ facing: Facing; size: THREE.Vector3; position: THREE.Vector3 }> = [
        { facing: "north", size: v3(width - 1.25, zoneHeight, 0.27), position: v3(center.x, y, center.z + depth / 2 - 0.26) },
        { facing: "south", size: v3(width - 1.25, zoneHeight, 0.27), position: v3(center.x, y, center.z - depth / 2 + 0.26) },
        { facing: "east", size: v3(0.27, zoneHeight, depth - 1.25), position: v3(center.x + width / 2 - 0.26, y, center.z) },
        { facing: "west", size: v3(0.27, zoneHeight, depth - 1.25), position: v3(center.x - width / 2 + 0.26, y, center.z) },
      ];
      specs.forEach(({ facing, size, position }, sideIndex) => {
        const panel = new THREE.Group();
        panel.add(makeBox(zone % 2 === 0 ? materials.glass : materials.glassLight, size));
        addWindowGrid(
          panel,
          size,
          facing,
          facing === "north" || facing === "south" ? 8 : 7,
          4,
          materials.glassLight,
          materials.chrome,
          0.055,
        );
        const glint = makeBox(
          materials.whitePaint,
          facing === "north" || facing === "south" ? v3(0.08, zoneHeight * 0.82, 0.035) : v3(0.035, zoneHeight * 0.82, 0.08),
          facing === "north" || facing === "south" ? v3(-size.x * 0.26, 0, (facing === "north" ? 1 : -1) * 0.2) : v3((facing === "east" ? 1 : -1) * 0.2, 0, -size.z * 0.26),
        );
        glint.material = materials.glassLight;
        panel.add(setFarDetail(glint));
        addPiece(tower, panel, {
          floor: zone * 2,
          kind: "facade",
          material: "glass",
          size,
          position,
          mass: 13,
          strength: 34 + ((zone + sideIndex) % 3) * 5,
        });
      });
    }

    const roof = new THREE.Group();
    roof.add(makeBox(materials.concreteDark, v3(width - 2.2, 0.72, depth - 2.2)));
    const mechanical: InstanceTransform[] = [
      { position: v3(-4.2, 0.9, -2.8), scale: v3(3.1, 1.15, 2.4) },
      { position: v3(2.7, 0.74, -2.6), scale: v3(2.6, 0.82, 2.1) },
      { position: v3(0.8, 0.62, 3.1), scale: v3(4.2, 0.58, 1.8) },
    ];
    roof.add(instancedBoxes(materials.galvanized, mechanical));
    roof.add(makeCylinder(materials.steelDark, 0.16, 5.8, v3(0, 3.1, 0)));
    const aerials: InstanceTransform[] = [];
    for (let index = 0; index < 5; index += 1) {
      aerials.push({ position: v3(-1.7 + index * 0.85, 5.3 - index * 0.28, 0), scale: v3(0.06, 0.06, 3.6 - index * 0.4) });
    }
    roof.add(instancedBoxes(materials.steelDark, aerials));
    addPiece(tower, roof, {
      floor: floors,
      kind: "roof",
      material: "concrete",
      size: v3(width - 2.2, 2.5, depth - 2.2),
      position: v3(center.x, 0.32 + height + 0.44, center.z),
      mass: 74,
      strength: 103,
    });
  };

  const buildMidrise = () => {
    const center = v3(27, 0, 19);
    const width = 17;
    const depth = 15;
    const floors = 5;
    const floorHeight = 4.1;
    const height = floors * floorHeight;
    const midrise = createAssembly(
      "midrise",
      "Canal House and Water Works",
      center,
      new THREE.Vector2(width, depth),
      floors,
      "brick",
      true,
    );

    for (let segment = 0; segment < 2; segment += 1) {
      const segmentHeight = height / 2;
      for (const xSign of [-1, 1]) {
        for (const zSign of [-1, 1]) {
          const group = new THREE.Group();
          group.add(makeBox(materials.concreteDark, v3(0.82, segmentHeight - 0.22, 0.82)));
          group.add(makeBox(materials.brickDark, v3(1.05, 0.4, 1.05), v3(0, segmentHeight / 2 - 0.3, 0)));
          addPiece(midrise, group, {
            floor: segment * 2,
            kind: "column",
            material: "concrete",
            size: v3(1.05, segmentHeight, 1.05),
            position: v3(
              center.x + xSign * (width / 2 - 0.58),
              0.32 + segment * segmentHeight + segmentHeight / 2,
              center.z + zSign * (depth / 2 - 0.58),
            ),
            mass: 56,
            strength: 164,
          });
        }
      }
    }

    for (let floor = 0; floor < floors; floor += 1) {
      const slab = new THREE.Group();
      slab.add(makeBox(materials.concreteWarm, v3(width - 1, 0.46, depth - 1)));
      if (floor === 2) addRebarEdge(slab, v3(width - 1, 0.46, depth - 1), true);
      addPiece(midrise, slab, {
        floor,
        kind: "floor",
        material: "concrete",
        size: v3(width - 1, 0.46, depth - 1),
        position: v3(center.x, 0.32 + (floor + 1) * floorHeight, center.z),
        mass: 78,
        strength: 117,
      });
    }

    [1, 3, 5].forEach((floor) => {
      const y = 0.32 + floor * floorHeight - 0.36;
      const specs = [
        { size: v3(width - 1, 0.6, 0.5), position: v3(center.x, y, center.z + depth / 2 - 0.45) },
        { size: v3(width - 1, 0.6, 0.5), position: v3(center.x, y, center.z - depth / 2 + 0.45) },
        { size: v3(0.5, 0.6, depth - 1), position: v3(center.x + width / 2 - 0.45, y, center.z) },
        { size: v3(0.5, 0.6, depth - 1), position: v3(center.x - width / 2 + 0.45, y, center.z) },
      ];
      specs.forEach((spec) => addPiece(midrise, makeBox(materials.steelDark, spec.size), {
        floor: floor - 1,
        kind: "beam",
        material: "steel",
        size: spec.size,
        position: spec.position,
        mass: 22,
        strength: 136,
      }));
    });

    const facadeZones = 3;
    for (let zone = 0; zone < facadeZones; zone += 1) {
      const zoneHeight = height / facadeZones - 0.26;
      const y = 0.32 + zone * (height / facadeZones) + height / facadeZones / 2;
      const specs: Array<{ facing: Facing; size: THREE.Vector3; position: THREE.Vector3 }> = [
        { facing: "north", size: v3(width - 1.2, zoneHeight, 0.38), position: v3(center.x, y, center.z + depth / 2 - 0.3) },
        { facing: "south", size: v3(width - 1.2, zoneHeight, 0.38), position: v3(center.x, y, center.z - depth / 2 + 0.3) },
        { facing: "east", size: v3(0.38, zoneHeight, depth - 1.2), position: v3(center.x + width / 2 - 0.3, y, center.z) },
        { facing: "west", size: v3(0.38, zoneHeight, depth - 1.2), position: v3(center.x - width / 2 + 0.3, y, center.z) },
      ];
      specs.forEach(({ facing, size, position }) => {
        const panel = new THREE.Group();
        panel.add(makeBox(zone % 2 === 0 ? materials.brickWarm : materials.brick, size));
        addBrickCourses(panel, size, facing, materials.brickWarm);
        addWindowGrid(
          panel,
          size,
          facing,
          facing === "north" || facing === "south" ? 6 : 5,
          zone === 2 ? 3 : 2,
          materials.glassDark,
          materials.concreteWarm,
          0.1,
        );
        addPiece(midrise, panel, {
          floor: zone * 2,
          kind: "facade",
          material: "brick",
          size,
          position,
          mass: 28,
          strength: 76,
        });
      });
    }

    const roof = new THREE.Group();
    roof.add(makeBox(materials.concreteDark, v3(width - 1.2, 0.62, depth - 1.2)));
    const parapets: InstanceTransform[] = [
      { position: v3(0, 0.58, depth / 2 - 0.85), scale: v3(width - 1.1, 0.8, 0.28) },
      { position: v3(0, 0.58, -depth / 2 + 0.85), scale: v3(width - 1.1, 0.8, 0.28) },
      { position: v3(width / 2 - 0.85, 0.58, 0), scale: v3(0.28, 0.8, depth - 1.1) },
      { position: v3(-width / 2 + 0.85, 0.58, 0), scale: v3(0.28, 0.8, depth - 1.1) },
    ];
    roof.add(instancedBoxes(materials.brickDark, parapets));
    roof.add(makeBox(materials.galvanized, v3(2.8, 1.2, 2.2), v3(-4.6, 0.92, -2.8)));
    roof.add(makeCylinder(materials.galvanized, 0.42, 2.6, v3(4.8, 1.5, 2.9)));
    addPiece(midrise, roof, {
      floor: floors,
      kind: "roof",
      material: "concrete",
      size: v3(width - 1.2, 1.6, depth - 1.2),
      position: v3(center.x, 0.32 + height + 0.34, center.z),
      mass: 66,
      strength: 102,
    });

    const tank = new THREE.Group();
    const tankBody = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.35, 4.2, 18, 5), materials.waterTankLight);
    tankBody.position.y = 2.2;
    tank.add(tankBody);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.72, 1.35, 18), materials.waterTank);
    cone.position.y = 4.9;
    tank.add(cone);
    const bands: InstanceTransform[] = [];
    for (let band = 0; band < 6; band += 1) {
      bands.push({ position: v3(0, 0.55 + band * 0.67, 0), scale: v3(2.6, 2.6, 1) });
    }
    const bandMesh = new THREE.InstancedMesh(new THREE.TorusGeometry(1, 0.035, 5, 18), materials.steelDark, 6);
    const bandMatrix = new THREE.Matrix4();
    bands.forEach((band, index) => {
      bandMatrix.compose(band.position, new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), band.scale);
      bandMesh.setMatrixAt(index, bandMatrix);
    });
    bandMesh.instanceMatrix.needsUpdate = true;
    setFarDetail(bandMesh);
    tank.add(bandMesh);
    for (const xSign of [-1, 1]) {
      for (const zSign of [-1, 1]) {
        const leg = beamBetween(materials.steelDark, v3(xSign * 1.65, 0, zSign * 1.65), v3(xSign * 2.25, -3.2, zSign * 2.25), 0.16);
        tank.add(leg);
      }
    }
    tank.add(makeCylinder(materials.steelDark, 0.11, 6.1, v3(-2.72, 1.6, 0)));
    const tankPiece = addPiece(midrise, tank, {
      floor: floors + 1,
      kind: "tank",
      material: "water",
      size: v3(5.8, 8.8, 5.8),
      position: v3(center.x + 1.8, 0.32 + height + 4.2, center.z + 0.5),
      mass: 68,
      strength: 75,
      collapseBias: v3(0.74, -0.06, 0.45),
    });
    tankPiece.object.userData.containsWater = true;
    tankPiece.object.userData.waterVolume = 48;
    waterTankPiece = tankPiece;
  };

  const buildParking = () => {
    const center = v3(4.5, 0, 19);
    const width = 19;
    const depth = 15;
    const floors = 4;
    const floorHeight = 3.3;
    const height = floors * floorHeight;
    const parking = createAssembly(
      "parking",
      "Civic Parking Deck",
      center,
      new THREE.Vector2(width, depth),
      floors,
      "concrete",
    );

    for (const x of [-width / 2 + 0.7, 0, width / 2 - 0.7]) {
      for (const z of [-depth / 2 + 0.7, 0, depth / 2 - 0.7]) {
        const column = new THREE.Group();
        column.add(makeBox(materials.concreteDark, v3(0.78, height - 0.2, 0.78)));
        const collars: InstanceTransform[] = [];
        for (let floor = 1; floor <= floors; floor += 1) {
          collars.push({ position: v3(0, -height / 2 + floor * floorHeight - 0.25, 0), scale: v3(1.04, 0.34, 1.04) });
        }
        column.add(instancedBoxes(materials.concrete, collars));
        addPiece(parking, column, {
          floor: 0,
          kind: "column",
          material: "concrete",
          size: v3(1.04, height, 1.04),
          position: v3(center.x + x, 0.32 + height / 2, center.z + z),
          mass: 72,
          strength: 171,
        });
      }
    }

    for (let floor = 0; floor < floors; floor += 1) {
      const slabY = 0.32 + (floor + 1) * floorHeight;
      for (const xSign of [-1, 1]) {
        const group = new THREE.Group();
        group.add(makeBox(materials.concrete, v3(width / 2 - 0.18, 0.44, depth - 1)));
        const parkingLines: InstanceTransform[] = [];
        for (let slot = -2; slot <= 2; slot += 1) {
          parkingLines.push({ position: v3(slot * 1.6, 0.25, 0), scale: v3(0.07, 0.03, depth - 2.4) });
        }
        group.add(instancedBoxes(materials.whitePaint, parkingLines));
        if (floor === 1 && xSign === 1) addRebarEdge(group, v3(width / 2 - 0.18, 0.44, depth - 1), true);
        addPiece(parking, group, {
          floor,
          kind: "floor",
          material: "concrete",
          size: v3(width / 2 - 0.18, 0.44, depth - 1),
          position: v3(center.x + xSign * width / 4, slabY, center.z),
          mass: 69,
          strength: 112,
        });
      }

      const beamSpecs = [
        { size: v3(width - 0.8, 0.7, 0.54), position: v3(center.x, slabY - 0.38, center.z + depth / 2 - 0.54) },
        { size: v3(width - 0.8, 0.7, 0.54), position: v3(center.x, slabY - 0.38, center.z - depth / 2 + 0.54) },
        { size: v3(0.54, 0.7, depth - 0.8), position: v3(center.x + width / 2 - 0.54, slabY - 0.38, center.z) },
        { size: v3(0.54, 0.7, depth - 0.8), position: v3(center.x - width / 2 + 0.54, slabY - 0.38, center.z) },
      ];
      beamSpecs.forEach((spec, side) => {
        const group = new THREE.Group();
        group.add(makeBox(side % 2 ? materials.concreteDark : materials.concrete, spec.size));
        const rails: InstanceTransform[] = [];
        const count = side < 2 ? 10 : 7;
        const length = side < 2 ? spec.size.x : spec.size.z;
        for (let index = 0; index < count; index += 1) {
          const t = index / (count - 1) - 0.5;
          rails.push({
            position: side < 2 ? v3(t * (length - 0.5), 0.7, 0) : v3(0, 0.7, t * (length - 0.5)),
            scale: side < 2 ? v3(0.08, 1.15, 0.08) : v3(0.08, 1.15, 0.08),
          });
        }
        group.add(instancedBoxes(materials.galvanized, rails));
        addPiece(parking, group, {
          floor,
          kind: "beam",
          material: "concrete",
          size: spec.size.clone().add(v3(0, 1.2, 0)),
          position: spec.position,
          mass: 24,
          strength: 127,
        });
      });
    }

    const ramp = new THREE.Group();
    ramp.add(makeBox(materials.concreteDark, v3(12.5, 0.5, 4.6)));
    const rampQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.23));
    addPiece(parking, ramp, {
      floor: 1,
      kind: "floor",
      material: "concrete",
      size: v3(12.5, 0.5, 4.6),
      position: v3(center.x, 5.15, center.z),
      mass: 59,
      strength: 104,
      quaternion: rampQuaternion,
    });
  };

  buildBank();
  buildWarehouse();
  buildGlassTower();
  buildMidrise();
  buildParking();

  const makeTree = (position: THREE.Vector3, scale = 1) => {
    const tree = new THREE.Group();
    tree.position.copy(position);
    tree.scale.setScalar(scale);
    const trunk = makeCylinder(materials.treeTrunk, 0.28, 3.1, v3(0, 1.55, 0));
    tree.add(trunk);
    const crownA = new THREE.Mesh(unitSphere, materials.foliage);
    crownA.scale.set(1.45, 1.75, 1.35);
    crownA.position.set(0, 3.65, 0);
    tree.add(crownA);
    const crownB = new THREE.Mesh(unitSphere, materials.foliageLight);
    crownB.scale.set(1.05, 1.25, 1.05);
    crownB.position.set(-0.55, 4.25, 0.15);
    tree.add(crownB);
    const grate = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 5, 16), materials.steelDark);
    grate.rotation.x = Math.PI / 2;
    grate.position.y = 0.18;
    grate.userData.noShadow = true;
    tree.add(grate);
    applyShadows(tree, true);
    root.add(tree);
    trees.push(tree);
    return tree;
  };

  const treePositions = [
    [-35, -4.5], [-27, -4.5], [-17, -4.5], [1, -4.7], [18, -4.7],
    [-39, 7.4], [-30, 7.4], [-18, 7.4], [18, 7.3], [35, 7.3],
    [-40, 30.5], [-29, 30.5], [-16, 30.5], [-1.5, 30.5], [13, 30.5], [27, 30.5], [38, 30.5],
  ] as const;
  treePositions.forEach(([x, z], index) => makeTree(v3(x, 0.24, z), 0.84 + (index % 4) * 0.07));

  const makeLamp = (position: THREE.Vector3, rotate = 0) => {
    const lamp = new THREE.Group();
    lamp.userData.noShadow = true;
    lamp.position.copy(position);
    lamp.rotation.y = rotate;
    lamp.add(makeCylinder(materials.steelDark, 0.11, 5.4, v3(0, 2.7, 0)));
    lamp.add(makeBox(materials.steelDark, v3(1.3, 0.11, 0.11), v3(0.58, 5.25, 0)));
    lamp.add(makeBox(materials.lampGlow, v3(0.52, 0.22, 0.36), v3(1.1, 5.08, 0)));
    lamp.add(makeCylinder(materials.steelDark, 0.23, 0.16, v3(0, 0.12, 0)));
    applyShadows(lamp, true);
    root.add(lamp);
  };
  [
    [-42, -4, 0], [-32, -4, 0], [-21, -4, 0], [-1, -4, Math.PI], [15, -4, Math.PI], [28, -4, Math.PI],
    [-42, 7.8, 0], [-31, 7.8, 0], [-19, 7.8, 0], [-1, 7.8, Math.PI], [14, 7.8, Math.PI], [27, 7.8, Math.PI], [39, 7.8, Math.PI],
    [-12, -29, Math.PI / 2], [-12, -15, Math.PI / 2], [-12, 16, Math.PI / 2], [-12, 29, Math.PI / 2],
  ].forEach(([x, z, rotation]) => makeLamp(v3(x, 0.25, z), rotation));

  const makeHydrant = (position: THREE.Vector3) => {
    const hydrant = new THREE.Group();
    hydrant.userData.noShadow = true;
    hydrant.position.copy(position);
    hydrant.add(makeCylinder(materials.hydrant, 0.28, 1.05, v3(0, 0.55, 0)));
    hydrant.add(makeCylinder(materials.hydrant, 0.43, 0.16, v3(0, 0.96, 0)));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), materials.hydrant);
    cap.position.y = 1.03;
    hydrant.add(cap);
    hydrant.add(makeCylinder(materials.chrome, 0.12, 0.8, v3(0, 0.63, 0)));
    hydrant.children[hydrant.children.length - 1].rotation.z = Math.PI / 2;
    applyShadows(hydrant, true);
    root.add(hydrant);
  };
  [v3(-36, 0.23, -4.7), v3(-2.2, 0.23, -4.7), v3(21, 0.23, 7.1), v3(-17, 0.23, 30), v3(38, 0.23, 29.8)].forEach(makeHydrant);

  const makeBench = (position: THREE.Vector3, rotation: number) => {
    const bench = new THREE.Group();
    bench.userData.noShadow = true;
    bench.position.copy(position);
    bench.rotation.y = rotation;
    const slats: InstanceTransform[] = [];
    for (let slat = 0; slat < 4; slat += 1) {
      slats.push({ position: v3(0, 0.62 + slat * 0.22, -0.28 + slat * 0.04), scale: v3(2.7, 0.14, 0.24) });
    }
    bench.add(instancedBoxes(materials.wood, slats));
    for (const x of [-1.1, 1.1]) {
      bench.add(makeBox(materials.steelDark, v3(0.12, 1.15, 0.12), v3(x, 0.52, 0)));
      bench.add(makeBox(materials.steelDark, v3(0.12, 0.12, 0.85), v3(x, 0.22, 0)));
    }
    applyShadows(bench, true);
    root.add(bench);
  };
  makeBench(v3(-31, 0.25, -4.8), 0);
  makeBench(v3(4, 0.25, -4.8), 0);
  makeBench(v3(20, 0.25, 7.4), Math.PI);
  makeBench(v3(-21, 0.25, 30.4), Math.PI);
  makeBench(v3(30, 0.25, 30.4), Math.PI);

  const carPalette = [
    new THREE.MeshStandardMaterial({ color: 0x2879a8, roughness: 0.52, metalness: 0.18 }),
    new THREE.MeshStandardMaterial({ color: 0xc64a38, roughness: 0.54, metalness: 0.16 }),
    new THREE.MeshStandardMaterial({ color: 0xf1d64d, roughness: 0.5, metalness: 0.13 }),
    new THREE.MeshStandardMaterial({ color: 0xf0eee4, roughness: 0.46, metalness: 0.18 }),
    new THREE.MeshStandardMaterial({ color: 0x395541, roughness: 0.57, metalness: 0.13 }),
  ];

  const makeCar = (
    position: THREE.Vector3,
    rotation: number,
    colorIndex: number,
    construction = false,
    long = false,
  ) => {
    const car = new THREE.Group();
    car.position.copy(position);
    car.rotation.y = rotation;
    const bodyLength = long ? 5.4 : 4.1;
    const bodyMaterial = construction ? materials.craneYellow : carPalette[colorIndex % carPalette.length];
    car.add(makeBox(bodyMaterial, v3(bodyLength, 0.78, 1.78), v3(0, 0.78, 0)));
    const hoodLength = long ? 2.6 : 1.7;
    car.add(makeBox(bodyMaterial, v3(hoodLength, 0.43, 1.66), v3(-bodyLength * 0.24, 1.2, 0)));
    const cabin = makeBox(materials.glassDark, v3(long ? 1.8 : 2.05, 0.78, 1.53), v3(bodyLength * 0.14, 1.43, 0));
    cabin.geometry = new THREE.BoxGeometry(1, 1, 1);
    car.add(cabin);
    car.add(makeBox(materials.chrome, v3(bodyLength + 0.12, 0.13, 1.85), v3(0, 0.5, 0)));
    for (const x of [-bodyLength * 0.31, bodyLength * 0.31]) {
      for (const z of [-0.93, 0.93]) {
        const wheel = new THREE.Mesh(unitWheel, materials.tire);
        wheel.userData.noShadow = true;
        wheel.scale.set(0.43, 0.24, 0.43);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.48, z);
        car.add(wheel);
      }
    }
    if (construction) {
      car.add(makeBox(materials.hazardOrange, v3(1.4, 0.12, 1.45), v3(bodyLength * 0.25, 1.18, 0)));
      car.add(makeCylinder(materials.warningGlow, 0.13, 0.22, v3(0.4, 1.93, 0)));
    }
    applyShadows(car, true);
    root.add(car);
    cars.push(car);
    return car;
  };

  makeCar(v3(-33, 0.23, 0.4), 0, 0);
  makeCar(v3(-20, 0.23, 3.2), Math.PI, 1);
  makeCar(v3(0.5, 0.23, 0.3), 0, 2);
  makeCar(v3(20.5, 0.23, 3.25), Math.PI, 3);
  makeCar(v3(31.5, 0.23, 0.35), 0, 4, true, true);
  makeCar(v3(-9.2, 0.23, -23.5), Math.PI / 2, 4);
  makeCar(v3(-5.8, 0.23, 24.5), -Math.PI / 2, 0, true, true);
  const elevatedParkingCars = [
    { car: makeCar(v3(0.7, 3.9, 18), 0, 3), floor: 0 },
    { car: makeCar(v3(8.2, 3.9, 20), Math.PI, 1), floor: 0 },
    { car: makeCar(v3(0.4, 7.2, 18.5), 0, 2), floor: 1 },
    { car: makeCar(v3(8.4, 10.5, 19.4), Math.PI, 0), floor: 2 },
  ];
  root.updateMatrixWorld(true);
  const parkingAssembly = buildings.find((building) => building.id === "parking");
  elevatedParkingCars.forEach(({ car, floor }) => {
    const worldPosition = car.getWorldPosition(new THREE.Vector3());
    const supportingSlab = parkingAssembly?.pieces
      .filter((piece) => piece.kind === "floor" && piece.floor === floor)
      .sort(
        (a, b) =>
          a.object.getWorldPosition(new THREE.Vector3()).distanceToSquared(worldPosition) -
          b.object.getWorldPosition(new THREE.Vector3()).distanceToSquared(worldPosition),
      )[0];
    if (!supportingSlab) return;
    supportingSlab.object.attach(car);
    car.userData.supportPieceId = supportingSlab.id;
  });

  const makeBarrier = (position: THREE.Vector3, rotation: number, withLight: boolean) => {
    const barrier = new THREE.Group();
    barrier.position.copy(position);
    barrier.rotation.y = rotation;
    for (const x of [-1.45, 1.45]) {
      barrier.add(makeBox(materials.hazardOrange, v3(0.18, 1.65, 0.18), v3(x, 0.85, 0)));
      barrier.add(makeBox(materials.steelDark, v3(0.85, 0.12, 0.42), v3(x, 0.12, 0)));
    }
    const plank = new THREE.Group();
    plank.add(makeBox(materials.hazardWhite, v3(3.35, 0.58, 0.16)));
    const stripes: InstanceTransform[] = [];
    for (let stripe = -3; stripe <= 3; stripe += 1) {
      stripes.push({ position: v3(stripe * 0.48, 0, 0.095), scale: v3(0.26, 0.56, 0.025), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.45)) });
    }
    plank.add(instancedBoxes(materials.hazardOrange, stripes, false));
    plank.position.y = 1.05;
    barrier.add(plank);
    if (withLight) {
      const lamp = makeCylinder(materials.warningGlow, 0.2, 0.28, v3(0, 1.65, 0));
      barrier.add(lamp);
      const light = new THREE.PointLight(0xff7b19, 4.8, 6.5, 2.2);
      light.position.set(0, 1.82, 0);
      barrier.add(light);
      warningLights.push(light);
    }
    applyShadows(barrier, true);
    root.add(barrier);
    return barrier;
  };

  const barrierSpecs: Array<[number, number, number]> = [
    [-42, -5.6, 0], [-34, -5.6, 0], [-26, -5.6, 0], [-18, -5.6, 0],
    [17, -5.6, 0], [25, -5.6, 0], [33, -5.6, 0], [41, -5.6, 0],
    [-42, 8.8, 0], [-34, 8.8, 0], [-26, 8.8, 0], [19, 8.8, 0], [27, 8.8, 0], [35, 8.8, 0],
    [-12.5, -25, Math.PI / 2], [-12.5, -17, Math.PI / 2], [-12.5, 18, Math.PI / 2], [-12.5, 26, Math.PI / 2],
  ];
  barrierSpecs.forEach(([x, z, rotation], index) => makeBarrier(v3(x, 0.23, z), rotation, index % 2 === 0));

  const makeFenceRun = (position: THREE.Vector3, length: number, rotation: number) => {
    const fence = setFarDetail(new THREE.Group());
    fence.position.copy(position);
    fence.rotation.y = rotation;
    const posts: InstanceTransform[] = [];
    const count = Math.floor(length / 2.4) + 1;
    for (let post = 0; post < count; post += 1) {
      posts.push({ position: v3(-length / 2 + (post * length) / (count - 1), 1.35, 0), scale: v3(0.09, 2.7, 0.09) });
    }
    fence.add(instancedBoxes(materials.galvanized, posts, false));
    const wires: InstanceTransform[] = [];
    for (let row = 0; row < 7; row += 1) {
      wires.push({ position: v3(0, 0.35 + row * 0.34, 0), scale: v3(length, 0.025, 0.025) });
    }
    fence.add(instancedBoxes(materials.galvanized, wires, false));
    applyShadows(fence, false);
    root.add(fence);
  };
  makeFenceRun(v3(18, 0.2, 34), 45, 0);
  makeFenceRun(v3(44, 0.2, 12), 38, Math.PI / 2);

  type ColoredGeometryPart = {
    geometry: THREE.BufferGeometry;
    matrix: THREE.Matrix4;
    color: number;
  };

  const mergeColoredGeometry = (parts: ColoredGeometryPart[]) => {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const position = new THREE.Vector3();
    const normal = new THREE.Vector3();

    parts.forEach((part) => {
      const source = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry;
      const positionAttribute = source.getAttribute("position");
      const normalAttribute = source.getAttribute("normal");
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(part.matrix);
      const color = new THREE.Color(part.color);
      for (let index = 0; index < positionAttribute.count; index += 1) {
        position.fromBufferAttribute(positionAttribute, index).applyMatrix4(part.matrix);
        positions.push(position.x, position.y, position.z);
        if (normalAttribute) {
          normal.fromBufferAttribute(normalAttribute, index).applyMatrix3(normalMatrix).normalize();
          normals.push(normal.x, normal.y, normal.z);
        } else {
          normals.push(0, 1, 0);
        }
        colors.push(color.r, color.g, color.b);
      }
      if (source !== part.geometry) source.dispose();
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  };

  const partMatrix = (
    position: THREE.Vector3,
    scale: THREE.Vector3,
    rotationZ = 0,
  ) => new THREE.Matrix4().compose(
    position,
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rotationZ)),
    scale,
  );

  const spectatorGeometryCache = new Map<string, THREE.BufferGeometry>();
  const spectatorHeadGeometry = new THREE.SphereGeometry(1, 9, 6);
  const spectatorHatGeometry = new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const spectatorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.82,
  });

  const getSpectatorGeometry = (shirtColor: number, hasPhone: boolean) => {
    const key = `${shirtColor}-${hasPhone ? 1 : 0}`;
    const cached = spectatorGeometryCache.get(key);
    if (cached) return cached;

    const parts: ColoredGeometryPart[] = [
      { geometry: unitBox, matrix: partMatrix(v3(0, 0.62, 0), v3(0.56, 1.05, 0.42)), color: 0x275783 },
      { geometry: unitBox, matrix: partMatrix(v3(0, 1.52, 0), v3(0.76, 0.94, 0.46)), color: shirtColor },
      { geometry: unitBox, matrix: partMatrix(v3(-0.2, 1.54, -0.245), v3(0.11, 0.78, 0.035)), color: 0xe9f233 },
      { geometry: unitBox, matrix: partMatrix(v3(0.2, 1.54, -0.245), v3(0.11, 0.78, 0.035)), color: 0xe9f233 },
      { geometry: spectatorHeadGeometry, matrix: partMatrix(v3(0, 2.2, 0), v3(0.29, 0.29, 0.29)), color: 0xb97852 },
      { geometry: spectatorHatGeometry, matrix: partMatrix(v3(0, 2.31, 0), v3(0.34, 0.34, 0.34)), color: 0xffd62f },
      { geometry: unitBox, matrix: partMatrix(v3(0, 2.28, -0.04), v3(0.76, 0.07, 0.45)), color: 0xffd62f },
      { geometry: unitBox, matrix: partMatrix(v3(-0.5, 1.7, -0.2), v3(0.18, 0.78, 0.18), -0.55), color: 0xb97852 },
      { geometry: unitBox, matrix: partMatrix(v3(0.5, 1.7, -0.2), v3(0.18, 0.78, 0.18), 0.55), color: 0xb97852 },
      { geometry: unitBox, matrix: partMatrix(v3(-0.18, 0.08, -0.02), v3(0.26, 0.16, 0.5)), color: 0x161b1e },
      { geometry: unitBox, matrix: partMatrix(v3(0.18, 0.08, -0.02), v3(0.26, 0.16, 0.5)), color: 0x161b1e },
    ];
    if (hasPhone) {
      parts.push({ geometry: unitBox, matrix: partMatrix(v3(0, 2.02, -0.5), v3(0.33, 0.52, 0.07)), color: 0x161b1e });
    }
    const geometry = mergeColoredGeometry(parts);
    spectatorGeometryCache.set(key, geometry);
    return geometry;
  };

  const makeSpectator = (position: THREE.Vector3, phase: number, shirtColor: number) => {
    const hasPhone = Math.floor(phase * 10) % 3 !== 0;
    const spectator = new THREE.Mesh(getSpectatorGeometry(shirtColor, hasPhone), spectatorMaterial);
    spectator.name = "Merged hard-hat spectator";
    spectator.userData.noShadow = true;
    spectator.position.copy(position);
    spectator.rotation.y = Math.atan2(-position.x, -position.z) + Math.PI;
    applyShadows(spectator, false);
    root.add(spectator);
    spectators.push({ object: spectator, homePosition: spectator.position.clone(), phase });
  };

  const crowdColors = [0xe35e3f, 0x3979aa, 0x5d8850, 0xe3b13d, 0x894f86, 0xe8e3d2];
  for (let index = 0; index < 22; index += 1) {
    const row = index % 2;
    const x = -2 + (index % 11) * 3.2 + (row ? 0.7 : 0);
    const z = 36 + row * 2.1;
    makeSpectator(v3(x, 0.24, z), index * 0.73 + 0.2, crowdColors[index % crowdColors.length]);
  }
  for (let index = 0; index < 8; index += 1) {
    makeSpectator(v3(46 + (index % 2) * 2, 0.24, -1 + Math.floor(index / 2) * 4.4), index * 1.11 + 0.4, crowdColors[(index + 2) % crowdColors.length]);
  }

  const makePigeon = (position: THREE.Vector3, phase: number) => {
    const bird = setFarDetail(new THREE.Group());
    bird.userData.noShadow = true;
    bird.position.copy(position);
    bird.rotation.y = phase;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 5), materials.pigeon);
    body.scale.set(1, 0.78, 1.4);
    body.position.y = 0.2;
    bird.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 5), materials.pigeonWing);
    head.position.set(0, 0.39, -0.18);
    bird.add(head);
    const wings: InstanceTransform[] = [
      { position: v3(-0.22, 0.23, 0.04), scale: v3(0.38, 0.045, 0.25), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.1, 0.22)) },
      { position: v3(0.22, 0.23, 0.04), scale: v3(0.38, 0.045, 0.25), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.1, -0.22)) },
    ];
    bird.add(instancedBoxes(materials.pigeonWing, wings, false));
    applyShadows(bird, false);
    root.add(bird);
    pigeons.push({ object: bird, homePosition: bird.position.clone(), phase });
  };

  const pigeonRoosts = [
    [-28, 13.7, -17], [-22, 13.7, -14], [-17, 13.7, -19],
    [-31, 12.2, 17], [-25, 12.2, 21], [-18, 12.2, 18],
    [5, 38.2, -17], [10, 38.2, -15], [14, 38.2, -19],
    [23, 21.9, 18], [30, 21.9, 21], [28, 21.9, 16],
    [0, 13.8, 20], [7, 13.8, 17], [11, 13.8, 22],
  ] as const;
  pigeonRoosts.forEach(([x, y, z], index) => makePigeon(v3(x, y, z), index * 0.81));

  const makeBillboard = (position: THREE.Vector3, rotation: number) => {
    const billboard = setFarDetail(new THREE.Group());
    billboard.position.copy(position);
    billboard.rotation.y = rotation;
    billboard.add(makeBox(materials.steelDark, v3(0.24, 7.5, 0.24), v3(-3.4, 3.75, 0)));
    billboard.add(makeBox(materials.steelDark, v3(0.24, 7.5, 0.24), v3(3.4, 3.75, 0)));
    billboard.add(makeBox(materials.billboardBlue, v3(8.5, 4.4, 0.32), v3(0, 7.2, 0)));
    const graphic: InstanceTransform[] = [
      { position: v3(-2.8, 7.3, -0.2), scale: v3(1.45, 2.75, 0.08) },
      { position: v3(-0.55, 7.3, -0.2), scale: v3(1.45, 2.75, 0.08) },
      { position: v3(2.1, 8.05, -0.2), scale: v3(2.6, 0.5, 0.08) },
      { position: v3(2.1, 6.65, -0.2), scale: v3(2.6, 0.5, 0.08) },
    ];
    billboard.add(instancedBoxes(materials.billboardCoral, graphic, false));
    applyShadows(billboard, true);
    root.add(billboard);
  };
  makeBillboard(v3(-46, 0.2, -22), Math.PI / 2);
  makeBillboard(v3(45, 0.2, 26), -Math.PI / 2);

  // Low-poly neighbors close the horizon without adding bodies to the simulation budget.
  const skyline = setFarDetail(new THREE.Group());
  const skylineSpecs = [
    [-43, -37, 13, 15, 12], [-27, -40, 15, 22, 11], [-9, -42, 14, 18, 12],
    [8, -43, 13, 25, 11], [24, -42, 15, 17, 12], [42, -38, 12, 21, 12],
  ] as const;
  skylineSpecs.forEach(([x, z, width, height, depth], index) => {
    const material = index % 3 === 0 ? materials.concreteWarm : index % 3 === 1 ? materials.brickDark : materials.glassDark;
    skyline.add(makeBox(material, v3(width, height, depth), v3(x, height / 2 - 0.1, z)));
    const windowTransforms: InstanceTransform[] = [];
    for (let row = 0; row < Math.floor(height / 3.1); row += 1) {
      for (let column = 0; column < Math.floor(width / 2.5); column += 1) {
        windowTransforms.push({
          position: v3(x - width / 2 + 1.4 + column * 2.4, 1.5 + row * 3, z + depth / 2 + 0.04),
          scale: v3(1.15, 1.45, 0.08),
        });
      }
    }
    skyline.add(instancedBoxes(materials.glassLight, windowTransforms, false));
  });
  applyShadows(skyline, false);
  root.add(skyline);

  // Prominent crawler crane. Only the upper works are under cranePivot, so yaw is cleanly about Y.
  const craneBasePosition = v3(36, 0.2, -3.5);
  const craneBase = new THREE.Group();
  craneBase.position.copy(craneBasePosition);
  for (const z of [-1.75, 1.75]) {
    craneBase.add(makeBox(materials.craneDark, v3(8.7, 1.2, 1.5), v3(0, 0.75, z)));
    const treads: InstanceTransform[] = [];
    for (let tread = -5; tread <= 5; tread += 1) {
      treads.push({ position: v3(tread * 0.72, 0.75, z + (z < 0 ? -0.79 : 0.79)), scale: v3(0.52, 1.1, 0.13) });
    }
    craneBase.add(instancedBoxes(materials.steelDark, treads, false));
  }
  craneBase.add(makeBox(materials.craneYellow, v3(6.4, 1.05, 4.2), v3(0, 1.7, 0)));
  const slewRing = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.8, 22), materials.steelDark);
  slewRing.position.y = 2.55;
  craneBase.add(slewRing);
  applyShadows(craneBase, true);
  root.add(craneBase);

  const cranePivot = new THREE.Group();
  cranePivot.name = "Crawler crane yaw pivot";
  cranePivot.position.copy(craneBasePosition);
  cranePivot.position.y += 2.85;
  cranePivot.rotation.y = -0.18;
  root.add(cranePivot);

  cranePivot.add(makeBox(materials.craneYellow, v3(7.4, 2.6, 4.4), v3(0.5, 1.5, 0)));
  cranePivot.add(makeBox(materials.craneDark, v3(2.15, 2.05, 3.8), v3(2.9, 2.45, 0)));
  const cab = new THREE.Group();
  cab.position.set(-2.4, 2.55, 0);
  cab.add(makeBox(materials.craneYellow, v3(2.8, 2.8, 3.6)));
  cab.add(makeBox(materials.glassDark, v3(1.8, 1.35, 3.22), v3(-0.58, 0.38, 0)));
  cranePivot.add(cab);
  const counterweights: InstanceTransform[] = [];
  for (let index = 0; index < 5; index += 1) {
    counterweights.push({ position: v3(3.55 + index * 0.22, 3.0 - index * 0.08, 0), scale: v3(0.36, 2.25, 3.85) });
  }
  cranePivot.add(instancedBoxes(materials.concreteDark, counterweights, false));

  const boomBase = v3(-2.1, 4.1, 0);
  const boomTipLocal = v3(-29, 33, 0);
  const boom = new THREE.Group();
  boom.userData.noShadow = true;
  const railOffsets = [
    v3(0, 0.85, 0.82), v3(0, -0.85, 0.82), v3(0, 0.85, -0.82), v3(0, -0.85, -0.82),
  ];
  railOffsets.forEach((offset) => {
    const taper = offset.clone().multiplyScalar(0.22);
    boom.add(beamBetween(materials.craneYellow, boomBase.clone().add(offset), boomTipLocal.clone().add(taper), 0.13));
  });
  const boomDirection = boomTipLocal.clone().sub(boomBase);
  for (let segment = 0; segment < 11; segment += 1) {
    const a = segment / 11;
    const b = (segment + 1) / 11;
    const centerA = boomBase.clone().addScaledVector(boomDirection, a);
    const centerB = boomBase.clone().addScaledVector(boomDirection, b);
    const widthA = THREE.MathUtils.lerp(0.82, 0.2, a);
    const widthB = THREE.MathUtils.lerp(0.82, 0.2, b);
    boom.add(
      beamBetween(materials.craneYellow, centerA.clone().add(v3(0, widthA, widthA)), centerB.clone().add(v3(0, -widthB, widthB)), 0.09),
      beamBetween(materials.craneYellow, centerA.clone().add(v3(0, -widthA, -widthA)), centerB.clone().add(v3(0, widthB, -widthB)), 0.09),
      beamBetween(materials.craneYellow, centerA.clone().add(v3(0, widthA, -widthA)), centerA.clone().add(v3(0, -widthA, widthA)), 0.08),
    );
  }
  cranePivot.add(boom);

  const boomTip = new THREE.Object3D();
  boomTip.name = "Stable crane cable anchor";
  boomTip.position.copy(boomTipLocal);
  cranePivot.add(boomTip);
  const tipSheave = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.12, 7, 16), materials.steelDark);
  tipSheave.rotation.y = Math.PI / 2;
  tipSheave.position.copy(boomTipLocal);
  cranePivot.add(tipSheave);
  applyShadows(cranePivot, true);

  root.updateMatrixWorld(true);
  const anchor = boomTip.getWorldPosition(new THREE.Vector3());
  const ballPosition = anchor.clone().add(v3(2.8, -21.7, 3.0));
  const cableGeometry = new THREE.BufferGeometry().setFromPoints([anchor, ballPosition]);
  const cable = new THREE.Line(
    cableGeometry,
    new THREE.LineBasicMaterial({ color: 0x1b2226, linewidth: 2 }),
  );
  cable.name = "Live two-point wrecking ball cable";
  cable.frustumCulled = false;
  root.add(cable);

  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0x33393d,
    roughness: 0.28,
    metalness: 0.88,
    emissive: 0xffaa24,
    emissiveIntensity: 0.18,
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 18), ballMaterial);
  ball.name = "28 tonne highlighted wrecking ball";
  ball.position.copy(ballPosition);
  ball.castShadow = true;
  ball.receiveShadow = true;
  ball.userData.mass = 28;
  ball.userData.radius = 1.5;
  ball.userData.cableLength = anchor.distanceTo(ballPosition);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.82, 0.045, 8, 36),
    new THREE.MeshBasicMaterial({ color: 0xffc64c, transparent: true, opacity: 0.54, depthWrite: false }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.userData.farDetail = true;
  ball.add(halo);
  root.add(ball);

  root.updateMatrixWorld(true);

  return {
    root,
    destructibleRoot,
    buildings,
    pieces,
    pigeons,
    spectators,
    warningLights,
    cars,
    trees,
    cranePivot,
    boomTip,
    cable,
    ball,
    waterTankPiece,
  };
}
