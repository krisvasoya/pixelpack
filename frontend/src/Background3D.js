import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

function Stars({ status, ...props }) {
  const ref = useRef();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  useFrame((state, delta) => {
    const speed = status === 'crawling' ? 15 : 1;
    ref.current.rotation.x -= delta / (10 / speed);
    ref.current.rotation.y -= delta / (15 / speed);
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#00e5ff"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function FileNebula({ breakdown, active }) {
  const groupRef = useRef();
  
  const nebulaLayers = useMemo(() => {
    if (!breakdown) return [];
    const layers = [
      { key: 'js',     color: '#facc15', size: 0.012 }, // Gold
      { key: 'css',    color: '#3b82f6', size: 0.012 }, // Blue
      { key: 'images', color: '#10b981', size: 0.012 }, // Green
      { key: 'other',  color: '#7c3aed', size: 0.010 }, // Purple
    ];

    return layers.map(layer => {
      const count = layer.key === 'other' 
        ? Object.values(breakdown).reduce((a, b) => a + b, 0) / 4 // Fallback
        : breakdown[layer.key] || 0;
      
      const p = new Float32Array(Math.min(count, 1000) * 3);
      for (let i = 0; i < p.length; i++) {
        p[i] = (Math.random() - 0.5) * 0.5;
      }
      return { ...layer, points: p };
    });
  }, [breakdown]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.z += delta * 0.05;
    }
  });

  if (!active || !breakdown) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0.5]}>
      {nebulaLayers.map((layer, i) => (
        <Points key={i} positions={layer.points} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color={layer.color}
            size={layer.size}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      ))}
    </group>
  );
}

const Background3D = ({ status, stats }) => {
  return (
    <div className="background-3d">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars status={status} />
        <FileNebula breakdown={stats?.breakdown} active={status === 'complete'} />
      </Canvas>
    </div>
  );
};

export default Background3D;
