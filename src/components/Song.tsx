import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PerformanceChart from './PerformanceChart';
import { SongSearch } from './SongSearch';
import SongPlacementPill from './SongPlacementPill';
import { formatInTimeZone } from 'date-fns-tz';

interface SongData {
  song: string;
  song_category: string;
  song_originalartist: string | null;
  song_coachnotes: string | null;
  song_lyrics: string | null;
  categories: {
    category_type: string;
    category_artwork?: string;
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
  joty_round?: string | null;
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
  order?: number;
}

interface Stats {
  groupCounts: GroupCount[];
  rarity: string;
  totalShows: number;
  hasRarity: boolean;
}

interface LastPlayed {
  show_date: string;
  show_canonid: number;
  showsAgo: number;
  show_id: string;
}

const cleanSongName = (songName: string): string => {
  return songName
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/∆/g, 'a');
};

const getRarityColor = (percentage: string | null): string => {
  if (!percentage || percentage === '-') return 'transparent';
  
  const numericPercentage = parseFloat(percentage.replace('%', ''));
  
  if (isNaN(numericPercentage)) return 'transparent';
  
  const colorStops = [
    { percent: 0, color: { r: 156, g: 12, b: 12 } },
    { percent: 15, color: { r: 230, g: 81, b: 0 } },
    { percent: 50, color: { r: 46, g: 125, b: 50 } },
    { percent: 100, color: { r: 13, g: 71, b: 161 } }
  ];
  
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (numericPercentage >= colorStops[i].percent && numericPercentage <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0;
  
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
  const [lastPlayed, setLastPlayed] = useState<LastPlayed | null>(null);

  const fetchPlacementStats = async (songName: string) => {
    try {
      const { data: placementOrders, error: placementError } = await supabase
        .from('placements')
        .select('placements, placement_order');
        
      if (placementError) throw placementError;
      
      const placementOrderMap: Record<string, number> = {};
      if (placementOrders) {
        placementOrders.forEach(p => {
          if (p.placement_order !== null) {
            placementOrderMap[p.placements] = p.placement_order;
          }
        });
      }

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
      
      const placementCounts: Record<string, number> = {};
      canonPerformances.forEach(perf => {
        const placement = perf.entry_placement;
        placementCounts[placement] = (placementCounts[placement] || 0) + 1;
      });
      
      const totalPerformances = canonPerformances.length;
      const stats = Object.entries(placementCounts)
        .map(([placement, count]) => ({
          placement,
          count,
          percentage: (count / totalPerformances) * 100,
          order: placementOrderMap[placement]
        }))
        .sort((a, b) => b.count - a.count);
      
      setPlacementStats(stats);
    } catch (error) {
      console.error('Error fetching placement stats:', error);
      setPlacementStats([]);
    }
  };

  const fetchLastPlayed = async (songName: string) => {
    try {
      const now = new Date();
      const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
      
      const { data: mostRecentShow, error: recentError } = await supabase
        .from('shows')
        .select('show_canonid, show_date')
        .not('show_canonid', 'is', null)
        .lte('show_date', alaskaDate)
        .order('show_date', { ascending: false })
        .order('show_canonid', { ascending: false })
        .order('show_group', { ascending: true })
        .limit(1)
        .single();
      
      if (recentError || !mostRecentShow) {
        console.error('Error fetching most recent show:', recentError);
        setLastPlayed(null);
        return;
      }

      const { data: lastPerformance, error: lastError } = await supabase
        .from('setlist_entries')
        .select(`
          entry_show,
          shows!inner (
            show_id,
            show_date,
            show_canonid
          )
        `)
        .eq('entry_song', songName)
        .not('shows.show_canonid', 'is', null)
        .order('shows(show_canonid)', { ascending: false })
        .limit(1)
        .single();
      
      if (lastError || !lastPerformance) {
        setLastPlayed(null);
        return;
      }

      const showsAgo = mostRecentShow.show_canonid - lastPerformance.shows.show_canonid + 1;
      
      setLastPlayed({
        show_date: lastPerformance.shows.show_date,
        show_canonid: lastPerformance.shows.show_canonid,
        showsAgo: showsAgo,
        show_id: lastPerformance.shows.show_id
      });
    } catch (error) {
      console.error('Error fetching last played:', error);
      setLastPlayed(null);
    }
  };

  const calculateStats = async (performances: Performance[]): Promise<Stats> => {
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
  
    const minCanonId = Math.min(...showsWithCanonIds.map(s => s.show_canonid));
  
    const now = new Date();
    const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
    
    const { data: mostRecentShow, error: maxError } = await supabase
      .from('shows')
      .select('show_canonid, show_date')
      .not('show_canonid', 'is', null)
      .lte('show_date', alaskaDate)
      .order('show_date', { ascending: false })
      .order('show_canonid', { ascending: false })
      .order('show_group', { ascending: true })
      .limit(1)
      .single();
  
    if (maxError || !mostRecentShow) {
      return { 
        groupCounts, 
        rarity: '',
        totalShows: uniqueShowIds.size,
        hasRarity: false
      };
    }
  
    const maxCanonId = mostRecentShow.show_canonid;
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
    if (songId !== previousSongId) {
      setLoading(true);
      setPreviousSongId(songId || null);
      setSelectedGroup(null);
    }

    async function fetchSongData() {
      if (!songId) return;

      try {
        const { data: songData, error: songError } = await supabase
          .from('songs')
          .select(`
            song,
            song_category,
            song_originalartist,
            song_coachnotes,
            song_lyrics,
            categories (
              category_type,
              category_artwork
            )
          `)
          .eq('song_id', songId)
          .single();
      
        if (songError) throw songError;
        setSong(songData);
      
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
            shows_since_debut_num,
            joty_results (
              round_achieved
            ),
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
          entry_song: songData.song, 
          joty_round: perf.joty_results?.round_achieved || null,
          shows_since_debut_num: perf.shows_since_debut_num,
          guests: perf.setlist_entry_guests?.map(g => ({
            guest_display_name: g.guests.guest_displayname
          })) || []
        }));
      
        setPerformances(processedPerformances);

        const newStats = await calculateStats(processedPerformances);
        setStats(newStats);
        
        await fetchPlacementStats(songData.song);
        
        await fetchLastPlayed(songData.song);
      } catch (error) {
        console.error('Error fetching song data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSongData();
  }, [songId, currentPage]);

  const handleGroupClick = (group: string) => {
    setSelectedGroup(currentGroup => currentGroup === group ? null : group);
  };

  const totalPages = Math.ceil(totalCount / performancesPerPage);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-tertiary animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-tertiary animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-tertiary animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading song data...</p>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center py-12">
          <p className="text-fifth">Song not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${song.song_lyrics ? "max-w-[936px] xl:max-w-[1280px]" : "max-w-[936px]"} mx-auto`}>
      <div className="flex justify-between">
        <h2 className="text-2xl font-trad bg-tertiary text-fifth inline-block mr-4 px-4 pt-0.5 pb-1.5 rounded-lg border border-secondary mb-6">{cleanSongName(song.song)}</h2>
        <SongSearch />
      </div>
    
      <div className={`${song.song_lyrics 
        ? "grid grid-cols-1 gap-4 space-y-0 xl:grid-cols-[minmax(936px,1fr)_1fr]" 
        : "space-y-4"} mb-8`}>
        <div className="space-y-4">
          <div className={`grid grid-cols-1 ${
            !performances.length && !song.song_coachnotes
              ? 'md:grid-cols-1'
              : (!performances.length || !song.song_coachnotes)
              ? 'md:grid-cols-2'
              : 'md:grid-cols-3'
          } gap-4`}>
            <div className="h-full">
              <div className="bg-primary rounded-lg p-3 border border-secondary w-full h-full">
                {song.categories?.category_artwork && (
                  <img 
                    src={song.categories.category_artwork}
                    alt={`${song.song_category} artwork`}
                    className="float-right ml-3 mb-2 w-20 h-20 rounded-md object-cover border border-secondary"
                  />
                )}
                <div className="space-y-2">
                  <div>
                    <div className="text-fifth text-base font-medium">Category</div>
                    <div className="text-fifth text-sm font-light mb-1">{song.song_category}</div>
                  </div>
                  {song.song_originalartist && (
                    <div>
                      <div className="text-fifth text-base font-medium">Original Artist</div>
                    <div className="text-fifth text-sm font-light">{song.song_originalartist}</div>
                    </div>
                  )}
                  {lastPlayed && (
                    <div>
                      <div className="text-fifth text-base font-medium">Last Time Played</div>
                      <div className="text-fifth text-sm font-light">
                        <button
                          onClick={() => navigate(`/setlist/${lastPlayed.show_id}`)}
                          className="hover:underline cursor-pointer font-medium"
                        >
                          {formatInTimeZone(new Date(lastPlayed.show_date), 'UTC', 'MM.dd.yy')}
                        </button> ({lastPlayed.showsAgo === 1 ? 'most recent show' : `${lastPlayed.showsAgo} shows ago`})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          
            {performances.length > 0 && (
              <div className="h-full">
                <div className="bg-primary rounded-lg p-3 border border-secondary w-full h-full space-y-2">
                  {stats.hasRarity && (
                    <>
                      <div className="flex items-center mb-1">
                        <div className="text-fifth text-base font-medium">Song Rarity</div>
                        <span 
                          className="text-primary text-sm font-normal border border-secondary px-2 py-0.5 rounded-md inline-block ml-6"
                          style={{ 
                            backgroundColor: getRarityColor(stats.rarity) 
                          }}
                        >
                          {stats.rarity}
                        </span>
                      </div>
                    </>
                  )}
                  <div className={!stats.hasRarity ? "mt-0" : ""}>
                    <div className="text-fifth text-base font-medium mb-1">Performances by Group</div>
                    <div>
                      {stats.groupCounts.map(({ group, count }) => (
                        <div 
                          key={group} 
                          className={`pl-2 pr-2 text-fifth text-sm flex justify-between font-medium cursor-pointer ${
                            selectedGroup === group ? 'bg-tertiary/80' : 'hover:bg-tertiary/40'
                          }`}
                          onClick={() => handleGroupClick(group)}
                        >
                          <span className='font-light'>{group}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          
            {song.song_coachnotes && (
              <div className="h-full">
                <div className="bg-primary rounded-lg p-3 border border-secondary w-full h-full">
                  <div className="text-fifth text-base font-medium mb-1">Song Notes</div>
                  <div 
                    className="text-fifth font-light text-xs"
                    dangerouslySetInnerHTML={{ __html: song.song_coachnotes }}
                  />
                </div>
              </div>
            )}
          </div>

          {placementStats.length > 0 && (
            <div className="overflow-x-auto">
              <div className="bg-primary border border-secondary rounded-lg p-3">
                <SongPlacementPill placementStats={placementStats} />
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {performances.length > 0 ? (
              <PerformanceChart 
                performances={performances} 
                selectedGroup={selectedGroup}
              />
            ) : (
              <div className="bg-primary border border-secondary rounded-lg p-3">
                <p className="text-fifth text-center font-light">
                  <span className="font-medium">{song.song}</span> hasn't been played live.
                </p>
              </div>
            )}
          </div>
        </div>

        {song.song_lyrics && (
          <div className="h-fit xl:sticky xl:top-3">
            <div className="bg-primary rounded-lg p-3 border border-secondary w-full">
              <div className="text-fifth text-base font-medium mb-1">Lyrics</div>
              <div 
                className="text-fifth font-light text-xs lyrics-container pr-2"
                dangerouslySetInnerHTML={{ 
                  __html: song.song_lyrics.replace(
                    /\[(.*?)\]/g, 
                    '<span class="font-medium">[$1]</span>'
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