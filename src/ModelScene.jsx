import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import model from './assets/Untitled.glb';

/* ── Auto-rotating model with mouse follow ── */
function Model({ url, globalMouse }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Auto slow rotation
    groupRef.current.rotation.y += delta * 0.25;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      globalMouse.y * 0.3,
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={0.5} />
    </group>
  );
}

/* ── Floating star particles ── */
function StarField() {
  const pointsRef = useRef();
  const count = 800;

  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.04;
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#a78bfa"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Orbiting energy ring ── */
function EnergyRing() {
  const ringRef = useRef();
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[2.2, 0.015, 8, 120]} />
      <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} />
    </mesh>
  );
}

function EnergyRing2() {
  const ringRef = useRef();
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      ringRef.current.rotation.z = -state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[2.6, 0.01, 8, 120]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
    </mesh>
  );
}

/* ── Camera smooth follow ── */
function CameraControl({ globalMouse }) {
  const cameraRef = useRef();
  const target = useRef(new THREE.Vector3());

  useFrame(({ camera }) => {
    target.current.x = globalMouse.x * 2.5;
    target.current.y = globalMouse.y * 1.8;
    camera.position.lerp(new THREE.Vector3(target.current.x, target.current.y, 5), 0.04);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

export default function ModelScene() {
  const [globalMouse, setGlobalMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setGlobalMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <spotLight position={[10, 10, 10]} intensity={1.5} color="#a78bfa" angle={0.4} penumbra={1} />
        <spotLight position={[-10, -5, 5]} intensity={0.8} color="#06b6d4" angle={0.5} penumbra={1} />
        <pointLight position={[0, 0, 3]} intensity={0.5} color="#f59e0b" />

        {/* Stars background */}
        <Stars radius={50} depth={50} count={3000} factor={3} saturation={0.5} fade speed={0.5} />

        {/* Custom star field */}
        <StarField />

        {/* Energy rings */}
        <EnergyRing />
        <EnergyRing2 />

        {/* 3D model */}
        <Model url={model} globalMouse={globalMouse} />

        {/* Environment */}
        <Environment preset="night" />

        {/* Camera */}
        <CameraControl globalMouse={globalMouse} />

        {/* Bloom post-processing */}
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            radius={0.8}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}