import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Html, useProgress, Float, Stars, Sparkles } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { items } from './data';
import * as THREE from 'three';

// --- Loading Component ---
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center w-64">
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-neon-blue transition-all duration-200" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-display tracking-widest text-neon-blue">
          INITIALIZING ASSETS... {Math.round(progress)}%
        </p>
      </div>
    </Html>
  );
}

// --- 3D Model Component ---
function Model({ file, scale, position, isVisible }) {
  const { scene } = useGLTF(`/models/${file}`);
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      // Gentle floating rotation
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      // Mouse interaction parallax
      const x = (state.mouse.x * 0.5);
      const y = (state.mouse.y * 0.5);
      ref.current.rotation.x = y * 0.2;
      ref.current.rotation.z = x * 0.1;
    }
  });

  return (
    <group ref={ref} dispose={null}>
      <AnimatePresence>
        {isVisible && (
          <mesh position={position} scale={scale}>
             <primitive object={scene} />
          </mesh>
        )}
      </AnimatePresence>
    </group>
  );
}

// --- Main Scene ---
function Experience({ currentItem }) {
  return (
    <>
      <color attach="background" args={['#050505']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={10} color="#00f3ff" />
      <pointLight position={[-10, -10, -10]} intensity={5} color="#b026ff" />
      
      {/* Environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={10} size={2} speed={0.4} opacity={0.5} color="#00f3ff" />
      <Environment preset="city" />

      {/* Models */}
      <Suspense fallback={<Loader />}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {items.map((item, index) => (
             index === currentItem ? (
               <Model 
                 key={item.id}
                 file={item.file} 
                 scale={item.scale} 
                 position={item.position}
                 isVisible={true}
               />
             ) : null
          ))}
        </Float>
      </Suspense>

      <ContactShadows resolution={1024} scale={50} blur={2.5} opacity={0.5} far={10} color="#000000" />
    </>
  );
}

// --- UI Overlay ---
function Overlay({ currentItem, setIndex, total }) {
  const item = items[currentItem];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-16 z-10">
      
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tighter">
            ARMORY<span className="text-neon-blue">.AI</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest">DIGITAL ASSET PROTOCOL</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-mono text-neon-green">SYS.STATUS: ONLINE</p>
          <p className="text-xs font-mono text-gray-500">V.2.0.45</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row items-end md:items-center justify-between w-full h-full mt-10">
        
        {/* Left: Info */}
        <div className="w-full md:w-1/3 mb-10 md:mb-0 pointer-events-auto">
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-xs font-mono border border-neon-blue text-neon-blue px-2 py-1 rounded">
                TYPE: {item.type.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-gray-500">ID: #{String(item.id).padStart(3, '0')}</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-display font-black text-white leading-none mb-6 text-glow">
              {item.name.toUpperCase()}
            </h2>
            
            <p className="text-gray-300 font-light leading-relaxed border-l-2 border-neon-purple pl-4 mb-8 max-w-md">
              {item.desc}
            </p>

            <button className="bg-white text-black font-display font-bold py-3 px-8 hover:bg-neon-blue hover:text-black transition-colors duration-300 clip-path-button">
              INSPECT ASSET
            </button>
          </motion.div>
        </div>

        {/* Right: Navigation (Desktop) */}
        <div className="hidden md:flex flex-col items-end space-y-4 pointer-events-auto">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx === currentItem ? 'bg-neon-blue scale-125 shadow-glow' : 'bg-gray-700 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="flex justify-between items-end pointer-events-auto">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setIndex((currentItem - 1 + total) % total)}
            className="group flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-2xl">←</span>
            <span className="text-xs font-display tracking-widest group-hover:text-neon-blue">PREV</span>
          </button>
          
          <div className="h-px w-12 bg-gray-700"></div>
          
          <button 
            onClick={() => setIndex((currentItem + 1) % total)}
            className="group flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-xs font-display tracking-widest group-hover:text-neon-blue">NEXT</span>
            <span className="text-2xl">→</span>
          </button>
        </div>

        <div className="text-right">
          <p className="text-[10rem] font-display font-black text-white opacity-5 absolute bottom-[-3rem] right-[-2rem] pointer-events-none select-none">
            {String(currentItem + 1).padStart(2, '0')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentItem, setCurrentItem] = useState(0);

  // Wheel listener for scroll interaction
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 50) {
        setCurrentItem((prev) => (prev + 1) % items.length);
      } else if (e.deltaY < -50) {
        setCurrentItem((prev) => (prev - 1 + items.length) % items.length);
      }
    };
    
    // Throttling could be added here
    let timeout;
    const throttledWheel = (e) => {
      if (!timeout) {
        handleWheel(e);
        timeout = setTimeout(() => { timeout = null }, 500); // 500ms delay between scrolls
      }
    };

    window.addEventListener('wheel', throttledWheel);
    return () => window.removeEventListener('wheel', throttledWheel);
  }, []);

  return (
    <div className="w-full h-screen relative bg-cyber-black overflow-hidden selection:bg-neon-blue selection:text-black">
      
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <Experience currentItem={currentItem} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <Overlay currentItem={currentItem} setIndex={setCurrentItem} total={items.length} />
      
      {/* Vignette & Grain Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-60 z-20"></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-20 mix-blend-overlay" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'}}></div>
    </div>
  );
}
