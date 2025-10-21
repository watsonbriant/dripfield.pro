import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface TourDetailsBreadcrumbsProps {
    tourName?: string;
}

export function TourDetailsBreadcrumbs({ tourName }: TourDetailsBreadcrumbsProps) {
    return (
        <div className="flex items-center mb-6 font-semibold text-sm text-fifth">
            <Link to="/setlistgame" className="hover:underline transition-colors">
                <div className="flex items-center bg-tertiary rounded-lg py-1 px-2 border border-secondary text-fifth">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Echo of a Show
                </div>
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-fifth bg-canvas rounded-lg py-1 px-2 border border-secondary">
                {tourName || 'Tour Details'}
            </span>
        </div>
    );
}
