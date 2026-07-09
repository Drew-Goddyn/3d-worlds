"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createDistrict } from "./city";
import { CinematicEffects } from "./effects";
import { DemolitionSimulation } from "./simulation";
import type {
  ChargePlacement,
  MaterialKind,
  SimulationFrameReport,
} from "./types";

type ToolMode = "ball" | "charges";
type QualityMode = "cinematic" | "balanced" | "performance";

interface HudState {
  tonnage: number;
  multiplier: number;
  headline: string;
  timeline: number;
  historySeconds: number;
  charges: number;
  rewinding: boolean;
  paused: boolean;
}

interface PlaygroundApi {
  fireCharges: () => void;
  resetCity: () => void;
  resetCamera: () => void;
  setTimeline: (value: number) => void;
  setQuality: (quality: QualityMode) => void;
  kickBall: (direction?: number) => void;
  setCraneControl: (control: string, active: boolean) => void;
}

interface ChargeRecord {
  charge: ChargePlacement;
  placedAt: number;
  firedAt: number | null;
}

interface CollateralState {
  object: THREE.Object3D;
  homePosition: THREE.Vector3;
  homeQuaternion: THREE.Quaternion;
  homeScale: THREE.Vector3;
}

const INITIAL_HUD: HudState = {
  tonnage: 0,
  multiplier: 1,
  headline: "DISTRICT STANDING BY",
  timeline: 1,
  historySeconds: 0,
  charges: 0,
  rewinding: false,
  paused: false,
};

const HERO_CAMERA = new THREE.Vector3(63, 43, 67);
const HERO_TARGET = new THREE.Vector3(0, 12, 0);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else {
      material?.dispose?.();
    }
  });
}

function formatTonnage(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: value < 100 ? 1 : 0,
  }).format(value);
}

export function DemolitionPlayground() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<PlaygroundApi | null>(null);
  const toolRef = useRef<ToolMode>("ball");
  const slowToggleRef = useRef(false);
  const slowHoldRef = useRef(false);
  const rewindHoldRef = useRef(false);
  const actionCameraRef = useRef(false);
  const [tool, setTool] = useState<ToolMode>("ball");
  const [slowToggle, setSlowToggle] = useState(false);
  const [actionCamera, setActionCamera] = useState(false);
  const [quality, setQuality] = useState<QualityMode>("cinematic");
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);

  const chooseTool = useCallback((next: ToolMode) => {
    toolRef.current = next;
    setTool(next);
  }, []);

  const toggleSlow = useCallback(() => {
    setSlowToggle((current) => {
      slowToggleRef.current = !current;
      return !current;
    });
  }, []);

  const toggleActionCamera = useCallback(() => {
    setActionCamera((current) => {
      actionCameraRef.current = !current;
      return !current;
    });
  }, []);

  const setControlFromPointer = useCallback(
    (control: string, active: boolean) => {
      apiRef.current?.setCraneControl(control, active);
    },
    [],
  );

  const holdButton = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      setter: MutableRefObject<boolean>,
      value: boolean,
    ) => {
      event.preventDefault();
      setter.current = value;
      if (value) event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;

    let disposed = false;
    let animationFrame = 0;
    let currentQuality: QualityMode = "cinematic";
    let lastFrame = performance.now();
    let lastHudUpdate = 0;
    let elapsed = 0;
    let timelineTime = 0;
    let activityStartTime = Number.NaN;
    let historyPaused = false;
    let autoRewind = false;
    let pendingKick = 0;
    let chargeCounter = 0;
    let craneYaw = -0.18;
    let cableLength = 22;
    let report: SimulationFrameReport = {
      cues: [],
      tonnage: 0,
      chainMultiplier: 1,
      detachedCount: 0,
      headline: "DISTRICT STANDING BY",
    };

    const activeControls = new Set<string>();
    const keys = new Set<string>();
    const charges: ChargePlacement[] = [];
    const chargeRecords: ChargeRecord[] = [];
    const chargeQueue: Array<{ record: ChargeRecord; at: number }> = [];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8fd1ef);
    scene.fog = new THREE.FogExp2(0xbfe1ec, 0.0064);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 340);
    camera.position.copy(HERO_CAMERA);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.target.copy(HERO_TARGET);
    controls.minDistance = 17;
    controls.maxDistance = 145;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.screenSpacePanning = true;
    controls.update();

    const hemi = new THREE.HemisphereLight(0xe9f8ff, 0x9a6949, 2.15);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0cc, 4.4);
    sun.position.set(-48, 78, 36);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 190;
    sun.shadow.bias = -0.00024;
    scene.add(sun);
    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff4c6, fog: false }),
    );
    sunDisc.position.set(-93, 118, -116);
    scene.add(sunDisc);

    const district = createDistrict();
    scene.add(district.root);
    const shadowCandidates: Array<{ mesh: THREE.Mesh; score: number }> = [];
    district.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.castShadow) return;
      if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
      const radius = object.geometry.boundingSphere?.radius ?? 0;
      const scale = object.getWorldScale(new THREE.Vector3());
      shadowCandidates.push({
        mesh: object,
        score: radius * Math.max(scale.x, scale.y, scale.z),
      });
    });
    shadowCandidates.sort((a, b) => b.score - a.score);
    shadowCandidates.forEach(({ mesh }, index) => {
      mesh.castShadow = index < 180;
    });
    const cableTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1, 7),
      new THREE.MeshStandardMaterial({
        color: 0x1a2024,
        roughness: 0.46,
        metalness: 0.62,
      }),
    );
    cableTube.name = "Visible wrecking cable sleeve";
    cableTube.frustumCulled = false;
    district.root.add(cableTube);
    const simulation = new DemolitionSimulation(district);
    const effects = new CinematicEffects(scene);
    const carStates: CollateralState[] = district.cars.map((object) => ({
      object,
      homePosition: object.position.clone(),
      homeQuaternion: object.quaternion.clone(),
      homeScale: object.scale.clone(),
    }));
    const treeStates: CollateralState[] = district.trees.map((object) => ({
      object,
      homePosition: object.position.clone(),
      homeQuaternion: object.quaternion.clone(),
      homeScale: object.scale.clone(),
    }));

    const anchor = new THREE.Vector3();
    const cableDirection = new THREE.Vector3();
    const cableUp = new THREE.Vector3(0, 1, 0);
    const ballPosition = new THREE.Vector3();
    const ballVelocity = new THREE.Vector3(0.8, 0, -0.25);
    district.boomTip.getWorldPosition(anchor);
    district.ball.getWorldPosition(ballPosition);
    if (ballPosition.distanceTo(anchor) < 5) {
      ballPosition.copy(anchor).add(new THREE.Vector3(2.8, -cableLength, 0.5));
    } else {
      cableLength = clamp(ballPosition.distanceTo(anchor), 12, 30);
    }

    const initialBallPosition = ballPosition.clone();
    const initialCableLength = cableLength;
    const pieceById = new Map(district.pieces.map((piece) => [piece.id, piece]));
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerDown = new THREE.Vector2();
    let pointerTravel = 0;
    const collateralObjectPosition = new THREE.Vector3();
    const collateralPiecePosition = new THREE.Vector3();
    const collateralDirection = new THREE.Vector3();
    const collateralRotation = new THREE.Quaternion();
    const collateralEuler = new THREE.Euler();

    const resize = () => {
      const rect = shell.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dprLimit =
        currentQuality === "cinematic"
          ? 2
          : currentQuality === "balanced"
            ? 1.45
            : 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprLimit));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(shell);
    resize();

    const resumeFromHistory = () => {
      if (!historyPaused) return;
      const historyBase = Math.max(0, timelineTime - simulation.historySeconds);
      timelineTime =
        historyBase + simulation.playheadNormalized * simulation.historySeconds;
      syncChargeStateAt(timelineTime, true);
      if (activityStartTime > timelineTime + 0.0001) {
        activityStartTime = Number.NaN;
      }
      simulation.resumeFromHistory();
      ballVelocity.set(0, 0, 0);
      historyPaused = false;
    };

    const clearCharges = () => {
      for (const record of chargeRecords) {
        district.root.remove(record.charge.object);
        disposeObject(record.charge.object);
      }
      charges.length = 0;
      chargeRecords.length = 0;
      chargeQueue.length = 0;
    };

    const syncChargeStateAt = (time: number, branch: boolean) => {
      chargeQueue.length = 0;
      if (branch) {
        for (let index = chargeRecords.length - 1; index >= 0; index -= 1) {
          const record = chargeRecords[index];
          if (record.placedAt > time + 0.0001) {
            district.root.remove(record.charge.object);
            disposeObject(record.charge.object);
            chargeRecords.splice(index, 1);
          } else if (record.firedAt !== null && record.firedAt > time + 0.0001) {
            record.firedAt = null;
          }
        }
      }
      charges.length = 0;
      for (const record of chargeRecords) {
        const visible =
          record.placedAt <= time + 0.0001 &&
          (record.firedAt === null || time < record.firedAt - 0.0001);
        record.charge.object.visible = visible;
        if (visible) charges.push(record.charge);
      }
    };

    const makeCharge = (position: THREE.Vector3, pieceId: number) => {
      if (charges.length >= 6) return;
      const marker = new THREE.Group();
      const pack = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.46, 0.18),
        new THREE.MeshStandardMaterial({
          color: 0xd82f24,
          roughness: 0.5,
          metalness: 0.08,
          emissive: 0x4d0703,
        }),
      );
      pack.castShadow = true;
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.28, 8),
        new THREE.MeshStandardMaterial({
          color: 0xf1d64a,
          emissive: 0x7d5d02,
          emissiveIntensity: 0.7,
        }),
      );
      cap.rotation.z = Math.PI / 2;
      cap.position.set(0, 0.33, 0);
      marker.add(pack, cap);
      marker.position.copy(position);
      marker.lookAt(camera.position.x, position.y, camera.position.z);
      marker.renderOrder = 5;
      district.root.add(marker);
      const charge: ChargePlacement = {
        id: chargeCounter++,
        pieceId,
        position: position.clone(),
        object: marker,
        armed: true,
      };
      charges.push(charge);
      chargeRecords.push({ charge, placedAt: timelineTime, firedAt: null });
    };

    const resolvePieceId = (object: THREE.Object3D) => {
      let cursor: THREE.Object3D | null = object;
      while (cursor) {
        if (typeof cursor.userData.pieceId === "number") {
          return cursor.userData.pieceId as number;
        }
        cursor = cursor.parent;
      }
      return -1;
    };

    const placeChargeFromPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(district.destructibleRoot, true);
      if (!hits.length) return;
      const hit = hits[0];
      let pieceId = resolvePieceId(hit.object);
      if (pieceId < 0) {
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const piece of district.pieces) {
          const distance = piece.object.position.distanceToSquared(hit.point);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            pieceId = piece.id;
          }
        }
      }
      const piece = pieceById.get(pieceId);
      if (!piece || piece.detached) return;
      makeCharge(hit.point.clone().addScaledVector(hit.face?.normal ?? new THREE.Vector3(0, 0, 1), 0.12), pieceId);
    };

    const onCanvasPointerDown = (event: PointerEvent) => {
      pointerDown.set(event.clientX, event.clientY);
      pointerTravel = 0;
    };
    const onCanvasPointerMove = (event: PointerEvent) => {
      pointerTravel = Math.max(
        pointerTravel,
        pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY)),
      );
    };
    const onCanvasPointerUp = (event: PointerEvent) => {
      if (toolRef.current === "charges" && pointerTravel < 6) {
        resumeFromHistory();
        placeChargeFromPointer(event);
      }
    };
    canvas.addEventListener("pointerdown", onCanvasPointerDown);
    canvas.addEventListener("pointermove", onCanvasPointerMove);
    canvas.addEventListener("pointerup", onCanvasPointerUp);

    const resetBall = () => {
      craneYaw = -0.18;
      district.cranePivot.rotation.y = craneYaw;
      cableLength = initialCableLength;
      ballPosition.copy(initialBallPosition);
      ballVelocity.set(0.8, 0, -0.25);
    };

    const resetCamera = () => {
      actionCameraRef.current = false;
      setActionCamera(false);
      camera.position.copy(HERO_CAMERA);
      controls.target.copy(HERO_TARGET);
      controls.enabled = true;
      controls.update();
    };

    const finishReset = () => {
      report = simulation.reset();
      effects.reset();
      clearCharges();
      resetBall();
      timelineTime = 0;
      activityStartTime = Number.NaN;
      historyPaused = false;
      autoRewind = false;
      setHud(INITIAL_HUD);
    };

    const fireCharges = () => {
      if (!charges.length || chargeQueue.length) return;
      resumeFromHistory();
      charges.forEach((charge, index) => {
        const record = chargeRecords.find((entry) => entry.charge === charge);
        if (record) chargeQueue.push({ record, at: timelineTime + index * 0.19 });
      });
    };

    apiRef.current = {
      fireCharges,
      resetCity: () => {
        clearCharges();
        if (!simulation.hasActivity) {
          finishReset();
          return;
        }
        autoRewind = true;
        historyPaused = false;
      },
      resetCamera,
      setTimeline: (value) => {
        const normalized = clamp(value, 0, 1);
        report = simulation.setPlaybackNormalized(normalized);
        district.ball.getWorldPosition(ballPosition);
        updateCable();
        historyPaused = normalized < 0.999;
        autoRewind = false;
        const historyBase = Math.max(0, timelineTime - simulation.historySeconds);
        const renderedTime =
          historyBase + normalized * simulation.historySeconds;
        syncChargeStateAt(renderedTime, false);
        effects.renderAt(
          renderedTime,
          1 / 60,
        );
        setHud((current) => ({
          ...current,
          tonnage: report.tonnage,
          multiplier: report.chainMultiplier,
          headline: report.headline,
          timeline: simulation.playheadNormalized,
          historySeconds: simulation.historySeconds,
          paused: historyPaused,
          rewinding: false,
        }));
      },
      setQuality: (nextQuality) => {
        currentQuality = nextQuality;
        effects.setQuality(nextQuality);
        renderer.shadowMap.enabled = nextQuality !== "performance";
        district.root.traverse((object) => {
          if (object.userData.farDetail === true) {
            object.visible = nextQuality !== "performance";
          }
        });
        scene.fog = new THREE.FogExp2(
          0xbfe1ec,
          nextQuality === "performance" ? 0.0085 : 0.0064,
        );
        resize();
      },
      kickBall: (direction = 1) => {
        resumeFromHistory();
        pendingKick += direction;
      },
      setCraneControl: (control, active) => {
        if (active) {
          resumeFromHistory();
          activeControls.add(control);
        } else {
          activeControls.delete(control);
        }
      },
    };

    const onKeyDown = (event: KeyboardEvent) => {
      keys.add(event.code);
      if (["KeyA", "KeyD", "KeyW", "KeyS", "Space", "KeyT", "KeyR"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === "Space" && !event.repeat) {
        apiRef.current?.kickBall(event.shiftKey ? -1 : 1);
      }
      if (event.code === "KeyT") slowHoldRef.current = true;
      if (event.code === "KeyR") rewindHoldRef.current = true;
      if (event.code === "Digit1") chooseTool("ball");
      if (event.code === "Digit2") chooseTool("charges");
      if (event.code === "KeyF" && !event.repeat) fireCharges();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.code);
      if (event.code === "KeyT") slowHoldRef.current = false;
      if (event.code === "KeyR") rewindHoldRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const setBallObjectPosition = () => {
      const parent = district.ball.parent;
      if (parent) {
        const local = parent.worldToLocal(ballPosition.clone());
        district.ball.position.copy(local);
      } else {
        district.ball.position.copy(ballPosition);
      }
      district.ball.updateMatrixWorld();
    };

    const updateCable = () => {
      district.boomTip.getWorldPosition(anchor);
      const geometry = district.cable.geometry as THREE.BufferGeometry;
      let attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
      if (!attribute || attribute.count < 2) {
        geometry.setFromPoints([anchor, ballPosition]);
        attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
      }
      attribute.setXYZ(0, anchor.x, anchor.y, anchor.z);
      attribute.setXYZ(1, ballPosition.x, ballPosition.y, ballPosition.z);
      attribute.needsUpdate = true;
      geometry.computeBoundingSphere();

      cableDirection.subVectors(ballPosition, anchor);
      const cableDistance = Math.max(0.001, cableDirection.length());
      cableTube.position.copy(anchor).add(ballPosition).multiplyScalar(0.5);
      cableTube.quaternion.setFromUnitVectors(
        cableUp,
        cableDirection.multiplyScalar(1 / cableDistance),
      );
      cableTube.scale.set(1, cableDistance, 1);
      cableTube.updateMatrixWorld();
    };

    const updateCraneAndBall = (delta: number) => {
      const turn =
        (keys.has("KeyD") || activeControls.has("right") ? 1 : 0) -
        (keys.has("KeyA") || activeControls.has("left") ? 1 : 0);
      const hoist =
        (keys.has("KeyS") || activeControls.has("down") ? 1 : 0) -
        (keys.has("KeyW") || activeControls.has("up") ? 1 : 0);
      craneYaw += turn * delta * 0.68;
      cableLength = clamp(cableLength + hoist * delta * 7.2, 11, 30);
      district.cranePivot.rotation.y = craneYaw;
      district.cranePivot.updateMatrixWorld(true);
      district.boomTip.getWorldPosition(anchor);

      if (pendingKick) {
        const tangent = new THREE.Vector3(
          Math.cos(craneYaw),
          0.12,
          -Math.sin(craneYaw),
        ).normalize();
        ballVelocity.addScaledVector(tangent, 8.4 * clamp(pendingKick, -1, 1));
        pendingKick = 0;
      }
      ballVelocity.y -= 18.5 * delta;
      ballVelocity.multiplyScalar(Math.pow(0.993, delta * 60));
      ballPosition.addScaledVector(ballVelocity, delta);

      const offset = ballPosition.clone().sub(anchor);
      const distance = Math.max(0.001, offset.length());
      const normal = offset.multiplyScalar(1 / distance);
      ballPosition.copy(anchor).addScaledVector(normal, cableLength);
      const radialSpeed = ballVelocity.dot(normal);
      ballVelocity.addScaledVector(normal, -radialSpeed);
      if (turn) {
        ballVelocity.x += Math.cos(craneYaw) * turn * delta * 8;
        ballVelocity.z -= Math.sin(craneYaw) * turn * delta * 8;
      }
      setBallObjectPosition();
      updateCable();

      const ballMaterial = district.ball.material;
      if (ballMaterial instanceof THREE.MeshStandardMaterial) {
        ballMaterial.emissiveIntensity = 0.18 + Math.sin(elapsed * 3.4) * 0.12;
      }
    };

    const processChargeQueue = () => {
      while (chargeQueue.length && chargeQueue[0].at <= timelineTime) {
        const { record } = chargeQueue.shift()!;
        const { charge } = record;
        const piece = pieceById.get(charge.pieceId);
        const blastPosition = charge.position.clone();
        simulation.applyBlast(blastPosition, 175);
        effects.push(
          [
            {
              type: "impact",
              position: blastPosition,
              energy: 180,
              material: piece?.material ?? ("concrete" as MaterialKind),
              buildingId: piece?.buildingId,
            },
            {
              type: "dust",
              position: blastPosition,
              energy: 150,
              material: piece?.material ?? ("concrete" as MaterialKind),
              buildingId: piece?.buildingId,
            },
          ],
          timelineTime,
        );
        record.firedAt = timelineTime;
        charge.object.visible = false;
        const index = charges.indexOf(charge);
        if (index >= 0) charges.splice(index, 1);
      }
    };

    const animateScenery = (sceneTimelineTime: number) => {
      const activity = simulation.hasActivity;
      const flightTime = Number.isFinite(activityStartTime)
        ? clamp(sceneTimelineTime - activityStartTime, 0, 8)
        : 0;
      district.warningLights.forEach((light, index) => {
        light.intensity = 1.8 + Math.max(0, Math.sin(elapsed * 5.8 + index * 0.9)) * 7;
      });
      district.pigeons.forEach((actor, index) => {
        if (activity) {
          actor.object.position.set(
            actor.homePosition.x + flightTime * Math.sin(actor.phase) * 5,
            actor.homePosition.y + flightTime * (7.5 + (index % 3)),
            actor.homePosition.z + flightTime * Math.cos(actor.phase) * 5,
          );
          actor.object.rotation.z = Math.sin(sceneTimelineTime * 17 + actor.phase) * 0.35;
        } else {
          actor.object.position.copy(actor.homePosition);
          actor.object.position.y += Math.sin(elapsed * 2 + actor.phase) * 0.05;
          actor.object.rotation.z = 0;
        }
      });
      district.spectators.forEach((actor, index) => {
        const cheer = report.chainMultiplier > 1.4 || report.detachedCount > 8;
        const duck = activity && report.detachedCount < 4;
        actor.object.position.y =
          actor.homePosition.y +
          (cheer ? Math.max(0, Math.sin(sceneTimelineTime * 7 + actor.phase)) * 0.32 : duck ? -0.18 : 0);
        actor.object.rotation.z = cheer
          ? Math.sin(sceneTimelineTime * 8 + index) * 0.06
          : 0;
      });
    };

    const updateCollateral = () => {
      district.root.updateMatrixWorld(true);
      for (const state of carStates) {
        state.object.position.copy(state.homePosition);
        state.object.quaternion.copy(state.homeQuaternion);
        state.object.scale.copy(state.homeScale);
      }
      for (const state of treeStates) {
        state.object.position.copy(state.homePosition);
        state.object.quaternion.copy(state.homeQuaternion);
        state.object.scale.copy(state.homeScale);
      }
      district.root.updateMatrixWorld(true);

      for (const state of carStates) {
        state.object.getWorldPosition(collateralObjectPosition);
        for (const piece of district.pieces) {
          if (!piece.detached || piece.mass < 14) continue;
          piece.object.getWorldPosition(collateralPiecePosition);
          const horizontalReach =
            Math.min(4.8, Math.max(piece.size.x, piece.size.z) * 0.42) + 1.4;
          const dx = collateralObjectPosition.x - collateralPiecePosition.x;
          const dz = collateralObjectPosition.z - collateralPiecePosition.z;
          const verticalReach = Math.min(5, piece.size.y * 0.5 + 1.5);
          if (
            dx * dx + dz * dz > horizontalReach * horizontalReach ||
            Math.abs(collateralObjectPosition.y - collateralPiecePosition.y) > verticalReach
          ) {
            continue;
          }
          state.object.scale.set(
            state.homeScale.x * 1.08,
            state.homeScale.y * 0.22,
            state.homeScale.z * 1.12,
          );
          state.object.position.y = state.homePosition.y - 0.36;
          collateralEuler.set(0, 0, dx >= 0 ? -0.08 : 0.08);
          collateralRotation.setFromEuler(collateralEuler);
          state.object.quaternion.copy(state.homeQuaternion).multiply(collateralRotation);
          break;
        }
      }

      for (const state of treeStates) {
        state.object.getWorldPosition(collateralObjectPosition);
        for (const piece of district.pieces) {
          if (!piece.detached || piece.mass < 14) continue;
          piece.object.getWorldPosition(collateralPiecePosition);
          const dx = collateralObjectPosition.x - collateralPiecePosition.x;
          const dz = collateralObjectPosition.z - collateralPiecePosition.z;
          const horizontalReach =
            Math.min(4.4, Math.max(piece.size.x, piece.size.z) * 0.35) + 1.1;
          if (
            dx * dx + dz * dz > horizontalReach * horizontalReach ||
            Math.abs(collateralObjectPosition.y - collateralPiecePosition.y) >
              Math.min(6, piece.size.y * 0.5 + 2.5)
          ) {
            continue;
          }
          collateralDirection.set(dx, 0, dz);
          if (collateralDirection.lengthSq() < 0.001) collateralDirection.set(1, 0, 0);
          collateralDirection.normalize();
          collateralEuler.set(
            collateralDirection.z * 1.12,
            0,
            -collateralDirection.x * 1.12,
          );
          collateralRotation.setFromEuler(collateralEuler);
          state.object.quaternion.copy(state.homeQuaternion).multiply(collateralRotation);
          state.object.scale.set(
            state.homeScale.x,
            state.homeScale.y * 0.86,
            state.homeScale.z,
          );
          break;
        }
      }
    };

    const updateActionCamera = (delta: number) => {
      if (!actionCameraRef.current) {
        controls.enabled = true;
        controls.update();
        return;
      }
      controls.enabled = false;
      const active = district.pieces.filter(
        (piece) => piece.detached && !piece.sleeping && piece.object.position.y > 0.5,
      );
      const focus = new THREE.Vector3();
      if (active.length) {
        active.slice(0, 28).forEach((piece) => focus.add(piece.object.position));
        focus.multiplyScalar(1 / Math.min(28, active.length));
      } else {
        focus.copy(HERO_TARGET);
      }
      focus.y = Math.max(3.5, focus.y);
      const radius = active.length ? 25 : 48;
      const desired = focus
        .clone()
        .add(
          new THREE.Vector3(
            Math.cos(elapsed * 0.11) * radius,
            14 + radius * 0.35,
            Math.sin(elapsed * 0.11) * radius,
          ),
        );
      camera.position.lerp(desired, 1 - Math.pow(0.018, delta));
      controls.target.lerp(focus, 1 - Math.pow(0.01, delta));
      camera.lookAt(controls.target);
    };

    const animate = (now: number) => {
      if (disposed) return;
      animationFrame = requestAnimationFrame(animate);
      const realDelta = clamp((now - lastFrame) / 1000, 0, 0.05);
      lastFrame = now;
      elapsed += realDelta;
      const slow = slowToggleRef.current || slowHoldRef.current;
      const rewinding = rewindHoldRef.current || autoRewind;
      const simDelta = realDelta * (slow ? 0.1 : 1);
      let renderedTimelineTime = timelineTime;

      if (rewinding && simulation.hasActivity) {
        report = simulation.stepRewind(realDelta * (autoRewind ? 4.2 : 2.4));
        district.ball.getWorldPosition(ballPosition);
        updateCable();
        historyPaused = simulation.playheadNormalized < 0.999;
        const historyBase = Math.max(0, timelineTime - simulation.historySeconds);
        renderedTimelineTime =
          historyBase + simulation.playheadNormalized * simulation.historySeconds;
        syncChargeStateAt(renderedTimelineTime, false);
        effects.renderAt(renderedTimelineTime, realDelta);
        if (autoRewind && simulation.playheadNormalized <= 0.001) finishReset();
      } else if (!historyPaused) {
        updateCraneAndBall(simDelta);
        timelineTime += simDelta;
        processChargeQueue();
        report = simulation.update(simDelta, ballPosition, ballVelocity);
        if (simulation.hasActivity && !Number.isFinite(activityStartTime)) {
          activityStartTime = timelineTime;
        }
        if (report.cues.length) effects.push(report.cues, timelineTime);
        effects.renderAt(timelineTime, realDelta);
      } else {
        district.ball.getWorldPosition(ballPosition);
        updateCable();
        const historyBase = Math.max(0, timelineTime - simulation.historySeconds);
        renderedTimelineTime =
          historyBase + simulation.playheadNormalized * simulation.historySeconds;
        syncChargeStateAt(renderedTimelineTime, false);
        effects.renderAt(renderedTimelineTime, realDelta);
      }

      updateCollateral();
      animateScenery(renderedTimelineTime);
      updateActionCamera(realDelta);
      renderer.render(scene, camera);

      if (now - lastHudUpdate > 90) {
        lastHudUpdate = now;
        setHud({
          tonnage: report.tonnage,
          multiplier: report.chainMultiplier,
          headline: report.headline,
          timeline: simulation.playheadNormalized,
          historySeconds: simulation.historySeconds,
          charges: charges.length,
          rewinding,
          paused: historyPaused,
        });
      }
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      apiRef.current = null;
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onCanvasPointerDown);
      canvas.removeEventListener("pointermove", onCanvasPointerMove);
      canvas.removeEventListener("pointerup", onCanvasPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      controls.dispose();
      effects.dispose();
      disposeObject(district.root);
      renderer.dispose();
    };
  }, [chooseTool]);

  return (
    <main ref={shellRef} className={`playground tool-${tool}`}>
      <canvas ref={canvasRef} className="city-canvas" aria-label="Interactive demolition district" />

      <div className="sun-wash" aria-hidden="true" />
      {tool === "charges" && <div className="charge-reticle" aria-hidden="true"><span /></div>}

      <header className="top-rail">
        <div className="site-status glass-panel">
          <span className="status-light" />
          <span className="eyebrow">SITE 08 · EVACUATED</span>
          <strong>Morning shift</strong>
        </div>

        <div className="score-card glass-panel" aria-live="polite">
          <div>
            <span className="eyebrow">TONNAGE DROPPED</span>
            <strong>{formatTonnage(hud.tonnage)}<small> t</small></strong>
          </div>
          <div className={`multiplier ${hud.multiplier > 1.2 ? "hot" : ""}`}>
            <span className="eyebrow">CHAIN</span>
            <strong>×{hud.multiplier.toFixed(1)}</strong>
          </div>
        </div>

        <div className="headline-chip" aria-live="polite">
          <span>{hud.rewinding ? "RECONSTRUCTION IN PROGRESS" : hud.paused ? "MOMENT HELD" : hud.headline}</span>
        </div>
      </header>

      <aside className="camera-stack glass-panel" aria-label="View controls">
        <button
          className={actionCamera ? "active" : ""}
          onClick={toggleActionCamera}
          aria-pressed={actionCamera}
          title="Toggle action camera"
        >
          <span className="button-icon">◉</span>
          <span>ACTION</span>
        </button>
        <button onClick={() => apiRef.current?.resetCamera()} title="Return to hero view">
          <span className="button-icon">⌂</span>
          <span>VIEW</span>
        </button>
        <label className="quality-control" title="Visual quality">
          <span className="sr-only">Visual quality</span>
          <select
            value={quality}
            onChange={(event) => {
              const next = event.target.value as QualityMode;
              setQuality(next);
              apiRef.current?.setQuality(next);
            }}
          >
            <option value="cinematic">FILMIC</option>
            <option value="balanced">BALANCED</option>
            <option value="performance">PERF</option>
          </select>
        </label>
      </aside>

      <section className="crane-controls glass-panel" aria-label="Crane controls">
        <span className="control-label">CRANE</span>
        <div className="control-grid">
          <button
            aria-label="Hoist cable"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setControlFromPointer("up", true);
            }}
            onPointerUp={() => setControlFromPointer("up", false)}
            onPointerCancel={() => setControlFromPointer("up", false)}
          >↑</button>
          <button
            aria-label="Rotate crane left"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setControlFromPointer("left", true);
            }}
            onPointerUp={() => setControlFromPointer("left", false)}
            onPointerCancel={() => setControlFromPointer("left", false)}
          >←</button>
          <button
            className="swing-button"
            aria-label="Kick wrecking ball swing"
            onClick={() => apiRef.current?.kickBall(1)}
          >SWING</button>
          <button
            aria-label="Rotate crane right"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setControlFromPointer("right", true);
            }}
            onPointerUp={() => setControlFromPointer("right", false)}
            onPointerCancel={() => setControlFromPointer("right", false)}
          >→</button>
          <button
            aria-label="Lower cable"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setControlFromPointer("down", true);
            }}
            onPointerUp={() => setControlFromPointer("down", false)}
            onPointerCancel={() => setControlFromPointer("down", false)}
          >↓</button>
        </div>
        <span className="key-hint">A D · W S · SPACE</span>
      </section>

      <section className="control-dock glass-panel" aria-label="Demolition controls">
        <div className="tool-switch" role="group" aria-label="Demolition tool">
          <button
            className={tool === "ball" ? "selected" : ""}
            onClick={() => chooseTool("ball")}
            aria-pressed={tool === "ball"}
          >
            <span className="wrecking-glyph" aria-hidden="true">●</span>
            BALL
            <kbd>1</kbd>
          </button>
          <button
            className={tool === "charges" ? "selected" : ""}
            onClick={() => chooseTool("charges")}
            aria-pressed={tool === "charges"}
          >
            <span className="charge-glyph" aria-hidden="true">▥</span>
            CHARGES <b>{hud.charges}/6</b>
            <kbd>2</kbd>
          </button>
        </div>

        {tool === "charges" && (
          <button
            className="plunger-button"
            onClick={() => apiRef.current?.fireCharges()}
            disabled={!hud.charges}
            title="Fire placed charges in sequence"
          >
            <span className="plunger-cap" />
            <span>FIRE</span>
            <kbd>F</kbd>
          </button>
        )}

        <button
          className={`slow-button ${slowToggle ? "active" : ""}`}
          onClick={toggleSlow}
          aria-pressed={slowToggle}
          title="Toggle 10% time; hold T for temporary slow motion"
        >
          <span>⅒</span>
          SLOW
          <kbd>T</kbd>
        </button>

        <div className="timeline-control">
          <div className="timeline-meta">
            <span>THE LAST {Math.max(1, Math.round(hud.historySeconds))} SEC</span>
            <span>{Math.round(hud.timeline * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            value={Math.round(hud.timeline * 1000)}
            onChange={(event) => apiRef.current?.setTimeline(Number(event.target.value) / 1000)}
            aria-label="Destruction timeline"
            style={{ "--timeline": `${hud.timeline * 100}%` } as CSSProperties}
          />
        </div>

        <button
          className={`rewind-button ${hud.rewinding ? "active" : ""}`}
          onPointerDown={(event) => holdButton(event, rewindHoldRef, true)}
          onPointerUp={(event) => holdButton(event, rewindHoldRef, false)}
          onPointerCancel={(event) => holdButton(event, rewindHoldRef, false)}
          title="Hold to rewind"
        >
          <span>◀◀</span>
          HOLD REWIND
          <kbd>R</kbd>
        </button>

        <button
          className="restore-button"
          onClick={() => apiRef.current?.resetCity()}
          title="Rebuild the entire district"
        >
          <span>↺</span>
          RESTORE CITY
        </button>
      </section>

      <div className="micro-instruction">
        <span>{tool === "charges" ? "CLICK STRUCTURE TO PLACE" : "DRAG TO ORBIT · SCROLL TO FLY"}</span>
        <i />
        <span>EVERYONE IS CLEAR</span>
      </div>
    </main>
  );
}
