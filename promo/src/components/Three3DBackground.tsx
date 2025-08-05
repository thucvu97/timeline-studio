import { Float, OrbitControls, Sphere } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"

function FloatingOrb() {
  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

export function Three3DBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <FloatingOrb />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}