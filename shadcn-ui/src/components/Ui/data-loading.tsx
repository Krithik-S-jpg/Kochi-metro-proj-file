import React from 'react';
import { Loader2 } from 'lucide-react';

interface DataLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DataLoading: React.FC<DataLoadingProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

export default DataLoading;