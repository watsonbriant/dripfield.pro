import { useEffect, useRef } from 'react';
import appStoreBadge from '../../img/wl/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg';
import googlePlayBadge from '../../img/wl/GetItOnGooglePlay_Badge_Web_color_English.svg';

export function WTED() {
  const containerRef = useRef<HTMLDivElement>(null);
  const historyContainerRef = useRef<HTMLDivElement>(null);

  // Add Umami analytics script to header
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[data-website-id="df551c73-5e95-469e-97eb-6db7c82e6e14"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://cloud.umami.is/script.js';
    script.setAttribute('data-website-id', 'df551c73-5e95-469e-97eb-6db7c82e6e14');
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      const scriptToRemove = document.querySelector('script[data-website-id="df551c73-5e95-469e-97eb-6db7c82e6e14"]');
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, []);

  // Add radio.co history script
  useEffect(() => {
    // Check if content already exists (radioco_history20 divs) to prevent duplicates
    const existingContent = document.querySelector('.radioco_history20');
    if (existingContent) return;

    // Check if script already exists to prevent duplicates
    const existingScript = document.querySelector('script[src*="embed.radio.co/embed/s3c11c85d6/history.js"]');
    if (existingScript) return;

    // Wait for container to be available
    if (!historyContainerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://embed.radio.co/embed/s3c11c85d6/history.js?l=20';
    script.async = true;
    script.id = 'radio-co-history-script';
    
    // Append script to our container - radio.co scripts render content where the script is placed
    historyContainerRef.current.appendChild(script);

    return () => {
      // Cleanup: remove script
      const scriptToRemove = document.getElementById('radio-co-history-script');
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
      
      // Clean up any content the script may have created (remove all radioco_history20 divs)
      const radiocoDivs = document.querySelectorAll('.radioco_history20');
      radiocoDivs.forEach(div => {
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      });
      
      // Also clean up container content
      if (historyContainerRef.current) {
        historyContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    // Function to remove duplicate radioco history content
    const removeDuplicateHistory = () => {
      if (!historyContainerRef.current) return;
      
      const radiocoDivs = historyContainerRef.current.querySelectorAll('.radioco_history20');
      // If there's more than one, keep only the first one
      if (radiocoDivs.length > 1) {
        for (let i = 1; i < radiocoDivs.length; i++) {
          const div = radiocoDivs[i];
          if (div && div.parentNode) {
            div.parentNode.removeChild(div);
          }
        }
      }
    };

    // Function to remove unwanted iframes that appear after the footer
    const removeUnwantedIframes = () => {
      const footer = document.querySelector('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const allIframes = document.querySelectorAll('iframe');
      
      allIframes.forEach((iframe) => {
        const iframeRect = iframe.getBoundingClientRect();
        // Check if iframe is positioned below the footer
        // and it's not our main radio player
        if (iframeRect.top > footerRect.bottom && 
            !iframe.src.includes('embed.radio.co/player/55044fc.html')) {
          iframe.remove();
        }
      });
    };

    // Run immediately and then periodically to catch dynamically created content
    removeDuplicateHistory();
    removeUnwantedIframes();
    const interval = setInterval(() => {
      removeDuplicateHistory();
      removeUnwantedIframes();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-wl-dark-green">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="m-8">
            <h1 className="text-wl-white text-xl font-bold text-center">WTED Goose Radio</h1>
            <h1 className="text-wl-white text-base font-medium mb-6 text-center">Powered by Wysteria Lane</h1>
            
            <div className="flex justify-center">
              <iframe
                src="https://embed.radio.co/player/55044fc.html"
                width="100%"
                allow="autoplay"
                scrolling="no"
                className="shadow-xl"
                style={{
                  border: 'none',
                  overflow: 'hidden',
                  maxWidth: '600px',
                  margin: '0px auto',
                  height: '100px'
                }}
              ></iframe>
            </div>
            
            <hr className="border-wl-orange my-6 clear-both" />
            
            <div className="text-wl-white text-center">
              <h2 className="text-wl-white text-lg font-bold mb-4">Download the WTED Mobile App</h2>
              <div className="flex flex-wrap justify-center items-center gap-4">
                <a
                  href="https://apps.apple.com/us/app/wted-goose-radio/id6476207418"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block transition-transform duration-300 hover:scale-105"
                >
                  <img
                    src={appStoreBadge}
                    alt="Download on the App Store"
                    className="h-[80px] w-auto shadow-xl"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.m92a0e1796e8f.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block transition-transform duration-300 hover:scale-105"
                >
                  <img
                    src={googlePlayBadge}
                    alt="Get it on Google Play"
                    className="h-[80px] w-auto shadow-xl"
                  />
                </a>
              </div>
            </div>
            
            <hr className="border-wl-orange my-6 clear-both" />
            
            <div className="text-wl-white text-center">
              <h2 className="text-wl-white text-lg font-bold mb-4">Upcoming Schedule</h2>
              <div className="flex justify-center">
                <iframe
                  src="https://embed.radio.co/embeds/schedule/es27f0222.html"
                width="100%"
                height="600"
                allow="autoplay"
                scrolling="no"
                className="shadow-xl"
                style={{
                  border: 'none',
                  overflow: 'hidden',
                  height: '600px'
                }}
                ></iframe>
              </div>
            </div>
            
            <hr className="border-wl-orange my-6 clear-both" />
            
            {/* Radio.co history script will render content here */}
            <div ref={historyContainerRef} id="radio-co-history" className="radio-co-history-container text-wl-white font-medium"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

