import React from 'react';
import { WLHeader } from './WLHeader';
import { WLFooter } from './WLFooter';

export function WTED() {
  return (
    <div className="flex flex-col min-h-screen bg-wl-dark-green">
      <WLHeader />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="m-8">
            <h1 className="text-wl-white text-xl font-bold mb-6 text-center">WTED Goose Radio</h1>
            
            <div className="text-wl-white space-y-4 font-normal text-sm leading-[1.125rem]">
              <p>
                This is a placeholder for the WTED Goose Radio page. Content will be added here.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <WLFooter />
    </div>
  );
}

