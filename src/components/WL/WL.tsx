import React from 'react';
import { WLHeader } from './WLHeader';
import { WLFooter } from './WLFooter';

export function WL() {
  return (
    <div className="flex flex-col min-h-screen bg-wl-dark-green">
      <WLHeader />
      
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary border border-fourth rounded-lg p-6">
            <h2 className="text-sm font-semibold bg-tertiary text-fifth inline-block px-2 py-0.5 rounded-lg border border-fourth mb-4">
              WL - New Site Design
            </h2>
            <p className="text-fifth">
              This is the placeholder component for the new site redesign. Start building here!
            </p>
          </div>
        </div>
      </main>
      
      <WLFooter />
    </div>
  );
}

