import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, MoveRight } from 'lucide-react';
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
      return <FaYoutube className="inline-block" size="1.25rem" />;
    case 'bandcamp':
      return <SiBandcamp className="inline-block" size="1.25rem" />;
    case 'nugs':
      return <img src={NugsIcon} alt="nugs" className="inline-block h-5 w-auto" />;
    case 'spotify':
      return <FaSpotify className="inline-block" size="1.25rem" />;
    default:
      return null;
  }
};

// Helper function to render display name with arrow replacement
const renderDisplayName = (displayName: string | null, release: string) => {
  const text = displayName || release || 'Untitled Release';
  
  if (text.includes('→')) {
    const parts = text.split('→');
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part.trim()}
            {index < parts.length - 1 && (
              <MoveRight className="inline-block mx-1 text-red-600" size={16} />
            )}
          </React.Fragment>
        ))}
      </>
    );
  }
  
  return text;
};

// Function to fetch Bandcamp album ID via Supabase Edge Function
const fetchBandcampAlbumId = async (bandcampUrl: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-bandcamp-album-id', {
      body: { url: bandcampUrl }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      return null;
    }
    
    return data.albumId || null;
  } catch (error) {
    console.error('Error calling Bandcamp Edge Function:', error);
    return null;
  }
};

// Function to convert YouTube watch URL to embed URL
const convertToYouTubeEmbed = (youtubeUrl: string): string => {
  const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return youtubeUrl; // Return original if can't parse
};

const ReleaseContainer: React.FC<ReleaseContainerProps> = ({ showId }) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [currentReleaseIndex, setCurrentReleaseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [embeddedReleaseIndex, setEmbeddedReleaseIndex] = useState<number | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(null);

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

  // Handle streaming service release click
  const handleStreamingClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const currentRelease = releases[currentReleaseIndex];
    const service = currentRelease.release_service?.toLowerCase();
    
    if (service === 'bandcamp' && currentRelease.release_link) {
      const fetchedAlbumId = await fetchBandcampAlbumId(currentRelease.release_link);
      if (fetchedAlbumId) {
        setAlbumId(fetchedAlbumId);
        setEmbeddedReleaseIndex(currentReleaseIndex);
      }
    } else if (service === 'youtube' && currentRelease.release_link) {
      // For YouTube, we don't need to fetch anything - just set the embed state
      setAlbumId(null); // Clear any previous Bandcamp album ID
      setEmbeddedReleaseIndex(currentReleaseIndex);
    }
  };

  // Fetch releases when showId changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setIsLoading(true);
      setCurrentReleaseIndex(0);
      setEmbeddedReleaseIndex(null);
      
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
    return <div className="bg-primary border border-secondary rounded-lg p-3 mb-4 text-center">
      <p className="text-black">Loading releases...</p>
    </div>;
  }

  // If no releases, don't render the component
  if (releases.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-primary border border-secondary rounded-lg p-3 mb-4">
      <div className="flex flex-col items-center">
        {releases.length > 0 && currentReleaseIndex < releases.length && (
          <div className="flex flex-col items-center w-full">
            {embeddedReleaseIndex === currentReleaseIndex && (albumId || releases[currentReleaseIndex].release_service?.toLowerCase() === 'youtube') ? (
              <div className="relative w-full mx-auto mb-3 flex justify-center">
                {releases[currentReleaseIndex].release_service?.toLowerCase() === 'bandcamp' && albumId ? (
                  <iframe 
                    style={{ 
                      border: 0, 
                      width: 'min(245px, 100%)', 
                      height: '390px' 
                    }}
                    src={`https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=333333/tracklist=false/transparent=true/`}
                    seamless
                    title={releases[currentReleaseIndex].release_displayname || releases[currentReleaseIndex].release}
                  />
                ) : releases[currentReleaseIndex].release_service?.toLowerCase() === 'youtube' ? (
                  <iframe 
                    className="lg:!h-[138px]"
                    style={{ 
                      border: 0, 
                      width: 'min(560px, 100%)', 
                      height: '200px' 
                    }}
                    src={convertToYouTubeEmbed(releases[currentReleaseIndex].release_link!)}
                    title={releases[currentReleaseIndex].release_displayname || releases[currentReleaseIndex].release}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : null}
              </div>
            ) : releases[currentReleaseIndex]?.release_link ? (
              releases[currentReleaseIndex].release_service?.toLowerCase() === 'bandcamp' || releases[currentReleaseIndex].release_service?.toLowerCase() === 'youtube' ? (
                <div 
                  onClick={handleStreamingClick}
                  className="relative w-full mx-auto mb-3 block cursor-pointer bg-canvas rounded-lg"
                >
                  <img 
                    src={releases[currentReleaseIndex].release_artwork} 
                    alt={releases[currentReleaseIndex].release_displayname || releases[currentReleaseIndex].release}
                    className="w-full h-full object-cover rounded-lg border border-secondary hover:opacity-70 transition-opacity"
                    onError={(e) => {
                      // Handle error silently
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <a 
                  href={releases[currentReleaseIndex].release_link}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative w-full mx-auto mb-3 block cursor-pointer bg-canvas rounded-lg"
                >
                  <img 
                    src={releases[currentReleaseIndex].release_artwork} 
                    alt={releases[currentReleaseIndex].release_displayname || releases[currentReleaseIndex].release}
                    className="w-full h-full object-cover rounded-lg border border-secondary hover:opacity-70 transition-opacity"
                    onError={(e) => {
                      // Handle error silently
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </a>
              )
            ) : (        
              <div className="relative w-full mx-auto mb-4">
                <img 
                  src={releases[currentReleaseIndex].release_artwork} 
                  alt={releases[currentReleaseIndex].release_displayname || releases[currentReleaseIndex].release}
                  className="w-full h-full object-cover rounded-lg border border-secondary"
                  onError={(e) => {
                    // Handle error silently
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="text-center">
              <h3 className="text-sm font-medium text-black leading-4 mb-1">
                {renderDisplayName(releases[currentReleaseIndex]?.release_displayname, releases[currentReleaseIndex]?.release)}
              </h3>
              {releases[currentReleaseIndex]?.release_link && (
                <div className="flex justify-center">
                  {releases[currentReleaseIndex].release_service?.toLowerCase() === 'bandcamp' || releases[currentReleaseIndex].release_service?.toLowerCase() === 'youtube' ? (
                    <div 
                      onClick={handleStreamingClick}
                      className="flex items-center justify-center gap-1 text-black hover:underline font-normal text-xs transition-colors text-center cursor-pointer"
                    >
                      {getServiceIcon(releases[currentReleaseIndex].release_service)}
                      <span>{releases[currentReleaseIndex].release_service || "Streaming Service"}</span>
                    </div>
                  ) : (
                    <a 
                      href={releases[currentReleaseIndex].release_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-black hover:underline font-normal text-xs transition-colors text-center"
                    >
                      {getServiceIcon(releases[currentReleaseIndex].release_service)}
                      <span>{releases[currentReleaseIndex].release_service || "Streaming Service"}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Navigation arrows - only show if there are multiple releases */}
            {releases.length > 1 && (
              <div className="flex justify-center items-center mt-2 gap-4">
                <button
                  onClick={() => {
                    setCurrentReleaseIndex(prev => (prev - 1 + releases.length) % releases.length);
                    setEmbeddedReleaseIndex(null);
                  }}
                  className="p-1 rounded-full border text-black bg-tertiary border-secondary hover:bg-primary hover:text-black transition-colors"
                  aria-label="Previous release"
                >
                  <ArrowLeft size={12} />
                </button>
                <div className="flex items-center gap-2">
                  {releases.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentReleaseIndex(index);
                        setEmbeddedReleaseIndex(null);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentReleaseIndex === index 
                          ? 'bg-black' 
                          : 'bg-tertiary border border-secondary hover:bg-primary'
                      }`}
                      aria-label={`Go to release ${index + 1}`}
                      aria-current={currentReleaseIndex === index ? 'true' : 'false'}
                    />
                  ))}
                </div>
                <button
                  onClick={() => {
                    setCurrentReleaseIndex(prev => (prev + 1) % releases.length);
                    setEmbeddedReleaseIndex(null);
                  }}
                  className="p-1 rounded-full border text-black bg-tertiary border-secondary hover:bg-primary hover:text-black transition-colors"
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