import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import wlIcon from '../img/WL.png';

interface WtedShow {
  show: string;
  order: number | null;
  episodes: WtedEpisode[];
}

interface WtedEpisode {
  episode: string;
  order: number | null;
  uuid: string;
  artwork: string | null;
  hasEntries: boolean;
}

export function Wted() {
  const [shows, setShows] = React.useState<WtedShow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hoveredEpisode, setHoveredEpisode] = React.useState<string | null>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    async function fetchShowsAndEpisodes() {
      try {
        // Fetch all shows ordered by order ascending
        const { data: showsData, error: showsError } = await supabase
          .from('wted_shows')
          .select('show, order')
          .order('order', { ascending: true });

        if (showsError) {
          console.error('Error fetching shows:', showsError);
          setLoading(false);
          return;
        }

        if (!showsData) {
          setLoading(false);
          return;
        }

        // For each show, fetch its episodes
        const showsWithEpisodes = await Promise.all(showsData.map(async (showItem) => {
          const { data: episodesData, error: episodesError } = await supabase
            .from('wted_episodes')
            .select('episode, order, uuid, artwork')
            .eq('show', showItem.show)
            .order('order', { ascending: true });

          if (episodesError) {
            console.error('Error fetching episodes:', episodesError);
            return {
              show: showItem.show,
              order: showItem.order,
              episodes: []
            };
          }

          // Check which episodes have entries in wted_episode_entries
          const episodesWithEntries = await Promise.all(
            (episodesData || []).map(async (episode) => {
              const { count, error: entriesError } = await supabase
                .from('wted_episode_entries')
                .select('*', { count: 'exact', head: true })
                .eq('episode', episode.uuid);

              if (entriesError) {
                console.error('Error checking episode entries:', entriesError);
                return {
                  episode: episode.episode,
                  order: episode.order,
                  uuid: episode.uuid,
                  artwork: episode.artwork,
                  hasEntries: false,
                };
              }

              return {
                episode: episode.episode,
                order: episode.order,
                uuid: episode.uuid,
                artwork: episode.artwork,
                hasEntries: (count || 0) > 0,
              };
            })
          );

          return {
            show: showItem.show,
            order: showItem.order,
            episodes: episodesWithEntries,
          };
        }));

        setShows(showsWithEpisodes);
      } catch (error) {
        console.error('Error fetching shows and episodes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShowsAndEpisodes();
  }, []);

  return (
    <>
      <Helmet>
        <title>WTED Radio Program Director — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-[1280px]">
        <div className="mb-4 shadow-xl">
          <div className="bg-primary border border-fourth">
            <div className="bg-tertiary text-fifth pr-1 py-0.5 flex justify-between items-center">
              <h1 className="text-sm font-semibold pl-2">
                WTED Radio Program Director
              </h1>
              <img src={wlIcon} alt="WL" className="w-5 h-5" />
            </div>
            <div className="px-2 py-1 text-[0.625rem] leading-[0.875rem] text-fifth font-light">
              <a
                href="https://www.wtedradio.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline transition-colors"
              >
                WTED Goose Radio
              </a>
              {' '}is an Internet streaming radio station (powered by{' '}
              <a
                href="https://wysterialane.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline transition-colors"
              >
                Wysteria Lane
              </a>
              ) that celebrates the band Goose as well as Goose-related projects and forerunners like Vasudo, Great Blue, and Orebolo. It streams a mix of studio and live recordings from the band's various catalogs as well as commentary, special event simulcasts, and other programming. Below is a comprehensive list of all shows and episodes that air at various times on WTED. Click any episode to see additional information and the track listing to follow along.
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
            <p className="text-fifth mt-4">Loading shows...</p>
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
            <p className="text-fifth">No shows found</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {shows.map((showItem) => (
              <div
                key={showItem.show}
                className="bg-primary border border-fourth overflow-hidden hover:border-fourth/70 transition-colors shadow-xl"
              >
                {/* Show Header */}
                <div className="bg-fourth text-white px-2 py-0.5">
                  <h2 className="text-sm font-semibold">
                    {showItem.show}
                  </h2>
                </div>

                {/* Episodes List */}
                {showItem.episodes.length > 0 ? (
                  <div className="p-2">
                    <ul className="space-y-1.5">
                      {showItem.episodes.map((episode, index) => (
                        <li
                          key={`${showItem.show}-${episode.episode}-${index}`}
                          className="text-[0.625rem] leading-[0.625rem] text-fifth font-light"
                        >
                          {episode.hasEntries ? (
                            <>
                              <Link
                                to={`/wted/${episode.uuid}`}
                                className="font-medium hover:underline transition-colors"
                                onMouseEnter={(e) => {
                                  if (episode.artwork) {
                                    setHoveredEpisode(episode.uuid);
                                    setMousePosition({ x: e.clientX, y: e.clientY });
                                  }
                                }}
                                onMouseMove={(e) => {
                                  if (episode.artwork) {
                                    setMousePosition({ x: e.clientX, y: e.clientY });
                                  }
                                }}
                                onMouseLeave={() => {
                                  setHoveredEpisode(null);
                                }}
                              >
                                {episode.episode}
                              </Link>
                              {hoveredEpisode === episode.uuid && episode.artwork && (
                                <div
                                  className="fixed bg-fourth border border-fourth rounded-lg shadow-xl z-[9999]"
                                  style={{
                                    left: `${mousePosition.x + 10}px`,
                                    top: `${mousePosition.y - 10}px`
                                  }}
                                >
                                  <img
                                    src={episode.artwork}
                                    alt={episode.episode}
                                    className="max-h-[60px] rounded-lg"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            episode.episode
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-2">
                    <p className="text-xs text-fifth/70 italic">No episodes found</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
