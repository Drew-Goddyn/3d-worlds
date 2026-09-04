import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Each storey is a complete, movable structural assembly. Geometry is batched
// by material inside the storey, so ornamentation follows the damaged floors.
export function createCity(scene) {
  const root = new THREE.Group();
  root.name = 'Demolition district';
  scene.add(root);
  const buildings = [], props = [], crowd = [], pigeons = [], warningLights = [];
  const colors = {
    stone: 0xead9b8, cream: 0xffefcd, concrete: 0xbfc9c4, trim: 0xf8f2df,
    brick: 0xb85e43, brickDark: 0x814331, terracotta: 0xcf7655,
    steel: 0x3d5556, window: 0x284d55, glass: 0x438f98, blueGlass: 0x86c3c6,
    roof: 0x657474, asphalt: 0x53615f, sidewalk: 0xd7d2ba, white: 0xf0e5bb,
    green: 0x759647, foliage: 0x769b45, leafLight: 0xa4b961, trunk: 0x79674b, wood: 0xa07851,
    yellow: 0xf8bc45, orange: 0xe97936, dark: 0x283d40, rubber: 0x293434,
    red: 0xcc5843, blue: 0x63a3ac, mint: 0xaac4b0, skin: 0xffd090,
  };
  const mats = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key,
    new THREE.MeshStandardMaterial({ color, roughness: key.includes('Glass') || key === 'glass' ? 0.18 : 0.82,
      metalness: key === 'glass' || key === 'blueGlass' ? 0.32 : key === 'steel' ? 0.45 : 0.03 })]));
  mats.window.roughness = 0.3;
  mats.window.metalness = 0.25;
  mats.brick.map = brickTexture('#bd674c', '#8e4b3a');
  mats.brickDark.map = brickTexture('#975339', '#713e2c');
  mats.terracotta.map = brickTexture('#d78a66', '#ad6c51');
  const amber = new THREE.MeshStandardMaterial({ color: 0xffbc45, emissive: 0xff8a16, emissiveIntensity: 1.5 });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const matrix = new THREE.Matrix4(), rotation = new THREE.Quaternion();
  const vector = new THREE.Vector3(), scale = new THREE.Vector3();

  function brickTexture(base, alternate) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#cfa58b'; ctx.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 8; y++) for (let x = -1; x < 9; x++) {
      ctx.fillStyle = (x * 7 + y * 3) % 5 === 0 ? alternate : base;
      ctx.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 61, 29);
      ctx.fillStyle = 'rgba(255,232,201,.06)';
      ctx.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 61, 3);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    texture.anisotropy = 4;
    return texture;
  }

  function batch(group, type = 'concrete') {
    const geometries = new Map();
    function add(geo, material, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
      const copy = geo.clone();
      rotation.setFromEuler(new THREE.Euler(rx, ry, rz));
      matrix.compose(vector.set(x, y, z), rotation, scale.set(sx, sy, sz));
      copy.applyMatrix4(matrix);
      if (!geometries.has(material)) geometries.set(material, []);
      geometries.get(material).push(copy);
    }
    return {
      box: (material, x, y, z, w, h, d, ry = 0) => add(boxGeo, material, x, y, z, w, h, d, 0, ry),
      cylinder(material, x, y, z, radius, height, sides = 10, rz = 0) {
        const geo = new THREE.CylinderGeometry(radius, radius, height, sides);
        add(geo, material, x, y, z, 1, 1, 1, 0, 0, rz); geo.dispose();
      },
      cone(material, x, y, z, radius, height, sides = 10) {
        const geo = new THREE.ConeGeometry(radius, height, sides);
        add(geo, material, x, y, z); geo.dispose();
      },
      sphere(material, x, y, z, radius, sx = 1, sy = 1, sz = 1) {
        const geo = new THREE.IcosahedronGeometry(radius, 1);
        add(geo, material, x, y, z, sx, sy, sz); geo.dispose();
      },
      finish() {
        const pieces = [];
        for (const [material, geos] of geometries) {
          // Primitive normals and UVs are kept; all primitives share attributes.
          const sources = geos.map(geo => geo.index ? geo.toNonIndexed() : geo);
          const fractureable = Number.isInteger(group.userData.floorIndex);
          const primitives = [];
          let offset = 0;
          if (fractureable) for (let id = 0; id < sources.length; id++) {
            const source = sources[id];
            source.computeBoundingBox();
            const center = source.boundingBox.getCenter(new THREE.Vector3());
            const size = source.boundingBox.getSize(new THREE.Vector3());
            const count = source.attributes.position.count;
            const centers = new Float32Array(count * 3), ids = new Float32Array(count);
            for (let vertex = 0; vertex < count; vertex++) {
              centers.set(center.toArray(), vertex * 3); ids[vertex] = id;
            }
            source.setAttribute('fractureCenter', new THREE.BufferAttribute(centers, 3));
            source.setAttribute('fractureId', new THREE.BufferAttribute(ids, 1));
            primitives.push({ id, start: offset, count, center: center.toArray(), size: size.toArray(), material: typeof material === 'string' ? material : type });
            offset += count;
          }
          const merged = mergeGeometries(sources, false);
          for (let i = 0; i < sources.length; i++) if (sources[i] !== geos[i]) sources[i].dispose();
          for (const geo of geos) geo.dispose();
          if (!merged) continue;
          const mesh = new THREE.Mesh(merged, typeof material === 'string' ? mats[material] : material);
          mesh.castShadow = mesh.receiveShadow = true;
          mesh.userData.material = type;
          if (fractureable) {
            mesh.userData.primitives = primitives;
            mesh.userData.originalPositions = merged.attributes.position.array.slice();
            mesh.userData.originalNormals = merged.attributes.normal.array.slice();
            if (type === 'glass' && ['glass', 'blueGlass', 'window'].includes(material)) mesh.userData.fractureUnits = primitives;
          }
          group.add(mesh); pieces.push({ mesh, material: type });
        }
        return pieces;
      },
    };
  }

  function sign(group, text, x, y, z, width, height, background = '#253f42', ink = '#fff0c9', angle = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background; ctx.fillRect(0, 0, 1024, 160);
    ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(12, 12, 1000, 136);
    ctx.fillStyle = ink; ctx.font = '600 70px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 83, 950);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }));
    mesh.position.set(x, y, z); mesh.rotation.y = angle; group.add(mesh);
  }

  // Streets, curbs, raised pavements, crossings, and all the small civil details.
  const street = batch(root);
  street.box('asphalt', 0, -0.13, -1, 66, 0.25, 67);
  for (const [x, z, w, d] of [[-17, -17, 28, 29], [17, -17, 28, 29], [-17, 16, 28, 26], [16, 16, 26, 26]]) {
    street.box('sidewalk', x, 0.05, z, w, 0.32, d);
    // Curb edges keep pavements legible from the overview.
    street.box('cream', x, 0.14, z + d / 2, w, 0.24, 0.17);
    street.box('cream', x, 0.14, z - d / 2, w, 0.24, 0.17);
    street.box('cream', x + w / 2, 0.14, z, 0.17, 0.24, d);
    street.box('cream', x - w / 2, 0.14, z, 0.17, 0.24, d);
  }
  for (let n = -29; n <= 29; n += 4) if (Math.abs(n) > 6) {
    street.box('yellow', n, 0.015, -0.15, 1.8, 0.018, 0.1);
    street.box('yellow', n, 0.015, 0.15, 1.8, 0.018, 0.1);
    street.box('yellow', -0.15, 0.015, n, 0.1, 0.018, 1.8);
    street.box('yellow', 0.15, 0.015, n, 0.1, 0.018, 1.8);
  }
  // Narrow loading lanes and marked parking bays along the two front blocks.
  for (const [x, width] of [[-17, 27], [12, 17]]) {
    street.box('asphalt', x, 0.223, 25.2, width, 0.018, 3.7);
    for (let xx = x - width / 2 + 0.6; xx < x + width / 2; xx += 4.1) {
      street.box('white', xx, 0.238, 25.2, 0.07, 0.015, 3.2);
    }
  }
  for (let n = -2.6; n <= 2.6; n += 0.8) for (const s of [-1, 1]) {
    street.box('white', n, 0.018, s * 5, 0.45, 0.025, 2.1);
    street.box('white', s * 5, 0.018, n, 2.1, 0.025, 0.45);
  }
  for (const z of [-22, -9, 10, 23]) {
    street.cylinder('steel', 0, 0.025, z, 0.44, 0.035, 16);
    for (let dx = -0.25; dx < 0.3; dx += 0.12) street.box('dark', dx, 0.046, z, 0.035, 0.015, 0.5);
  }
  for (const [x, z] of [[-4, -7], [4, 7], [-4, 22], [4, -22], [-29, 2], [23, -4]]) {
    street.cylinder('steel', x, 1.9, z, 0.075, 3.8, 8);
    street.box('steel', x + 0.4, 3.8, z, 0.9, 0.08, 0.08);
    street.box('cream', x + 0.8, 3.73, z, 0.45, 0.13, 0.3);
  }
  for (const [x, z] of [[-18, 22], [-5, -20], [18, 21], [21, -5]]) {
    street.box('trunk', x, 0.64, z, 1.7, 0.12, 0.55);
    street.box('trunk', x, 0.98, z - 0.23, 1.7, 0.48, 0.1);
    for (const dx of [-0.65, 0.65]) street.box('steel', x + dx, 0.38, z, 0.11, 0.6, 0.55);
  }
  for (const [x, z] of [[-4, 9], [5, -7], [-19, 4]]) {
    street.cylinder('red', x, 0.54, z, 0.16, 0.7, 8);
    street.sphere('red', x, 0.9, z, 0.19);
    street.box('red', x, 0.6, z, 0.55, 0.15, 0.16);
  }
  // Perimeter construction fence, warm striped barriers and practical beacons.
  for (const [x, z, angle] of [[-29, 29, 0], [-22, 29, 0], [-15, 29, 0], [-8, 29, 0], [0, 29, 0], [7, 29, 0], [14, 29, 0], [21, 29, 0], [30, -25, Math.PI / 2], [-32, 14, Math.PI / 2], [-32, 7, Math.PI / 2], [-32, -1, Math.PI / 2]]) {
    street.box('concrete', x, 0.48, z, 5.8, 0.8, 0.5, angle);
    street.box('yellow', x, 0.82, z + (angle === 0 ? 0.28 : 0), 5.7, 0.3, 0.08, angle);
    for (let i = -2; i <= 2; i++) {
      street.box('dark', x + Math.cos(angle) * i, 0.83, z - Math.sin(angle) * i + (angle === 0 ? 0.33 : 0), 0.35, 0.3, 0.09, angle);
    }
    for (const direction of [-1, 1]) {
      const xx = x + Math.cos(angle) * direction * 2.4, zz = z - Math.sin(angle) * direction * 2.4;
      street.box('steel', xx, 1.55, zz, 0.07, 1.6, 0.07);
    }
    street.box('steel', x, 2.2, z, 5, 0.055, 0.055, angle);
    street.box('steel', x, 1.2, z, 5, 0.055, 0.055, angle);
    if (warningLights.length < 8) {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), amber.clone());
      light.position.set(x, 1.14, z); light.userData.phase = warningLights.length * 1.2;
      root.add(light); warningLights.push(light);
    }
  }
  street.finish();

  function supportFrame(b, floor, assembly, exteriorMaterial) {
    const { width: w, depth: d } = b, h = floor.height;
    assembly.box('concrete', 0, 0.16, 0, w, 0.32, d);
    for (const x of [-w / 2 + 0.45, 0, w / 2 - 0.45]) for (const z of [-d / 2 + 0.45, d / 2 - 0.45]) {
      floor.columns.push({ x, z });
      assembly.box(exteriorMaterial, x, h / 2, z, 0.43, h, 0.43);
    }
    assembly.box('concrete', 0, h - 0.16, -d / 2 + 0.35, w, 0.3, 0.45);
    assembly.box('concrete', 0, h - 0.16, d / 2 - 0.35, w, 0.3, 0.45);
  }

  function roof(b, floor, assembly) {
    const { width: w, depth: d } = b, h = floor.height;
    assembly.box('roof', 0, h, 0, w - 0.35, 0.2, d - 0.35);
    for (const side of [-1, 1]) {
      assembly.box('trim', 0, h + 0.29, side * (d / 2 - 0.12), w, 0.6, 0.24);
      assembly.box('trim', side * (w / 2 - 0.12), h + 0.29, 0, 0.24, 0.6, d);
    }
    assembly.box('concrete', -w * 0.19, h + 0.6, -d * 0.17, 2.1, 1.2, 1.5);
    assembly.box('roof', -w * 0.19, h + 1.25, -d * 0.17, 2.25, 0.12, 1.7);
    for (const x of [-w * 0.19 - 0.5, -w * 0.19 + 0.5]) assembly.cylinder('steel', x, h + 1.33, -d * 0.17, 0.35, 0.1, 12);
    assembly.box('steel', w * 0.2, h + 0.28, -d * 0.24, 2.6, 0.42, 0.65);
    if (b.waterTower) {
      floor.group.userData.waterTower = { x: 1.8, y: h + 3.25, z: 1.3, radius: 1.65 };
      b.waterTowerPosition = new THREE.Vector3(b.x + 1.8, floor.y + h + 3.25, b.z + 1.3);
      for (const xx of [0.7, 2.9]) for (const zz of [0.2, 2.4]) assembly.box('steel', xx, h + 1.3, zz, 0.18, 2.6, 0.18);
      // The tank has its own center-of-mass transform so it can detach, tumble,
      // rupture, and rewind independently while its supports follow the roof.
      const tankGroup = new THREE.Group();
      tankGroup.name = 'Waterworks wooden rooftop tank';
      tankGroup.position.set(1.8, h + 3.25, 1.3);
      tankGroup.userData.buildingId = b.id;
      tankGroup.userData.floorIndex = floor.index;
      tankGroup.userData.isWaterTower = true;
      const tank = batch(tankGroup, 'brick');
      tank.cylinder('trunk', 0, 0, 0, 1.6, 2.4, 24);
      for (let stave = 0; stave < 24; stave++) {
        const theta = stave / 24 * Math.PI * 2;
        tank.box(stave % 4 === 0 ? 'trunk' : 'wood', Math.sin(theta) * 1.6, 0,
          Math.cos(theta) * 1.6, 0.41, 2.4, 0.1, theta);
      }
      for (const yy of [-1.06, -0.04, 1.02]) tank.cylinder('steel', 0, yy, 0, 1.69, 0.09, 24);
      tank.cone('roof', 0, 1.5, 0, 1.83, 0.92, 24);
      for (const xx of [1.51, 2.05]) tank.box('steel', xx, -1.05, 0, 0.065, 4.4, 0.065);
      for (let yy = -3.05; yy < 1.25; yy += 0.4) tank.box('steel', 1.78, yy, 0, 0.59, 0.06, 0.065);
      tank.finish();
      floor.group.add(tankGroup);
      b.waterTower = { group: tankGroup, position: b.waterTowerPosition.clone(), radius: 1.65 };
    }
  }

  function masonryFloor(b, floor, assembly, index) {
    const { width: w, depth: d } = b, h = floor.height;
    const wall = b.kind === 'stone' ? 'stone' : b.color || 'brick';
    supportFrame(b, floor, assembly, wall);
    // Pane strips sit between solid spandrels and real mullion piers.
    for (const side of [-1, 1]) {
      const z = side * (d / 2 - 0.16);
      assembly.box(wall, 0, 0.61, z, w, 0.92, 0.34);
      assembly.box(wall, 0, h - 0.34, z, w, 0.7, 0.34);
      const columns = Math.max(3, Math.floor(w / 2.2));
      const step = w / columns;
      for (let col = 0; col < columns; col++) {
        const x = -w / 2 + step * (col + 0.5), winWidth = step - 0.65;
        assembly.box('window', x, h * 0.51, z + side * 0.05, winWidth, h - 1.3, 0.12);
        assembly.box(wall, x - step * 0.5 + 0.19, h * 0.5, z, 0.56, h, 0.43);
        assembly.box('trim', x, 0.96, z + side * 0.19, winWidth + 0.25, 0.13, 0.37);
        assembly.box('trim', x, h - 0.69, z + side * 0.19, winWidth + 0.35, 0.16, 0.34);
        assembly.box('trim', x, h * 0.51, z + side * 0.14, 0.065, h - 1.3, 0.08);
        assembly.box('trim', x, h * 0.49, z + side * 0.14, winWidth, 0.065, 0.08);
      }
      assembly.box('trim', 0, h - 0.04, z + side * 0.13, w + 0.18, 0.18, 0.43);
    }
    for (const side of [-1, 1]) {
      const x = side * (w / 2 - 0.14);
      assembly.box(wall, x, h / 2, 0, 0.32, h, d);
      for (let z = -d / 2 + 1.25; z < d / 2 - 0.5; z += 2.25) {
        assembly.box('window', x + side * 0.18, h * 0.52, z, 0.09, h - 1.5, 1.24);
        assembly.box('trim', x + side * 0.22, 0.97, z, 0.24, 0.12, 1.45);
        assembly.box('trim', x + side * 0.22, h - 0.69, z, 0.24, 0.14, 1.45);
        assembly.box('trim', x + side * 0.24, h * 0.52, z, 0.08, h - 1.5, 0.065);
      }
      assembly.box('trim', x, h - 0.04, 0, 0.55, 0.18, d + 0.3);
    }
    if (b.kind === 'stone') {
      // A monumental columned entrance, cornices, and a dentil crown.
      if (index < 2) for (const x of [-4.7, -2.35, 0, 2.35, 4.7]) {
        assembly.cylinder('cream', x, h / 2, d / 2 + 0.54, 0.31, h - 0.24, 12);
        assembly.box('trim', x, 0.3, d / 2 + 0.54, 0.82, 0.32, 0.8);
        assembly.box('trim', x, h - 0.21, d / 2 + 0.54, 0.8, 0.35, 0.8);
      }
      assembly.box('cream', 0, h - 0.1, d / 2 + 0.48, w + 0.6, 0.35, 1.3);
      if (index === 0) {
        for (let step = 0; step < 3; step++) assembly.box('stone', 0, 0.1 + step * 0.13, d / 2 + 1.25 - step * 0.21, w - 1.3, 0.2, 1.5 - step * 0.25);
      }
      if (index === b.storeys - 1) {
        assembly.box('cream', 0, h + 0.14, d / 2 + 0.14, w + 0.8, 0.35, 0.75);
        for (let x = -w / 2; x < w / 2; x += 0.45) assembly.box('trim', x, h - 0.17, d / 2 + 0.32, 0.2, 0.2, 0.25);
      }
    } else if (b.fireEscape && index > 0) {
      const xx = w / 2 + 0.7;
      assembly.box('steel', xx, 0.55, 0.5, 1.15, 0.13, 3.1);
      for (const z of [-0.9, 1.9]) {
        assembly.box('steel', xx, 1.4, z, 1.2, 0.05, 0.05);
        for (const x of [xx - 0.5, xx, xx + 0.5]) assembly.box('steel', x, 1, z, 0.04, 0.9, 0.04);
      }
      assembly.box('steel', xx + 0.56, 1.4, 0.5, 0.06, 0.06, 2.8);
      for (let t = 0; t < 8; t++) assembly.box('steel', xx, 0.4 + t * (h / 8), -0.75 + t * 0.31, 0.8, 0.08, 0.28);
    }
  }

  function glassFloor(b, floor, assembly, index) {
    const { width: w, depth: d } = b, h = floor.height;
    supportFrame(b, floor, assembly, 'trim');
    // Slightly different reflective panes give the curtain wall a lively skyline.
    for (const side of [-1, 1]) {
      const z = side * (d / 2);
      for (let col = 0; col < 7; col++) {
        const x = -w / 2 + (col + 0.5) * w / 7;
        assembly.box((col * 3 + index) % 5 < 2 ? 'blueGlass' : 'glass', x, h / 2, z, w / 7 - 0.055, h - 0.24, 0.12);
        assembly.box('trim', x - w / 14, h / 2, z + side * 0.06, 0.065, h, 0.15);
      }
      assembly.box('trim', 0, 0.16, z + side * 0.08, w + 0.1, 0.13, 0.2);
    }
    for (const side of [-1, 1]) {
      const x = side * w / 2;
      for (let col = 0; col < 7; col++) {
        const z = -d / 2 + (col + 0.5) * d / 7;
        assembly.box((col + index * 2) % 6 < 2 ? 'blueGlass' : 'glass', x, h / 2, z, 0.12, h - 0.24, d / 7 - 0.055);
        assembly.box('trim', x + side * 0.06, h / 2, z - d / 14, 0.15, h, 0.065);
      }
      assembly.box('trim', x, 0.16, 0, 0.2, 0.13, d);
    }
  }

  function parkingFloor(b, floor, assembly, index) {
    const { width: w, depth: d } = b, h = floor.height;
    supportFrame(b, floor, assembly, 'concrete');
    for (const side of [-1, 1]) {
      assembly.box('concrete', 0, 0.66, side * d / 2, w, 0.68, 0.33);
      assembly.box('trim', 0, 1.07, side * d / 2, w, 0.09, 0.4);
      for (const x of [-w / 2 + 0.25, -w / 4, 0, w / 4, w / 2 - 0.25]) assembly.box('concrete', x, h / 2, side * d / 2, 0.38, h, 0.5);
    }
    for (const side of [-1, 1]) assembly.box('concrete', side * w / 2, 0.66, 0, 0.3, 0.68, d);
    for (let z = -d / 2 + 1; z < d / 2; z += 2.5) for (const side of [-1, 1]) assembly.box('white', side * w * 0.29, 0.335, z, w * 0.32, 0.018, 0.07);
    // Ramp ribbons read through the large open bays and remain in the assembly.
    assembly.box('concrete', 0, h * 0.38, -d * 0.23, 2.6, 0.2, 4.5);
    if (index === 0) {
      assembly.box('blue', w / 2 + 0.02, 1.7, d / 2 - 1.25, 0.1, 1.65, 1.35);
      sign(floor.group, 'P', 1.6, 1.6, d / 2 + 0.19, 1.3, 1.3, '#347c91');
    }
  }

  const specs = [
    { name: 'Mercantile Bank', kind: 'stone', x: -11, z: 14, width: 12, depth: 11, storeys: 3, storeyHeight: 4.3 },
    { name: 'Waterworks Lofts', kind: 'brick', color: 'brickDark', x: -24, z: 14, width: 9, depth: 12, storeys: 6, storeyHeight: 3.2, waterTower: true, fireEscape: true },
    { name: 'Parkside Garage', kind: 'concrete', x: 11, z: 14, width: 12, depth: 12, storeys: 4, storeyHeight: 3.1 },
    { name: 'Verdant Tower', kind: 'glass', x: 10, z: -13, width: 11, depth: 12, storeys: 11, storeyHeight: 3.15 },
    { name: 'Foundry Warehouse', kind: 'brick', color: 'brick', x: -24, z: -13, width: 10, depth: 12, storeys: 4, storeyHeight: 3.35, fireEscape: true },
    { name: 'Union House', kind: 'brick', color: 'terracotta', x: -11, z: -13, width: 11, depth: 12, storeys: 6, storeyHeight: 3.25 },
    { name: 'Atlantic Building', kind: 'brick', color: 'terracotta', x: 24, z: -13, width: 9, depth: 12, storeys: 7, storeyHeight: 3.2, fireEscape: true },
    { name: 'Supply Exchange', kind: 'brick', color: 'brick', x: -11, z: -26, width: 11, depth: 8, storeys: 3, storeyHeight: 3.6 },
  ];
  for (const spec of specs) {
    const b = { ...spec, id: buildings.length, height: spec.storeys * spec.storeyHeight, floors: [] };
    for (let i = 0; i < b.storeys; i++) {
      const group = new THREE.Group();
      const floor = { group, y: 0.23 + i * b.storeyHeight, height: b.storeyHeight, index: i, material: b.kind, columns: [], pieces: [] };
      group.position.set(b.x, floor.y, b.z);
      group.name = `${b.name} / floor ${i + 1}`;
      group.userData.buildingId = b.id; group.userData.floorIndex = i;
      const assembly = batch(group, b.kind);
      if (b.kind === 'glass') glassFloor(b, floor, assembly, i);
      else if (b.kind === 'concrete') parkingFloor(b, floor, assembly, i);
      else masonryFloor(b, floor, assembly, i);
      if (i === b.storeys - 1) roof(b, floor, assembly);
      floor.pieces = assembly.finish();
      b.floors.push(floor); root.add(group);
    }
    buildings.push(b);
  }
  sign(buildings[0].floors[1].group, 'MERCANTILE BANK', 0, 3.45, 6.28, 9.7, 0.8, '#d9c6a0', '#615e4c');
  sign(buildings[4].floors[0].group, 'FOUNDRY & CO.', 0, 2.75, 6.26, 7.4, 0.8, '#254748');
  sign(buildings[5].floors[0].group, 'UNION  /  COFFEE', 0, 2.7, 6.25, 7.4, 0.7, '#467c78');
  sign(buildings[6].floors[6].group, 'ATLANTIC', 0, 2.6, 6.25, 7.7, 0.9, '#ae604a');
  sign(buildings[7].floors[2].group, 'SUPPLY EXCHANGE', 0, 2.85, 4.26, 8.8, 0.8, '#9f513c');
  const billboardFloor = buildings[7].floors[2];
  const billboard = batch(billboardFloor.group, 'brick');
  for (const x of [-3, 3]) billboard.box('steel', x, billboardFloor.height + 1.6, 0.4, 0.12, 3.2, 0.12);
  billboard.box('steel', 0, billboardFloor.height + 2.1, 0.4, 8.2, 2, 0.17);
  billboardFloor.pieces.push(...billboard.finish());
  sign(billboardFloor.group, 'MAKE SOME ROOM.', 0, billboardFloor.height + 2.1, 0.51, 8, 1.8, '#e9b44e', '#304b4b');

  function car(x, z, color, angle = 0) {
    const group = new THREE.Group(); group.position.set(x, 0.23, z); group.rotation.y = angle;
    const body = batch(group);
    body.box(color, 0, 0.55, 0, 1.55, 0.56, 3.1);
    body.box(color, 0, 0.98, -0.15, 1.35, 0.5, 1.65);
    body.box('window', 0, 1.13, 0.61, 1.18, 0.39, 0.055);
    body.box('window', 0, 1.13, -0.96, 1.18, 0.34, 0.055);
    for (const side of [-1, 1]) {
      body.box('window', side * 0.685, 1.12, -0.17, 0.035, 0.32, 1.25);
      for (const zz of [-1.02, 1.02]) body.cylinder('rubber', side * 0.77, 0.42, zz, 0.33, 0.15, 10, Math.PI / 2);
    }
    // Warm headlights use the body material to keep car batching compact.
    body.box(color, 0, 0.5, 1.59, 1.5, 0.16, 0.13);
    body.finish(); root.add(group); props.push({ group, x, z, kind: 'car', height: 1.5, radius: 1.7 });
  }
  for (const [x, z, color, angle] of [[-6, 25, 'red', Math.PI / 2], [-14, 25, 'mint', Math.PI / 2], [-24, 25, 'yellow', Math.PI / 2], [8, 25, 'blue', Math.PI / 2], [16, 25, 'cream', Math.PI / 2], [-2.1, -19, 'mint', 0], [-2.1, 16, 'yellow', 0], [2.1, -24, 'red', Math.PI], [2.1, 11, 'blue', Math.PI], [19, -27, 'cream', Math.PI / 2]]) car(x, z, color, angle);

  function tree(x, z, n) {
    const group = new THREE.Group(); group.position.set(x, 0.22, z);
    const canopy = batch(group);
    canopy.cylinder('trunk', 0, 1.25, 0, 0.15, 2.5, 7);
    canopy.sphere('foliage', -0.4, 3, 0, 1.27, 0.85, 1.1, 0.9);
    canopy.sphere('foliage', 0.5, 3.3, 0.1, 1.12, 0.9, 1.1, 0.9);
    canopy.sphere('foliage', 0, 3.85, -0.1, 0.96, 0.9, 1.1, 0.85);
    canopy.finish(); group.rotation.y = n * 1.45; root.add(group);
    props.push({ group, x, z, kind: 'tree', height: 4.8, radius: 1.2 });
  }
  [[-29.5, 23], [-19, 22.6], [-4.4, 24], [4.5, 23], [19, 23], [-4.4, -25], [4.3, -26], [19, -23], [-19, -24], [-30, -5]].forEach(([x, z], n) => tree(x, z, n));

  // Spectators stand outside the exclusion fence. Their own local groups allow
  // the simulation to duck, cheer, and restore their exact recorded poses.
  for (let i = 0; i < 11; i++) {
    const group = new THREE.Group();
    group.position.set(-20 + i * 2.2, 0.04, 32 + (i % 3) * 0.25);
    group.rotation.y = Math.PI + Math.sin(i) * 0.3;
    const person = batch(group);
    const shirt = ['orange', 'blue', 'yellow'][i % 3];
    person.box('dark', -0.13, 0.4, 0, 0.18, 0.68, 0.22);
    person.box('dark', 0.13, 0.4, 0, 0.18, 0.68, 0.22);
    person.box(shirt, 0, 1, 0, 0.51, 0.61, 0.28);
    person.sphere('yellow', 0, 1.53, 0, 0.21, 0.88, 1.1, 0.87);
    person.cylinder('yellow', 0, 1.7, 0, 0.26, 0.11, 8);
    person.finish();
    group.userData.arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.name = side < 0 ? 'Left shoulder and hand' : 'Right shoulder and phone';
      arm.position.set(side * 0.31, 1.25, 0);
      const limb = batch(arm);
      limb.box(shirt, 0, -0.2, 0, 0.15, 0.4, 0.19);
      limb.box('yellow', 0, -0.43, 0, 0.12, 0.13, 0.13);
      if (side > 0) limb.box('dark', 0, -0.47, 0.11, 0.12, 0.2, 0.055);
      limb.finish();
      arm.userData.side = side;
      arm.userData.restRotation = [0, 0, 0];
      group.add(arm); group.userData.arms.push(arm);
    }
    root.add(group);
    group.userData.baseY = group.position.y; group.userData.phase = i * 1.7;
    crowd.push(group);
  }

  for (let i = 0; i < 7; i++) {
    const b = buildings[[0, 1, 4, 5][i % 4]];
    const group = new THREE.Group();
    group.position.set(b.x - 2 + i * 0.57, b.height + 1.08, b.z + b.depth / 2 - 0.25);
    const bird = batch(group);
    bird.sphere('steel', 0, 0.05, 0, 0.17, 0.75, 0.9, 1.3);
    bird.sphere('steel', 0, 0.22, 0.12, 0.105);
    bird.box('steel', 0, 0.06, -0.18, 0.19, 0.05, 0.18);
    bird.finish();
    group.userData.wings = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.Group();
      wing.name = side < 0 ? 'Left pigeon wing' : 'Right pigeon wing';
      wing.position.set(side * 0.08, 0.075, -0.035);
      const feather = batch(wing);
      feather.sphere('steel', side * 0.17, 0, -0.01, 0.18, 1.35, 0.1, 0.63);
      feather.finish();
      wing.rotation.z = -side * 0.25;
      wing.userData.side = side;
      wing.userData.restRotation = [0, 0, -side * 0.25];
      group.add(wing); group.userData.wings.push(wing);
    }
    root.add(group); group.userData.home = group.position.clone(); group.userData.phase = i;
    pigeons.push(group);
  }
  boxGeo.dispose();
  return { buildings, props, crowd, pigeons, warningLights, root };
}
