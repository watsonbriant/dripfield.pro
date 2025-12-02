import React from 'react';
import { useLooseEndsData } from '../hooks/useLooseEndsData';
import { getCategoryColor } from './LooseEndsUtils';

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
    error
  } = useLooseEndsData(userId);

  if (loading) {
    return (
      <div className="max-w-[1500px]">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading Loose Ends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1500px]">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-red-500">Error loading Loose Ends</p>
          <p className="text-fifth text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-[1500px]">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
          <p className="text-fifth">No Loose Ends found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-[1500px]">
      {categories.map((category) => (
        <div key={category} className="mb-4">
          <div className="bg-primary border border-fourth shadow-xl">
            <div className={`${getCategoryColor(category)} text-white px-2 py-0.5`}>
              <h3 className="text-sm font-semibold">
                {category}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {groupedLooseEnds[category].map((looseEnd) => (
                <LooseEndCard key={looseEnd.end_id} looseEnd={looseEnd} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const LooseEndCard: React.FC<{ looseEnd: LooseEnd }> = ({ looseEnd }) => {
  return (
    <div className="bg-tertiary/40 overflow-hidden hover:bg-tertiary/80 transition-all flex flex-col border-[0.5px] border-fourth">
      <div className="relative pb-[49.25%]">
        <img
          src={looseEnd.isCompleted && looseEnd.end_image_collected 
            ? looseEnd.end_image_collected 
            : looseEnd.end_image}
          alt={`${looseEnd.end} illustration`}
          className="absolute top-0 left-0 w-full h-full object-cover px-[13px] py-[6px]"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error(`Failed to load image for ${looseEnd.end}:`, looseEnd.isCompleted ? looseEnd.end_image_collected : looseEnd.end_image);
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://via.placeholder.com/670x330?text=Image+Not+Available';
          }}
        />
      </div>
      <div className="p-2 flex-1 flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-fifth">
            {looseEnd.end}
          </h3>
          
          {looseEnd.isCompleted && (
            <span className="bg-[#006400] text-white text-[0.625rem] px-1.5 py-[1px] rounded ml-2 border border-fourth">
              Collected
            </span>
          )}
        </div>
        
        <p className="text-fifth font-light text-[0.625rem] mb-0.5 flex-grow">
          {looseEnd.end_description}
        </p>
        
        {looseEnd.progress && (
          <div className="mt-auto">
            <div className="flex justify-between text-[0.625rem] text-fifth mb-0.5">
              <span>{looseEnd.progress.seen}/{looseEnd.progress.total}</span>
              <span>{looseEnd.progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden border border-fourth">
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