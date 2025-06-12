import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NugsIcon from '../../public/src/img/nugs.png';
import { FaYoutube } from "react-icons/fa6";
import { SiBandcamp } from "react-icons/si";
import { FaSpotify } from "react-icons/fa";

interface Release {
  release_id: string;
  release: string;
  release_artwork: string;
  release_displayname: string | null;
  release_link: string | null;
  release_service: string | null;
  release_order: number;  // Add the release_order property
}

interface ReleaseContainerProps {
  showId: string;
}

// Function to get the appropriate icon based on service name
const getServiceIcon = (serviceName: string | null) => {
  if (!serviceName) return null;
  
  switch (serviceName.toLowerCase()) {
    case 'youtube':
      return <FaYoutube className="inline-block mr-1" size="1.25rem" />;
    case 'bandcamp':
      return <SiBandcamp className="inline-block mr-1" size="1.25rem" />;
    case 'nugs':
      return <img src={NugsIcon} alt="nugs" className="inline-block mr-1 h-5 w-auto" />;
    case 'spotify':
      return <FaSpotify className="inline-block mr-1" size="1.25rem" />;
    default:
      return null;
  }
};

const ReleaseContainer: React.FC<ReleaseContainerProps> = ({ showId }) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the fetch function
  const fetchReleases = useCallback(async () => {
    if (!showId) {
      return [];
    }
    
    try {
      // Updated query to join tables and include release_order
      const { data, error } = await supabase
        .from('releases_shows')
        .select(`
          release_order,
          release_id,
          releases:release_id (
            release_id, 
            release, 
            release_artwork, 
            release_displayname, 
            release_link, 
            release_service
          )
        `)
        .eq('show_id', showId)
        .order('release_order', { ascending: true });  // Sort by release_order
      
      if (error) {
        console.error('Error fetching releases with order:', error);
        return [];
      }
      
      if (data && data.length > 0) {
        // Map the joined data to the expected release format
        const formattedReleases = data.map(item => ({
          ...item.releases,
          release_order: item.release_order
        }));
        
        return formattedReleases;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in fetchReleases:', error);
      return [];
    }
  }, [showId]);

  // Fetch releases when showId changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      setCurrentReleaseIndex(0);
      
      const data = await fetchReleases();
      
      // Only update state if component is still mounted
      if (isMounted) {
        setReleases(data);
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [showId, fetchReleases]);

  if (isLoading) {
    return <div className="bg-primary border border-black rounded-lg p-3 mb-4 text-center">
      <p className="text-black">Loading releases...</p>
    </div>;
  }

  // If no releases, don't render the component
  if (releases.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-primary border border-black rounded-lg p-3 mb-4">
      <div className="flex flex-col items-center">
        {releases.length > 0 && currentReleaseIndex < releases.length && (
          <div className="flex flex-col items-center w-full">
            {releases[currentReleaseIndex]?.release_link ? (
              <a 
                href={releases[currentReleaseIndex].release_link}
                target="_blank" 
                rel="noopener noreferrer"
                className="relative w-full mx-auto mb-3 block cursor-pointer"
              >
                <img 
                  src={releases[currentReleaseIndex].release_artwork} 
                  alt={releases[currentReleaseIndex].release_displayname || releases[currentReleaseIndex].release}
                  className="w-full h-full object-cover rounded-lg border border-black"
                  onError={(e) => {
                    // Handle error silently
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </a>
            ) : (        
              <div className="relative w-full mx-auto mb-4">
                <img 
                  src={releases[currentReleaseIndex].release_artwork} 
                  alt={releases[currentReleaseIndex].release_displayname || releases[currentReleaseIndex].release}
                  className="w-full h-full object-cover rounded-lg border border-black"
                  onError={(e) => {
                    // Handle error silently
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="text-center">
              <h3 className="text-base font-semibold text-black leading-5">
                {releases[currentReleaseIndex]?.release_displayname || releases[currentReleaseIndex]?.release || 'Untitled Release'}
              </h3>
              {releases[currentReleaseIndex]?.release_link && (
                <a 
                  href={releases[currentReleaseIndex].release_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-black hover:text-[#a9682e] hover:underline font-semibold text-sm inline-block transition-colors"
                >
                  {getServiceIcon(releases[currentReleaseIndex].release_service)}
                  {releases[currentReleaseIndex].release_service || "Streaming Service"}
                </a>
              )}
            </div>
            
            {/* Navigation arrows - only show if there are multiple releases */}
            {releases.length > 1 && (
              <div className="flex justify-center items-center mt-2 gap-4">
                <button
                  onClick={() => setCurrentReleaseIndex(prev => (prev - 1 + releases.length) % releases.length)}
                  className="p-1 rounded-full border text-black bg-[#f9ae37] border-black hover:bg-white hover:text-black transition-colors"
                  aria-label="Previous release"
                >
                  <ArrowLeft size={12} />
                </button>
                <div className="flex items-center gap-2">
                  {releases.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentReleaseIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentReleaseIndex === index 
                          ? 'bg-black' 
                          : 'bg-[#f9ae37] border border-black hover:bg-gray-400'
                      }`}
                      aria-label={`Go to release ${index + 1}`}
                      aria-current={currentReleaseIndex === index ? 'true' : 'false'}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentReleaseIndex(prev => (prev + 1) % releases.length)}
                  className="p-1 rounded-full border text-black bg-[#f9ae37] border-black hover:bg-white hover:text-black transition-colors"
                  aria-label="Next release"
                >
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ReleaseContainer);