import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/** Creates a brilliant, crisp circular bead sprite texture for bright Braille dot rendering. */
function createBrailleDotTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.6, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.82, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(0.96, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Eyelid arch equations defining the classic, harmonious eye contour. */
const EYE_WIDTH = 2.75;

function getUpperLidY(x: number): number {
  const t = Math.max(-1, Math.min(1, x / EYE_WIDTH));
  const arch = Math.max(0, 1 - t * t);
  return 1.46 * Math.pow(arch, 0.58) * (1 - 0.05 * t);
}

function getLowerLidY(x: number): number {
  const t = Math.max(-1, Math.min(1, x / EYE_WIDTH));
  const arch = Math.max(0, 1 - t * t);
  return -1.18 * Math.pow(arch, 0.62) * (1 + 0.04 * t);
}

/** An interactive, premium 3D Particle Eye shaped from illuminated Braille-like dots. */
export default function BrailleParticleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef(new THREE.Vector2());
  const clickRipple = useRef({ time: -10, x: 0, y: 0 });
  const triggerBlinkRef = useRef<() => void>(() => {});
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFallback(true);
      return;
    }

    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.setAttribute("role", "presentation");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 0, 9.4);

    const dotTexture = createBrailleDotTexture();

    // High-contrast, radiant DotSync palette
    const colorPureWhite = new THREE.Color("#FFFFFF");
    const colorStarlight = new THREE.Color("#FFF9EE");
    const colorCream = new THREE.Color("#FFE5BA");
    const colorGold = new THREE.Color("#FBB931");
    const colorAmber = new THREE.Color("#F88F22");
    const colorOrange = new THREE.Color("#EA6113");
    const colorSclera = new THREE.Color("#E5D0B5");

    // Master hierarchy
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Dynamic Eyeball Group (Iris, Pupil, Cornea Catchlight)
    const eyeballGroup = new THREE.Group();
    masterGroup.add(eyeballGroup);

    // Eyelid & Socket Group (Contour lines, lashes, sclera backdrop)
    const eyelidGroup = new THREE.Group();
    masterGroup.add(eyelidGroup);

    // -----------------------------------------------------------
    // 1. IRIS & PUPIL STRUCTURE (~1,450 glowing dots)
    // -----------------------------------------------------------
    type IrisParticle = {
      r: number;
      theta: number;
      baseColor: THREE.Color;
      speed: number;
      phase: number;
      isCatchlight?: boolean;
    };
    const irisPoints: IrisParticle[] = [];

    // A. Outer Limbal Rings (2 dense perimeter rings at r = 1.22 and 1.28)
    const limbalRing1 = 140;
    for (let i = 0; i < limbalRing1; i++) {
      const theta = (i / limbalRing1) * Math.PI * 2;
      const r = 1.22 + (Math.random() - 0.5) * 0.04;
      irisPoints.push({
        r,
        theta,
        baseColor: Math.random() < 0.6 ? colorOrange : colorAmber,
        speed: 0.015,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const limbalRing2 = 160;
    for (let i = 0; i < limbalRing2; i++) {
      const theta = (i / limbalRing2) * Math.PI * 2;
      const r = 1.28 + (Math.random() - 0.5) * 0.05;
      irisPoints.push({
        r,
        theta,
        baseColor: Math.random() < 0.65 ? colorAmber : colorGold,
        speed: -0.012,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // B. Radial Stroma Fibers (76 radiating spokes with woven dots)
    const spokeCount = 76;
    const dotsPerSpoke = 12;
    for (let s = 0; s < spokeCount; s++) {
      const baseTheta = (s / spokeCount) * Math.PI * 2;
      for (let d = 0; d < dotsPerSpoke; d++) {
        const progress = d / (dotsPerSpoke - 1); // 0 (near pupil) to 1 (near limbus)
        const r = 0.44 + progress * 0.78 + (Math.random() - 0.5) * 0.03;
        // Elegant organic spiral twist
        const theta = baseTheta + Math.sin(progress * Math.PI * 2) * 0.1 + (Math.random() - 0.5) * 0.02;

        let baseColor: THREE.Color;
        if (progress > 0.72) {
          baseColor = Math.random() < 0.5 ? colorOrange : colorAmber;
        } else if (progress > 0.35) {
          baseColor = Math.random() < 0.6 ? colorGold : colorAmber;
        } else {
          baseColor = Math.random() < 0.7 ? colorCream : colorGold;
        }

        irisPoints.push({
          r,
          theta,
          baseColor,
          speed: (Math.random() - 0.5) * 0.025,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // C. Collarette (Wavy crest midway across the iris at r = 0.76)
    const collaretteCount = 130;
    for (let i = 0; i < collaretteCount; i++) {
      const theta = (i / collaretteCount) * Math.PI * 2;
      const r = 0.76 + Math.sin(theta * 14) * 0.05 + (Math.random() - 0.5) * 0.025;
      irisPoints.push({
        r,
        theta,
        baseColor: Math.random() < 0.8 ? colorStarlight : colorCream,
        speed: 0.018,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // D. Pupillary Margin Ring (Dense, radiant inner border around the dark pupil aperture)
    const pupilRingCount1 = 110;
    for (let i = 0; i < pupilRingCount1; i++) {
      const theta = (i / pupilRingCount1) * Math.PI * 2;
      const r = 0.44 + (Math.random() - 0.5) * 0.03;
      irisPoints.push({
        r,
        theta,
        baseColor: Math.random() < 0.85 ? colorPureWhite : colorCream,
        speed: -0.015,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const pupilRingCount2 = 90;
    for (let i = 0; i < pupilRingCount2; i++) {
      const theta = (i / pupilRingCount2) * Math.PI * 2;
      const r = 0.40 + (Math.random() - 0.5) * 0.025;
      irisPoints.push({
        r,
        theta,
        baseColor: Math.random() < 0.7 ? colorGold : colorAmber,
        speed: 0.02,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // E. Brilliant Specular Glint / Catchlight (White corneal reflection)
    const catchlightCount = 24;
    for (let i = 0; i < catchlightCount; i++) {
      const r = 0.52 + (Math.random() - 0.5) * 0.12;
      const theta = Math.PI * 0.32 + (Math.random() - 0.5) * 0.20;
      irisPoints.push({
        r,
        theta,
        baseColor: colorPureWhite,
        speed: 0,
        phase: 0,
        isCatchlight: true,
      });
    }

    const irisCount = irisPoints.length;
    const irisPositions = new Float32Array(irisCount * 3);
    const irisColors = new Float32Array(irisCount * 3);

    for (let i = 0; i < irisCount; i++) {
      const p = irisPoints[i];
      const x = Math.cos(p.theta) * p.r;
      const y = Math.sin(p.theta) * p.r;
      // Curvature of the corneal dome
      const z = Math.sqrt(Math.max(0, 1.8 - p.r * p.r * 0.6)) + (p.isCatchlight ? 0.08 : 0);
      irisPositions[i * 3] = x;
      irisPositions[i * 3 + 1] = y;
      irisPositions[i * 3 + 2] = z;

      irisColors[i * 3] = p.baseColor.r;
      irisColors[i * 3 + 1] = p.baseColor.g;
      irisColors[i * 3 + 2] = p.baseColor.b;
    }

    const irisGeometry = new THREE.BufferGeometry();
    irisGeometry.setAttribute("position", new THREE.BufferAttribute(irisPositions, 3));
    irisGeometry.setAttribute("color", new THREE.BufferAttribute(irisColors, 3));

    const irisMaterial = new THREE.PointsMaterial({
      size: 0.145,
      sizeAttenuation: true,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
    });

    const irisMesh = new THREE.Points(irisGeometry, irisMaterial);
    eyeballGroup.add(irisMesh);

    // -----------------------------------------------------------
    // 2. EYELID ALMOND CONTOUR & LASHES (~980 dots)
    // -----------------------------------------------------------
    type LidPoint = { x: number; y: number; z: number; color: THREE.Color; isUpper: boolean };
    const lidPoints: LidPoint[] = [];

    // Dense primary upper lash line (pearl strand effect)
    const upperLashCount = 180;
    for (let i = 0; i <= upperLashCount; i++) {
      const t = (i / upperLashCount) * 2 - 1;
      const x = t * (EYE_WIDTH * 0.99);
      const baseY = getUpperLidY(x);
      const arch = Math.max(0, 1 - t * t);
      const z = 0.44 * arch + 0.08;
      lidPoints.push({
        x,
        y: baseY,
        z,
        color: Math.random() < 0.6 ? colorPureWhite : colorCream,
        isUpper: true,
      });
    }

    // Secondary & Tertiary upper eyelid contours + crease
    const upperRows = [
      { yOffset: 0.08, zOffset: 0.38, color: colorGold, count: 110, density: 0.96 },
      { yOffset: 0.18, zOffset: 0.30, color: colorAmber, count: 95, density: 0.92 },
      { yOffset: 0.32, zOffset: 0.20, color: colorOrange, count: 80, density: 0.86 },
      { yOffset: 0.54, zOffset: 0.10, color: colorGold, count: 70, density: 0.80 }, // Eyebrow / crease line
    ];

    upperRows.forEach(({ yOffset, zOffset, color, count, density }) => {
      for (let i = 0; i <= count; i++) {
        const t = (i / count) * 2 - 1;
        const x = t * (EYE_WIDTH * density);
        const baseY = getUpperLidY(x);
        const y = baseY + yOffset * (1 - Math.abs(t) * 0.3);
        const arch = Math.max(0, 1 - t * t);
        const z = zOffset * arch + 0.08;
        lidPoints.push({ x, y, z, color, isUpper: true });
      }
    });

    // Delicate upper eyelashes (26 lashes protruding upward)
    const lashStems = 26;
    for (let l = 0; l < lashStems; l++) {
      const t = (l / (lashStems - 1)) * 1.6 - 0.8; // across central 80%
      const x = t * EYE_WIDTH;
      const baseY = getUpperLidY(x);
      const lashLength = 0.26 + Math.sin((t + 0.8) / 1.6 * Math.PI) * 0.16;
      const lashAngle = (t * 0.4) + Math.PI / 2; // fan outward

      for (let dot = 1; dot <= 3; dot++) {
        const dist = (dot / 3) * lashLength;
        lidPoints.push({
          x: x + Math.cos(lashAngle) * dist,
          y: baseY + Math.sin(lashAngle) * dist,
          z: 0.44 + dot * 0.04,
          color: dot === 1 ? colorCream : colorGold,
          isUpper: true,
        });
      }
    }

    // Dense primary lower lash line
    const lowerLashCount = 150;
    for (let i = 0; i <= lowerLashCount; i++) {
      const t = (i / lowerLashCount) * 2 - 1;
      const x = t * (EYE_WIDTH * 0.99);
      const baseY = getLowerLidY(x);
      const arch = Math.max(0, 1 - t * t);
      const z = 0.40 * arch + 0.08;
      lidPoints.push({
        x,
        y: baseY,
        z,
        color: Math.random() < 0.5 ? colorPureWhite : colorCream,
        isUpper: false,
      });
    }

    // Secondary & Tertiary lower eyelid contours
    const lowerRows = [
      { yOffset: -0.08, zOffset: 0.32, color: colorGold, count: 100, density: 0.95 },
      { yOffset: -0.18, zOffset: 0.22, color: colorAmber, count: 85, density: 0.90 },
      { yOffset: -0.32, zOffset: 0.12, color: colorOrange, count: 70, density: 0.82 },
    ];

    lowerRows.forEach(({ yOffset, zOffset, color, count, density }) => {
      for (let i = 0; i <= count; i++) {
        const t = (i / count) * 2 - 1;
        const x = t * (EYE_WIDTH * density);
        const baseY = getLowerLidY(x);
        const y = baseY + yOffset * (1 - Math.abs(t) * 0.3);
        const arch = Math.max(0, 1 - t * t);
        const z = zOffset * arch + 0.08;
        lidPoints.push({ x, y, z, color, isUpper: false });
      }
    });

    // Medial canthus (inner eye corner loop at left x ~ -EYE_WIDTH)
    for (let c = 0; c < 16; c++) {
      const angle = (c / 16) * Math.PI * 2;
      const x = -EYE_WIDTH - 0.08 + Math.cos(angle) * 0.14;
      const y = Math.sin(angle) * 0.12;
      lidPoints.push({ x, y, z: 0.16, color: colorAmber, isUpper: true });
    }

    const lidCount = lidPoints.length;
    const lidBasePositions = lidPoints.map((p) => ({ ...p }));
    const lidPositions = new Float32Array(lidCount * 3);
    const lidColors = new Float32Array(lidCount * 3);

    for (let i = 0; i < lidCount; i++) {
      const p = lidPoints[i];
      lidPositions[i * 3] = p.x;
      lidPositions[i * 3 + 1] = p.y;
      lidPositions[i * 3 + 2] = p.z;

      lidColors[i * 3] = p.color.r;
      lidColors[i * 3 + 1] = p.color.g;
      lidColors[i * 3 + 2] = p.color.b;
    }

    const lidGeometry = new THREE.BufferGeometry();
    lidGeometry.setAttribute("position", new THREE.BufferAttribute(lidPositions, 3));
    lidGeometry.setAttribute("color", new THREE.BufferAttribute(lidColors, 3));

    const lidMaterial = new THREE.PointsMaterial({
      size: 0.14,
      sizeAttenuation: true,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });

    const lidMesh = new THREE.Points(lidGeometry, lidMaterial);
    eyelidGroup.add(lidMesh);

    // -----------------------------------------------------------
    // 3. SCLERA (Eyeball white/interior constellation, ~380 dots)
    // -----------------------------------------------------------
    const scleraPoints: { x: number; y: number; z: number; color: THREE.Color }[] = [];
    const targetScleraCount = 380;
    while (scleraPoints.length < targetScleraCount) {
      const x = (Math.random() * 2 - 1) * EYE_WIDTH * 0.95;
      const upperY = getUpperLidY(x);
      const lowerY = getLowerLidY(x);
      const y = lowerY + Math.random() * (upperY - lowerY);
      const distFromCenter = Math.hypot(x, y);

      // Keep sclera dots mostly outside the central iris core
      if (distFromCenter > 0.98 || Math.random() < 0.2) {
        const sphereRadius = 3.6;
        const z = Math.sqrt(Math.max(0, sphereRadius * sphereRadius - x * x - y * y)) - (sphereRadius - 0.28);
        const color = Math.random() < 0.65 ? colorSclera : colorCream;
        scleraPoints.push({ x, y, z, color });
      }
    }

    const scleraCount = scleraPoints.length;
    const scleraBasePositions = scleraPoints.map((p) => ({ ...p }));
    const scleraPositions = new Float32Array(scleraCount * 3);
    const scleraColors = new Float32Array(scleraCount * 3);

    for (let i = 0; i < scleraCount; i++) {
      const p = scleraPoints[i];
      scleraPositions[i * 3] = p.x;
      scleraPositions[i * 3 + 1] = p.y;
      scleraPositions[i * 3 + 2] = p.z;

      scleraColors[i * 3] = p.color.r;
      scleraColors[i * 3 + 1] = p.color.g;
      scleraColors[i * 3 + 2] = p.color.b;
    }

    const scleraGeometry = new THREE.BufferGeometry();
    scleraGeometry.setAttribute("position", new THREE.BufferAttribute(scleraPositions, 3));
    scleraGeometry.setAttribute("color", new THREE.BufferAttribute(scleraColors, 3));

    const scleraMaterial = new THREE.PointsMaterial({
      size: 0.10,
      sizeAttenuation: true,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
    });

    const scleraMesh = new THREE.Points(scleraGeometry, scleraMaterial);
    eyelidGroup.add(scleraMesh);

    // -----------------------------------------------------------
    // 4. AMBIENT STARLIGHT DUST (~160 particles around the eye)
    // -----------------------------------------------------------
    const ambientCount = 160;
    const ambientPositions = new Float32Array(ambientCount * 3);
    const ambientColors = new Float32Array(ambientCount * 3);
    const ambientVelocities: { angle: number; radius: number; speed: number; yDrift: number }[] = [];

    for (let i = 0; i < ambientCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.4 + Math.random() * 2.0;
      ambientVelocities.push({
        angle,
        radius,
        speed: (0.012 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1),
        yDrift: (Math.random() - 0.5) * 0.3,
      });

      ambientPositions[i * 3] = Math.cos(angle) * radius;
      ambientPositions[i * 3 + 1] = Math.sin(angle) * (radius * 0.65);
      ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      const c = Math.random() < 0.6 ? colorGold : colorAmber;
      ambientColors[i * 3] = c.r;
      ambientColors[i * 3 + 1] = c.g;
      ambientColors[i * 3 + 2] = c.b;
    }

    const ambientGeometry = new THREE.BufferGeometry();
    ambientGeometry.setAttribute("position", new THREE.BufferAttribute(ambientPositions, 3));
    ambientGeometry.setAttribute("color", new THREE.BufferAttribute(ambientColors, 3));

    const ambientMaterial = new THREE.PointsMaterial({
      size: 0.09,
      sizeAttenuation: true,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });

    const ambientMesh = new THREE.Points(ambientGeometry, ambientMaterial);
    masterGroup.add(ambientMesh);

    // -----------------------------------------------------------
    // ANIMATION & INTERACTION STATE
    // -----------------------------------------------------------
    let animationFrame = 0;
    let visible = true;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastTime = 0;

    const currentGaze = new THREE.Vector2(0, 0);

    // Blinking cycle state
    let isBlinking = false;
    let blinkStartTime = 0;
    const BLINK_DURATION = 0.24; // 240ms fast, realistic blink
    let nextBlinkTime = 3.5 + Math.random() * 3.5;

    const triggerBlink = () => {
      if (!isBlinking) {
        isBlinking = true;
        blinkStartTime = performance.now() * 0.001;
      }
    };
    triggerBlinkRef.current = triggerBlink;

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      const aspect = width / height;
      camera.aspect = aspect;

      // Adjust camera distance dynamically for all screen sizes
      if (aspect < 0.9) {
        camera.position.z = 9.4 / (aspect * 1.05);
      } else if (aspect < 1.3) {
        camera.position.z = 9.4 + (1.3 - aspect) * 1.4;
      } else {
        camera.position.z = 9.4;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2));
      renderer.render(scene, camera);
    };

    const animate = (timestamp: number) => {
      animationFrame = 0;
      if (!visible) return;

      const time = timestamp * 0.001;
      const delta = lastTime ? Math.min((timestamp - lastTime) * 0.001, 0.04) : 0.016;
      lastTime = timestamp;

      if (!reducedMotion) {
        // --- 1. Blink Physics ---
        if (!isBlinking && time >= nextBlinkTime) {
          isBlinking = true;
          blinkStartTime = time;
        }

        let blinkProgress = 0;
        if (isBlinking) {
          const elapsed = time - blinkStartTime;
          if (elapsed < BLINK_DURATION) {
            const phase = elapsed / BLINK_DURATION;
            // Quick snap shut, tiny pause, smooth open
            if (phase < 0.42) {
              blinkProgress = Math.sin((phase / 0.42) * (Math.PI / 2));
            } else if (phase < 0.52) {
              blinkProgress = 1;
            } else {
              blinkProgress = Math.cos(((phase - 0.52) / 0.48) * (Math.PI / 2));
            }
          } else {
            isBlinking = false;
            blinkProgress = 0;
            nextBlinkTime = time + 3.2 + Math.random() * 4.0;
          }
        }

        // --- 2. Smooth Gaze Tracking (Natural anatomical bounds) ---
        // Iris translates gently while pitch/yaw rotates to look in direction of cursor
        const targetGazeX = THREE.MathUtils.clamp(pointer.current.x * 0.38, -0.36, 0.36);
        const targetGazeY = THREE.MathUtils.clamp(pointer.current.y * 0.26, -0.22, 0.22);

        currentGaze.x += (targetGazeX - currentGaze.x) * Math.min(delta * 5.2, 1);
        currentGaze.y += (targetGazeY - currentGaze.y) * Math.min(delta * 5.2, 1);

        // Position and rotate eyeball to gaze realistically
        eyeballGroup.position.x = currentGaze.x;
        eyeballGroup.position.y = currentGaze.y;
        eyeballGroup.position.z =
          Math.sqrt(Math.max(0, 1.4 - currentGaze.x * currentGaze.x * 0.5 - currentGaze.y * currentGaze.y * 0.8)) - 0.28;

        // Expressive 3D eye rotation (pitch and yaw)
        eyeballGroup.rotation.y = currentGaze.x * 0.65;
        eyeballGroup.rotation.x = -currentGaze.y * 0.55;

        // Subtle organic breathing dilation of pupil & iris
        const breath = Math.sin(time * 1.7) * 0.032;
        const blinkScaleY = Math.max(0.01, 1 - blinkProgress * 0.96);
        eyeballGroup.scale.set(1 + breath, (1 + breath) * blinkScaleY, 1 + breath);
        irisMaterial.opacity = 0.98 * (1 - blinkProgress * 0.92);

        // --- 3. Dynamic Eyelid Morphing (Blink Action) ---
        const lidPosAttr = lidGeometry.attributes.position as THREE.BufferAttribute;
        const seamY = -0.06; // natural eye closure line

        for (let i = 0; i < lidCount; i++) {
          const base = lidBasePositions[i];
          if (base.isUpper) {
            // Upper eyelid descends smoothly to seam
            const closedY = seamY + (base.y - getUpperLidY(base.x)) * 0.18;
            lidPosAttr.setY(i, base.y + (closedY - base.y) * blinkProgress);
            lidPosAttr.setZ(i, base.z + Math.sin(blinkProgress * Math.PI) * 0.18);
          } else {
            // Lower eyelid lifts slightly to meet upper eyelid
            const closedY = seamY + (base.y - getLowerLidY(base.x)) * 0.18;
            lidPosAttr.setY(i, base.y + (closedY - base.y) * blinkProgress);
            lidPosAttr.setZ(i, base.z + Math.sin(blinkProgress * Math.PI) * 0.1);
          }
        }
        lidPosAttr.needsUpdate = true;

        // Flatten sclera during blink so dots don't penetrate closed lids
        const scleraPosAttr = scleraGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < scleraCount; i++) {
          const base = scleraBasePositions[i];
          scleraPosAttr.setY(i, base.y * (1 - blinkProgress * 0.88));
        }
        scleraPosAttr.needsUpdate = true;
        scleraMaterial.opacity = 0.76 * (1 - blinkProgress * 0.85);

        // --- 4. Micro-twinkle in Iris dots ---
        const irisPosAttr = irisGeometry.attributes.position as THREE.BufferAttribute;
        const rippleElapsed = time - clickRipple.current.time;
        const hasActiveRipple = rippleElapsed >= 0 && rippleElapsed < 0.65;

        for (let i = 0; i < irisCount; i++) {
          const p = irisPoints[i];
          if (!p.isCatchlight) {
            const wobble = Math.sin(time * 2.2 + p.phase) * 0.008;
            const r = p.r + wobble;
            const theta = p.theta + p.speed * delta;
            p.theta = theta;

            let rippleLift = 0;
            if (hasActiveRipple) {
              const ringDist = Math.abs(r - rippleElapsed * 2.5);
              if (ringDist < 0.3) {
                rippleLift = Math.cos((ringDist / 0.3) * (Math.PI / 2)) * 0.12;
              }
            }

            const localX = Math.cos(theta) * r;
            const localY = Math.sin(theta) * r;
            const worldX = eyeballGroup.position.x + localX;
            const worldY = eyeballGroup.position.y + localY;
            const upperY = getUpperLidY(worldX);
            const lowerY = getLowerLidY(worldX);

            // Tucking dots that pass behind the eyelid rim
            let depthOffset = 0;
            if (worldY > upperY + 0.05 || worldY < lowerY - 0.05 || Math.abs(worldX) > EYE_WIDTH * 0.95) {
              depthOffset = -0.6; // push behind eyelid geometry
            }

            irisPosAttr.setX(i, localX);
            irisPosAttr.setY(i, localY);
            irisPosAttr.setZ(i, Math.sqrt(Math.max(0, 1.8 - r * r * 0.6)) + rippleLift + depthOffset);
          }
        }
        irisPosAttr.needsUpdate = true;

        // --- 5. Ambient Stardust Drift ---
        const ambPosAttr = ambientGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < ambientCount; i++) {
          const vel = ambientVelocities[i];
          vel.angle += vel.speed * delta;
          const x = Math.cos(vel.angle) * vel.radius + pointer.current.x * 0.12;
          const y = Math.sin(vel.angle) * (vel.radius * 0.65) + Math.sin(time * 0.5 + i) * 0.08 + pointer.current.y * 0.08;
          ambPosAttr.setX(i, x);
          ambPosAttr.setY(i, y);
        }
        ambPosAttr.needsUpdate = true;

        // Subtle master group tilt responding to cursor
        masterGroup.rotation.y = pointer.current.x * 0.06;
        masterGroup.rotation.x = -pointer.current.y * 0.05;
      }

      renderer.render(scene, camera);
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      if (visible && !reducedMotion && animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else start();
      renderer.render(scene, camera);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = container.getBoundingClientRect();
      pointer.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.current.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
    };

    const handlePointerLeave = () => {
      pointer.current.set(0, 0);
    };

    const handleClick = () => {
      triggerBlink();
      clickRipple.current = {
        time: performance.now() * 0.001,
        x: pointer.current.x,
        y: pointer.current.y,
      };
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    container.addEventListener("click", handleClick);
    motionPreference.addEventListener("change", handleMotionChange);

    resize();
    renderer.render(scene, camera);
    start();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("click", handleClick);
      motionPreference.removeEventListener("change", handleMotionChange);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      dotTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`particle-scene${fallback ? " particle-scene-fallback" : ""}`}
      role="img"
      aria-label="An interactive 3D eye formed from glowing Braille-like dots that follows your cursor and blinks naturally."
      title="Click to interact with the Dot Eye"
      style={{ cursor: "pointer" }}
    >
      {fallback && (
        <div className="fallback-particles fallback-eye" aria-hidden="true" />
      )}
    </div>
  );
}
