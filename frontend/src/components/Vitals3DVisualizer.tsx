'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, ShieldCheck, Box, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface Point3D {
  time: string;
  heartRate: number;
  spo2: number;
  isAnomaly?: boolean;
}

interface Vitals3DVisualizerProps {
  data: Point3D[];
  baselineHR?: number;
  baselineSpO2?: number;
  hrLower?: number;
  hrUpper?: number;
  spo2Lower?: number;
}

export const Vitals3DVisualizer: React.FC<Vitals3DVisualizerProps> = ({
  data,
  baselineHR = 70,
  baselineSpO2 = 98.2,
  hrLower = 60,
  hrUpper = 85,
  spo2Lower = 94
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<Point3D | null>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<{ isDragging: boolean; prevX: number; prevY: number; rotX: number; rotY: number; zoom: number }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0.35,
    rotY: -0.65,
    zoom: 14
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = 340;

    // 1. Scene & Lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Light slate-50 clean background
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(12, 10, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x0284c7, 0.6);
    dirLight.position.set(15, 20, 15);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xe2e8f0, 0.8);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    // 5. 3D Coordinate Grids & Floor
    const gridHelper = new THREE.GridHelper(16, 16, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -3.5;
    scene.add(gridHelper);

    // 6. Volumetric "Safe Corridor" Envelope (Green Semi-Transparent Box)
    // Map HR (60 to 85) and SpO2 (94 to 100) to 3D space
    // Coordinates: X: Time (-7 to +7), Y: HR (-3.5 to +3.5), Z: SpO2 (-3.5 to +3.5)
    const mapY = (hr: number) => ((hr - 50) / 80) * 6 - 3;
    const mapZ = (spo2: number) => ((spo2 - 80) / 20) * 6 - 3;

    const corridorMinY = mapY(hrLower);
    const corridorMaxY = mapY(hrUpper);
    const corridorMinZ = mapZ(spo2Lower);
    const corridorMaxZ = mapZ(100);

    const corridorHeight = Math.max(0.5, corridorMaxY - corridorMinY);
    const corridorDepth = Math.max(0.5, corridorMaxZ - corridorMinZ);
    const corridorCenterY = (corridorMinY + corridorMaxY) / 2;
    const corridorCenterZ = (corridorMinZ + corridorMaxZ) / 2;

    const safeBoxGeo = new THREE.BoxGeometry(14, corridorHeight, corridorDepth);
    const safeBoxMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.08,
      wireframe: false
    });
    const safeBox = new THREE.Mesh(safeBoxGeo, safeBoxMat);
    safeBox.position.set(0, corridorCenterY, corridorCenterZ);
    scene.add(safeBox);

    // Safe Corridor Wireframe Edge
    const wireGeo = new THREE.EdgesGeometry(safeBoxGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.25 });
    const safeWire = new THREE.LineSegments(wireGeo, wireMat);
    safeWire.position.copy(safeBox.position);
    scene.add(safeWire);

    // 7. Physiological 3D Trajectory Curve & Spheres
    const curvePoints: THREE.Vector3[] = [];
    const count = data.length || 20;

    data.forEach((pt, idx) => {
      const x = (idx / Math.max(1, count - 1)) * 14 - 7;
      const y = mapY(pt.heartRate);
      const z = mapZ(pt.spo2);
      curvePoints.push(new THREE.Vector3(x, y, z));
    });

    if (curvePoints.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.12, 12, false);

      // Vertex color attribute based on anomaly status
      const colors: number[] = [];
      const position = tubeGeo.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        // Find closest point in data
        const normalizedX = (x + 7) / 14;
        const dataIdx = Math.min(count - 1, Math.max(0, Math.floor(normalizedX * count)));
        const isAnom = data[dataIdx]?.isAnomaly || (data[dataIdx]?.spo2 < 91) || (data[dataIdx]?.heartRate > 105);

        if (isAnom) {
          colors.push(0.88, 0.11, 0.28); // Crimson #e11d48
        } else {
          colors.push(0.01, 0.52, 0.78); // Medical Blue #0284c7
        }
      }
      tubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const tubeMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.3,
        metalness: 0.1
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tube);
    }

    // 8. Individual Point Spheres along Trajectory
    data.forEach((pt, idx) => {
      const x = (idx / Math.max(1, count - 1)) * 14 - 7;
      const y = mapY(pt.heartRate);
      const z = mapZ(pt.spo2);

      const isAnom = pt.isAnomaly || pt.spo2 < 91 || pt.heartRate > 105;
      const sphereGeo = new THREE.SphereGeometry(isAnom ? 0.28 : 0.18, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: isAnom ? 0xe11d48 : 0x0284c7,
        emissive: isAnom ? 0x9f1239 : 0x075985,
        emissiveIntensity: isAnom ? 0.5 : 0.2
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(x, y, z);
      scene.add(sphere);
    });

    // 9. Mouse Orbit Interaction
    const handleMouseDown = (e: MouseEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isDragging) return;
      const dx = e.clientX - controlsRef.current.prevX;
      const dy = e.clientY - controlsRef.current.prevY;
      controlsRef.current.rotY += dx * 0.008;
      controlsRef.current.rotX = Math.max(-0.6, Math.min(1.2, controlsRef.current.rotX + dy * 0.008));
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const handleMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlsRef.current.zoom = Math.max(6, Math.min(26, controlsRef.current.zoom + e.deltaY * 0.015));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // 10. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && !controlsRef.current.isDragging) {
        controlsRef.current.rotY += 0.004;
      }

      const { rotX, rotY, zoom } = controlsRef.current;
      camera.position.x = zoom * Math.cos(rotX) * Math.sin(rotY);
      camera.position.y = zoom * Math.sin(rotX);
      camera.position.z = zoom * Math.cos(rotX) * Math.cos(rotY);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [data, autoRotate, baselineHR, baselineSpO2, hrLower, hrUpper, spo2Lower]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      {/* 3D Header & Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                3D Physiological Embedding Manifold (Three.js WebGL)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Interactive Multi-Dimensional
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              X-Axis: Time Evolution • Y-Axis: Heart Rate (bpm) • Z-Axis: Pulse Oximetry (SpO₂ %)
            </p>
          </div>
        </div>

        {/* 3D View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5",
              autoRotate ? "bg-sky-50 border-sky-200 text-sky-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <RotateCw className={cn("w-3.5 h-3.5", autoRotate && "animate-spin")} />
            <span>{autoRotate ? 'Auto-Rotate ON' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Mounting Container */}
      <div className="relative w-full h-[340px] rounded-xl overflow-hidden border border-slate-100 bg-slate-50/50 cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="w-full h-full" />

        {/* Overlaid 3D Spatial Legend */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 text-[11px] font-mono shadow-sm space-y-1.5 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
            <span className="text-slate-700 font-medium">Trajectory: Physiological Stream</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
            <span className="text-rose-700 font-medium">Anomalous Extrusion (Breach Zone)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded border border-emerald-500 bg-emerald-500/20 inline-block"></span>
            <span className="text-emerald-700 font-medium">Safe Corridor (Personal Baseline Envelope)</span>
          </div>
          <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-100">
            • Drag to rotate 360° • Scroll wheel to zoom
          </p>
        </div>
      </div>
    </div>
  );
};
