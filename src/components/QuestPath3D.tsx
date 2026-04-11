import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface QuestNode {
  id: string;
  title: string;
  status: "completed" | "active" | "locked";
  xp: number;
  type: "recovery" | "growth";
}

/* ── Single cozy island platform ── */
function Platform({
  node,
  position,
  index,
  onSelect,
  isSelected,
}: {
  node: QuestNode;
  position: [number, number, number];
  index: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const colors = useMemo(() => {
    if (node.status === "completed") return { base: "#5b8c5a", top: "#7ec87e", emissive: "#3a6b3a", accent: "#b8e6b8" };
    if (node.status === "active" && node.type === "recovery") return { base: "#c0392b", top: "#e67e73", emissive: "#8b2020", accent: "#f5b7b1" };
    if (node.status === "active") return { base: "#8e6bbf", top: "#b794e6", emissive: "#6a4d9e", accent: "#d4b8f0" };
    return { base: "#7f8c8d", top: "#a0aeb0", emissive: "#5a6566", accent: "#bdc3c7" };
  }, [node]);

  const emoji = node.status === "completed" ? "★" : node.status === "active" ? "⚔" : "?";

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + index * 0.9) * 0.06;
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.1}>
        <group
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        >
          {/* Base stone/earth layers */}
          <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.9, 1.1, 0.4, 8]} />
            <meshStandardMaterial color="#6b5b4f" roughness={0.9} metalness={0.05} />
          </mesh>
          <mesh position={[0, -0.08, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 0.9, 0.25, 8]} />
            <meshStandardMaterial color="#8b7355" roughness={0.85} metalness={0.05} />
          </mesh>

          {/* Grassy top */}
          <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.88, 0.85, 0.15, 8]} />
            <meshStandardMaterial
              color={hovered || isSelected ? colors.accent : colors.top}
              emissive={colors.emissive}
              emissiveIntensity={hovered || isSelected ? 0.35 : 0.1}
              roughness={0.7}
              metalness={0.05}
            />
          </mesh>

          {/* Little flag/marker on top */}
          {node.status === "completed" && (
            <group position={[0.3, 0.18, 0.3]}>
              {/* Flag pole */}
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
                <meshStandardMaterial color="#8b6914" roughness={0.6} />
              </mesh>
              {/* Flag */}
              <mesh position={[0.12, 0.42, 0]}>
                <boxGeometry args={[0.2, 0.12, 0.02]} />
                <meshStandardMaterial color="#e6c843" emissive="#c4a000" emissiveIntensity={0.3} />
              </mesh>
            </group>
          )}

          {/* Tiny bushes / decoration */}
          <mesh position={[-0.4, 0.22, 0.3]}>
            <sphereGeometry args={[0.12, 6, 6]} />
            <meshStandardMaterial color={colors.base} roughness={0.8} />
          </mesh>
          <mesh position={[0.5, 0.2, -0.2]}>
            <sphereGeometry args={[0.09, 6, 6]} />
            <meshStandardMaterial color={colors.base} roughness={0.8} />
          </mesh>

          {/* Glow orb for active quests */}
          {node.status === "active" && (
            <GlowOrb position={[0, 0.55, 0]} color={colors.accent} />
          )}
        </group>

        {/* XP label floating above */}
        <Text
          position={[0, 0.75, 0]}
          fontSize={0.14}
          color={colors.accent}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {`+${node.xp} XP`}
        </Text>
      </Float>

      {/* Soft ground shadow circle */}
      <mesh position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} />
      </mesh>

      {node.status === "completed" && <FloatingSparkles color={colors.accent} />}
    </group>
  );
}

/* ── Pulsing glow orb for active platforms ── */
function GlowOrb({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const s = 0.12 + Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
    ref.current.scale.set(s * 10, s * 10, s * 10);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.01, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

/* ── Gentle sparkles ── */
function FloatingSparkles({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(8 * 3);
    for (let i = 0; i < 8; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.2;
      arr[i * 3 + 1] = Math.random() * 0.6 + 0.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    return arr;
  }, []);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.15;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/* ── Ladder connecting two platforms at different heights ── */
function Ladder({
  from,
  to,
  completed,
}: {
  from: [number, number, number];
  to: [number, number, number];
  completed: boolean;
}) {
  const ladderParts = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const dir = end.clone().sub(start);
    const length = dir.length();
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const angle = Math.atan2(dir.x, dir.z);
    const pitch = Math.atan2(dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z));

    const rungCount = Math.max(3, Math.floor(length / 0.45));
    const rungs: THREE.Vector3[] = [];
    for (let i = 0; i <= rungCount; i++) {
      const t = i / rungCount;
      rungs.push(start.clone().lerp(end.clone(), t));
    }

    return { mid, angle, pitch, length, rungs, start, end, dir };
  }, [from, to]);

  const woodColor = completed ? "#a0785a" : "#7a6552";
  const ropeColor = completed ? "#c4a97d" : "#8a7a6a";

  return (
    <group>
      {/* Two side rails */}
      {[-0.12, 0.12].map((offset, idx) => {
        const railStart = new THREE.Vector3(
          from[0] + Math.cos(Math.atan2(to[0] - from[0], to[2] - from[2]) + Math.PI / 2) * offset,
          from[1],
          from[2] + Math.sin(Math.atan2(to[0] - from[0], to[2] - from[2]) + Math.PI / 2) * offset * -1
        );
        const railEnd = new THREE.Vector3(
          to[0] + Math.cos(Math.atan2(to[0] - from[0], to[2] - from[2]) + Math.PI / 2) * offset,
          to[1],
          to[2] + Math.sin(Math.atan2(to[0] - from[0], to[2] - from[2]) + Math.PI / 2) * offset * -1
        );
        const railMid = railStart.clone().add(railEnd).multiplyScalar(0.5);
        const railDir = railEnd.clone().sub(railStart);
        const railLen = railDir.length();

        return (
          <mesh
            key={`rail-${idx}`}
            position={[railMid.x, railMid.y, railMid.z]}
            rotation={[
              Math.atan2(railDir.y, Math.sqrt(railDir.x * railDir.x + railDir.z * railDir.z)),
              Math.atan2(railDir.x, railDir.z),
              0,
            ]}
          >
            <cylinderGeometry args={[0.025, 0.025, railLen, 4]} />
            <meshStandardMaterial color={woodColor} roughness={0.85} />
          </mesh>
        );
      })}

      {/* Rungs */}
      {ladderParts.rungs.map((pos, i) => {
        const crossDir = new THREE.Vector3(to[0] - from[0], 0, to[2] - from[2])
          .normalize()
          .cross(new THREE.Vector3(0, 1, 0))
          .normalize();
        return (
          <mesh
            key={`rung-${i}`}
            position={[pos.x, pos.y, pos.z]}
            rotation={[0, Math.atan2(crossDir.x, crossDir.z) + Math.PI / 2, 0]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.24, 4]} />
            <meshStandardMaterial color={ropeColor} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Background clouds ── */
function Clouds() {
  const cloudsData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      pos: [(Math.random() - 0.5) * 12, 3 + Math.random() * 2, -4 - Math.random() * 8] as [number, number, number],
      scale: 0.5 + Math.random() * 0.8,
      speed: 0.05 + Math.random() * 0.08,
    })), []);

  return (
    <>
      {cloudsData.map((c, i) => (
        <CloudPuff key={i} position={c.pos} scale={c.scale} speed={c.speed} />
      ))}
    </>
  );
}

function CloudPuff({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 1.5;
    }
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#f0e6d3" roughness={1} transparent opacity={0.6} /></mesh>
      <mesh position={[0.35, 0.08, 0]}><sphereGeometry args={[0.35, 8, 8]} /><meshStandardMaterial color="#f0e6d3" roughness={1} transparent opacity={0.5} /></mesh>
      <mesh position={[-0.3, 0.05, 0.1]}><sphereGeometry args={[0.4, 8, 8]} /><meshStandardMaterial color="#ede0cc" roughness={1} transparent opacity={0.55} /></mesh>
    </group>
  );
}

/* ── The full 3D scene ── */
function QuestScene({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: QuestNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  // Arrange in a winding vertical path — each platform higher than the last
  const positions = useMemo<[number, number, number][]>(() => {
    return nodes.map((_, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const xDir = row % 2 === 0 ? 1 : -1;
      const x = (col === 0 ? -1.2 : 1.2) * xDir;
      const z = -row * 1.8;
      const y = i * 0.7; // ascending height!
      return [x, y, z];
    });
  }, [nodes]);

  return (
    <>
      {/* Warm cozy lighting */}
      <ambientLight intensity={0.55} color="#ffecd2" />
      <directionalLight position={[4, 10, 5]} intensity={0.9} color="#fff5e6" castShadow />
      <pointLight position={[-3, 6, -2]} intensity={0.3} color="#c4a97d" />
      <hemisphereLight color="#ffecd2" groundColor="#8b7355" intensity={0.4} />

      <Clouds />

      {/* Ladders between platforms */}
      {nodes.map((node, i) => {
        if (i === 0) return null;
        const prevCompleted = nodes[i - 1].status === "completed";
        return (
          <Ladder
            key={`ladder-${i}`}
            from={positions[i - 1]}
            to={positions[i]}
            completed={prevCompleted}
          />
        );
      })}

      {/* Platforms */}
      {nodes.map((node, i) => (
        <Platform
          key={node.id}
          node={node}
          position={positions[i]}
          index={i}
          onSelect={onSelect}
          isSelected={selectedId === node.id}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 8}
        target={[0, nodes.length * 0.35, -Math.floor(nodes.length / 2) * 0.9]}
      />
    </>
  );
}

/* ── Exported component ── */
export function QuestPath3D({
  quests,
}: {
  quests: Array<{
    id: string;
    title: string;
    status: string;
    xp_reward: number;
    type: string;
    description?: string | null;
  }>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes: QuestNode[] = useMemo(() => {
    const sorted = [...quests].sort((a, b) => {
      const order = { completed: 0, active: 1 };
      const aO = order[a.status as keyof typeof order] ?? 2;
      const bO = order[b.status as keyof typeof order] ?? 2;
      return aO - bO;
    });
    return sorted.map((q) => ({
      id: q.id,
      title: q.title.replace(/^[^\w]*/, "").trim(),
      status: (q.status === "completed" ? "completed" : q.status === "active" ? "active" : "locked") as QuestNode["status"],
      xp: q.xp_reward,
      type: (q.type === "recovery" ? "recovery" : "growth") as QuestNode["type"],
    }));
  }, [quests]);

  const selectedNode = nodes.find((n) => n.id === selectedId);

  return (
    <div className="relative w-full rounded-lg border-2 border-border overflow-hidden" style={{ background: "linear-gradient(180deg, #87CEEB 0%, #b8d8f0 30%, #ffecd2 80%, #e8d5b7 100%)" }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border bg-card/90 backdrop-blur-sm">
        <span className="font-pixel text-[9px] text-foreground">🏔️ QUEST TRAIL</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#5b8c5a] inline-block" /> Done
          </span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#8e6bbf] inline-block" /> Active
          </span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#c0392b] inline-block" /> Recovery
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ height: "380px", width: "100%" }}>
        <Canvas
          camera={{ position: [4, 4, 8], fov: 45 }}
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={["#87CEEB"]} />
            <fog attach="fog" args={["#c8dff0", 12, 22]} />
            <QuestScene nodes={nodes} selectedId={selectedId} onSelect={setSelectedId} />
          </Suspense>
        </Canvas>
      </div>

      {/* Selected quest detail overlay */}
      {selectedNode && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t-2 border-border p-3 cursor-pointer animate-fade-in"
          onClick={() => setSelectedId(null)}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                selectedNode.status === "completed"
                  ? "bg-[#5b8c5a]"
                  : selectedNode.type === "recovery"
                  ? "bg-[#c0392b]"
                  : "bg-[#8e6bbf]"
              }`}
            />
            <span className="font-pixel text-[10px] text-foreground truncate">{selectedNode.title}</span>
            <span className="font-pixel text-[9px] text-warning ml-auto shrink-0">+{selectedNode.xp} XP</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedNode.status === "completed" ? "★ Completed!" : "⚔ In Progress — tap to dismiss"}
          </p>
        </div>
      )}
    </div>
  );
}
