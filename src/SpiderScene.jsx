import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import './spiderscene.css';

/* ─── Physics constants ─── */
const REST_Y    = 0.0;
const TOP_Y     = 4.0;
const MAX_PULL  = -2.8;
const STIFFNESS = 200;
const DAMPING   = 20;

/* ─── Web geometry ─── */
const SPOKES   = 12;
const RINGS    = 6;
const WEB_R    = 2.4;
const ANCHOR_Y = 3.2;

function buildWebPositions(spiderY) {
  const pts = [];
  const cx = 0, cy = spiderY;

  // Radial spokes from spider center to outer anchors
  for (let s = 0; s < SPOKES; s++) {
    const a = (s / SPOKES) * Math.PI * 2;
    const ex = Math.cos(a) * WEB_R;
    const ey = ANCHOR_Y + Math.sin(a) * WEB_R * 0.3;
    pts.push(cx, cy, 0, ex, ey, 0);
  }

  // Concentric ring segments
  for (let r = 1; r <= RINGS; r++) {
    const t = r / (RINGS + 1);
    for (let s = 0; s < SPOKES; s++) {
      const a1 = (s / SPOKES) * Math.PI * 2;
      const a2 = ((s + 1) / SPOKES) * Math.PI * 2;

      const ox1 = Math.cos(a1) * WEB_R, oy1 = ANCHOR_Y + Math.sin(a1) * WEB_R * 0.3;
      const ox2 = Math.cos(a2) * WEB_R, oy2 = ANCHOR_Y + Math.sin(a2) * WEB_R * 0.3;

      const p1x = cx + (ox1 - cx) * t, p1y = cy + (oy1 - cy) * t;
      const p2x = cx + (ox2 - cx) * t, p2y = cy + (oy2 - cy) * t;
      pts.push(p1x, p1y, 0, p2x, p2y, 0);
    }
  }
  return new Float32Array(pts);
}

/* ─── Silk thread (vertical line from anchor to spider) ─── */
function SilkThread({ phys }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([0, ANCHOR_Y, 0,  0, REST_Y + 0.3, 0]), 3
    ));
    return g;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    arr[4] = phys.current.spiderY + 0.3;
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <line ref={ref} geometry={geo}>
      <lineBasicMaterial color="#e8f0ff" transparent opacity={0.85} linewidth={2} />
    </line>
  );
}

/* ─── Spider web mesh ─── */
function SpiderWeb({ phys }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(buildWebPositions(REST_Y), 3));
    return g;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = buildWebPositions(phys.current.spiderY);
    ref.current.geometry.attributes.position.array.set(pos);
    ref.current.geometry.attributes.position.needsUpdate = true;

    // Subtle shimmer on web material
    const mat = ref.current.material;
    mat.opacity = 0.28 + Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });

  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial color="#c8d8ff" transparent opacity={0.3} />
    </lineSegments>
  );
}

/* ─── One spider leg (3 segments: femur, tibia, tarsus) ─── */
function SpiderLeg({ side, row, phys }) {
  const femurRef = useRef();
  const tibiaRef = useRef();
  const tarsusRef = useRef();

  // Leg spread and angles per row
  const baseAngle  = [0.55, 0.75, 0.95, 1.12][row];
  const femurLen   = [0.55, 0.60, 0.58, 0.52][row];
  const tibiaLen   = [0.50, 0.55, 0.52, 0.46][row];
  const tarsusLen  = [0.30, 0.32, 0.30, 0.26][row];
  const yOffset    = [0.15, 0.05, -0.06, -0.16][row];
  const zOffset    = [0.10, 0.04, -0.04, -0.10][row];

  useFrame((state) => {
    const t   = state.clock.elapsedTime;
    const vel = Math.abs(phys.current.spiderVel);
    // Idle leg micro-twitch + bounce amplification
    const wiggle = Math.sin(t * 2.2 + row * 1.1) * (0.025 + vel * 0.06);

    if (femurRef.current)  femurRef.current.rotation.z  = wiggle * 0.5;
    if (tibiaRef.current)  tibiaRef.current.rotation.z  = wiggle;
    if (tarsusRef.current) tarsusRef.current.rotation.z = wiggle * 1.4;
  });

  const legMat = <meshPhysicalMaterial
    color="#1a0808"
    roughness={0.55}
    metalness={0.35}
    reflectivity={0.5}
    clearcoat={0.4}
    clearcoatRoughness={0.6}
  />;

  // Femur origin sits on the cephalothorax side
  const ox = side * 0.19;
  const oy = yOffset;
  const oz = zOffset;

  return (
    <group position={[ox, oy, oz]}>
      {/* Femur */}
      <group ref={femurRef} rotation={[oz * 0.5, 0, side * baseAngle]}>
        <mesh position={[side * femurLen * 0.5, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.024, femurLen, 7]} />
          {legMat}
        </mesh>

        {/* Tibia */}
        <group
          ref={tibiaRef}
          position={[side * femurLen, 0, 0]}
          rotation={[0, 0, side * 0.55]}
        >
          <mesh position={[side * tibiaLen * 0.5, -tibiaLen * 0.12, 0]}>
            <cylinderGeometry args={[0.024, 0.017, tibiaLen, 7]} />
            {legMat}
          </mesh>

          {/* Tarsus (tip) */}
          <group
            ref={tarsusRef}
            position={[side * tibiaLen, -tibiaLen * 0.25, 0]}
            rotation={[0, 0, side * 0.5]}
          >
            <mesh position={[side * tarsusLen * 0.5, -tarsusLen * 0.18, 0]}>
              <cylinderGeometry args={[0.017, 0.007, tarsusLen, 6]} />
              {legMat}
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ─── Full 3D spider body ─── */
function Spider({ phys }) {
  const groupRef = useRef();
  const eyeRef   = useRef([]);

  useFrame((_, delta) => {
    const p = phys.current;

    // Spring physics
    if (!p.isDragging) {
      const dt   = Math.min(delta, 0.05);
      const disp = p.spiderY - p.targetY;
      const acc  = -STIFFNESS * disp - DAMPING * p.spiderVel;
      p.spiderVel += acc * dt;
      p.spiderY   += p.spiderVel * dt;
    }

    if (groupRef.current) {
      groupRef.current.position.y = p.spiderY;
      // Squish & stretch with velocity
      const squish = 1 + Math.abs(p.spiderVel) * 0.015;
      groupRef.current.scale.set(squish, 1 / squish, squish);
    }

    // Pulse eyes
    eyeRef.current.forEach(m => {
      if (m) m.material.emissiveIntensity = 1.0 + Math.sin(Date.now() * 0.003) * 0.5;
    });
  });

  return (
    <group ref={groupRef} position={[0, TOP_Y, 0]}>

      {/* ── Abdomen (large oval) ── */}
      <mesh position={[0, -0.22, 0]} scale={[1, 1.22, 1]}>
        <sphereGeometry args={[0.40, 28, 28]} />
        <meshPhysicalMaterial
          color="#0e0408"
          roughness={0.45}
          metalness={0.3}
          reflectivity={0.8}
          clearcoat={0.7}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Abdomen stripe pattern */}
      {[0.1, -0.05, -0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0.38]} scale={[1, 0.4, 0.1]}>
          <sphereGeometry args={[0.22 - i * 0.04, 8, 8]} />
          <meshPhysicalMaterial
            color="#2a0a10"
            roughness={0.5}
            metalness={0.2}
            emissive="#1a0508"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* ── Hourglass / red marking ── */}
      <mesh position={[0, -0.18, 0.39]}>
        <sphereGeometry args={[0.10, 12, 12]} />
        <meshPhysicalMaterial
          color="#cc1500"
          emissive="#ff2200"
          emissiveIntensity={1.5}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* ── Pedicel (waist) ── */}
      <mesh position={[0, 0.10, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshPhysicalMaterial color="#0e0408" roughness={0.5} metalness={0.25} />
      </mesh>

      {/* ── Cephalothorax (front) ── */}
      <mesh position={[0, 0.28, 0]} scale={[1, 1.1, 1]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshPhysicalMaterial
          color="#120608"
          roughness={0.42}
          metalness={0.35}
          reflectivity={0.9}
          clearcoat={0.8}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* Cephalothorax groove line */}
      <mesh position={[0, 0.3, 0.24]} scale={[0.15, 0.6, 0.15]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#0a0308" roughness={0.7} />
      </mesh>

      {/* ── Main eyes (2 large) ── */}
      {[[-0.11, 0.44, 0.22], [0.11, 0.44, 0.22]].map((pos, i) => (
        <mesh key={`me${i}`} position={pos} ref={el => { if (el) eyeRef.current[i] = el; }}>
          <sphereGeometry args={[0.038, 10, 10]} />
          <meshPhysicalMaterial
            color="#ff0800"
            emissive="#ff2200"
            emissiveIntensity={1.2}
            roughness={0.1}
            metalness={0.0}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
          />
        </mesh>
      ))}

      {/* ── Secondary eyes (4 small) ── */}
      {[[-0.05, 0.41, 0.24], [0.05, 0.41, 0.24],
        [-0.14, 0.40, 0.17], [0.14, 0.40, 0.17]].map((pos, i) => (
        <mesh key={`se${i}`} position={pos}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshPhysicalMaterial
            color="#cc0800"
            emissive="#dd1500"
            emissiveIntensity={0.9}
            roughness={0.15}
            clearcoat={1.0}
          />
        </mesh>
      ))}

      {/* ── Chelicerae / fangs ── */}
      {[[-0.09, 0.18, 0.23], [0.09, 0.18, 0.23]].map((pos, i) => (
        <group key={`fang${i}`} position={pos} rotation={[0.5, 0, i === 0 ? -0.2 : 0.2]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.008, 0.14, 6]} />
            <meshPhysicalMaterial color="#1a0808" roughness={0.5} metalness={0.4} clearcoat={0.6} />
          </mesh>
          {/* Fang tip (darker, sharper) */}
          <mesh position={[0, -0.09, 0]}>
            <coneGeometry args={[0.012, 0.09, 6]} />
            <meshPhysicalMaterial color="#0a0404" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ── Pedipalps (small arm-like) ── */}
      {[[-0.14, 0.3, 0.2], [0.14, 0.3, 0.2]].map((pos, i) => (
        <mesh key={`palp${i}`} position={pos} rotation={[0.3, 0, i === 0 ? -0.4 : 0.4]}>
          <cylinderGeometry args={[0.016, 0.01, 0.18, 5]} />
          <meshPhysicalMaterial color="#1a0808" roughness={0.55} metalness={0.3} />
        </mesh>
      ))}

      {/* ── 8 Legs (4 rows × 2 sides) ── */}
      {[0, 1, 2, 3].map(row => (
        <group key={row}>
          <SpiderLeg side={-1} row={row} phys={phys} />
          <SpiderLeg side={1}  row={row} phys={phys} />
        </group>
      ))}
    </group>
  );
}

/* ─── Scene: lighting + objects ─── */
function SceneContent({ phys }) {
  return (
    <>
      {/* Key light — dramatic top-front */}
      <spotLight
        position={[0, 5, 4]}
        intensity={3.5}
        angle={0.4}
        penumbra={0.85}
        color="#b0a0ff"
        castShadow
      />
      {/* Fill light — cool blue rim */}
      <spotLight
        position={[-4, 0, 3]}
        intensity={1.2}
        angle={0.6}
        penumbra={1.0}
        color="#2060ff"
      />
      {/* Back light — warm glow from behind */}
      <pointLight position={[0, -1, -3]} intensity={0.9} color="#ff4010" />
      {/* Ambient — very subtle */}
      <ambientLight intensity={0.18} color="#4040aa" />

      <Environment preset="night" />

      <SpiderWeb  phys={phys} />
      <SilkThread phys={phys} />
      <Spider     phys={phys} />
    </>
  );
}

/* ─── Main component ─── */
export default function SpiderScene({ scrollProgress }) {
  const containerRef = useRef(null);

  const phys = useRef({
    spiderY:   TOP_Y,
    spiderVel: 0,
    targetY:   TOP_Y,
    isDragging: false,
    descended:  false,
  });

  /* ── Trigger descent on scroll ── */
  useEffect(() => {
    const p = phys.current;
    if (scrollProgress > 0.15 && !p.descended) {
      p.targetY  = REST_Y;
      p.descended = true;
    }
  }, [scrollProgress]);

  /* ── Drag interaction — Y only, downward only ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // How many world units the full canvas height equals
    const WORLD_H = 6.0;

    let startClientY = 0;
    let startSpiderY = 0;

    const getY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

    const onDown = (e) => {
      const p = phys.current;
      if (!p.descended) return;
      p.isDragging = true;
      p.spiderVel  = 0;
      startClientY = getY(e);
      startSpiderY = p.spiderY;
      e.preventDefault();
    };

    const onMove = (e) => {
      const p = phys.current;
      if (!p.isDragging) return;
      const h  = el.getBoundingClientRect().height;
      // Screen Y increases downward → world Y decreases → negate
      const dy = (getY(e) - startClientY) / h * WORLD_H;
      // Clamped: can only pull DOWN (negative), never above REST_Y
      p.spiderY = Math.max(MAX_PULL, Math.min(REST_Y, startSpiderY - dy));
      e.preventDefault();
    };

    const onUp = () => {
      const p = phys.current;
      if (!p.isDragging) return;
      p.isDragging = false;
      p.spiderVel  = 0; // spring takes over
    };

    el.addEventListener('mousedown',  onDown, { passive: false });
    el.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchend',  onUp);

    return () => {
      el.removeEventListener('mousedown',  onDown);
      el.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchend',  onUp);
    };
  }, []);

  return (
    <div className="spider-scene-container" ref={containerRef}>
      <div className="pull-hint">↓ drag to pull</div>
      <Canvas
        camera={{ position: [0, 0.3, 6.5], fov: 46 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        shadows
      >
        <SceneContent phys={phys} />
      </Canvas>
    </div>
  );
}
