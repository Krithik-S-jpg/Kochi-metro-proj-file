import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { ExportModal } from './ExportModal';

interface ExportButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  variant = 'default', 
  size = 'default',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <Download className="h-4 w-4 mr-2" />
        Export Data
      </Button>
      
      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};