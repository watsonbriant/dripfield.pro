import React from 'react';
import { Link } from 'react-router-dom';

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
    <div className="bg-primary border border-fourth w-full shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-semibold">
          {currentYear} Tours
        </h2>
      </div>
      <div>
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
            <div key={tour.tour_count} className="text-fifth text-xs flex items-center">
              <div 
                className="w-1 h-5 flex-shrink-0"
                style={{ 
                  width: '5px',
                  padding: 0,
                  backgroundColor: tour.color
                }}
              />
              <div className="flex-1 text-left leading-tight ml-2 font-light">
                <Link 
                  to={`/tours/${tour.tour_id}`}
                  className="hover:underline transition-colors font-medium text-left"
                >
                  {tour.tour_count.split(' (')[0]}
                </Link>
                {' (' + tour.tour_count.split(' (')[1]}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
