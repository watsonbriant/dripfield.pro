import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';

export function WtedEpisode() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const [episode, setEpisode] = React.useState<{ episode: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchEpisode() {
      if (!episodeId) return;

      try {
        const { data, error } = await supabase
          .from('wted_episodes')
          .select('episode')
          .eq('uuid', episodeId)
          .single();

        if (error) {
          console.error('Error fetching episode:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setEpisode(data);
        }
      } catch (error) {
        console.error('Error fetching episode:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEpisode();
  }, [episodeId]);

  return (
    <>
      <Helmet>
        <title>{episode ? `${episode.episode} — WTED Radio Program Director` : 'WTED Episode — Dripfield.pro'}</title>
      </Helmet>
      <div className="max-w-[1280px]">
        {loading ? (
          <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
            <p className="text-fifth mt-4">Loading episode...</p>
          </div>
        ) : episode ? (
          <div className="bg-primary border border-fourth rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-4 text-fifth">{episode.episode}</h1>
            <p className="text-lg text-secondary">Placeholder content for {episode.episode}</p>
          </div>
        ) : (
          <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
            <p className="text-fifth">Episode not found</p>
          </div>
        )}
      </div>
    </>
  );
}

