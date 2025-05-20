import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PerformanceChart from './PerformanceChart';
import { SongSearch } from './SongSearch';
import SongPlacementPill from './SongPlacementPill';

interface SongData {
  song: string;
  song_category: string;
  song_originalartist: string | null;
  song_coachnotes: string | null;
  song_lyrics: string | null;
  categories: {
    category_type: string;
  };
}

interface Performance {
  show_id: string;
  show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string;
  show_tour: string | null;
  entry_length: string | null;
  entry_placement: string;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_segue: string | null;
  entry_set: string;
  entry_setnum: number;
  entry_song: string;
  guests: {
    guest_display_name: string;
  }[];
}

interface GroupCount {
  group: string;
  count: number;
}

interface PlacementStat {
  placement: string;
  count: number;
  percentage: number;
  order?: number; // Add placement order field
}

interface Stats {
  groupCounts: GroupCount[];
  rarity: string;
  totalShows: number;
  hasRarity: boolean;
}

const getRarityColor = (percentage: string | null): string => {
  // If percentage is null or not a valid percentage string, return transparent
  if (!percentage || percentage === '-') return 'transparent';
  
  // Convert percentage string to number
  const numericPercentage = parseFloat(percentage.replace('%', ''));
  
  if (isNaN(numericPercentage)) return 'transparent';
  
  // Define our 4 color stops with breakpoints at 0, 15, 50, 100
  const colorStops = [
    { percent: 0, color: { r: 156, g: 12, b: 12 } },     // #9C0C0C (Even Darker Red)
    { percent: 15, color: { r: 230, g: 81, b: 0 } },     // #E65100 (Darker Orange)
    { percent: 50, color: { r: 46, g: 125, b: 50 } },    // #2E7D32 (Darker Green)
    { percent: 100, color: { r: 13, g: 71, b: 161 } }    // #0D47A1 (Darker Blue)
  ];
  
  // Find the color stops to interpolate between
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (numericPercentage >= colorStops[i].percent && numericPercentage <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0;
  
  // Interpolate RGB values
  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));
  
  return `rgb(${r}, ${g}, ${b})`;
};

export function Song() {
  const { songId } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState<SongData | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ 
    groupCounts: [], 
    rarity: '', 
    totalShows: 0,
    hasRarity: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const performancesPerPage = 50;
  const [previousSongId, setPreviousSongId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [placementStats, setPlacementStats] = useState<PlacementStat[]>([]);

  const fetchPlacementStats = async (songName: string) => {
    try {
      // First, get the placement order information
      const { data: placementOrders, error: placementError } = await supabase
        .from('placements')
        .select('placements, placement_order');
        
      if (placementError) throw placementError;
      
      // Create a map of placement names to their orders
      const placementOrderMap: Record<string, number> = {};
      if (placementOrders) {
        placementOrders.forEach(p => {
          if (p.placement_order !== null) {
            placementOrderMap[p.placements] = p.placement_order;
          }
        });
      }

      // Fetch all canon performances of this song
      const { data: canonPerformances, error } = await supabase
        .from('setlist_entries')
        .select(`
          entry_placement,
          shows!inner (
            show_canonid
          )
        `)
        .eq('entry_song', songName)
        .not('shows.show_canonid', 'is', null);
      
      if (error) throw error;
      
      if (!canonPerformances || canonPerformances.length === 0) {
        setPlacementStats([]);
        return;
      }
      
      // Count occurrences of each placement
      const placementCounts: Record<string, number> = {};
      canonPerformances.forEach(perf => {
        const placement = perf.entry_placement;
        placementCounts[placement] = (placementCounts[placement] || 0) + 1;
      });
      
      // Calculate percentages and create stats array
      const totalPerformances = canonPerformances.length;
      const stats = Object.entries(placementCounts)
        .map(([placement, count]) => ({
          placement,
          count,
          percentage: (count / totalPerformances) * 100,
          order: placementOrderMap[placement] // Add the order from our map
        }))
        // Sort by count for the legend display (most common first)
        .sort((a, b) => b.count - a.count);
      
      setPlacementStats(stats);
    } catch (error) {
      console.error('Error fetching placement stats:', error);
      setPlacementStats([]);
    }
  };

  const calculateStats = async (performances: Performance[]): Promise<Stats> => {
    // [existing code unchanged]
    const uniqueShowsMap = new Map<string, Set<string>>();
    const uniqueShowIds = new Set(performances.map(p => p.show_id));
    
    performances.forEach(perf => {
      if (!uniqueShowsMap.has(perf.show_group)) {
        uniqueShowsMap.set(perf.show_group, new Set());
      }
      uniqueShowsMap.get(perf.show_group)?.add(perf.show_id);
    });
  
    const groupCounts = Array.from(uniqueShowsMap).map(([group, shows]) => ({
      group,
      count: shows.size
    })).sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.group.localeCompare(b.group);
    });
  
    // Get all shows where this song was performed that have a canon ID
    const { data: showsWithCanonIds, error: showsError } = await supabase
      .from('shows')
      .select('show_canonid')
      .in('show_id', Array.from(uniqueShowIds))
      .not('show_canonid', 'is', null);
  
    if (showsError || !showsWithCanonIds || showsWithCanonIds.length === 0) {
      return { 
        groupCounts, 
        rarity: '',
        totalShows: uniqueShowIds.size,
        hasRarity: false
      };
    }
  
    // Get the minimum canon ID from shows where this song was played
    const minCanonId = Math.min(...showsWithCanonIds.map(s => s.show_canonid));
  
    // Get the maximum canon ID from all shows up to today
    const { data: maxCanonIdData, error: maxError } = await supabase
      .from('shows')
      .select('show_canonid')
      .not('show_canonid', 'is', null)
      .lte('show_date', new Date().toISOString())
      .order('show_canonid', { ascending: false })
      .limit(1);
  
    if (maxError || !maxCanonIdData || maxCanonIdData.length === 0) {
      return { 
        groupCounts, 
        rarity: '',
        totalShows: uniqueShowIds.size,
        hasRarity: false
      };
    }
  
    const maxCanonId = maxCanonIdData[0].show_canonid;
    const showRange = maxCanonId - minCanonId + 1;
    const uniqueShowCount = showsWithCanonIds.length;
    const rarityPercentage = (uniqueShowCount / showRange) * 100;
  
    return { 
      groupCounts, 
      rarity: `${rarityPercentage.toFixed(2)}%`,
      totalShows: uniqueShowIds.size,
      hasRarity: true
    };
  };

  useEffect(() => {
    // If the songId parameter changes, set loading to true
    if (songId !== previousSongId) {
      setLoading(true);
      setPreviousSongId(songId || null);
      setSelectedGroup(null); // Reset selected group when song changes
    }

    async function fetchSongData() {
      if (!songId) return;

      try {
        // First get the song data
        const { data: songData, error: songError } = await supabase
          .from('songs')
          .select(`
            song,
            song_category,
            song_originalartist,
            song_coachnotes,
            song_lyrics,
            categories (
              category_type
            )
          `)
          .eq('song_id', songId)
          .single();
      
        if (songError) throw songError;
        setSong(songData);
      
        // Then get the performance data
        const { data: performanceData, error: performanceError } = await supabase
          .from('setlist_entries')
          .select(`
            entry_show,
            entry_length,
            entry_placement,
            entry_coachnotes,
            entry_segue,
            entry_short,
            entry_set,
            entry_setnum,
            shows (
              show_date,
              show_group,
              show_subvenue,
              show_venue_location,
              show_tour,
              show_id
            ),
            setlist_entry_guests (
              guests (
                guest_displayname
              )
            )
          `)
          .eq('entry_song', songData.song)
          .order('entry_show', { ascending: true });
      
        if (performanceError) throw performanceError;
      
        const processedPerformances = performanceData.map(perf => ({
          show_id: perf.shows.show_id,
          show_date: perf.shows.show_date,
          show_group: perf.shows.show_group,
          show_subvenue: perf.shows.show_subvenue,
          show_venue_location: perf.shows.show_venue_location,
          show_tour: perf.shows.show_tour,
          entry_length: perf.entry_length,
          entry_placement: perf.entry_placement,
          entry_coachnotes: perf.entry_coachnotes,
          entry_segue: perf.entry_segue,
          entry_short: perf.entry_short,
          entry_set: perf.entry_set,
          entry_setnum: perf.entry_setnum,
          entry_song: songData.song, // Add this line
          guests: perf.setlist_entry_guests?.map(g => ({
            guest_display_name: g.guests.guest_displayname
          })) || []
        }));
      
        setPerformances(processedPerformances);

        // Calculate stats
        const newStats = await calculateStats(processedPerformances);
        setStats(newStats);
        
        // Fetch placement stats
        await fetchPlacementStats(songData.song);
      } catch (error) {
        console.error('Error fetching song data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSongData();
  }, [songId, currentPage]);

  // Handle group selection
  const handleGroupClick = (group: string) => {
    setSelectedGroup(currentGroup => currentGroup === group ? null : group);
  };

  const totalPages = Math.ceil(totalCount / performancesPerPage);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading song data...</p>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <p className="text-black">Song not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${song.song_lyrics ? "max-w-[872px] xl:max-w-[1280px]" : "max-w-[872px]"} mx-auto`}>
      <div className="flex justify-between">
        <h2 className="text-2xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-6">{song.song}</h2>
        <SongSearch />
      </div>
    
      <div className={`${song.song_lyrics 
        ? "grid grid-cols-1 gap-6 space-y-0 xl:grid-cols-[minmax(872px,1fr)_1fr]" 
        : "space-y-6"} mb-8`}>
        {/* Left column - main content */}
        <div className="space-y-6">
          {/* Info Containers */}
          <div className={`grid grid-cols-1 ${
            // If no performances and no notes, full width
            !performances.length && !song.song_coachnotes
              ? 'md:grid-cols-1'
              // If either no performances OR no notes, split in two
              : (!performances.length || !song.song_coachnotes)
              ? 'md:grid-cols-2'
              // Otherwise, split in three
              : 'md:grid-cols-3'
          } gap-6`}>
            {/* Song Info */}
            <div className="h-full">
              <div className="bg-primary rounded-lg p-3 border border-black w-full h-full">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1">Category</h2>
                    <div className="text-black text-sm font-semibold mb-1">{song.song_category}</div>
                  </div>
                  {song.song_originalartist && (
                    <div>
                      <h2 className="text-base font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1">Original Artist</h2>
                      <div className="text-black text-sm font-semibold">{song.song_originalartist}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          
            {/* Performance Stats */}
            {performances.length > 0 && (
              <div className="h-full">
                <div className="bg-primary rounded-lg p-3 border border-black w-full h-full">
                  {stats.hasRarity && (
                    <>
                      <div className="flex items-center mb-1">
                        <h2 className="text-base font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mb-1">Song Rarity</h2>
                        <span 
                          className="text-white text-sm font-semibold px-2 py-0.5 mb-1 rounded-md inline-block ml-6"
                          style={{ 
                            backgroundColor: getRarityColor(stats.rarity) 
                          }}
                        >
                          {stats.rarity}
                        </span>
                      </div>
                      <div className="border-t border-black/20 mt-2 pt-2" />
                    </>
                  )}
                  <div className={!stats.hasRarity ? "mt-0" : ""}>
                    <h2 className="text-base font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black mt-1 mb-1">Performances by Group</h2>
                    <div className="space-y-1">
                      {stats.groupCounts.map(({ group, count }) => (
                        <div 
                          key={group} 
                          className={`text-black text-sm flex justify-between font-semibold cursor-pointer ${
                            selectedGroup === group ? 'bg-[#f9ae37]/40' : 'hover:bg-[#f9ae37]/20'
                          }`}
                          onClick={() => handleGroupClick(group)}
                        >
                          <span>{group}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          
            {/* Song Notes */}
            {song.song_coachnotes && (
              <div className="h-full">
                <div className="bg-primary rounded-lg p-3 border border-black w-full h-full">
                  <div className="text-black mb-1 font-semibold">Song Notes</div>
                  <div 
                    className="text-black text-xs"
                    dangerouslySetInnerHTML={{ __html: song.song_coachnotes }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Song Placement Pill */}
          {placementStats.length > 0 && (
            <div className="overflow-x-auto">
              <div className="bg-primary border border-black rounded-lg p-4">
                <SongPlacementPill placementStats={placementStats} />
              </div>
            </div>
          )}

          {/* Performance Timeline */}
          <div className="overflow-x-auto">
            {performances.length > 0 ? (
              <PerformanceChart 
                performances={performances} 
                selectedGroup={selectedGroup}
              />
            ) : (
              <div className="bg-primary border border-black rounded-lg p-4">
                <p className="text-black text-center">
                  <span className="font-semibold">{song.song}</span> hasn't been played live.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Lyrics (only shown if lyrics exist) */}
        {song.song_lyrics && (
          <div className="h-fit xl:sticky xl:top-4">
            <div className="bg-primary rounded-lg p-3 border border-black w-full">
              <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-3">Lyrics</h2>
              <div 
                className="text-black text-sm lyrics-container max-h-[80vh] overflow-y-auto pr-2"
                dangerouslySetInnerHTML={{ 
                  __html: song.song_lyrics.replace(
                    /\[(.*?)\]/g, 
                    '<span class="font-bold">[$1]</span>'
                  ) 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}