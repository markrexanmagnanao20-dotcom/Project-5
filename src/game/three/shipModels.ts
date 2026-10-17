/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ShipId } from '../../types/game';

// Helper to create procedural contact shadow texture
function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const shadowTexture = typeof document !== 'undefined' ? createRadialShadowTexture() : null;

/**
 * Procedural Composite 3D Models for Combat Vessels
 * Each model is constructed as a composite THREE.Group of 6–10 distinct parts
 * with varied PBR metallic/roughness properties, beveled shapes, and emissive accents.
 */

// ----------------------------------------------------
// 1. VALKYRIE INTERCEPTOR (High-Agility Air-Superiority Fighter)
// ----------------------------------------------------
export function createValkyrieGroup(trailColor = '#00f0ff'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ship_valkyrie';

  // Materials with varied PBR properties
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.82,
    roughness: 0.26,
  });

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.65,
    roughness: 0.38,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    metalness: 0.9,
    roughness: 0.15,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.35,
  });

  const cockpitMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.6,
    thickness: 0.5,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.5,
  });

  const engineMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.88,
    roughness: 0.22,
  });

  const thrusterGlowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(trailColor),
  });

  // Part 1: Primary Fuselage (Streamlined tapered body)
  const bodyGeo = new THREE.ConeGeometry(0.85, 3.6, 6);
  bodyGeo.rotateX(Math.PI / 2);
  bodyGeo.scale(1, 0.45, 1);
  const bodyMesh = new THREE.Mesh(bodyGeo, hullMat);
  bodyMesh.position.set(0, 0.25, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // Part 2: Main Swept Delta Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.8);
  wingShape.lineTo(2.4, -1.2);
  wingShape.lineTo(1.8, -1.5);
  wingShape.lineTo(0, -0.6);
  wingShape.lineTo(-1.8, -1.5);
  wingShape.lineTo(-2.4, -1.2);
  wingShape.closePath();

  const wingExtrude = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  wingExtrude.rotateX(Math.PI / 2);
  const wingMesh = new THREE.Mesh(wingExtrude, wingMat);
  wingMesh.position.set(0, 0.18, 0.2);
  wingMesh.castShadow = true;
  wingMesh.receiveShadow = true;
  group.add(wingMesh);

  // Part 3: Cockpit Canopy (Armored aerodynamic glass bubble)
  const cockpitGeo = new THREE.SphereGeometry(0.38, 16, 12);
  cockpitGeo.scale(0.7, 0.5, 2.0);
  const cockpitMesh = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpitMesh.position.set(0, 0.42, 0.25);
  group.add(cockpitMesh);

  // Part 4 & 5: Twin Wingtip Forward Canards / Strike Fins
  const canardGeo = new THREE.BoxGeometry(0.06, 0.45, 0.8);
  const leftCanard = new THREE.Mesh(canardGeo, trimMat);
  leftCanard.position.set(1.9, 0.35, -0.8);
  leftCanard.rotation.z = -0.2;
  group.add(leftCanard);

  const rightCanard = new THREE.Mesh(canardGeo, trimMat);
  rightCanard.position.set(-1.9, 0.35, -0.8);
  rightCanard.rotation.z = 0.2;
  group.add(rightCanard);

  // Part 6 & 7: Twin Underside Plasma Rail Cannons
  const cannonGeo = new THREE.CylinderGeometry(0.07, 0.08, 1.6, 8);
  cannonGeo.rotateX(Math.PI / 2);
  const leftCannon = new THREE.Mesh(cannonGeo, engineMat);
  leftCannon.position.set(0.65, 0.05, 0.6);
  leftCannon.castShadow = true;
  group.add(leftCannon);

  const rightCannon = new THREE.Mesh(cannonGeo, engineMat);
  rightCannon.position.set(-0.65, 0.05, 0.6);
  rightCannon.castShadow = true;
  group.add(rightCannon);

  // Part 8 & 9: Twin Afterburner Thruster Pods & Glow Discs
  const thrusterGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.8, 12);
  thrusterGeo.rotateX(Math.PI / 2);
  const leftThruster = new THREE.Mesh(thrusterGeo, engineMat);
  leftThruster.position.set(0.42, 0.22, -1.6);
  group.add(leftThruster);

  const rightThruster = new THREE.Mesh(thrusterGeo, engineMat);
  rightThruster.position.set(-0.42, 0.22, -1.6);
  group.add(rightThruster);

  const glowGeo = new THREE.CircleGeometry(0.2, 12);
  const leftGlow = new THREE.Mesh(glowGeo, thrusterGlowMat);
  leftGlow.position.set(0.42, 0.22, -2.01);
  leftGlow.rotateY(Math.PI);
  group.add(leftGlow);

  const rightGlow = new THREE.Mesh(glowGeo, thrusterGlowMat);
  rightGlow.position.set(-0.42, 0.22, -2.01);
  rightGlow.rotateY(Math.PI);
  group.add(rightGlow);

  // Part 10: Soft Ground Contact Shadow Disc
  if (shadowTexture) {
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.55;
    group.add(shadow);
  }

  return group;
}

// ----------------------------------------------------
// 2. CHRONOS WARP WING (Temporal Phase Projector & Graviton Manipulator)
// ----------------------------------------------------
export function createChronosMesh(trailColor = '#c084fc'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ship_chronos';

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x2e1065,
    metalness: 0.86,
    roughness: 0.2,
  });

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x581c87,
    metalness: 0.92,
    roughness: 0.14,
    emissive: 0x9333ea,
    emissiveIntensity: 0.4,
  });

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xa855f7,
    metalness: 0.2,
    roughness: 0.08,
    transmission: 0.7,
    thickness: 0.6,
    emissive: 0xc084fc,
    emissiveIntensity: 0.8,
  });

  const thrusterGlowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(trailColor),
  });

  // Part 1: Central Forward Prow & Cockpit Nacelle
  const prowGeo = new THREE.ConeGeometry(0.7, 3.2, 5);
  prowGeo.rotateX(Math.PI / 2);
  prowGeo.scale(0.85, 0.4, 1);
  const prow = new THREE.Mesh(prowGeo, hullMat);
  prow.position.set(0, 0.25, 0.4);
  prow.castShadow = true;
  group.add(prow);

  // Part 2: Spinning Temporal Accelerator Torus Ring
  const ringGeo = new THREE.TorusGeometry(1.4, 0.14, 12, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 0.25, -0.2);
  ring.name = 'chronos_torus_ring';
  ring.castShadow = true;
  group.add(ring);

  // Part 3: Octahedral Quantum Singularity Core
  const coreGeo = new THREE.OctahedronGeometry(0.5, 0);
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 0.25, -0.2);
  core.name = 'chronos_quantum_core';
  group.add(core);

  // Part 4 & 5: Forward-Swept Chrono Crescent Wings
  const crescentShape = new THREE.Shape();
  crescentShape.moveTo(0, 0);
  crescentShape.quadraticCurveTo(1.8, 1.0, 2.3, -0.8);
  crescentShape.quadraticCurveTo(1.2, -0.4, 0.6, -1.2);
  crescentShape.closePath();

  const crescentGeo = new THREE.ExtrudeGeometry(crescentShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  crescentGeo.rotateX(Math.PI / 2);

  const rightWing = new THREE.Mesh(crescentGeo, hullMat);
  rightWing.position.set(0.4, 0.22, 0);
  rightWing.castShadow = true;
  group.add(rightWing);

  const leftWingGeo = crescentGeo.clone();
  leftWingGeo.scale(-1, 1, 1);
  const leftWing = new THREE.Mesh(leftWingGeo, hullMat);
  leftWing.position.set(-0.4, 0.22, 0);
  leftWing.castShadow = true;
  group.add(leftWing);

  // Part 6 & 7: Dual Tachyon Emitters on Ring Nodes
  const emitterGeo = new THREE.SphereGeometry(0.18, 12, 8);
  const leftEmitter = new THREE.Mesh(emitterGeo, coreMat);
  leftEmitter.position.set(-1.4, 0.25, -0.2);
  group.add(leftEmitter);

  const rightEmitter = new THREE.Mesh(emitterGeo, coreMat);
  rightEmitter.position.set(1.4, 0.25, -0.2);
  group.add(rightEmitter);

  // Part 8: Phase Drive Thruster Exhaust
  const thrusterGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.6, 12);
  thrusterGeo.rotateX(Math.PI / 2);
  const thruster = new THREE.Mesh(thrusterGeo, hullMat);
  thruster.position.set(0, 0.25, -1.5);
  group.add(thruster);

  const glowGeo = new THREE.CircleGeometry(0.28, 16);
  const glow = new THREE.Mesh(glowGeo, thrusterGlowMat);
  glow.position.set(0, 0.25, -1.81);
  glow.rotateY(Math.PI);
  group.add(glow);

  // Contact Shadow
  if (shadowTexture) {
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.55;
    group.add(shadow);
  }

  return group;
}

// ----------------------------------------------------
// 3. TITAN DREADNOUGHT (Heavy Armored Bastion with Siege Railguns)
// ----------------------------------------------------
export function createTitanMesh(trailColor = '#f59e0b'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ship_titan';

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    metalness: 0.88,
    roughness: 0.32,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    metalness: 0.72,
    roughness: 0.42,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.95,
    roughness: 0.18,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
  });

  const thrusterGlowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(trailColor),
  });

  // Part 1: Heavy Angular Prow & Center Hull Chassis
  const hullGeo = new THREE.BoxGeometry(1.6, 0.65, 3.4);
  const hull = new THREE.Mesh(hullGeo, armorMat);
  hull.position.set(0, 0.32, 0);
  hull.castShadow = true;
  group.add(hull);

  // Part 2: Reinforced Beveled Prow Ram
  const ramGeo = new THREE.ConeGeometry(1.1, 1.4, 4);
  ramGeo.rotateX(Math.PI / 2);
  ramGeo.scale(1.1, 0.5, 1);
  const ram = new THREE.Mesh(ramGeo, goldMat);
  ram.position.set(0, 0.32, 2.0);
  ram.castShadow = true;
  group.add(ram);

  // Part 3 & 4: Left & Right Outrigger Heavy Armor Sponson Plates
  const sponsonGeo = new THREE.BoxGeometry(0.7, 0.45, 2.2);
  const leftSponson = new THREE.Mesh(sponsonGeo, secondaryMat);
  leftSponson.position.set(1.15, 0.28, -0.3);
  leftSponson.castShadow = true;
  group.add(leftSponson);

  const rightSponson = new THREE.Mesh(sponsonGeo, secondaryMat);
  rightSponson.position.set(-1.15, 0.28, -0.3);
  rightSponson.castShadow = true;
  group.add(rightSponson);

  // Part 5: Elevated Command Bridge Tower
  const bridgeGeo = new THREE.BoxGeometry(0.8, 0.4, 1.0);
  const bridge = new THREE.Mesh(bridgeGeo, armorMat);
  bridge.position.set(0, 0.75, -0.5);
  bridge.castShadow = true;
  group.add(bridge);

  // Bridge Sensor Visor
  const visorGeo = new THREE.BoxGeometry(0.65, 0.1, 0.05);
  const visorMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.8, 0.02);
  group.add(visor);

  // Part 6 & 7: Dual Heavy Siege Railgun Barrels
  const gunGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8);
  gunGeo.rotateX(Math.PI / 2);
  const leftGun = new THREE.Mesh(gunGeo, goldMat);
  leftGun.position.set(0.55, 0.45, 1.6);
  leftGun.castShadow = true;
  group.add(leftGun);

  const rightGun = new THREE.Mesh(gunGeo, goldMat);
  rightGun.position.set(-0.55, 0.45, 1.6);
  rightGun.castShadow = true;
  group.add(rightGun);

  // Part 8, 9, 10: Quad Heavy Exhaust Thrusters
  const thrusterGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.7, 10);
  thrusterGeo.rotateX(Math.PI / 2);
  const tPositions = [
    { x: -0.5, y: 0.45 },
    { x: 0.5, y: 0.45 },
    { x: -0.5, y: 0.18 },
    { x: 0.5, y: 0.18 },
  ];

  tPositions.forEach((pos) => {
    const t = new THREE.Mesh(thrusterGeo, secondaryMat);
    t.position.set(pos.x, pos.y, -1.8);
    group.add(t);

    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), thrusterGlowMat);
    glow.position.set(pos.x, pos.y, -2.16);
    glow.rotateY(Math.PI);
    group.add(glow);
  });

  // Contact Shadow
  if (shadowTexture) {
    const shadowGeo = new THREE.PlaneGeometry(4.8, 4.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.55;
    group.add(shadow);
  }

  return group;
}

// ----------------------------------------------------
// 4. APOCALYPSE MEGA TITAN (Boss Class V Colossus)
// ----------------------------------------------------
export function createMegaBossMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ship_mega_boss';

  const blackHullMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.9,
    roughness: 0.22,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.95,
    roughness: 0.15,
  });

  const crimsonCoreMat = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    emissive: 0xef4444,
    emissiveIntensity: 0.9,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.5,
  });

  // Colossal central dreadnought structure
  const hullGeo = new THREE.CylinderGeometry(1.6, 2.6, 4.5, 6);
  hullGeo.rotateX(Math.PI / 2);
  hullGeo.scale(1.4, 0.45, 1);
  const mainHull = new THREE.Mesh(hullGeo, blackHullMat);
  mainHull.castShadow = true;
  group.add(mainHull);

  // Pulsing Singularity Core
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), crimsonCoreMat);
  core.position.set(0, 0.2, 0);
  core.name = 'boss_singularity_core';
  group.add(core);

  // Accretion Disk Ring
  const disk = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 1.45, 32),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
  );
  disk.rotateX(Math.PI / 2);
  disk.name = 'boss_accretion_disk';
  group.add(disk);

  // Heavy Outrigger Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 1.2);
  wingShape.lineTo(4.2, -1.8);
  wingShape.lineTo(3.2, -2.4);
  wingShape.lineTo(0, -1.2);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.18, bevelEnabled: true });
  wingGeo.rotateX(Math.PI / 2);
  const leftW = new THREE.Mesh(wingGeo, blackHullMat);
  leftW.castShadow = true;
  group.add(leftW);

  const rightWGeo = wingGeo.clone();
  rightWGeo.scale(-1, 1, 1);
  const rightW = new THREE.Mesh(rightWGeo, blackHullMat);
  rightW.castShadow = true;
  group.add(rightW);

  // Heavy Gold Prow Crest
  const crest = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.0, 5), goldTrimMat);
  crest.rotateX(Math.PI / 2);
  crest.scale.set(1.2, 0.4, 1);
  crest.position.set(0, 0.2, 2.6);
  group.add(crest);

  return group;
}

export function createShipMeshById(shipId: ShipId, trailColor?: string): THREE.Group {
  switch (shipId) {
    case 'chronos':
      return createChronosMesh(trailColor);
    case 'titan':
      return createTitanMesh(trailColor);
    case 'valkyrie':
    default:
      return createValkyrieGroup(trailColor);
  }
}
