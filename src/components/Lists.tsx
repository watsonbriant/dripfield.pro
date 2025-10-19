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
        <div className="max-w-[936px] mx-auto">
          <div className="text-fifth text-center py-8">Loading lists...</div>
        </div>
      );
    }

    return (
      <div className="max-w-[936px] mx-auto">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Lists</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
              Songs
            </h2>
            <div className="text-fourth text-sm font-medium">
              {songLists.length > 0 ? (
                songLists.map((list, index) => (
                  <button
                    key={`song-${list.id || index}`}
                    onClick={() => handleListClick(list.list_id)}
                    className="block w-full text-left hover:underline transition-colors cursor-pointer"
                  >
                    {list.list_name}
                  </button>
                ))
              ) : (
                <div key="no-songs" className="text-gray-500">No song lists available</div>
              )}
            </div>
          </div>

          <div className="bg-primary border border-secondary rounded-lg p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
              Shows
            </h2>
            <div className="text-fourth text-sm font-medium">
              {showLists.length > 0 ? (
                showLists.map((list, index) => (
                  <button
                    key={`show-${list.id || index}`}
                    onClick={() => handleListClick(list.list_id)}
                    className="block w-full text-left hover:underline transition-colors cursor-pointer"
                  >
                    {list.list_name}
                  </button>
                ))
              ) : (
                <div key="no-shows" className="text-gray-500">No show lists available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }