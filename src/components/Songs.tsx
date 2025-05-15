import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { SongSearch } from './SongSearch';

interface Song {
  song: string;
  song_category: string;
  song_originalartist: string;
  song_id: string;
}

type SortField = 'song' | 'song_category' | 'song_originalartist';
type SortDirection = 'asc' | 'desc';

type TableType = 'goose' | 'covers' | 'adjacent' | 'collaborations';

interface TableState {
  songs: Song[];
  loading: boolean;
  currentPage: number;
  totalCount: number;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface SongBasic {
  song: string;
  song_id: string;
}

export function Songs() {
  const navigate = useNavigate();
  const songsPerPage = 30;

  const [gooseTable, setGooseTable] = React.useState<TableState>({
    songs: [],
    loading: true,
    currentPage: 1,
    totalCount: 0,
    sortField: 'song',
    sortDirection: 'asc'
  });

  const [coversTable, setCoversTable] = React.useState<TableState>({
    songs: [],
    loading: true,
    currentPage: 1,
    totalCount: 0,
    sortField: 'song',
    sortDirection: 'asc'
  });

  const [adjacentTable, setAdjacentTable] = React.useState<TableState>({
    songs: [],
    loading: true,
    currentPage: 1,
    totalCount: 0,
    sortField: 'song',
    sortDirection: 'asc'
  });

  const [collaborationsTable, setCollaborationsTable] = React.useState<TableState>({
    songs: [],
    loading: true,
    currentPage: 1,
    totalCount: 0,
    sortField: 'song',
    sortDirection: 'asc'
  });

  const fetchSongs = async (type: TableType, page: number, field: SortField, direction: SortDirection) => {
    try {
      const categoryType = {
        goose: 'Goose',
        covers: 'Cover Songs',
        adjacent: 'Goose-adjacent',
        collaborations: 'Live Collaborations'
      }[type];

      const { data, count, error } = await supabase
        .from('songs')
        .select(`
          song,
          song_category,
          song_originalartist,
          song_id,
          categories!inner(category_type)
        `, { count: 'exact' })
        .eq('categories.category_type', categoryType)
        .eq('song_placeholder', false) // Only show songs where song_placeholder is false
        .order(field, { ascending: direction === 'asc' })
        .range((page - 1) * songsPerPage, page * songsPerPage - 1);

      if (error) throw error;

      const formattedData = data?.map(song => ({
        song: song.song,
        song_category: song.song_category,
        song_originalartist: song.song_originalartist,
        song_id: song.song_id
      })) || [];

      return { songs: formattedData, count: count || 0 };
    } catch (error) {
      console.error(`Error fetching ${type} songs:`, error);
      return { songs: [], count: 0 };
    }
  };

  React.useEffect(() => {
    async function fetchGooseSongs() {
      setGooseTable(prev => ({ ...prev, loading: true }));
      const { songs, count } = await fetchSongs('goose', gooseTable.currentPage, gooseTable.sortField, gooseTable.sortDirection);
      setGooseTable(prev => ({
        ...prev,
        songs,
        totalCount: count,
        loading: false
      }));
    }
    fetchGooseSongs();
  }, [gooseTable.currentPage, gooseTable.sortField, gooseTable.sortDirection]);

  React.useEffect(() => {
    async function fetchCoverSongs() {
      setCoversTable(prev => ({ ...prev, loading: true }));
      const { songs, count } = await fetchSongs('covers', coversTable.currentPage, coversTable.sortField, coversTable.sortDirection);
      setCoversTable(prev => ({
        ...prev,
        songs,
        totalCount: count,
        loading: false
      }));
    }
    fetchCoverSongs();
  }, [coversTable.currentPage, coversTable.sortField, coversTable.sortDirection]);

  React.useEffect(() => {
    async function fetchAdjacentSongs() {
      setAdjacentTable(prev => ({ ...prev, loading: true }));
      const { songs, count } = await fetchSongs('adjacent', adjacentTable.currentPage, adjacentTable.sortField, adjacentTable.sortDirection);
      setAdjacentTable(prev => ({
        ...prev,
        songs,
        totalCount: count,
        loading: false
      }));
    }
    fetchAdjacentSongs();
  }, [adjacentTable.currentPage, adjacentTable.sortField, adjacentTable.sortDirection]);

  React.useEffect(() => {
    async function fetchCollaborationSongs() {
      setCollaborationsTable(prev => ({ ...prev, loading: true }));
      const { songs, count } = await fetchSongs('collaborations', collaborationsTable.currentPage, collaborationsTable.sortField, collaborationsTable.sortDirection);
      setCollaborationsTable(prev => ({
        ...prev,
        songs,
        totalCount: count,
        loading: false
      }));
    }
    fetchCollaborationSongs();
  }, [collaborationsTable.currentPage, collaborationsTable.sortField, collaborationsTable.sortDirection]);

  const handleSort = (type: TableType, field: SortField) => {
    const setState = type === 'goose' ? setGooseTable : 
                    type === 'covers' ? setCoversTable :
                    type === 'adjacent' ? setAdjacentTable :
                    setCollaborationsTable;
    const state = type === 'goose' ? gooseTable :
                 type === 'covers' ? coversTable :
                 type === 'adjacent' ? adjacentTable :
                 collaborationsTable;

    setState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: field === prev.sortField && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      currentPage: 1
    }));
  };

  const renderSortIcon = (tableState: TableState, field: SortField) => {
    if (field !== tableState.sortField) {
      return <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    }
    return tableState.sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const handlePageChange = (type: TableType, newPage: number) => {
    const setState = type === 'goose' ? setGooseTable :
                    type === 'covers' ? setCoversTable :
                    type === 'adjacent' ? setAdjacentTable :
                    setCollaborationsTable;
    setState(prev => ({ ...prev, currentPage: newPage }));
  };

  const SongsTable = ({ type, state }: { type: TableType; state: TableState }) => {
    const totalPages = Math.ceil(state.totalCount / songsPerPage);

    const getTableTitle = (type: TableType) => {
      switch (type) {
        case 'goose':
          return 'Goose Songs';
        case 'covers':
          return 'Cover Songs';
        case 'adjacent':
          return 'Goose-Adjacent Songs';
        case 'collaborations':
          return 'Live Collaborations';
        default:
          return '';
      }
    };

    return (
      <div className="flex-1 min-w-0 bg-primary border border-black rounded-lg p-3">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-4">
          {getTableTitle(type)}
        </h2>
        {state.loading ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
              <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
              <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
            </div>
            <p className="text-black mt-4">Loading songs...</p>
          </div>
        ) : state.songs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black">No songs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-max">
                <thead>
                  <tr className="bg-canvas border-y border-white/10">
                    <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                      <button 
                        onClick={() => handleSort(type, 'song')}
                        className="flex items-center gap-1 hover:text-[#a9682e] group"
                      >
                        Song
                        {renderSortIcon(state, 'song')}
                      </button>
                    </th>
                    {(type === 'goose' || type === 'adjacent') && (
                      <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                        <button 
                          onClick={() => handleSort(type, 'song_category')}
                          className="flex items-center gap-1 hover:text-[#a9682e] group"
                        >
                          Category
                          {renderSortIcon(state, 'song_category')}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                      <button 
                        onClick={() => handleSort(type, 'song_originalartist')}
                        className="flex items-center gap-1 hover:text-[#a9682e] group"
                      >
                        Original Artist
                        {renderSortIcon(state, 'song_originalartist')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {state.songs.map((song, index) => (
                    <tr
                      key={song.song_id}
                      className={`${
                        index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                      } hover:bg-black/10 transition-colors text-xs`}
                    >
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">
                        <span 
                          className="font-semibold hover:text-[#a9682e] transition-colors table-link cursor-pointer"
                          onClick={() => navigate(`/song/${song.song_id}`)}
                        >
                          {song.song}
                        </span>
                      </td>
                      {(type === 'goose' || type === 'adjacent') && (
                        <td className="px-4 py-0.5 text-black whitespace-nowrap">{song.song_category}</td>
                      )}
                      <td className="px-4 py-0.5 text-black whitespace-nowrap">{song.song_originalartist}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between px-4">
              <div className="text-sm text-black">
                Showing {(state.currentPage - 1) * songsPerPage + 1}-{Math.min(state.currentPage * songsPerPage, state.totalCount)} of {state.totalCount}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(type, state.currentPage - 1)}
                  disabled={state.currentPage === 1}
                  className={`p-1 rounded-md transition-colors ${
                    state.currentPage === 1
                      ? 'text-black/30 cursor-not-allowed'
                      : 'text-black hover:text-[#a9682e] hover:bg-black/10'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-black">
                  Page {state.currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(type, state.currentPage + 1)}
                  disabled={state.currentPage === totalPages}
                  className={`p-1 rounded-md transition-colors ${
                    state.currentPage === totalPages
                      ? 'text-black/30 cursor-not-allowed'
                      : 'text-black hover:text-[#a9682e] hover:bg-black/10'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">Songs</h1>
        <SongSearch />
      </div>
      <div className="flex flex-col gap-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full">
            <SongsTable type="goose" state={gooseTable} />
          </div>
          <div className="w-full">
            <SongsTable type="covers" state={coversTable} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full">
            <SongsTable type="adjacent" state={adjacentTable} />
          </div>
          <div className="w-full">
            <SongsTable type="collaborations" state={collaborationsTable} />
          </div>
        </div>
      </div>
    </div>
  );
}