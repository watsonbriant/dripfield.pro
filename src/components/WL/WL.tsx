import React, { useState } from 'react';
import { WLHeader } from './WLHeader';
import { WLFooter } from './WLFooter';
import goosePressImage from '../../img/wl/Goose_Press_STL2025_0422_143639-6948_ALIVE.jpg';

export function WL() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear form fields
    setFirstName('');
    setLastName('');
    setEmail('');
    setMessage('');
  };

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
            <p className="font-normal mx-8 text-wl-white text-center text-sm leading-[1.125rem]">
              Wysteria Lane is the online home for the charitable arm of a fan site and streaming radio station for the band Goose. Currently organized as an LLC with a goal of achieving 501(c)3 non-profit certification from the IRS, Wysteria Lane manages and operates <a href="https://www.wtedradio.com/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:text-wl-light-orange underline font-medium">WTED Goose Radio</a> and the <a href="https://community.wysterialane.org/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:text-wl-light-orange underline font-medium">Wysteria Lane Community</a>, both of which are available free of charge. Please explore, and reach out if you have questions or want to know more.
            </p>
            
            {/* Contact Us Form */}
            <form onSubmit={handleSubmit} className="mt-16">
              <h2 className="text-wl-white text-center font-bold text-xl mb-4">Contact Us:</h2>
              
              {/* Name Fields */}
              <div className="mb-4">
                <label className="block text-wl-white mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wl-orange"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last"
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wl-orange"
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="mb-4">
                <label className="block text-wl-white mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wl-orange"
                />
              </div>

              {/* Message Field */}
              <div className="mb-6">
                <label className="block text-wl-white mb-2">
                  Comment or Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Comment or Message"
                  rows={6}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wl-orange resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-wl-orange hover:bg-wl-light-orange text-wl-black font-medium px-6 py-2 rounded transition-colors hover:scale-105 transition-transform duration-300"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      <WLFooter />
    </div>
  );
}

