import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading personnel data..." 
}) => {
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="text-center py-12">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-[#8ec1b6] animate-pulse"></div>
          <div className="w-4 h-4 rounded-full bg-[#8ec1b6] animate-pulse delay-150"></div>
          <div className="w-4 h-4 rounded-full bg-[#8ec1b6] animate-pulse delay-300"></div>
        </div>
        <p className="text-fifth mt-4">{message}</p>
      </div>
    </div>
  );
};
