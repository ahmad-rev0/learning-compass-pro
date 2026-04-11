import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type WizardMood = "idle" | "pointing" | "celebrating" | "concerned" | "thinking";

/* ── Procedural 3D Wizard Cartographer ── */
function WizardModel({ mood }: { mood: WizardMood }) {
  const groupRef = useRef<THREE.Group>(null);
  const staffRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const hatGlowRef = useRef<THREE.Mesh>(null);

  const colors = useMemo(() => ({
    robe: "#2a3a6b",
    robeAccent: "#3a4a8b",
    skin: "#f5d0a9",
    hat: "#1a2a5b",
    hatBand: "#c4a97d",
    staff: "#8b6914",
    staffGem: "#44ffaa",
    beard: "#e8e0d0",
    eyes: "#1a1a2e",
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Idle bobbing
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.06;

    // Staff animation based on mood
    if (staffRef.current) {
      if (mood === "pointing") {
        staffRef.current.rotation.z = THREE.MathUtils.lerp(
          staffRef.current.rotation.z,
          -0.6 + Math.sin(t * 2) * 0.08,
          0.05
        );
      } else if (mood === "celebrating") {
        staffRef.current.rotation.z = Math.sin(t * 4) * 0.3;
        staffRef.current.position.y = 0.1 + Math.abs(Math.sin(t * 3)) * 0.15;
      } else if (mood === "concerned") {
        staffRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;
      } else {
        staffRef.current.rotation.z = THREE.MathUtils.lerp(
          staffRef.current.rotation.z,
          Math.sin(t * 0.6) * 0.08,
          0.03
        );
      }
    }

    // Arm pointing gesture
    if (armRef.current) {
      if (mood === "pointing") {
        armRef.current.rotation.z = THREE.MathUtils.lerp(
          armRef.current.rotation.z,
          -1.2 + Math.sin(t * 1.5) * 0.1,
          0.04
        );
      } else {
        armRef.current.rotation.z = THREE.MathUtils.lerp(
          armRef.current.rotation.z,
          0,
          0.04
        );
      }
    }

    // Hat glow pulse
    if (hatGlowRef.current) {
      const intensity = mood === "celebrating" ? 0.6 + Math.sin(t * 5) * 0.3
        : mood === "concerned" ? 0.2 + Math.sin(t * 2) * 0.1
        : 0.3 + Math.sin(t * 1.5) * 0.15;
      (hatGlowRef.current.material as THREE.MeshBasicMaterial).opacity = intensity;
    }

    // Body sway
    groupRef.current.rotation.z = Math.sin(t * 0.7) * 0.03;
    if (mood === "thinking") {
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    } else if (mood === "pointing") {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -0.3,
        0.03
      );
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.sin(t * 0.3) * 0.1,
        0.02
      );
    }
  });

  return (
    <group ref={groupRef} scale={1.1}>
      {/* Body / Robe */}
      <mesh position={[0, -0.15, 0]}>
        <coneGeometry args={[0.32, 0.7, 8]} />
        <meshStandardMaterial color={colors.robe} roughness={0.7} />
      </mesh>
      {/* Robe trim */}
      <mesh position={[0, -0.48, 0]}>
        <torusGeometry args={[0.31, 0.03, 6, 16]} />
        <meshStandardMaterial color={colors.hatBand} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={colors.skin} roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.06, 0.3, 0.16]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={colors.eyes} />
      </mesh>
      <mesh position={[0.06, 0.3, 0.16]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={colors.eyes} />
      </mesh>
      {/* Eye highlights */}
      <mesh position={[-0.05, 0.31, 0.18]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.07, 0.31, 0.18]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Beard */}
      <mesh position={[0, 0.15, 0.1]}>
        <coneGeometry args={[0.1, 0.25, 6]} />
        <meshStandardMaterial color={colors.beard} roughness={0.9} />
      </mesh>

      {/* Wizard Hat */}
      <mesh position={[0, 0.55, -0.02]} rotation={[0.1, 0, 0]}>
        <coneGeometry args={[0.2, 0.45, 8]} />
        <meshStandardMaterial color={colors.hat} roughness={0.6} />
      </mesh>
      {/* Hat brim */}
      <mesh position={[0, 0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.26, 12]} />
        <meshStandardMaterial color={colors.hat} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Hat band */}
      <mesh position={[0, 0.42, 0]}>
        <torusGeometry args={[0.19, 0.02, 6, 12]} />
        <meshStandardMaterial color={colors.hatBand} roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Hat star/compass */}
      <mesh ref={hatGlowRef} position={[0, 0.5, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={colors.staffGem} transparent opacity={0.4} />
      </mesh>

      {/* Left arm (pointing arm) */}
      <group ref={armRef} position={[-0.25, 0.05, 0]}>
        <mesh rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.04, 0.25, 4, 6]} />
          <meshStandardMaterial color={colors.robeAccent} roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[-0.05, -0.18, 0]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={colors.skin} roughness={0.6} />
        </mesh>
      </group>

      {/* Right arm + Staff */}
      <group ref={staffRef} position={[0.28, 0.05, 0]}>
        <mesh rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.04, 0.2, 4, 6]} />
          <meshStandardMaterial color={colors.robeAccent} roughness={0.7} />
        </mesh>
        {/* Staff */}
        <mesh position={[0.05, -0.1, 0]} rotation={[0, 0, -0.1]}>
          <cylinderGeometry args={[0.025, 0.02, 0.9, 6]} />
          <meshStandardMaterial color={colors.staff} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Staff gem (compass orb) */}
        <mesh position={[0.05, 0.35, 0]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            color={colors.staffGem}
            emissive={colors.staffGem}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>
        {/* Staff gem glow */}
        <mesh position={[0.05, 0.35, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color={colors.staffGem} transparent opacity={0.15} />
        </mesh>
      </group>

      {/* Celebrating sparkles */}
      {mood === "celebrating" && <CelebrationParticles />}
    </group>
  );
}

function CelebrationParticles() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(30 * 3);
    for (let i = 0; i < 30; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.2;
      arr[i * 3 + 1] = Math.random() * 1.0 - 0.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.5;
    const posArr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 30; i++) {
      posArr[i * 3 + 1] += Math.sin(t * 3 + i) * 0.005;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#FFD700" transparent opacity={0.8} />
    </points>
  );
}

/* ── Exported canvas wrapper ── */
export function WizardAvatar3DCanvas({ mood = "idle" }: { mood?: WizardMood }) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 2.2], fov: 35 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} color="#ffecd2" />
      <directionalLight position={[2, 3, 2]} intensity={1.0} color="#fff5e6" />
      <pointLight position={[-1, 1, 1]} intensity={0.4} color="#88bbff" distance={5} />
      <WizardModel mood={mood} />
    </Canvas>
  );
}

export type { WizardMood };
