import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { SongHeader } from './SongHeader';
import { SongInfo } from './SongInfo';
import { SongPlacementStats } from './SongPlacementStats';
import { SongPerformanceChart } from './SongPerformanceChart';
import { SongLyrics } from './SongLyrics';
import { SongData, Performance, Stats, PlacementStat, LastPlayed } from '../types/song';



export function Song() {
  const { songId } = useParams();
  const [song, setSong] = useState<SongData | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ 
    groupCounts: [], 
    rarity: '', 
    totalShows: 0,
    hasRarity: false
  });
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

      const showsAgo = mostRecentShow.show_canonid - (lastPerformance.shows as any).show_canonid + 1;
      
      setLastPlayed({
        show_date: (lastPerformance.shows as any).show_date,
        show_canonid: (lastPerformance.shows as any).show_canonid,
        showsAgo: showsAgo,
        show_id: (lastPerformance.shows as any).show_id
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
        setSong(songData as unknown as SongData);
      
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
          show_id: (perf.shows as any).show_id,
          show_date: (perf.shows as any).show_date,
          show_group: (perf.shows as any).show_group,
          show_subvenue: (perf.shows as any).show_subvenue,
          show_venue_location: (perf.shows as any).show_venue_location,
          show_tour: (perf.shows as any).show_tour,
          entry_length: perf.entry_length,
          entry_placement: perf.entry_placement,
          entry_coachnotes: perf.entry_coachnotes,
          entry_segue: perf.entry_segue,
          entry_short: perf.entry_short,
          entry_set: perf.entry_set,
          entry_setnum: perf.entry_setnum,
          entry_song: songData.song, 
          joty_round: (perf.joty_results as any)?.round_achieved || null,
          shows_since_debut_num: perf.shows_since_debut_num,
          guests: (perf.setlist_entry_guests as any)?.map((g: any) => ({
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
  }, [songId]);

  const handleGroupClick = (group: string) => {
    setSelectedGroup(currentGroup => currentGroup === group ? null : group);
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
          <p className="text-fifth mt-4">Loading song data...</p>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
        <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3 shadow-xl">
          <p className="text-fifth">Song not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{song ? `${song.song} — Dripfield.pro` : 'Song — Dripfield.pro'}</title>
      </Helmet>
      <div className="max-w-[1280px]">
      <div className={`grid grid-cols-1 gap-2 space-y-0 ${
        song.song_lyrics 
          ? "lg:grid-cols-[936px_1fr]" 
          : "lg:grid-cols-[936px]"
      }`}>
        <div className={song.song_lyrics ? "xl:col-span-2" : ""}>
          <div className="shadow-xl">
            <SongHeader songName={song.song} />
          </div>
        </div>
      </div>
    
      <div className={`grid grid-cols-1 gap-2 space-y-0 ${
        song.song_lyrics 
          ? "lg:grid-cols-[936px_1fr]" 
          : "lg:grid-cols-[936px]"
      } mb-8`}>
        <div className="space-y-2">
          <SongInfo 
            song={song}
            stats={stats}
            lastPlayed={lastPlayed}
            selectedGroup={selectedGroup}
            onGroupClick={handleGroupClick}
          />

          <SongPlacementStats placementStats={placementStats} />

          <SongPerformanceChart 
            performances={performances}
            selectedGroup={selectedGroup}
            songName={song.song}
          />
        </div>

        {song.song_lyrics && <SongLyrics lyrics={song.song_lyrics} />}
      </div>
    </div>
    </>
  );
}