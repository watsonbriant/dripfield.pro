import React from 'react';
import { WLHeader } from './WLHeader';
import { WLFooter } from './WLFooter';
import goosePressImage from '../../img/wl/Goose_Press_STL2025_0422_143639-6948_ALIVE.jpg';

export function WL() {
  return (
    <div className="flex flex-col min-h-screen bg-wl-dark-green">
      <WLHeader />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="m-8">
            <img 
              src={goosePressImage} 
              alt="Goose Press STL 2025" 
              className="w-full h-auto object-cover rounded-3xl shadow-xl mb-8"
            />
            <p className="font-medium mx-8 text-wl-white text-center text-sm leading-[1.125rem]">
              Wysteria Lane is the online home for the charitable arm of a fan site and streaming radio station for the band Goose. Currently organized as an LLC with a goal of achieving 501(c)3 non-profit certification from the IRS, Wysteria Lane manages and operates <a href="https://www.wtedradio.com/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:text-wl-light-orange underline">WTED Goose Radio</a> and the <a href="https://community.wysterialane.org/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:text-wl-light-orange underline">Wysteria Lane Community</a>, both of which are available free of charge. Please explore, and reach out if you have questions or want to know more.
            </p>
          </div>
        </div>
      </main>
      
      <WLFooter />
    </div>
  );
}

