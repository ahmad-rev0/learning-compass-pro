import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface QuestNode {
  id: string;
  title: string;
  status: "completed" | "active" | "locked";
  xp: number;
  type: "recovery" | "growth";
}

/* ── Single floating platform ── */
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
    if (node.status === "completed") return { base: "#22c55e", glow: "#4ade80", emissive: "#16a34a" };
    if (node.status === "active" && node.type === "recovery") return { base: "#ef4444", glow: "#f87171", emissive: "#dc2626" };
    if (node.status === "active") return { base: "#a855f7", glow: "#c084fc", emissive: "#9333ea" };
    return { base: "#6b7280", glow: "#9ca3af", emissive: "#4b5563" };
  }, [node]);

  const emoji = node.status === "completed" ? "✓" : node.status === "active" ? "!" : "?";

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Gentle bob
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8 + index * 1.2) * 0.12;
    // Scale pulse for active
    if (node.status === "active") {
      const s = 1 + Math.sin(t * 2 + index) * 0.05;
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.2}>
        {/* Platform box */}
        <mesh
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.4, 0.3, 1.4]} />
          <meshStandardMaterial
            color={hovered || isSelected ? colors.glow : colors.base}
            emissive={colors.emissive}
            emissiveIntensity={hovered || isSelected ? 0.6 : 0.25}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>

        {/* Top face detail — slightly raised inner platform */}
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[1.0, 0.04, 1.0]} />
          <meshStandardMaterial
            color={colors.glow}
            emissive={colors.emissive}
            emissiveIntensity={0.4}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>

        {/* Icon on top */}
        <Text
          position={[0, 0.35, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {emoji}
        </Text>

        {/* XP label */}
        <Text
          position={[0, -0.05, 0.75]}
          fontSize={0.13}
          color="white"
          anchorX="center"
          anchorY="middle"
          rotation={[-0.3, 0, 0]}
        >
          {`+${node.xp} XP`}
        </Text>
      </Float>

      {/* Glow ring for active/selected */}
      {(node.status === "active" || isSelected) && (
        <GlowRing color={colors.glow} />
      )}

      {/* Completion sparkles */}
      {node.status === "completed" && <CompletionParticles color={colors.glow} />}
    </group>
  );
}

function GlowRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.5;
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      ref.current.scale.set(s, s, s);
    }
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.9, 0.03, 8, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
}

/* ── Small sparkle particles around completed platforms ── */
function CompletionParticles({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);
  const count = 12;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.6;
      arr[i * 3 + 1] = Math.random() * 0.8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={color} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

/* ── Connecting path between platforms ── */
function PathConnector({
  from,
  to,
  completed,
}: {
  from: [number, number, number];
  to: [number, number, number];
  completed: boolean;
}) {
  const geometry = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      Math.max(from[1], to[1]) + 0.5,
      (from[2] + to[2]) / 2,
    ];
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
    const points = curve.getPoints(20);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [from, to]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color={completed ? "#22c55e" : "#6b7280"}
        transparent
        opacity={completed ? 0.8 : 0.3}
      />
    </line>
  );
}

/* ── Background grid ── */
function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -3]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a1a2e" transparent opacity={0.3} />
    </mesh>
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
  const positions = useMemo<[number, number, number][]>(() => {
    return nodes.map((_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const xDir = row % 2 === 0 ? 1 : -1;
      const x = (col - 1) * 2.2 * xDir;
      const z = -row * 2.5;
      const y = 0;
      return [x, y, z];
    });
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
      <pointLight position={[-3, 4, -2]} intensity={0.5} color="#a855f7" />
      <pointLight position={[3, 3, 2]} intensity={0.3} color="#22c55e" />

      <GridFloor />

      {/* Connectors */}
      {nodes.map((node, i) => {
        if (i === 0) return null;
        const prevCompleted = nodes[i - 1].status === "completed";
        return (
          <PathConnector
            key={`path-${i}`}
            from={positions[i - 1]}
            to={positions[i]}
            completed={prevCompleted && node.status === "completed"}
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
        maxDistance={14}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        target={[0, 0, -2]}
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
    <div className="relative w-full rounded-lg border-2 border-border overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(240 20% 12%) 0%, hsl(260 25% 18%) 100%)" }}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border bg-card">
        <span className="font-pixel text-[9px] text-foreground">🗺️ QUEST PATH</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" /> Done
          </span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#a855f7] inline-block" /> Active
          </span>
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" /> Recovery
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ height: "340px", width: "100%" }}>
        <Canvas
          camera={{ position: [0, 5, 7], fov: 50 }}
          shadows
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={["#1a1a2e"]} />
            <fog attach="fog" args={["#1a1a2e", 8, 18]} />
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
                  ? "bg-[#22c55e]"
                  : selectedNode.type === "recovery"
                  ? "bg-[#ef4444]"
                  : "bg-[#a855f7]"
              }`}
            />
            <span className="font-pixel text-[10px] text-foreground truncate">{selectedNode.title}</span>
            <span className="font-pixel text-[9px] text-warning ml-auto shrink-0">+{selectedNode.xp} XP</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedNode.status === "completed" ? "✅ Completed" : "⚔️ In Progress — click background to dismiss"}
          </p>
        </div>
      )}
    </div>
  );
}
