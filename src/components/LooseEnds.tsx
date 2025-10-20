import React from 'react';
import { useLooseEndsData } from '../hooks/useLooseEndsData';
import { CircularProgress, getCategoryColor, getCategoryTextColor } from './LooseEndsUtils';

interface LooseEnd {
  end: string;
  end_description: string;
  end_id: string;
  end_image: string;
  end_order: number;
  end_category: string;
  end_image_collected: string;
  isCompleted?: boolean;
  end_visible: boolean;
  progress?: {
    seen: number;
    total: number;
    percentage: number;
  };
}


export const LooseEnds: React.FC<{ userId: string }> = ({ userId }) => {
  const {
    groupedLooseEnds,
    categories,
    loading,
    loadingProgress,
    error
  } = useLooseEndsData(userId);

  if (loading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">Loading Loose Ends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3 text-center py-12">
        <p className="text-red-600 font-semibold">Error loading Loose Ends</p>
        <p className="text-fifth text-sm mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-fourth text-fifth rounded-lg border border-secondary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3 text-center py-12">
        <p className="text-fifth">No Loose Ends found</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Loose Ends</h3>
      </div>
      
      {categories.map((category) => (
        <div key={category} className="mb-10">
          <h4 className={`text-lg font-semibold ${getCategoryColor(category)} ${getCategoryTextColor(category)} inline-block px-3 py-1 rounded-lg border border-secondary mb-2`}>
            {category}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groupedLooseEnds[category].map((looseEnd) => (
              <LooseEndCard key={looseEnd.end_id} looseEnd={looseEnd} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const LooseEndCard: React.FC<{ looseEnd: LooseEnd }> = ({ looseEnd }) => {
  return (
    <div className="bg-primary border border-secondary rounded-lg overflow-hidden hover:bg-[#d5e4e1] transition-all flex flex-col">
      <div className="relative pb-[49.25%]">
        <img
          src={looseEnd.isCompleted && looseEnd.end_image_collected 
            ? looseEnd.end_image_collected 
            : looseEnd.end_image}
          alt={`${looseEnd.end} illustration`}
          className="absolute top-0 left-0 w-full h-full object-cover"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error(`Failed to load image for ${looseEnd.end}:`, looseEnd.isCompleted ? looseEnd.end_image_collected : looseEnd.end_image);
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://via.placeholder.com/670x330?text=Image+Not+Available';
          }}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium text-fifth">
            {looseEnd.end}
          </h3>
          
          {looseEnd.isCompleted && (
            <span className="bg-[#006400] text-primary text-xs px-2 py-1 rounded-full ml-2 border border-secondary">
              Collected
            </span>
          )}
        </div>
        
        <p className="text-fifth font-light text-xs mb-3 flex-grow">
          {looseEnd.end_description}
        </p>
        
        {looseEnd.progress && (
          <div className="mt-auto">
            <div className="flex justify-between text-xs text-fifth mb-1">
              <span>{looseEnd.progress.seen}/{looseEnd.progress.total}</span>
              <span>{looseEnd.progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden border border-secondary">
              <div 
                className={`h-2 ${looseEnd.isCompleted ? 'bg-[#006400]' : 'bg-fourth'}`}
                style={{ width: `${looseEnd.progress.percentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LooseEnds;