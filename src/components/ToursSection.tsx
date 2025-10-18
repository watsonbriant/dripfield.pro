import React from 'react';

interface TourCount {
  tour_count: string;
  tour_canonid: number;
  tour_id: string;
  tour: string;
  color: string;
}

interface ToursSectionProps {
  tours: TourCount[];
  currentYear: string;
  loading: boolean;
}

export function ToursSection({ tours, currentYear, loading }: ToursSectionProps) {
  return (
    <div className="bg-primary border border-secondary rounded-lg p-3 w-full">
      <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
        {currentYear} Tours
      </h2>
      <div className="space-y-1.5">
        {loading ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
              <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
          </div>
        ) : tours.length === 0 ? (
          <p className="text-fifth text-xs text-center py-2">No tours found</p>
        ) : (
          tours.map((tour) => (
            <div key={tour.tour_count} className="text-fifth text-xs flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded flex-shrink-0 border border-secondary"
                style={{ backgroundColor: tour.color }}
              />
              <div className="flex-1 text-left leading-tight">
                <a 
                  href={`/tours/${tour.tour_id}`}
                  className="hover:underline transition-colors font-semibold text-left"
                >
                  {tour.tour_count.split(' (')[0]}
                </a>
                {' (' + tour.tour_count.split(' (')[1]}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
