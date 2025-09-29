import React, { useEffect, useRef, useState } from 'react';

interface ParallaxLayer {
  src: string;
  name: string;
  depth: number;
  left: string;
  top: string;
  width?: string;
  zIndex: number;
  scale: number;
}

interface Station {
  name: string;
  x: number;
  y: number;
}

interface ParallaxBackgroundProps {
  className?: string;
  intensity?: number;
  children?: React.ReactNode;
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ 
  className = '', 
  intensity = 1,
  children 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLImageElement[]>([]);
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setClock(`${hours}:${minutes}:${seconds}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Define the parallax layers with EXACT positioning from position.txt
  const layers: ParallaxLayer[] = [
  { src: '/images/parallax-asserts/sunrise.png', name: 'Sunrise', depth: 0.1, left: '325.92px', top: '213.28px', width: '100px', zIndex: 1, scale: 2 },
  { src: '/images/parallax-asserts/leaf.png', name: 'Leaf', depth: 0.15, left: '298.76px', top: '110.08px', zIndex: 20, scale: 1.35 },
  { src: '/images/parallax-asserts/train.png', name: 'Train', depth: 0.3, left: '271.6px', top: '82.56px', zIndex: 2, scale: 1 },
  { src: '/images/parallax-asserts/road.png', name: 'Road', depth: 0.25, left: '271.6px', top: '233.92px', zIndex: 1, scale: 1.04 },
  { src: '/images/parallax-asserts/clock.png', name: 'Clock', depth: 0.4, left: '339.5px', top: '199.52px', zIndex: 3, scale: 0.49 },
  { src: '/images/parallax-asserts/boat.png', name: 'Boat', depth: 0.35, left: '176.54px', top: '165.12px', zIndex: 2, scale: 0.33 },
  { src: '/images/parallax-asserts/boy.png', name: 'Boy', depth: 0.5, left: '624.68px', top: '68.8px', zIndex: 3, scale: 0.33 },
  { src: '/images/parallax-asserts/moongirl.png', name: 'Girl', depth: 0.55, left: '461.72px', top: '178.88px', zIndex: 1, scale: 0.43 },
  { src: '/images/parallax-asserts/uncle.png', name: 'Uncle', depth: 0.6, left: '692.58px', top: '0px', zIndex: 2, scale: 0.32 },
  { src: '/images/parallax-asserts/buldings.png', name: 'Buildings', depth: 0.45, left: '774.06px', top: '137.6px', width: '100px', zIndex: 1, scale: 1.86 },
  { src: '/images/parallax-asserts/moon.png', name: 'Moon', depth: 0.2, left: '1032.08px', top: '371.52px', width: '100px', zIndex: 1, scale: 1.86 },
  ];

  // KMRL Station data from the original source
  const stations: Station[] = [
    { name: "Aluva", x: 250, y: 250 },
    { name: "Pulinchodu", x: 160, y: 300 },
    { name: "Companypady", x: 210, y: 420 },
    { name: "Muttom", x: 280, y: 485 },
    { name: "Kalamassery", x: 340, y: 550 },
    { name: "Cochin University", x: 420, y: 600 },
    { name: "Edapally", x: 520, y: 650 },
    { name: "Palarivattom", x: 740, y: 650 },
    { name: "Jubilee", x: 800, y: 600 },
    { name: "Lissie", x: 880, y: 550 },
    { name: "M.G. Road", x: 950, y: 485 },
    { name: "Kaloor", x: 1000, y: 420 }
  ];

  useEffect(() => {
    // Set initial positions exactly as in the new source
    layersRef.current.forEach((layer, index) => {
      if (!layer) return;
      
      const layerData = layers[index];
      if (layerData) {
        // Apply exact positioning from position.txt
        layer.style.left = layerData.left;
        layer.style.top = layerData.top;
        if (layerData.width) {
          layer.style.width = layerData.width;
        }
        layer.style.zIndex = layerData.zIndex.toString();
        layer.style.transform = `scale(${layerData.scale})`;
        
        // Check localStorage for saved positions (like original)
        const saved = localStorage.getItem(layerData.name);
        if (saved) {
          try {
            const pos = JSON.parse(saved);
            layer.style.left = pos.left || layerData.left;
            layer.style.top = pos.top || layerData.top;
            layer.style.width = pos.width || layerData.width || 'auto';
            layer.style.zIndex = pos.zIndex?.toString() || layerData.zIndex.toString();
            layer.style.transform = `scale(${pos.scale || layerData.scale})`;
          } catch (e) {
            // Keep default values if parsing fails
          }
        }
      }
    });

    // Create station labels exactly as in original source
    if (containerRef.current) {
      const container = containerRef.current;
      
      // Remove existing station labels
      const existingLabels = container.querySelectorAll('.station-label');
      existingLabels.forEach(label => label.remove());

      // Add station labels
      stations.forEach(station => {
        const label = document.createElement("div");
        label.className = "station-label";
        label.textContent = station.name;
        container.appendChild(label);

        // Set position exactly as in original
        label.style.position = "absolute";
        label.style.left = station.x + "px";
        label.style.top = station.y + "px";
        label.style.color = "#000";
        label.style.background = "rgba(255,255,255,0.8)";
        label.style.padding = "2px 6px";
        label.style.borderRadius = "4px";
        label.style.fontSize = "12px";
        label.style.pointerEvents = "none";
        label.style.transform = "translate(-50%, -50%)";
        label.style.zIndex = "100";
        label.style.fontFamily = "Arial, sans-serif";
        label.style.fontWeight = "500";
        label.style.whiteSpace = "nowrap";
        label.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";
      });
    }
  }, []);

  useEffect(() => {
    // Parallax effect based on mouse movement - exactly as in new source
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // range -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      layersRef.current.forEach((layer, index) => {
        if (!layer) return;
        
        const depth = parseFloat(layer.getAttribute('data-depth') || '0');
        const moveX = x * depth * 40 * intensity;
        const moveY = y * depth * 40 * intensity;

        // Preserve existing transforms (scale, etc.) - exactly as in original
        const existingTransform = layer.style.transform.replace(/translate\(.*?\)/, '').trim();
        layer.style.transform = `${existingTransform} translate(${moveX}px, ${moveY}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [intensity]);

  return (
    <>
      {/* Parallax Background Container - matching new metro-container */}
      <div 
        ref={containerRef}
        className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
        style={{ 
          zIndex: 0,
          width: '100%',
          height: '100vh',
          position: 'relative'
        }}
      >
        {/* Parallax Layers - with EXACT positioning from position.txt */}
        {layers.map((layer, index) => (
          <img
            key={layer.name}
            ref={(el) => {
              if (el) {
                layersRef.current[index] = el;
                // Set data attributes as in new source
                el.setAttribute('data-depth', layer.depth.toString());
                el.setAttribute('data-name', layer.name);
              }
            }}
            src={layer.src}
            alt={layer.name}
            data-name={layer.name}
            data-depth={layer.depth}
            className="layer"
            style={{
              position: 'absolute',
              left: layer.left,
              top: layer.top,
              width: layer.width || 'auto',
              zIndex: layer.zIndex,
              cursor: 'grab',
              transition: 'transform 0.15s ease, width 0.2s ease, z-index 0.2s ease',
              transform: `scale(${layer.scale})`,
              opacity: 0.9
            }}
            loading="lazy"
            onMouseDown={(e) => {
              e.currentTarget.style.cursor = 'grabbing';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.cursor = 'grab';
            }}
          />
        ))}
      </div>
      
      {/* Top Navigation Bar + Content overlay */}
    <div className="fixed w-full top-0 left-0" style={{ zIndex: 100 }}>
      <nav className="w-full bg-white/90 dark:bg-gray-900/90 shadow-md backdrop-blur-sm transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer select-none">
              <img
                src="https://s3-ap-south-1.amazonaws.com/kmrldata/wp-content/uploads/2022/08/12105259/KMRL-logo-300x165.gif"
                alt="Kochi Metro Rail Limited Logo"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex-1 text-center">
              <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-wide transition-colors duration-300">
                Kochi Metro Rail Limited
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <div>
                <span className="font-orbitron text-lg bg-blue-800 text-blue-50 px-4 py-1 rounded-lg shadow min-w-[110px] text-center select-none transition-colors duration-300" style={{ letterSpacing: '0.15em' }}>{clock}</span>
              </div>
              <div>
                <img 
                  src="https://gad.kerala.gov.in/sites/default/files/inline-images/kerala%20final%20emblem_0.jpg" 
                  alt="Kerala Govt Official Logo" 
                  className="h-14 w-auto object-contain"
                  title="Kerala Government Official"
                  style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))' }}
                />
              </div>
            </div>
          </div>
        </nav>
        <div style={{ marginTop: 90 }}>
        </div>
        {children}
      </div>
    </>
  );
};

export default ParallaxBackground;