import React, { useState, useEffect } from 'react';
import { Train, Brain, Zap } from 'lucide-react';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Train, text: 'Initializing KMRL System...', duration: 1000 },
    { icon: Brain, text: 'Loading AI Engine...', duration: 1000 },
    { icon: Zap, text: 'Preparing Dashboard...', duration: 1000 }
  ];

  useEffect(() => {
    let totalTime = 0;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

    const timer = setInterval(() => {
      totalTime += 50;
      const newProgress = (totalTime / totalDuration) * 100;
      setProgress(Math.min(newProgress, 100));

      // Update current step
      let accumulatedTime = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulatedTime += steps[i].duration;
        if (totalTime <= accumulatedTime) {
          setCurrentStep(i);
          break;
        }
      }

      if (totalTime >= totalDuration) {
        clearInterval(timer);
        setTimeout(() => {
          onLoadingComplete?.();
        }, 200);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  const CurrentIcon = steps[currentStep]?.icon || Train;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl shadow-lg">
            <Train className="h-8 w-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">KMRL</h1>
            <p className="text-sm text-gray-600">Train Scheduling</p>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
              <div 
                className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <CurrentIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {steps[currentStep]?.text || 'Loading...'}
            </p>
            <p className="text-xs text-gray-500">
              {Math.round(progress)}% Complete
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-xs text-gray-500">
          <div className="text-center">
            <Train className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p>Real-time Tracking</p>
          </div>
          <div className="text-center">
            <Brain className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p>AI Optimization</p>
          </div>
          <div className="text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p>Smart Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;