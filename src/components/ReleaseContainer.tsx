import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MoveRight, AudioLines, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import NugsIcon from '../../public/src/img/nugs1.png';
import NugsColorIcon from '../../public/src/img/NugsColor.png';
import { FaYoutube } from "react-icons/fa6";
import { SiBandcamp } from "react-icons/si";
import { FaSpotify } from "react-icons/fa";

// Move utility functions outside component to prevent recreation on every render
const getServiceIcon = (serviceName: string | null, isHovered: boolean = false) => {
  if (!serviceName) return null;
  
  switch (serviceName.toLowerCase()) {
    case 'youtube':
      return <FaYoutube className={`inline-block ${isHovered ? '' : 'text-[#FF0033]'}`} size="1rem" />;
    case 'bandcamp':
      return <SiBandcamp className={`inline-block ${isHovered ? '' : 'text-[#1b96bb]'}`} size="1rem" />;
    case 'nugs':
      return <img src={isHovered ? NugsIcon : NugsColorIcon} alt="nugs" className="inline-block h-4 w-auto" />;
    case 'spotify':
      return <FaSpotify className={`inline-block ${isHovered ? '' : 'text-[#1ed760]'}`} size="1rem" />;
    default:
      return null;
  }
};

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
              <MoveRight className="inline-block mx-1 text-red-600 h-3" size={16} strokeWidth={3} />
            )}
          </React.Fragment>
        ))}
      </>
    );
  }
  
  return text;
};

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

const convertToYouTubeEmbed = (youtubeUrl: string): string => {
  const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return youtubeUrl; // Return original if can't parse
};

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
  highlightOnMount?: boolean;
  className?: string;
}

const ReleaseContainer: React.FC<ReleaseContainerProps> = ({ showId, highlightOnMount = false, className = "" }) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [embeddedReleaseIndex, setEmbeddedReleaseIndex] = useState<number | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [loadingReleaseIndex, setLoadingReleaseIndex] = useState<number | null>(null);
  const [hoveredReleaseIndex, setHoveredReleaseIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper functions for embed state
  const isEmbedded = useCallback((index: number) => {
    return embeddedReleaseIndex === index;
  }, [embeddedReleaseIndex]);

  const hasEmbeddedContent = useCallback((release: Release, index: number) => {
    return isEmbedded(index) && (albumId || release?.release_service?.toLowerCase() === 'youtube');
  }, [isEmbedded, albumId]);

  const isLoadingEmbed = useCallback((index: number) => {
    return loadingReleaseIndex === index;
  }, [loadingReleaseIndex]);

  // Optimize event handlers to prevent recreation on every render
  const handleStreamingClick = useCallback(async (e: React.MouseEvent, release: Release, index: number) => {
    e.preventDefault();
    
    const service = release?.release_service?.toLowerCase();
    
    // If this release is already embedded, close it
    if (embeddedReleaseIndex === index) {
      setEmbeddedReleaseIndex(null);
      setAlbumId(null);
      setLoadingReleaseIndex(null);
      return;
    }
    
    // Close any existing embed and open this one
    setEmbeddedReleaseIndex(null);
    setAlbumId(null);
    setLoadingReleaseIndex(index); // Show loading state
    
    if (service === 'bandcamp' && release?.release_link) {
      try {
        const fetchedAlbumId = await fetchBandcampAlbumId(release.release_link);
        if (fetchedAlbumId) {
          setAlbumId(fetchedAlbumId);
          setEmbeddedReleaseIndex(index);
        }
      } catch (error) {
        console.error('Error loading Bandcamp embed:', error);
      } finally {
        setLoadingReleaseIndex(null); // Hide loading state
      }
    } else if (service === 'youtube' && release?.release_link) {
      // For YouTube, we don't need to fetch anything - just set the embed state
      // Add a small delay to show loading state briefly
      setTimeout(() => {
        setEmbeddedReleaseIndex(index);
        setLoadingReleaseIndex(null);
      }, 300);
    } else {
      setLoadingReleaseIndex(null);
    }
  }, [embeddedReleaseIndex]);


  // Fetch releases when showId changes - remove fetchReleases from dependencies to prevent infinite loops
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!showId) {
        if (isMounted) {
          setReleases([]);
          setIsLoading(false);
        }
        return;
      }
      
      setIsLoading(true);
      setEmbeddedReleaseIndex(null);
      setLoadingReleaseIndex(null);
      
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
          if (isMounted) {
            setReleases([]);
            setIsLoading(false);
          }
          return;
        }
        
        if (data && data.length > 0) {
          // Map the joined data to the expected release format
          const formattedReleases: Release[] = data
            .filter(item => item.releases) // Filter out null releases
            .map(item => ({
              ...item.releases!,
              release_order: item.release_order
            } as unknown as Release));
          
          if (isMounted) {
            setReleases(formattedReleases);
            setIsLoading(false);
          }
        } else {
          if (isMounted) {
            setReleases([]);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in loadData:', error);
        if (isMounted) {
          setReleases([]);
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [showId]); // Only depend on showId

  // Handle highlight effect on mount - now handled by CSS animation class
  useEffect(() => {
    if (highlightOnMount) {
      // Highlight animation is handled by CSS class
    }
  }, [highlightOnMount]);

  // Early return for loading state
  if (isLoading) {
    return <div className="bg-primary border border-secondary rounded-lg p-3 mb-4 text-center">
      <p className="text-black">Loading releases...</p>
    </div>;
  }

  // Early return if no releases
  if (releases.length === 0) {
    return null;
  }
  
  return (
    <div 
      ref={containerRef}
      className={`border border-secondary rounded-lg p-3 mb-4 relative bg-fifth ${className}`}
    >
      {/* AudioLines icon positioned in top right */}
      <AudioLines className="absolute top-3 right-3 text-primary w-[1rem] h-[1rem]" />
      
      <div className="space-y-1.5">
        {releases.map((release, index) => (
          <React.Fragment key={release.release_id}>
            <div className="relative">
              <div className="flex items-center gap-3">
                {/* Square artwork */}
                <div className="flex-shrink-0">
                  {release?.release_link ? (
                    release.release_service?.toLowerCase() === 'bandcamp' || release.release_service?.toLowerCase() === 'youtube' ? (
                      <div 
                        onClick={(e) => handleStreamingClick(e, release, index)}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredReleaseIndex(index)}
                        onMouseLeave={() => setHoveredReleaseIndex(null)}
                      >
                        <img 
                          src={release.release_artwork} 
                          alt={release.release_displayname || release.release}
                          className="w-12 h-12 rounded object-cover hover:opacity-70 transition-opacity"
                          onError={(e) => {
                            // Handle error silently
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <a 
                        href={release.release_link}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                        onMouseEnter={() => setHoveredReleaseIndex(index)}
                        onMouseLeave={() => setHoveredReleaseIndex(null)}
                      >
                        <img 
                          src={release.release_artwork} 
                          alt={release.release_displayname || release.release}
                          className="w-12 h-12 rounded object-cover hover:opacity-70 transition-opacity"
                          onError={(e) => {
                            // Handle error silently
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </a>
                    )
                  ) : (
                    <img 
                      src={release.release_artwork} 
                      alt={release.release_displayname || release.release}
                      className="w-12 h-12 rounded object-cover"
                      onError={(e) => {
                        // Handle error silently
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                
                {/* Release info */}
                <div className={`flex-1 min-w-0 ${index === 0 ? 'pr-6' : ''}`}>
                    {release?.release_link ? (
                      release.release_service?.toLowerCase() === 'bandcamp' || release.release_service?.toLowerCase() === 'youtube' ? (
                        <h3 
                          onClick={(e) => handleStreamingClick(e, release, index)}
                          className="text-[13px] font-medium text-primary leading-[13px] cursor-pointer hover:underline"
                          onMouseEnter={() => setHoveredReleaseIndex(index)}
                          onMouseLeave={() => setHoveredReleaseIndex(null)}
                        >
                          {renderDisplayName(release?.release_displayname, release?.release)}
                        </h3>
                      ) : (
                        <a 
                          href={release.release_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[13px] font-medium text-primary leading-[13px] hover:underline block"
                          onMouseEnter={() => setHoveredReleaseIndex(index)}
                          onMouseLeave={() => setHoveredReleaseIndex(null)}
                        >
                          {renderDisplayName(release?.release_displayname, release?.release)}
                        </a>
                      )
                    ) : (
                      <h3 className="text-[13px] font-medium text-primary leading-[13px]">
                        {renderDisplayName(release?.release_displayname, release?.release)}
                      </h3>
                    )}
                  {release?.release_link && (
                    <div className="flex items-center">
                      {release.release_service?.toLowerCase() === 'bandcamp' || release.release_service?.toLowerCase() === 'youtube' ? (
                        <div 
                          onClick={(e) => handleStreamingClick(e, release, index)}
                          className="flex items-center gap-1 text-primary hover:underline font-normal text-[10px] leading-[10px] pt-0.5 transition-colors cursor-pointer"
                          onMouseEnter={() => setHoveredReleaseIndex(index)}
                          onMouseLeave={() => setHoveredReleaseIndex(null)}
                        >
                          {getServiceIcon(release.release_service, hoveredReleaseIndex === index)}
                          {release.release_service || "Streaming Service"}
                        </div>
                      ) : (
                        <a 
                          href={release.release_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline font-normal text-[10px] leading-[10px] transition-colors"
                          onMouseEnter={() => setHoveredReleaseIndex(index)}
                          onMouseLeave={() => setHoveredReleaseIndex(null)}
                        >
                          {getServiceIcon(release.release_service, hoveredReleaseIndex === index)}
                          {release.release_service || "Streaming Service"}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Loading state - spans full width below both columns */}
              {isLoadingEmbed(index) && (
                <div className="mt-3 flex justify-center items-center py-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </div>
                </div>
              )}
              
              {/* Embedded content - spans full width below both columns */}
              {hasEmbeddedContent(release, index) && (
                <div className="mt-3 flex justify-center">
                  {release.release_service?.toLowerCase() === 'bandcamp' && albumId ? (
                    <iframe 
                      style={{ 
                        border: 0, 
                        width: 'min(245px, 100%)', 
                        height: '390px' 
                      }}
                      src={`https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=ffffff/linkcol=333333/tracklist=false/transparent=true/`}
                      seamless
                      title={release.release_displayname || release.release}
                    />
                  ) : release.release_service?.toLowerCase() === 'youtube' ? (
                    <iframe 
                      className="lg:!h-[138px]"
                      style={{ 
                        border: 0, 
                        width: 'min(560px, 100%)', 
                        height: '200px' 
                      }}
                      src={convertToYouTubeEmbed(release.release_link!)}
                      title={release.release_displayname || release.release}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : null}
                </div>
              )}
            </div>
            
            {/* Divider - only show between releases, not after the last one */}
            {index < releases.length - 1 && (
              <div className="h-px bg-secondary/20" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ReleaseContainer);