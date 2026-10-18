import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Particle = {
  angle: number;
  radius: number;
  depth: number;
  phase: number;
  speed: number;
  drift: number;
};

const DOT_COUNT = 980;

/** A restrained, responsive Three.js particle field with an open center. */
export default function BrailleParticleScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef(new THREE.Vector2());
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setFallback(true);
      return;
    }

    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.setAttribute("role", "presentation");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
    camera.position.set(0, 0, 10.7);

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffe3b3, 1.45));
    const keyLight = new THREE.PointLight(0xf88f22, 24, 14);
    keyLight.position.set(-2.6, 2.8, 4.2);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xfbb931, 12, 12);
    fillLight.position.set(3, -2, 2.5);
    scene.add(fillLight);

    const particles: Particle[] = [];
    const positions = new Float32Array(DOT_COUNT * 3);
    const colors = new Float32Array(DOT_COUNT * 3);
    const orange = new THREE.Color("#EA6113");
    const amber = new THREE.Color("#F88F22");
    const gold = new THREE.Color("#FBB931");
    const cream = new THREE.Color("#FFE3B3");

    for (let index = 0; index < DOT_COUNT; index += 1) {
      const isHalo = Math.random() < 0.8;
      const particle: Particle = {
        angle: Math.random() * Math.PI * 2,
        radius: isHalo ? 2.02 + Math.random() * 0.44 : 2.45 + Math.random() * 1.05,
        depth: (Math.random() - 0.5) * (isHalo ? 0.62 : 1.1),
        phase: Math.random() * Math.PI * 2,
        speed: (0.022 + Math.random() * 0.035) * (Math.random() > 0.5 ? 1 : -1),
        drift: 0.035 + Math.random() * (isHalo ? 0.06 : 0.2),
      };
      particles.push(particle);
      positions[index * 3] = Math.cos(particle.angle) * particle.radius;
      positions[index * 3 + 1] = Math.sin(particle.angle) * particle.radius * 0.78;
      positions[index * 3 + 2] = particle.depth;
      const warmColor = Math.random() < 0.62 ? cream : Math.random() < 0.57 ? gold : Math.random() < 0.65 ? amber : orange;
      colors[index * 3] = warmColor.r;
      colors[index * 3 + 1] = warmColor.g;
      colors[index * 3 + 2] = warmColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.085,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
    });
    const field = new THREE.Points(geometry, particleMaterial);
    group.add(field);

    let animationFrame = 0;
    let visible = true;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastTime = 0;
    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.position.z = width / height > 1.3 ? 10.7 + (width / height - 1.3) * 1.15 : 10.7;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5));
      renderer.render(scene, camera);
    };

    const animate = (timestamp: number) => {
      animationFrame = 0;
      if (!visible) return;
      const time = timestamp * 0.001;
      const delta = lastTime ? Math.min((timestamp - lastTime) * 0.001, 0.04) : 0.016;
      lastTime = timestamp;

      if (!reducedMotion) {
        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index];
          const angle = particle.angle + time * particle.speed + pointer.current.x * 0.035;
          const normalizedX = Math.cos(angle) * particle.radius / 3.5;
          const normalizedY = Math.sin(angle) * particle.radius * 0.78 / 3.5;
          const pointerDistance = Math.hypot(normalizedX - pointer.current.x, normalizedY + pointer.current.y);
          const hoverLift = Math.exp(-pointerDistance * pointerDistance * 13) * 0.2;
          const radius = particle.radius + Math.sin(time * 0.72 + particle.phase) * particle.drift + hoverLift;
          const wave = Math.sin(time * 0.55 + particle.phase) * 0.12;
          positions[index * 3] = Math.cos(angle) * radius;
          positions[index * 3 + 1] = Math.sin(angle) * radius * 0.78 + wave + pointer.current.y * 0.09;
          positions[index * 3 + 2] = particle.depth + Math.cos(time * 0.8 + particle.phase) * 0.12 + hoverLift * 0.65;
        }
        geometry.attributes.position.needsUpdate = true;
        group.rotation.y += (pointer.current.x * 0.12 - group.rotation.y) * Math.min(delta * 1.4, 1);
        group.rotation.x += (-pointer.current.y * 0.08 - group.rotation.x) * Math.min(delta * 1.4, 1);
        group.rotation.z = Math.sin(time * 0.16) * 0.028;
        keyLight.intensity = 22 + Math.sin(time * 0.6) * 2;
      }

      renderer.render(scene, camera);
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      if (visible && !reducedMotion && animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }, { threshold: 0.05 });
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
    const handlePointerLeave = () => pointer.current.set(0, 0);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
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
      motionPreference.removeEventListener("change", handleMotionChange);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`particle-scene${fallback ? " particle-scene-fallback" : ""}`}
      role="img"
      aria-label="A slowly turning, open ring of sunset-colored particles."
    >
      {fallback && <div className="fallback-particles" aria-hidden="true" />}
    </div>
  );
}
