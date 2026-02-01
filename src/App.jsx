import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, Html, useProgress, Float, Stars, Sparkles, OrbitControls, PerspectiveCamera, useAnimations } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { items } from './data';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

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

// --- Auto-Scaling Model Component ---
function AutoScaledModel({ file, inspecting }) {
  const { scene, animations } = useGLTF(`/models/${file}`);
  const groupRef = useRef();
  
  // Animation Support
  const { actions, names } = useAnimations(animations, groupRef);

  // Play Animation if available
  useEffect(() => {
    if (names.length > 0) {
      // Play the first animation found (usually 'Idle' or 'Mixamo.com')
      const action = actions[names[0]];
      action.reset().fadeIn(0.5).play();
      
      // Optional: If multiple animations exist, you could pick specific ones here
      return () => action.fadeOut(0.5);
    }
  }, [actions, names]);

  // Clone the scene to avoid mutating the cached GLTF result
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Auto-scale logic: Fit model into a normalized box size
  const { scale, centerOffset } = useMemo(() => {
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = maxDim > 0 ? 3.5 / maxDim : 1;
    
    return {
      scale: scaleFactor,
      centerOffset: center.multiplyScalar(-scaleFactor)
    };
  }, [clone]);

  useFrame((state) => {
    if (groupRef.current) {
      // If the model has its own animations, we reduce the procedural movement
      // to avoid it looking messy. If no animations, we keep the full float effect.
      const hasAnimations = names.length > 0;
      
      if (!inspecting) {
        // Gallery Mode
        if (hasAnimations) {
          // Subtle rotation only
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (state.mouse.x * 0.1), 0.1);
        } else {
          // Full Float & Spin
          groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1 + (state.mouse.x * 0.1), 0.1);
          groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, Math.cos(state.clock.getElapsedTime() * 0.2) * 0.05 + (state.mouse.y * 0.1), 0.1);
        }
      } else {
         // Inspection Mode: Stop procedural rotation
         groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
         groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
      }
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      <group position={[centerOffset.x, centerOffset.y, centerOffset.z]}>
        <primitive object={scene} scale={scale} />
      </group>
    </group>
  );
}

// --- Main Scene ---
function Experience({ currentItem, inspecting }) {
  const item = items[currentItem];
  const { camera } = useThree();

  return (
    <>
      <color attach="background" args={['#050505']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={10} color="#00f3ff" />
      <pointLight position={[-10, -10, -10]} intensity={5} color="#b026ff" />
      <pointLight position={[0, 5, 0]} intensity={inspecting ? 5 : 2} color="#ffffff" />
      
      {/* Environment */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={10} size={2} speed={0.4} opacity={0.5} color="#00f3ff" />
      <Environment preset="city" />

      {/* Model Container */}
      <Suspense fallback={<Loader />}>
        {/* Gallery Mode Float */}
        {!inspecting ? (
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
             <AutoScaledModel file={item.file} inspecting={inspecting} />
          </Float>
        ) : (
          /* Inspection Mode (No Float, fixed position for inspection) */
          <AutoScaledModel file={item.file} inspecting={inspecting} />
        )}
      </Suspense>

      <ContactShadows resolution={1024} scale={50} blur={2.5} opacity={0.5} far={10} color="#000000" />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={inspecting} 
        minDistance={2} 
        maxDistance={8}
        autoRotate={inspecting}
        autoRotateSpeed={2}
        enabled={inspecting} // Only allow manual control in inspect mode
      />
    </>
  );
}

// --- UI Overlay ---
function Overlay({ currentItem, setIndex, total, inspecting, setInspecting }) {
  const item = items[currentItem];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-16 z-10">
      
      {/* Header */}
      <header className="flex justify-between items-start pointer-events-auto">
        <div onClick={() => setInspecting(false)} className="cursor-pointer">
          <h1 className="text-2xl font-display font-bold text-white tracking-tighter hover:text-neon-blue transition-colors">
            ARMORY<span className="text-neon-blue">.AI</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 tracking-widest">DIGITAL ASSET PROTOCOL</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-mono text-neon-green">SYS.STATUS: ONLINE</p>
          <p className="text-xs font-mono text-gray-500">V.2.1.0</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row items-end md:items-center justify-between w-full h-full mt-10 pointer-events-none">
        
        {/* Left: Gallery Info (Hidden when Inspecting) */}
        <AnimatePresence>
          {!inspecting && (
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full md:w-1/3 mb-10 md:mb-0 pointer-events-auto"
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

              <button 
                onClick={() => setInspecting(true)}
                className="bg-white text-black font-display font-bold py-3 px-8 hover:bg-neon-blue hover:text-black transition-colors duration-300 clip-path-button"
              >
                INSPECT ASSET
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Inspection Stats (Visible only when Inspecting) */}
        <AnimatePresence>
          {inspecting && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-80 p-8 glass-panel pointer-events-auto mr-8 md:mr-16 rounded-lg border border-neon-blue/30"
            >
              <h3 className="text-2xl font-display font-bold mb-6 text-neon-blue">{item.name}</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>DAMAGE OUTPUT</span>
                    <span>{item.stats?.damage || 50}/100</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${item.stats?.damage || 50}%` }} 
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>SPEED / FIRE RATE</span>
                    <span>{item.stats?.speed || 50}/100</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${item.stats?.speed || 50}%` }} 
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>{item.stats?.range ? 'EFFECTIVE RANGE' : 'DEFENSE RATING'}</span>
                    <span>{item.stats?.range || item.stats?.defense || 50}/100</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${item.stats?.range || item.stats?.defense || 50}%` }} 
                      transition={{ duration: 1, delay: 0.6 }}
                      className="h-full bg-neon-green shadow-[0_0_10px_rgba(0,255,157,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-400 leading-relaxed font-mono">
                  {item.desc}
                </p>
              </div>

              <button 
                onClick={() => setInspecting(false)}
                className="w-full mt-6 border border-white/20 text-white font-mono text-xs py-2 hover:bg-white hover:text-black transition-colors"
              >
                CLOSE INSPECTION
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Navigation Dots (Desktop) - Hide when inspecting */}
        {!inspecting && (
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
        )}
      </div>

      {/* Footer / Controls - Hide when inspecting */}
      {!inspecting && (
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

          <div className="text-right pointer-events-none">
            <p className="text-[10rem] font-display font-black text-white opacity-5 absolute bottom-[-3rem] right-[-2rem] select-none">
              {String(currentItem + 1).padStart(2, '0')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [currentItem, setCurrentItem] = useState(0);
  const [inspecting, setInspecting] = useState(false);

  // Wheel listener for scroll interaction (Disabled when inspecting)
  useEffect(() => {
    const handleWheel = (e) => {
      if (inspecting) return; // Disable scroll nav during inspection
      
      if (e.deltaY > 50) {
        setCurrentItem((prev) => (prev + 1) % items.length);
      } else if (e.deltaY < -50) {
        setCurrentItem((prev) => (prev - 1 + items.length) % items.length);
      }
    };
    
    let timeout;
    const throttledWheel = (e) => {
      if (!timeout) {
        handleWheel(e);
        timeout = setTimeout(() => { timeout = null }, 500); 
      }
    };

    window.addEventListener('wheel', throttledWheel);
    return () => window.removeEventListener('wheel', throttledWheel);
  }, [inspecting]);

  return (
    <div className="w-full h-screen relative bg-cyber-black overflow-hidden selection:bg-neon-blue selection:text-black">
      
      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <Experience 
            currentItem={currentItem} 
            inspecting={inspecting} 
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <Overlay 
        currentItem={currentItem} 
        setIndex={setCurrentItem} 
        total={items.length} 
        inspecting={inspecting}
        setInspecting={setInspecting}
      />
      
      {/* Vignette & Grain Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-60 z-20"></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-20 mix-blend-overlay" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'}}></div>
    </div>
  );
}
