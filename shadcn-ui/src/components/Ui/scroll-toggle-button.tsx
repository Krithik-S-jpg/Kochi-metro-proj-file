import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScrollToggleButtonProps {
  className?: string;
}

export default function ScrollToggleButton({ className = '' }: ScrollToggleButtonProps) {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show button when there's content to scroll
      setIsVisible(documentHeight > windowHeight + 100);
      
      // Determine if we're at top or bottom
      const isNearTop = scrollTop < 100;
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;
      
      if (isNearTop) {
        setIsAtTop(true);
      } else if (isNearBottom) {
        setIsAtTop(false);
      }
    };

    // Initial check
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleClick = () => {
    if (isAtTop) {
      scrollToBottom();
    } else {
      scrollToTop();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={`fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white border-2 border-white/20 backdrop-blur-sm ${className}`}
      title={isAtTop ? 'Scroll to bottom' : 'Scroll to top'}
    >
      {isAtTop ? (
        <ChevronDown className="h-6 w-6" />
      ) : (
        <ChevronUp className="h-6 w-6" />
      )}
    </Button>
  );
}