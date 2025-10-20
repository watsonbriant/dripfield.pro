import React from 'react';

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
      <p className="text-fifth">{message}</p>
    </div>
  );
};

export default EmptyState;
