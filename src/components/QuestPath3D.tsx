import { useRef, useState, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface QuestNode {
  id: string;
  title: string;
  status: "completed" | "active" | "locked";
  xp: number;
  type: "recovery" | "growth" | "sidequest";
  mastery: number;
}

/* ── Mastery-scaled values ── */
function getMasteryScale(mastery: number) {
  const aggressive = mastery > 0.8;
  return {
    emissiveIntensity: aggressive ? 1.5 : 0.1 + mastery * 0.9,
    particleCount: Math.floor(aggressive ? 40 : 4 + mastery * 20),
    particleSpeed: aggressive ? 2.0 : 0.2 + mastery * 0.8,
    particleSpread: aggressive ? 2.5 : 0.8 + mastery * 1.2,
    glowScale: aggressive ? 1.8 : 0.8 + mastery * 0.6,
    bobIntensity: aggressive ? 0.18 : 0.03 + mastery * 0.08,
    pulseFreq: aggressive ? 6 : 1.5 + mastery * 2,
    rotationSpeed: aggressive ? 1.5 : 0.5 + mastery,
    orbPulseAmp: aggressive ? 0.08 : 0.03 * mastery,
  };
}

/* ── Single cozy island platform ── */
function Platform({
  node, position, index, onSelect, isSelected, _totalNodes,
}: {
  node: QuestNode; position: [number, number, number]; index: number;
  onSelect: (id: string) => void; isSelected: boolean; _totalNodes: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const m = getMasteryScale(node.mastery);

  const colors = useMemo(() => {
    if (node.status === "completed") return { base: "#5b8c5a", top: "#7ec87e", emissive: "#3a6b3a", accent: "#b8e6b8", glow: "#44ff88" };
    if (node.status === "active" && node.type === "recovery") return { base: "#c0392b", top: "#e67e73", emissive: "#8b2020", accent: "#f5b7b1", glow: "#ff6644" };
    if (node.status === "active") return { base: "#8e6bbf", top: "#b794e6", emissive: "#6a4d9e", accent: "#d4b8f0", glow: "#bb88ff" };
    return { base: "#7f8c8d", top: "#a0aeb0", emissive: "#5a6566", accent: "#bdc3c7", glow: "#aabbcc" };
  }, [node]);

  const aggressive = node.mastery > 0.8;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const bobFreq = aggressive ? 1.8 : 0.5;
    groupRef.current.position.y = position[1] + Math.sin(t * bobFreq + index * 0.9) * m.bobIntensity;
    if (aggressive) groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
    if (glowRef.current) {
      const s = m.glowScale + Math.sin(t * m.pulseFreq) * (aggressive ? 0.4 : 0.1) * node.mastery;
      glowRef.current.scale.set(s, s, s);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = aggressive
        ? 0.5 + Math.sin(t * 4) * 0.3 : 0.15 + node.mastery * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.08}>
        <group
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.9, 1.1, 0.4, 8]} />
            <meshStandardMaterial color="#6b5b4f" roughness={0.9} metalness={0.05} />
          </mesh>
          <mesh position={[0, -0.08, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 0.9, 0.25, 8]} />
            <meshStandardMaterial color="#8b7355" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.88, 0.85, 0.15, 8]} />
            <meshStandardMaterial
              color={hovered || isSelected ? colors.accent : colors.top}
              emissive={colors.emissive}
              emissiveIntensity={hovered || isSelected ? m.emissiveIntensity + 0.2 : m.emissiveIntensity}
              roughness={0.7} metalness={0.05}
            />
          </mesh>
          {node.status === "completed" && (
            <group position={[0.3, 0.18, 0.3]}>
              <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.02, 0.02, 0.5, 6]} /><meshStandardMaterial color="#8b6914" roughness={0.6} /></mesh>
              <mesh position={[0.12, 0.42, 0]}><boxGeometry args={[0.2, 0.12, 0.02]} /><meshStandardMaterial color="#e6c843" emissive="#c4a000" emissiveIntensity={0.3 + node.mastery * 0.5} /></mesh>
            </group>
          )}
          <mesh position={[-0.4, 0.22, 0.3]}><sphereGeometry args={[0.12, 6, 6]} /><meshStandardMaterial color={colors.base} roughness={0.8} /></mesh>
          <mesh position={[0.5, 0.2, -0.2]}><sphereGeometry args={[0.09, 6, 6]} /><meshStandardMaterial color={colors.base} roughness={0.8} /></mesh>
          {node.status !== "locked" && <MasteryOrb position={[0, 0.5, 0]} color={colors.glow} mastery={node.mastery} />}
        </group>
        <group position={[0, 0.9, 0]}>
          <mesh><planeGeometry args={[0.7, 0.28]} /><meshBasicMaterial color="#000000" transparent opacity={0.6} /></mesh>
          <Text position={[0, 0.005, 0.01]} fontSize={0.18} color="#FFD700" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#8B6914" fontWeight="bold">
            {`+${node.xp} XP`}
          </Text>
        </group>
      </Float>
      <mesh ref={glowRef} position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1.15, 24]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {node.status !== "locked" && <MasteryParticles color={colors.glow} mastery={node.mastery} />}
    </group>
  );
}

/* ── Mastery orb ── */
function MasteryOrb({ position, color, mastery }: { position: [number, number, number]; color: string; mastery: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const aggressive = mastery > 0.8;
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (aggressive) {
      const pulse = 0.25 + Math.sin(t * 6) * 0.1 + Math.sin(t * 9) * 0.05;
      ref.current.scale.setScalar(pulse * 10);
      ref.current.rotation.y = t * 2.5;
      ref.current.rotation.x = Math.sin(t * 3) * 0.5;
      if (innerRef.current) { innerRef.current.scale.setScalar(pulse * 7); innerRef.current.rotation.z = t * 3; }
    } else {
      const baseScale = 0.08 + mastery * 0.14;
      const pulse = baseScale + Math.sin(t * (2 + mastery * 3)) * 0.03 * mastery;
      ref.current.scale.setScalar(pulse * 10);
      ref.current.rotation.y = t * (0.5 + mastery);
      if (innerRef.current) innerRef.current.scale.setScalar(pulse * 6);
    }
  });
  return (
    <group position={position}>
      <mesh ref={ref}><icosahedronGeometry args={[0.01, aggressive ? 2 : 1]} /><meshBasicMaterial color={color} transparent opacity={aggressive ? 0.6 : 0.25 + mastery * 0.3} /></mesh>
      <mesh ref={innerRef}><icosahedronGeometry args={[0.01, aggressive ? 2 : 1]} /><meshBasicMaterial color="#ffffff" transparent opacity={aggressive ? 0.9 : 0.4 + mastery * 0.4} /></mesh>
      {aggressive && <AggressiveEnergyRing color={color} />}
    </group>
  );
}

function AggressiveEnergyRing({ color }: { color: string }) {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) { ring1.current.rotation.x = t * 3; ring1.current.rotation.z = t * 1.5; }
    if (ring2.current) { ring2.current.rotation.y = t * 4; ring2.current.rotation.x = t * 0.8; }
    if (ring3.current) { ring3.current.rotation.z = t * 2.5; ring3.current.rotation.y = t * 1.2; }
  });
  return (
    <group>
      <mesh ref={ring1}><torusGeometry args={[0.22, 0.008, 8, 32]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
      <mesh ref={ring2}><torusGeometry args={[0.28, 0.006, 8, 32]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.4} /></mesh>
      <mesh ref={ring3}><torusGeometry args={[0.18, 0.005, 8, 24]} /><meshBasicMaterial color={color} transparent opacity={0.5} /></mesh>
    </group>
  );
}

function MasteryParticles({ color, mastery }: { color: string; mastery: number }) {
  const ref = useRef<THREE.Points>(null);
  const m = getMasteryScale(mastery);
  const positions = useMemo(() => {
    const arr = new Float32Array(m.particleCount * 3);
    for (let i = 0; i < m.particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * m.particleSpread;
      arr[i * 3 + 1] = Math.random() * (0.5 + mastery * 1.0);
      arr[i * 3 + 2] = (Math.random() - 0.5) * m.particleSpread;
    }
    return arr;
  }, [mastery, m.particleCount, m.particleSpread]);
  const aggressive = mastery > 0.8;
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * m.particleSpeed;
    if (aggressive) ref.current.rotation.x = Math.sin(t * 0.7) * 0.3;
    const posArr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < m.particleCount; i++) {
      const speed = aggressive ? 0.012 : 0.002;
      const freq = aggressive ? (3 + i * 0.5) : (1 + mastery * 2);
      posArr[i * 3 + 1] += Math.sin(t * freq + i) * speed * (1 + mastery);
      if (aggressive) {
        posArr[i * 3] += Math.cos(t * 4 + i * 0.8) * 0.003;
        posArr[i * 3 + 2] += Math.sin(t * 3.5 + i * 1.1) * 0.003;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.04 + mastery * 0.06} color={color} transparent opacity={0.3 + mastery * 0.5} sizeAttenuation />
    </points>
  );
}

/* ── Ladder connecting two platforms ── */
function Ladder({ from, to, completed }: { from: [number, number, number]; to: [number, number, number]; completed: boolean }) {
  const ladderParts = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const dir = end.clone().sub(start);
    const length = dir.length();
    const rungCount = Math.max(3, Math.floor(length / 0.45));
    const rungs: THREE.Vector3[] = [];
    for (let i = 0; i <= rungCount; i++) rungs.push(start.clone().lerp(end.clone(), i / rungCount));
    return { length, rungs };
  }, [from, to]);
  const woodColor = completed ? "#a0785a" : "#7a6552";
  const ropeColor = completed ? "#c4a97d" : "#8a7a6a";
  return (
    <group>
      {[-0.12, 0.12].map((offset, idx) => {
        const angle = Math.atan2(to[0] - from[0], to[2] - from[2]);
        const railStart = new THREE.Vector3(from[0] + Math.cos(angle + Math.PI / 2) * offset, from[1], from[2] - Math.sin(angle + Math.PI / 2) * offset);
        const railEnd = new THREE.Vector3(to[0] + Math.cos(angle + Math.PI / 2) * offset, to[1], to[2] - Math.sin(angle + Math.PI / 2) * offset);
        const railMid = railStart.clone().add(railEnd).multiplyScalar(0.5);
        const railDir = railEnd.clone().sub(railStart);
        const railLen = railDir.length();
        return (
          <mesh key={`rail-${idx}`} position={railMid.toArray()} rotation={[Math.atan2(railDir.y, Math.sqrt(railDir.x ** 2 + railDir.z ** 2)), Math.atan2(railDir.x, railDir.z), 0]}>
            <cylinderGeometry args={[0.025, 0.025, railLen, 4]} /><meshStandardMaterial color={woodColor} roughness={0.85} />
          </mesh>
        );
      })}
      {ladderParts.rungs.map((pos, i) => {
        const crossDir = new THREE.Vector3(to[0] - from[0], 0, to[2] - from[2]).normalize().cross(new THREE.Vector3(0, 1, 0)).normalize();
        return (
          <mesh key={`rung-${i}`} position={pos.toArray()} rotation={[0, Math.atan2(crossDir.x, crossDir.z) + Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.24, 4]} /><meshStandardMaterial color={ropeColor} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Hot Air Balloon (side quest) ── */
function HotAirBalloon({
  node, position, index, onSelect, isSelected,
}: {
  node: QuestNode; position: [number, number, number]; index: number;
  onSelect: (id: string) => void; isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const balloonColor = useMemo(() => {
    const palette = ["#e74c3c", "#f39c12", "#2ecc71", "#3498db", "#9b59b6", "#e67e22"];
    return palette[index % palette.length];
  }, [index]);

  const stripeColor = useMemo(() => {
    const palette = ["#c0392b", "#d68910", "#27ae60", "#2980b9", "#8e44ad", "#d35400"];
    return palette[index % palette.length];
  }, [index]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Gentle floating bob
    groupRef.current.position.y = position[1] + Math.sin(t * 0.4 + index * 1.3) * 0.25;
    groupRef.current.position.x = position[0] + Math.sin(t * 0.25 + index * 0.7) * 0.15;
    groupRef.current.rotation.y = Math.sin(t * 0.15 + index) * 0.06;
  });

  return (
    <group ref={groupRef} position={position}>
      <group
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        {/* Envelope (balloon) */}
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.65, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
          <meshStandardMaterial
            color={hovered || isSelected ? "#fff" : balloonColor}
            emissive={balloonColor}
            emissiveIntensity={hovered ? 0.5 : 0.15}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Stripe bands */}
        {[0.2, 0.5, 0.8].map((yOff, i) => (
          <mesh key={i} position={[0, 0.6 + yOff * 0.9, 0]}>
            <torusGeometry args={[0.55 - yOff * 0.15, 0.025, 6, 16]} />
            <meshStandardMaterial color={stripeColor} roughness={0.5} />
          </mesh>
        ))}
        {/* Basket */}
        <mesh position={[0, 0.0, 0]}>
          <cylinderGeometry args={[0.22, 0.18, 0.2, 8]} />
          <meshStandardMaterial color="#8b6914" roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Ropes */}
        {[[-0.15, 0, -0.15], [0.15, 0, -0.15], [-0.15, 0, 0.15], [0.15, 0, 0.15]].map((off, i) => (
          <mesh key={`rope-${i}`} position={[off[0], 0.5, off[2]]}>
            <cylinderGeometry args={[0.008, 0.008, 0.9, 3]} />
            <meshStandardMaterial color="#c4a97d" roughness={0.8} />
          </mesh>
        ))}
        {/* Flame glow */}
        {node.status !== "locked" && (
          <pointLight position={[0, 0.35, 0]} color="#ff8800" intensity={1.2} distance={3} decay={2} />
        )}
      </group>

      {/* XP Badge */}
      <group position={[0, -0.25, 0.4]}>
        <mesh><planeGeometry args={[0.6, 0.24]} /><meshBasicMaterial color="#000000" transparent opacity={0.65} /></mesh>
        <Text position={[0, 0.005, 0.01]} fontSize={0.14} color="#FFD700" anchorX="center" anchorY="middle" outlineWidth={0.015} outlineColor="#8B6914" fontWeight="bold">
          {`+${node.xp} XP`}
        </Text>
      </group>
      {/* Label */}
      <group position={[0, -0.55, 0.4]}>
        <mesh><planeGeometry args={[1.0, 0.2]} /><meshBasicMaterial color="#000000" transparent opacity={0.5} /></mesh>
        <Text position={[0, 0.005, 0.01]} fontSize={0.09} color="#88ddff" anchorX="center" anchorY="middle" maxWidth={0.9}>
          🎈 SIDE QUEST
        </Text>
      </group>
    </group>
  );
}

/* ── Stylized Earth Globe — BIGGER, more green ── */
function EarthGlobe() {
  const earthRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const continents = useMemo(() => {
    const patches: Array<{ pos: THREE.Vector3; scale: number; color: string }> = [];
    const landPositions = [
      // More numerous + larger green land masses
      { lat: 0.6, lon: -0.3, s: 0.8, c: "#4a8a4a" },
      { lat: 0.7, lon: 0.3, s: 0.65, c: "#5b9b5a" },
      { lat: 0.3, lon: -1.0, s: 0.7, c: "#3a7a3a" },
      { lat: -0.2, lon: -0.8, s: 0.9, c: "#5b8c5a" },
      { lat: -0.5, lon: 0.5, s: 0.6, c: "#4a8a4a" },
      { lat: 0.1, lon: 1.2, s: 0.75, c: "#3a7a3a" },
      { lat: 0.8, lon: 1.5, s: 0.5, c: "#5b9b5a" },
      { lat: -0.7, lon: -0.1, s: 0.5, c: "#6ba56b" },
      { lat: 0.4, lon: 2.0, s: 0.7, c: "#4a8a4a" },
      { lat: -0.3, lon: 2.5, s: 0.6, c: "#3a7a3a" },
      { lat: 0.0, lon: -0.1, s: 0.85, c: "#5b8c5a" },
      { lat: -0.4, lon: 1.6, s: 0.55, c: "#6ba56b" },
      { lat: 0.5, lon: -1.8, s: 0.6, c: "#4a8a4a" },
      { lat: -0.6, lon: -1.2, s: 0.5, c: "#3a7a3a" },
      { lat: 0.2, lon: 0.8, s: 0.7, c: "#5b9b5a" },
      { lat: -0.1, lon: -2.2, s: 0.55, c: "#6ba56b" },
      { lat: 0.9, lon: -0.8, s: 0.45, c: "#4a8a4a" },
      { lat: -0.8, lon: 1.0, s: 0.4, c: "#5b8c5a" },
    ];
    const r = 4.95; // slightly inside sphere radius 5
    for (const l of landPositions) {
      const phi = Math.PI / 2 - l.lat;
      const theta = l.lon;
      patches.push({
        pos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)),
        scale: l.s,
        color: l.c,
      });
    }
    return patches;
  }, []);

  useFrame((state) => {
    if (earthRef.current) earthRef.current.rotation.y = state.clock.elapsedTime * 0.025;
    if (atmosphereRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.004;
      atmosphereRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[0, -9, -3]}>
      <group ref={earthRef}>
        {/* Ocean sphere — radius 5 */}
        <mesh>
          <sphereGeometry args={[5, 48, 48]} />
          <meshStandardMaterial color="#1a5a96" roughness={0.5} metalness={0.15} emissive="#0d3a6c" emissiveIntensity={0.15} />
        </mesh>
        {/* Land masses */}
        {continents.map((c, i) => (
          <mesh key={i} position={c.pos.toArray()}>
            <sphereGeometry args={[c.scale * 0.6, 10, 10]} />
            <meshStandardMaterial color={c.color} roughness={0.75} emissive={c.color} emissiveIntensity={0.12} />
          </mesh>
        ))}
        {/* Ice caps */}
        <mesh position={[0, 4.9, 0]}><sphereGeometry args={[0.9, 12, 12]} /><meshStandardMaterial color="#e8eef5" roughness={0.4} emissive="#c0d0e0" emissiveIntensity={0.1} /></mesh>
        <mesh position={[0, -4.9, 0]}><sphereGeometry args={[0.7, 12, 12]} /><meshStandardMaterial color="#e8eef5" roughness={0.4} emissive="#c0d0e0" emissiveIntensity={0.1} /></mesh>
      </group>
      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef}><sphereGeometry args={[5.3, 48, 48]} /><meshBasicMaterial color="#6ab7ff" transparent opacity={0.07} side={THREE.BackSide} /></mesh>
      <mesh><sphereGeometry args={[5.6, 48, 48]} /><meshBasicMaterial color="#88ccff" transparent opacity={0.035} side={THREE.BackSide} /></mesh>
    </group>
  );
}

/* ── Compass Rose ── */
function CompassRose() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.08; });
  return (
    <group ref={ref} position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh><ringGeometry args={[1.8, 2.0, 32]} /><meshStandardMaterial color="#c4a97d" emissive="#8b6914" emissiveIntensity={0.2} side={THREE.DoubleSide} roughness={0.4} metalness={0.6} /></mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 1.9, Math.sin(angle) * 1.9, 0.01]}><circleGeometry args={[0.08, 6]} /><meshBasicMaterial color={i === 0 ? "#e6c843" : "#c4a97d"} /></mesh>
      ))}
      <mesh position={[0, 0, 0.01]}><ringGeometry args={[0.3, 0.4, 16]} /><meshStandardMaterial color="#e6c843" emissive="#c4a000" emissiveIntensity={0.3} side={THREE.DoubleSide} metalness={0.7} /></mesh>
    </group>
  );
}

/* ── Background clouds ── */
function Clouds() {
  const cloudsData = useMemo(() =>
    Array.from({ length: 10 }, () => ({
      pos: [(Math.random() - 0.5) * 20, 2 + Math.random() * 8, -6 - Math.random() * 12] as [number, number, number],
      scale: 0.5 + Math.random() * 1.2,
      speed: 0.03 + Math.random() * 0.06,
    })), []);
  return <>{cloudsData.map((c, i) => <CloudPuff key={i} position={c.pos} scale={c.scale} speed={c.speed} />)}</>;
}

function CloudPuff({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { if (ref.current) ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 2; });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#f0e6d3" roughness={1} transparent opacity={0.5} /></mesh>
      <mesh position={[0.35, 0.08, 0]}><sphereGeometry args={[0.35, 8, 8]} /><meshStandardMaterial color="#f0e6d3" roughness={1} transparent opacity={0.4} /></mesh>
      <mesh position={[-0.3, 0.05, 0.1]}><sphereGeometry args={[0.4, 8, 8]} /><meshStandardMaterial color="#ede0cc" roughness={1} transparent opacity={0.45} /></mesh>
    </group>
  );
}

/* ── Camera controller ── */
function CameraController({ nodeCount }: { nodeCount: number }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  useEffect(() => {
    const baseY = 0.5;
    const targetY = 1.0;
    camera.position.set(6, baseY + 3, 10);
    camera.lookAt(0, targetY, -2);
  }, [camera, nodeCount]);
  return (
    <OrbitControls ref={controlsRef} enablePan={false} enableZoom={true} minDistance={6} maxDistance={22}
      maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 8} target={[0, 2, -2]} enableDamping dampingFactor={0.05} />
  );
}

/* ── The full 3D scene ── */
function QuestScene({
  nodes, sideQuests, selectedId, onSelect,
}: {
  nodes: QuestNode[]; sideQuests: QuestNode[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  // Main quest positions — MORE SPACED OUT (y * 1.2 instead of 0.7, z * 2.8)
  const positions = useMemo<[number, number, number][]>(() => {
    return nodes.map((_, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const xDir = row % 2 === 0 ? 1 : -1;
      const x = (col === 0 ? -1.5 : 1.5) * xDir;
      const z = -row * 2.8;
      const y = i * 1.2;
      return [x, y, z];
    });
  }, [nodes]);

  // Side quest balloon positions — flanking left and right
  const balloonPositions = useMemo<[number, number, number][]>(() => {
    return sideQuests.map((_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const yBase = 1.5 + i * 1.8;
      const x = side * (4.5 + Math.sin(i * 1.2) * 0.8);
      const z = -2 - i * 1.5;
      return [x, yBase, z];
    });
  }, [sideQuests]);

  return (
    <>
      <ambientLight intensity={0.35} color="#ffecd2" />
      <directionalLight position={[6, 14, 8]} intensity={1.2} color="#fff5e6" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-far={30} shadow-camera-near={1} />
      <pointLight position={[-4, 8, -3]} intensity={0.5} color="#ffaa44" distance={20} decay={2} />
      <pointLight position={[3, 2, 5]} intensity={0.4} color="#88bbff" distance={15} decay={2} />
      <spotLight position={[0, 12, 0]} angle={0.5} penumbra={0.8} intensity={0.6} color="#ffd699" castShadow />
      <hemisphereLight color="#ffe8cc" groundColor="#5a4a3a" intensity={0.5} />

      <EarthGlobe />
      <CompassRose />
      <Clouds />

      {/* Ladders */}
      {nodes.map((_, i) => {
        if (i === 0) return null;
        return <Ladder key={`ladder-${i}`} from={positions[i - 1]} to={positions[i]} completed={nodes[i - 1].status === "completed"} />;
      })}

      {/* Main Quest Platforms */}
      {nodes.map((node, i) => (
        <Platform key={node.id} node={node} position={positions[i]} index={i} onSelect={onSelect} isSelected={selectedId === node.id} _totalNodes={nodes.length} />
      ))}

      {/* Side Quest Balloons */}
      {sideQuests.map((sq, i) => (
        <HotAirBalloon key={sq.id} node={sq} position={balloonPositions[i]} index={i} onSelect={onSelect} isSelected={selectedId === sq.id} />
      ))}

      <CameraController nodeCount={nodes.length} />
    </>
  );
}

/* ── Exported component ── */
export function QuestPath3D({
  quests,
}: {
  quests: Array<{
    id: string; title: string; status: string; xp_reward: number;
    type: string; description?: string | null;
  }>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { mainNodes, sideQuestNodes } = useMemo(() => {
    const main: QuestNode[] = [];
    const side: QuestNode[] = [];

    const sorted = [...quests].sort((a, b) => {
      const order = { completed: 0, active: 1 };
      const aO = order[a.status as keyof typeof order] ?? 2;
      const bO = order[b.status as keyof typeof order] ?? 2;
      return aO - bO;
    });
    const maxXp = Math.max(...sorted.map((q) => q.xp_reward), 1);

    for (const q of sorted) {
      const node: QuestNode = {
        id: q.id,
        title: q.title.replace(/^[^\w]*/, "").trim(),
        status: (q.status === "completed" ? "completed" : q.status === "active" ? "active" : "locked") as QuestNode["status"],
        xp: q.xp_reward,
        type: (q.type === "sidequest" ? "sidequest" : q.type === "recovery" ? "recovery" : "growth") as QuestNode["type"],
        mastery: q.status === "completed" ? 1.0 : q.xp_reward / maxXp,
      };
      if (q.type === "sidequest") {
        side.push(node);
      } else {
        main.push(node);
      }
    }
    return { mainNodes: main, sideQuestNodes: side };
  }, [quests]);

  const selectedNode = [...mainNodes, ...sideQuestNodes].find((n) => n.id === selectedId);

  return (
    <div className="relative w-full rounded-lg border-2 border-border overflow-hidden" style={{ background: "linear-gradient(180deg, #0a1628 0%, #1a2a4a 40%, #2a4a6a 70%, #3a6a8a 100%)" }}>
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border bg-card/90 backdrop-blur-sm">
        <span className="font-pixel text-[9px] text-foreground">🧭 ATLAS QUEST TRAIL</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-[#44ff88] inline-block shadow-[0_0_4px_#44ff88]" /> Done</span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-[#bb88ff] inline-block shadow-[0_0_4px_#bb88ff]" /> Active</span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-[#ff6644] inline-block shadow-[0_0_4px_#ff6644]" /> Recovery</span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-[#f39c12] inline-block shadow-[0_0_4px_#f39c12]" /> 🎈 Side</span>
        </div>
      </div>

      <div style={{ height: "480px", width: "100%" }}>
        <Canvas camera={{ position: [6, 3, 10], fov: 42 }} shadows dpr={[1, 1.5]}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
          <Suspense fallback={null}>
            <color attach="background" args={["#0a1628"]} />
            <fog attach="fog" args={["#0a1628", 16, 32]} />
            <QuestScene nodes={mainNodes} sideQuests={sideQuestNodes} selectedId={selectedId} onSelect={setSelectedId} />
          </Suspense>
        </Canvas>
      </div>

      {selectedNode && (
        <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t-2 border-border p-3 cursor-pointer animate-fade-in" onClick={() => setSelectedId(null)}>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full shrink-0 shadow-lg ${
              selectedNode.type === "sidequest" ? "bg-[#f39c12] shadow-[0_0_8px_#f39c12]"
              : selectedNode.status === "completed" ? "bg-[#44ff88] shadow-[0_0_8px_#44ff88]"
              : selectedNode.type === "recovery" ? "bg-[#ff6644] shadow-[0_0_8px_#ff6644]"
              : "bg-[#bb88ff] shadow-[0_0_8px_#bb88ff]"
            }`} />
            <span className="font-pixel text-[10px] text-foreground truncate">
              {selectedNode.type === "sidequest" ? "🎈 " : ""}{selectedNode.title}
            </span>
            <span className="font-pixel text-[10px] text-[#FFD700] ml-auto shrink-0 drop-shadow-[0_0_4px_#FFD700]">+{selectedNode.xp} XP</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedNode.type === "sidequest"
              ? `🎈 Side Quest — Bonus knowledge to explore!`
              : selectedNode.status === "completed"
              ? `★ Completed! Mastery: ${Math.round(selectedNode.mastery * 100)}%`
              : `⚔ In Progress — Mastery: ${Math.round(selectedNode.mastery * 100)}%`}
          </p>
        </div>
      )}
    </div>
  );
}
