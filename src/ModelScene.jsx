import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Stars, ContactShadows, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import model from './assets/Untitled.glb';

/* ── Auto-rotating model with float + mouse follow ── */
function Model({ url, globalMouse }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  // Traverse and enhance materials
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.envMapIntensity = 1.8;
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.22;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      globalMouse.y * 0.25,
      0.04
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
  const count = 900;

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
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.012;
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
        size={0.055}
        color="#a78bfa"
        transparent
        opacity={0.65}
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
      <torusGeometry args={[2.3, 0.018, 8, 120]} />
      <meshBasicMaterial color="#7c3aed" transparent opacity={0.65} />
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
      <torusGeometry args={[2.8, 0.012, 8, 120]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.45} />
    </mesh>
  );
}

/* ── Rim light that orbits ── */
function RimLight() {
  const lightRef = useRef();
  useFrame((state) => {
    if (lightRef.current) {
      const t = state.clock.elapsedTime * 0.4;
      lightRef.current.position.set(Math.sin(t) * 4, 2, Math.cos(t) * 4);
    }
  });
  return (
    <pointLight ref={lightRef} intensity={2.5} color="#c4b5fd" distance={8} />
  );
}

/* ── Camera smooth follow ── */
function CameraControl({ globalMouse }) {
  useFrame(({ camera }) => {
    const tx = globalMouse.x * 2.2;
    const ty = globalMouse.y * 1.6;
    camera.position.lerp(new THREE.Vector3(tx, ty, 5), 0.04);
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
      shadows
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.25} />
        <spotLight
          position={[8, 12, 8]}
          intensity={2.0}
          color="#a78bfa"
          angle={0.35}
          penumbra={0.85}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight
          position={[-10, -4, 6]}
          intensity={1.0}
          color="#06b6d4"
          angle={0.5}
          penumbra={1}
        />
        <pointLight position={[0, 0, 3]} intensity={0.6} color="#f59e0b" />

        {/* Orbiting rim light */}
        <RimLight />

        {/* Stars background */}
        <Stars radius={50} depth={50} count={3000} factor={3} saturation={0.5} fade speed={0.4} />

        {/* Custom star field */}
        <StarField />

        {/* Energy rings */}
        <EnergyRing />
        <EnergyRing2 />

        {/* 3D model with float animation */}
        <Float speed={1.8} rotationIntensity={0} floatIntensity={0.6} floatingRange={[-0.15, 0.15]}>
          <Model url={model} globalMouse={globalMouse} />
        </Float>

        {/* Contact shadow on floor */}
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.35}
          scale={5}
          blur={2.5}
          far={4}
          color="#4338ca"
        />

        {/* Environment — studio for reflections */}
        <Environment preset="studio" />

        {/* Camera */}
        <CameraControl globalMouse={globalMouse} />

        {/* Bloom post-processing — tighter for premium look */}
        <EffectComposer>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.28}
            luminanceSmoothing={0.85}
            radius={0.7}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}