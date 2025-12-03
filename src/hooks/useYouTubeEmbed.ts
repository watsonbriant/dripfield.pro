import { useState, useEffect, useCallback } from 'react';

interface YouTubeEmbed {
  release_link: string;
  release_displayname: string | null;
  release: string;
}

export const useYouTubeEmbed = (showId: string | undefined) => {
  const [youtubeEmbed, setYoutubeEmbed] = useState<YouTubeEmbed | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);

  // Clear embeds when showId changes
  useEffect(() => {
    setYoutubeEmbed(null);
    setYoutubeLoading(false);
  }, [showId]);

  const handleYouTubeEmbed = useCallback((release: YouTubeEmbed | null) => {
    setYoutubeEmbed(prev => {
      // If clicking the same release, toggle it off
      if (prev && release && prev.release_link === release.release_link) {
        return null;
      }
      // Otherwise, set to new release (or null to close)
      return release;
    });
  }, []);

  const handleYouTubeLoading = useCallback((loading: boolean) => {
    setYoutubeLoading(loading);
  }, []);

  const convertToYouTubeEmbed = useCallback((youtubeUrl: string): string => {
    const videoIdMatch = youtubeUrl.match(/[?&]v=([^&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return youtubeUrl; // Return original if can't parse
  }, []);

  const clearEmbed = useCallback(() => {
    setYoutubeEmbed(null);
    setYoutubeLoading(false);
  }, []);

  return {
    youtubeEmbed,
    youtubeLoading,
    handleYouTubeEmbed,
    handleYouTubeLoading,
    convertToYouTubeEmbed,
    clearEmbed
  };
};

