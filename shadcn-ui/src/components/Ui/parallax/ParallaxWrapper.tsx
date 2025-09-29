import React from 'react';
import ParallaxBackground from './ParallaxBackground';

interface ParallaxWrapperProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  className?: string;
}

const ParallaxWrapper: React.FC<ParallaxWrapperProps> = ({ 
  children, 
  enabled = true, 
  intensity = 1,
  className = ''
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={`relative min-h-screen ${className}`}>
      <ParallaxBackground intensity={intensity} />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default ParallaxWrapper;