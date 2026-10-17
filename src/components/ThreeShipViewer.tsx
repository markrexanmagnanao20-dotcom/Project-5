/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ShipId } from '../types/game';
import { createShipMeshById } from '../game/three/shipModels';
import { RotateCw, Sparkles, Eye, Shield } from 'lucide-react';

interface ThreeShipViewerProps {
  shipId: ShipId;
  trailColor?: string;
  interactive?: boolean;
  className?: string;
}

export const ThreeShipViewer: React.FC<ThreeShipViewerProps> = ({
  shipId,
  trailColor,
  interactive = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRotatingAuto, setIsRotatingAuto] = useState<boolean>(true);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);

  // References to keep loop stable across renders
  const shipIdRef = useRef<ShipId>(shipId);
  shipIdRef.current = shipId;

  const trailColorRef = useRef<string | undefined>(trailColor);
  trailColorRef.current = trailColor;

  const wireframeRef = useRef<boolean>(wireframeMode);
  wireframeRef.current = wireframeMode;

  const isAutoRef = useRef<boolean>(isRotatingAuto);
  isAutoRef.current = isRotatingAuto;

  const currentShipGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let isDisposed = false;
    let animFrameId: number;

    // 1. Setup Three.js WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Setup Scene & Atmospheric Cosmic Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.035);

    // 3. Studio PBR Environment Reflection via PMREMGenerator & RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // 4. Studio PBR Lighting Rig
    // Cool ambient hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x020617, 0.9);
    scene.add(hemiLight);

    // Warm key directional light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 2.4);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Dynamic colored rim backlight
    const rimLight = new THREE.PointLight(0x00f0ff, 2.0, 15);
    rimLight.position.set(-4, -1, -4);
    scene.add(rimLight);

    // 5. 3D Starfield Backdrop (1,000 Depth-Aware Stars)
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      starPos[idx] = (Math.random() - 0.5) * 80;
      starPos[idx + 1] = (Math.random() - 0.5) * 60;
      starPos[idx + 2] = -15 - Math.random() * 50;

      const c = Math.random();
      if (c < 0.6) {
        starColors[idx] = 1.0;
        starColors[idx + 1] = 1.0;
        starColors[idx + 2] = 1.0;
      } else if (c < 0.85) {
        starColors[idx] = 0.22;
        starColors[idx + 1] = 0.74;
        starColors[idx + 2] = 0.97;
      } else {
        starColors[idx] = 0.98;
        starColors[idx + 1] = 0.75;
        starColors[idx + 2] = 0.14;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 6. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(0, 2.2, 5.8);
    camera.lookAt(0, 0.2, 0);

    // 7. Ship Model Anchor
    const shipRoot = new THREE.Group();
    scene.add(shipRoot);

    // Load active ship mesh
    let loadedId = shipIdRef.current;
    let shipMesh = createShipMeshById(loadedId, trailColorRef.current);
    shipRoot.add(shipMesh);
    currentShipGroupRef.current = shipMesh;

    // Update rim light color to match current ship
    if (loadedId === 'valkyrie') rimLight.color.setHex(0x00f0ff);
    else if (loadedId === 'chronos') rimLight.color.setHex(0xc084fc);
    else if (loadedId === 'titan') rimLight.color.setHex(0xf59e0b);

    // 8. Interactive Mouse / Orbit Tracking
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotY = 0.35;
    let targetRotX = 0.15;
    let currentRotY = 0.35;
    let currentRotX = 0.15;
    let targetZoom = 5.8;
    let currentZoom = 5.8;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetRotY += deltaX * 0.008;
        targetRotX = Math.max(-0.6, Math.min(0.8, targetRotX + deltaY * 0.006));
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      targetZoom = Math.max(3.2, Math.min(9.0, targetZoom + e.deltaY * 0.004));
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Handle Window Resize
    const onResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', onResize);

    // 9. Damped 60FPS Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      if (isDisposed) return;

      const dt = Math.min(0.05, Math.max(0.001, (time - lastTime) / 1000));
      lastTime = time;

      // Check if ship changed dynamically in parent
      if (loadedId !== shipIdRef.current) {
        loadedId = shipIdRef.current;
        shipRoot.clear();
        shipMesh = createShipMeshById(loadedId, trailColorRef.current);
        shipRoot.add(shipMesh);
        currentShipGroupRef.current = shipMesh;

        // Reset camera tilt
        targetRotY = 0.35;
        targetRotX = 0.15;

        if (loadedId === 'valkyrie') rimLight.color.setHex(0x00f0ff);
        else if (loadedId === 'chronos') rimLight.color.setHex(0xc084fc);
        else if (loadedId === 'titan') rimLight.color.setHex(0xf59e0b);
      }

      // Toggle wireframe mode if requested
      if (currentShipGroupRef.current) {
        currentShipGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => (m.wireframe = wireframeRef.current));
            } else {
              child.material.wireframe = wireframeRef.current;
            }
          }
        });
      }

      // Auto turntable rotation when not dragging
      if (isAutoRef.current && !isDragging) {
        targetRotY += dt * 0.45;
      }

      // Sub-model animations
      // Chronos spinning torus ring and pulsar core
      const torusRing = shipMesh.getObjectByName('chronos_torus_ring');
      if (torusRing) {
        torusRing.rotation.z += dt * 1.8;
      }
      const quantumCore = shipMesh.getObjectByName('chronos_quantum_core');
      if (quantumCore) {
        quantumCore.rotation.x += dt * 1.2;
        quantumCore.rotation.y += dt * 1.5;
        const scale = 1.0 + Math.sin(time * 0.005) * 0.08;
        quantumCore.scale.set(scale, scale, scale);
      }

      // Gentle aerodynamic ship hover bob
      shipMesh.position.y = Math.sin(time * 0.002) * 0.08;

      // Exponential damping on camera and rotation
      const damp = 1 - Math.exp(-9 * dt);
      currentRotY += (targetRotY - currentRotY) * damp;
      currentRotX += (targetRotX - currentRotX) * damp;
      currentZoom += (targetZoom - currentZoom) * damp;

      shipRoot.rotation.y = currentRotY;
      shipRoot.rotation.x = currentRotX;

      camera.position.z = currentZoom;

      // Slow starfield drift
      starPoints.rotation.y += dt * 0.02;

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);

      // Clean disposal of Three.js resources
      renderer.dispose();
      envTexture.dispose();
      starGeo.dispose();
      starMat.dispose();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[280px] overflow-hidden rounded-2xl bg-radial from-slate-900/60 via-slate-950/80 to-slate-950 border border-slate-800/80 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab active:cursor-grabbing touch-none select-none"
      />

      {/* Floating 3D Viewport Controls Dock (<= 15% viewport footprint) */}
      {interactive && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono select-none">
          <button
            onClick={() => setIsRotatingAuto(!isRotatingAuto)}
            title="Toggle Auto-Rotation"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isRotatingAuto ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            title="Toggle Holographic Wireframe"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              wireframeMode ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Subtle interaction hint */}
      {interactive && (
        <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-mono text-slate-500 tracking-wider pointer-events-none">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>3D TACTICAL VIEW · DRAG TO ROTATE</span>
        </div>
      )}
    </div>
  );
};
