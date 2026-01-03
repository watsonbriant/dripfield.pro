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
      return <FaYoutube className={`inline-block ${isHovered ? '' : 'text-[#FF0033]'}`} size="0.875rem" />;
    case 'bandcamp':
      return <SiBandcamp className={`inline-block ${isHovered ? '' : 'text-[#1b96bb]'}`} size="0.875rem" />;
    case 'nugs':
      return <img src={isHovered ? NugsIcon : NugsColorIcon} alt="nugs" className="inline-block h-[0.875rem] w-auto" />;
    case 'spotify':
      return <FaSpotify className={`inline-block ${isHovered ? '' : 'text-[#1ed760]'}`} size="0.875rem" />;
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
  onYouTubeEmbed?: (release: Release | null) => void;
  onYouTubeLoading?: (loading: boolean) => void;
  onReleaseHover?: (releaseId: string | null) => void;
}

const ReleaseContainer: React.FC<ReleaseContainerProps> = ({ showId, highlightOnMount = false, className = "", onYouTubeEmbed, onYouTubeLoading, onReleaseHover }) => {
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
    // Only show Bandcamp embeds inline - YouTube embeds are handled by parent
    return isEmbedded(index) && albumId && release?.release_service?.toLowerCase() === 'bandcamp';
  }, [isEmbedded, albumId]);

  const isLoadingEmbed = useCallback((index: number, release: Release) => {
    // Only show loading for Bandcamp - YouTube loading is handled by parent
    return loadingReleaseIndex === index && release?.release_service?.toLowerCase() === 'bandcamp';
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
      // Clear YouTube embed if it was this one
      if (service === 'youtube' && onYouTubeEmbed) {
        onYouTubeEmbed(null);
      }
      if (service === 'youtube' && onYouTubeLoading) {
        onYouTubeLoading(false);
      }
      return;
    }
    
    // Clear YouTube embed if opening Bandcamp, or clear Bandcamp if opening YouTube
    if (service === 'bandcamp') {
      // Clear YouTube embed when opening Bandcamp
      if (onYouTubeEmbed) {
        onYouTubeEmbed(null);
      }
      if (onYouTubeLoading) {
        onYouTubeLoading(false);
      }
      
      // Close any existing Bandcamp embed
      setEmbeddedReleaseIndex(null);
      setAlbumId(null);
      
      // Show loading state for Bandcamp
      setLoadingReleaseIndex(index);
      
      if (release?.release_link) {
        try {
          const fetchedAlbumId = await fetchBandcampAlbumId(release.release_link);
          if (fetchedAlbumId) {
            setAlbumId(fetchedAlbumId);
            setEmbeddedReleaseIndex(index);
          }
        } catch (error) {
          console.error('Error loading Bandcamp embed:', error);
        } finally {
          setLoadingReleaseIndex(null);
        }
      } else {
        setLoadingReleaseIndex(null);
      }
    } else if (service === 'youtube' && release?.release_link) {
      // Clear Bandcamp embed when opening YouTube
      setEmbeddedReleaseIndex(null);
      setAlbumId(null);
      
      // Notify parent about YouTube embed
      if (onYouTubeEmbed) {
        onYouTubeEmbed(release);
      }
      if (onYouTubeLoading) {
        onYouTubeLoading(true);
        // Hide loading after a brief delay
        setTimeout(() => {
          if (onYouTubeLoading) {
            onYouTubeLoading(false);
          }
        }, 300);
      }
    }
  }, [embeddedReleaseIndex, onYouTubeEmbed, onYouTubeLoading]);


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
      setAlbumId(null);
      setLoadingReleaseIndex(null);
      // Clear YouTube embed when showId changes
      if (onYouTubeEmbed) {
        onYouTubeEmbed(null);
      }
      if (onYouTubeLoading) {
        onYouTubeLoading(false);
      }
      // Clear release hover when showId changes
      if (onReleaseHover) {
        onReleaseHover(null);
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
  }, [showId, onYouTubeEmbed, onYouTubeLoading]); // Include callbacks in dependencies

  // Handle highlight effect on mount - now handled by CSS animation class
  useEffect(() => {
    if (highlightOnMount) {
      // Highlight animation is handled by CSS class
    }
  }, [highlightOnMount]);

  // Early return for loading state
  if (isLoading) {
    return <div className="bg-primary border border-fourth rounded-lg p-3 mb-4 text-center">
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
      className={`p-1 mt-2 relative bg-fifth ${className}`}
    >
      {/* AudioLines icon positioned in top right */}
      <AudioLines className="absolute top-1 right-1 text-white w-3 h-3" />
      
      <div className="space-y-1.5">
        {releases.map((release, index) => (
          <React.Fragment key={release.release_id}>
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* Square artwork */}
                <div className="flex-shrink-0">
                  {release?.release_link ? (
                      release.release_service?.toLowerCase() === 'bandcamp' || release.release_service?.toLowerCase() === 'youtube' ? (
                      <div 
                        onClick={(e) => handleStreamingClick(e, release, index)}
                        className="cursor-pointer"
                        onMouseEnter={() => {
                          setHoveredReleaseIndex(index);
                          if (onReleaseHover) {
                            onReleaseHover(release.release_id);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredReleaseIndex(null);
                          if (onReleaseHover) {
                            onReleaseHover(null);
                          }
                        }}
                      >
                        <img 
                          src={release.release_artwork} 
                          alt={release.release_displayname || release.release}
                          className="w-8 h-8 rounded object-cover hover:opacity-70 transition-opacity"
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
                        onMouseEnter={() => {
                          setHoveredReleaseIndex(index);
                          if (onReleaseHover) {
                            onReleaseHover(release.release_id);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredReleaseIndex(null);
                          if (onReleaseHover) {
                            onReleaseHover(null);
                          }
                        }}
                      >
                        <img 
                          src={release.release_artwork} 
                          alt={release.release_displayname || release.release}
                          className="w-8 h-8 rounded object-cover hover:opacity-70 transition-opacity"
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
                      className="w-8 h-8 rounded object-cover"
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
                          className="text-xs font-medium text-white cursor-pointer hover:underline leading-[0.75rem]"
                          onMouseEnter={() => {
                            setHoveredReleaseIndex(index);
                            if (onReleaseHover) {
                              onReleaseHover(release.release_id);
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredReleaseIndex(null);
                            if (onReleaseHover) {
                              onReleaseHover(null);
                            }
                          }}
                        >
                          {renderDisplayName(release?.release_displayname, release?.release)}
                        </h3>
                      ) : (
                        <a 
                          href={release.release_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-medium leading-[0.75rem] text-white hover:underline block"
                          onMouseEnter={() => {
                            setHoveredReleaseIndex(index);
                            if (onReleaseHover) {
                              onReleaseHover(release.release_id);
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredReleaseIndex(null);
                            if (onReleaseHover) {
                              onReleaseHover(null);
                            }
                          }}
                        >
                          {renderDisplayName(release?.release_displayname, release?.release)}
                        </a>
                      )
                    ) : (
                      <h3 className="text-xs font-medium text-white">
                        {renderDisplayName(release?.release_displayname, release?.release)}
                      </h3>
                    )}
                  {release?.release_link && (
                    <div className="flex items-center">
                      {                      release.release_service?.toLowerCase() === 'bandcamp' || release.release_service?.toLowerCase() === 'youtube' ? (
                        <div 
                          onClick={(e) => handleStreamingClick(e, release, index)}
                          className="flex items-center gap-1 text-white hover:underline font-normal text-[0.625rem] transition-colors cursor-pointer"
                          onMouseEnter={() => {
                            setHoveredReleaseIndex(index);
                            if (onReleaseHover) {
                              onReleaseHover(release.release_id);
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredReleaseIndex(null);
                            if (onReleaseHover) {
                              onReleaseHover(null);
                            }
                          }}
                        >
                          {getServiceIcon(release.release_service, hoveredReleaseIndex === index)}
                          {release.release_service || "Streaming Service"}
                        </div>
                      ) : (
                        <a 
                          href={release.release_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-white hover:underline font-normal text-[0.625rem] transition-colors"
                          onMouseEnter={() => {
                            setHoveredReleaseIndex(index);
                            if (onReleaseHover) {
                              onReleaseHover(release.release_id);
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredReleaseIndex(null);
                            if (onReleaseHover) {
                              onReleaseHover(null);
                            }
                          }}
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
              {isLoadingEmbed(index, release) && (
                <div className="mt-3 flex justify-center items-center py-1">
                  <div className="flex items-center gap-2 text-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </div>
                </div>
              )}
              
              {/* Embedded content - only Bandcamp embeds appear here, YouTube embeds are in parent */}
              {hasEmbeddedContent(release, index) && release.release_service?.toLowerCase() === 'bandcamp' && albumId && (
                <div className="mt-2 flex justify-center">
                  <iframe 
                    style={{ 
                      border: 0, 
                      width: 'min(245px, 100%)', 
                      height: '330px' 
                    }}
                    src={`https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=181818/linkcol=ffffff/tracklist=false/transparent=true/`}
                    seamless
                    title={release.release_displayname || release.release}
                  />
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ReleaseContainer);