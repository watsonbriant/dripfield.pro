  import React, { useEffect, useState } from 'react';
  import { supabase } from '../lib/supabase';
  import { useNavigate } from 'react-router-dom';

  interface List {
    id: number;
    list_id: string;
    list_name: string;
    list_category: string;
    list_order: number;
  }

  export function Lists() {
    const [songLists, setSongLists] = useState<List[]>([]);
    const [showLists, setShowLists] = useState<List[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      fetchLists();
    }, []);

    async function fetchLists() {
      try {
        // Fetch song lists
        const { data: songData, error: songError } = await supabase
          .from('lists')
          .select('*')
          .eq('list_category', 'songs')
          .order('list_order', { ascending: true });

        if (songError) throw songError;

        // Fetch show lists
        const { data: showData, error: showError } = await supabase
          .from('lists')
          .select('*')
          .eq('list_category', 'shows')
          .order('list_order', { ascending: true });

        if (showError) throw showError;

        setSongLists(songData || []);
        setShowLists(showData || []);
      } catch (error) {
        console.error('Error fetching lists:', error);
      } finally {
        setLoading(false);
      }
    }

    const handleListClick = (listId: string) => {
      navigate(`/lists/${listId}`);
    };

    if (loading) {
      return (
        <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
          <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3 shadow-xl">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
            <p className="text-fifth mt-4">Loading lists...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-[960px]">
        <div className="mb-4 shadow-xl">
          <div className="bg-primary border border-fourth">
            <div className="bg-tertiary text-fifth pr-1 py-0.5">
              <h1 className="text-sm font-semibold pl-2">
                Lists
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary border border-fourth shadow-xl">
            <div className="bg-fourth text-white px-2 py-0.5">
              <h2 className="text-sm font-semibold">
                Songs
              </h2>
            </div>
            <div className="p-1.5">
              {songLists.length > 0 ? (
                <div className="space-y-0">
                  {songLists.map((list, index) => (
                    <button
                      key={`song-${list.id || index}`}
                      onClick={() => handleListClick(list.list_id)}
                      className="block w-full text-left text-xs text-fifth hover:underline transition-colors font-medium cursor-pointer hover:bg-tertiary/40 px-1"
                    >
                      {list.list_name}
                    </button>
                  ))}
                </div>
              ) : (
                <div key="no-songs" className="text-[0.625rem] text-fifth/70">No song lists available</div>
              )}
            </div>
          </div>

          <div className="bg-primary border border-fourth shadow-xl">
            <div className="bg-fourth text-white px-2 py-0.5">
              <h2 className="text-sm font-semibold">
                Shows
              </h2>
            </div>
            <div className="p-1.5">
              {showLists.length > 0 ? (
                <div className="space-y-0">
                  {showLists.map((list, index) => (
                    <button
                      key={`show-${list.id || index}`}
                      onClick={() => handleListClick(list.list_id)}
                      className="block w-full text-left text-xs text-fifth hover:underline transition-colors font-medium cursor-pointer hover:bg-tertiary/40 px-1"
                    >
                      {list.list_name}
                    </button>
                  ))}
                </div>
              ) : (
                <div key="no-shows" className="text-[0.625rem] text-fifth/70">No show lists available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }