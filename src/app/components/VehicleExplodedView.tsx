import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
  Float,
} from '@react-three/drei';
import * as THREE from 'three';

// 车辆部件定义 — 后续替换为真实 GLB 模型的子网格
const PARTS = [
  {
    id: 'chassis',
    name: '车身底盘',
    color: '#4a4a4a',
    basePos: [0, 0, 0] as [number, number, number],
    explodedPos: [0, -1.5, 0] as [number, number, number],
    size: [3.2, 0.3, 1.6] as [number, number, number],
    description: '加固型越野底盘 · 承载 2.5T',
  },
  {
    id: 'body',
    name: '车厢主体',
    color: '#e8e0d0',
    basePos: [0, 0.8, 0] as [number, number, number],
    explodedPos: [0, 0.8, 0] as [number, number, number],
    size: [2.8, 1.2, 1.5] as [number, number, number],
    description: '铝合金框架 · 保温隔热层',
  },
  {
    id: 'solar',
    name: '太阳能板组',
    color: '#1a3a5c',
    basePos: [0, 1.6, 0] as [number, number, number],
    explodedPos: [0, 3.5, 0] as [number, number, number],
    size: [2.6, 0.08, 1.4] as [number, number, number],
    description: '2×800W 可折叠 · JA Solar',
  },
  {
    id: 'server',
    name: 'AI 服务器',
    color: '#2dd4bf',
    basePos: [-0.6, 0.8, 0] as [number, number, number],
    explodedPos: [-2.8, 0.8, 0] as [number, number, number],
    size: [0.6, 0.8, 0.5] as [number, number, number],
    description: '4×L40 GPU · 80GB VRAM',
  },
  {
    id: 'battery',
    name: '储能电池组',
    color: '#f3d230',
    basePos: [0.8, 0.3, 0] as [number, number, number],
    explodedPos: [2.8, -0.5, 0] as [number, number, number],
    size: [0.8, 0.5, 1.0] as [number, number, number],
    description: 'LiFePO₄ 2000Ah · 磷酸铁锂',
  },
  {
    id: 'printer',
    name: '3D 打印机',
    color: '#f97316',
    basePos: [0.6, 0.8, 0.3] as [number, number, number],
    explodedPos: [2.8, 1.8, 1.5] as [number, number, number],
    size: [0.5, 0.5, 0.5] as [number, number, number],
    description: 'Bambu Lab X1C · 多色打印',
  },
  {
    id: 'antenna',
    name: '卫星天线',
    color: '#a78bfa',
    basePos: [0, 1.7, -0.5] as [number, number, number],
    explodedPos: [0, 4.2, -2.0] as [number, number, number],
    size: [0.4, 0.05, 0.4] as [number, number, number],
    description: 'Starlink Gen 3 · 低轨卫星',
  },
  {
    id: 'wheels',
    name: '越野轮组',
    color: '#333333',
    basePos: [0, -0.3, 0] as [number, number, number],
    explodedPos: [0, -3.0, 0] as [number, number, number],
    size: [3.4, 0.1, 2.0] as [number, number, number],
    description: 'BFGoodrich AT · 33 inch',
  },
];

interface PartMeshProps {
  part: (typeof PARTS)[number];
  exploded: boolean;
  hovered: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  selected: string | null;
}

function PartMesh({ part, exploded, hovered, onHover, onClick, selected }: PartMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useMemo(
    () => new THREE.Vector3(...(exploded ? part.explodedPos : part.basePos)),
    [exploded, part],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(targetPos, 0.06);

    // 高亮效果
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const isActive = hovered === part.id || selected === part.id;
    const targetEmissiveIntensity = isActive ? 0.3 : 0;
    mat.emissiveIntensity += (targetEmissiveIntensity - mat.emissiveIntensity) * 0.1;
  });

  const isSelected = selected === part.id;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={part.basePos}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(part.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(part.id);
        }}
        castShadow
        receiveShadow
      >
        {part.id === 'antenna' ? (
          <cylinderGeometry args={[0.2, 0.25, 0.05, 16]} />
        ) : part.id === 'wheels' ? (
          <boxGeometry args={part.size} />
        ) : (
          <boxGeometry args={part.size} />
        )}
        <meshStandardMaterial
          color={part.color}
          roughness={0.4}
          metalness={0.3}
          emissive={part.color}
          emissiveIntensity={0}
          transparent
          opacity={hovered && hovered !== part.id ? 0.4 : 1}
        />
      </mesh>

      {/* 选中部件的标注 */}
      {isSelected && exploded && (
        <Html
          position={exploded ? part.explodedPos : part.basePos}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-200 whitespace-nowrap">
            <div className="text-sm font-semibold text-gray-900">{part.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{part.description}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({
  exploded,
  hovered,
  onHover,
  selected,
  onSelect,
}: {
  exploded: boolean;
  hovered: string | null;
  onHover: (id: string | null) => void;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} />

      {PARTS.map((part) => (
        <PartMesh
          key={part.id}
          part={part}
          exploded={exploded}
          hovered={hovered}
          onHover={onHover}
          onClick={(id) => onSelect(selected === id ? null : id)}
          selected={selected}
        />
      ))}

      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />
      <Environment preset="city" />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

export function VehicleExplodedView() {
  const [exploded, setExploded] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const hoveredPart = PARTS.find((p) => p.id === hovered);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
      {/* 3D Canvas */}
      <div className="w-full h-[500px] md:h-[600px]">
        <Canvas
          shadows
          camera={{ position: [5, 3, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          onPointerMissed={() => setSelected(null)}
        >
          <Scene
            exploded={exploded}
            hovered={hovered}
            onHover={setHovered}
            selected={selected}
            onSelect={setSelected}
          />
        </Canvas>
      </div>

      {/* 控制面板 */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        {/* 爆炸/组装切换 */}
        <button
          onClick={() => {
            setExploded((v) => !v);
            setSelected(null);
          }}
          className="bg-white/90 backdrop-blur-sm rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-white transition-colors duration-200 cursor-pointer flex items-center gap-2"
        >
          <span className={`inline-block w-2 h-2 rounded-full ${exploded ? 'bg-[#f3d230]' : 'bg-gray-400'}`} />
          {exploded ? '组装复原' : '爆炸拆解'}
        </button>

        {/* Hover 提示 */}
        {hoveredPart && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-700 shadow-sm">
            {hoveredPart.name}
          </div>
        )}

        {/* 操作提示 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-gray-400 shadow-sm hidden md:block">
          拖拽旋转 · 滚轮缩放 · 点击查看
        </div>
      </div>
    </div>
  );
}
