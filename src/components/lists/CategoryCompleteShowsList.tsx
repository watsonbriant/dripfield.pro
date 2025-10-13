import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import { Check, Star, FileMusic, Users, AudioLines } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import wlImage from '../../img/WL.png';

interface ShowWithCategory {
    show_id: string;
    show_date: string;
    show_group: string;
    show_tour: string;
    tour_id: string;
    show_subvenue: string;
    show_venue_location: string;
    show_detail: string | null;
    show_alert: string | null;
    show_wl_link: string | null;
    venue_id: string;
    show_length: string;
    show_rarity: string | null;
    show_gap: string | null;
    show_listcategorycomplete: string;
    category_artwork: string | null;
}

interface CategoryCompleteShowsListProps {
    onProgressUpdate: (progress: number) => void;
}

export function CategoryCompleteShowsList({ onProgressUpdate }: CategoryCompleteShowsListProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [shows, setShows] = useState<ShowWithCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);
    const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(new Set());
    const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(new Set());
    const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
    const [showRatings, setShowRatings] = useState<Record<string, number>>({});
    const [categoryArtwork, setCategoryArtwork] = useState<Record<string, string>>({});
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    const getRarityColor = (percentage: string | null): string => {
        if (!percentage || percentage === '-') return 'transparent';

        const numericPercentage = parseFloat(percentage.replace('%', ''));

        if (isNaN(numericPercentage)) return 'transparent';

        const cappedPercentage = Math.min(numericPercentage, 100);

        const colorStops = [
            { percent: 0, color: { r: 156, g: 12, b: 12 } },
            { percent: 12, color: { r: 230, g: 81, b: 0 } },
            { percent: 24, color: { r: 179, g: 135, b: 0 } },
            { percent: 50, color: { r: 46, g: 125, b: 50 } },
            { percent: 100, color: { r: 13, g: 71, b: 161 } }
        ];

        let lowerStop = colorStops[0];
        let upperStop = colorStops[colorStops.length - 1];

        for (let i = 0; i < colorStops.length - 1; i++) {
            if (cappedPercentage >= colorStops[i].percent && cappedPercentage <= colorStops[i + 1].percent) {
                lowerStop = colorStops[i];
                upperStop = colorStops[i + 1];
                break;
            }
        }

        const range = upperStop.percent - lowerStop.percent;
        const factor = range !== 0 ? (cappedPercentage - lowerStop.percent) / range : 0;

        const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
        const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
        const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

        return `rgb(${r}, ${g}, ${b})`;
    };

    const getGapColor = (value: string | null): string => {
        if (!value || value === '-') return 'transparent';

        const numericValue = parseFloat(value);

        if (isNaN(numericValue)) return 'transparent';

        const cappedValue = Math.min(numericValue, 100);

        const colorStops = [
            { percent: 0, color: { r: 13, g: 71, b: 161 } },
            { percent: 12, color: { r: 46, g: 125, b: 50 } },
            { percent: 24, color: { r: 179, g: 135, b: 0 } },
            { percent: 50, color: { r: 230, g: 81, b: 0 } },
            { percent: 100, color: { r: 156, g: 12, b: 12 } }
        ];

        let lowerStop = colorStops[0];
        let upperStop = colorStops[colorStops.length - 1];

        for (let i = 0; i < colorStops.length - 1; i++) {
            if (cappedValue >= colorStops[i].percent && cappedValue <= colorStops[i + 1].percent) {
                lowerStop = colorStops[i];
                upperStop = colorStops[i + 1];
                break;
            }
        }

        const range = upperStop.percent - lowerStop.percent;
        const factor = range !== 0 ? (cappedValue - lowerStop.percent) / range : 0;

        const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
        const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
        const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));

        return `rgb(${r}, ${g}, ${b})`;
    };

    const formatShowLength = (length: string): string => {
        const parts = length.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10);
            return `${hours}:${parts[1]}:${parts[2]}`;
        }
        return length;
    };

    useEffect(() => {
        if (user) {
            fetchAttendedShows();
        } else {
            setAttendedShowIds([]);
        }
    }, [user]);

    async function fetchAttendedShows() {
        if (!user) return;
        
        try {
            const { data, error } = await supabase
                .from('user_attended_shows')
                .select('show_id')
                .eq('user_id', user.id);

            if (error) throw error;
            setAttendedShowIds(data.map(item => item.show_id));
        } catch (error) {
            console.error('Error fetching attended shows:', error);
        }
    }

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    useEffect(() => {
        fetchShows();
    }, []);

    useEffect(() => {
        if (shows.length > 0) {
            fetchCategoryArtwork();
            fetchShowsWithSetlists();
            fetchShowsWithReleases();
            fetchAttendeeCounts();
            fetchShowRatings();
        }
    }, [shows]);

    async function fetchShowsWithSetlists() {
        if (shows.length === 0) return;
        
        try {
            const { data, error } = await supabase
                .from('show_setlists')
                .select('show_id')
                .in('show_id', shows.map(s => s.show_id));
            
            if (error) throw error;
            setShowsWithSetlists(new Set(data?.map(item => item.show_id) || []));
        } catch (error) {
            console.error('Error fetching shows with setlists:', error);
        }
    }

    async function fetchCategoryArtwork() {
        if (shows.length === 0) return;
        
        try {
            // Get unique categories from shows
            const uniqueCategories = [...new Set(shows.map(s => s.show_listcategorycomplete))];
            
            // Fetch category artwork for all unique categories
            const { data, error } = await supabase
                .from('categories')
                .select('category, category_artwork')
                .in('category', uniqueCategories);
            
            if (error) throw error;
            
            // Create a map of category to artwork URL
            const artworkMap: Record<string, string> = {};
            data?.forEach(cat => {
                artworkMap[cat.category] = cat.category_artwork;
            });
            
            setCategoryArtwork(artworkMap);
        } catch (error) {
            console.error('Error fetching category artwork:', error);
        }
    }

    async function fetchShowsWithReleases() {
        if (shows.length === 0) return;
        
        try {
            const showIds = shows.map(s => s.show_id);
            
            const { count, error: countError } = await supabase
                .from('releases_shows')
                .select('*', { count: 'exact', head: true })
                .in('show_id', showIds);
            
            if (countError) throw countError;
            
            const batchSize = 1000;
            const totalBatches = Math.ceil((count || 0) / batchSize);
            let allReleaseShows: any[] = [];
            
            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (count || 0) - 1);
                
                const { data, error } = await supabase
                    .from('releases_shows')
                    .select('show_id')
                    .in('show_id', showIds)
                    .range(start, end);
                
                if (error) throw error;
                if (data) allReleaseShows = [...allReleaseShows, ...data];
            }
            
            setShowsWithReleases(new Set(allReleaseShows.map(item => item.show_id)));
        } catch (error) {
            console.error('Error fetching shows with releases:', error);
        }
    }

    async function fetchAttendeeCounts() {
        if (shows.length === 0) return;
        
        try {
            const showIds = shows.map(s => s.show_id);
            
            const { count, error: countError } = await supabase
                .from('user_attended_shows')
                .select('*', { count: 'exact', head: true })
                .in('show_id', showIds);
            
            if (countError) throw countError;
            
            const batchSize = 1000;
            const totalBatches = Math.ceil((count || 0) / batchSize);
            let allData: any[] = [];
            
            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (count || 0) - 1);
                
                const { data, error } = await supabase
                    .from('user_attended_shows')
                    .select('show_id')
                    .in('show_id', showIds)
                    .range(start, end);
                
                if (error) throw error;
                if (data) allData = [...allData, ...data];
            }
            
            const counts: Record<string, number> = {};
            shows.forEach(show => {
                counts[show.show_id] = 0;
            });
            
            allData.forEach(record => {
                counts[record.show_id] = (counts[record.show_id] || 0) + 1;
            });
            
            setAttendeeCounts(counts);
        } catch (error) {
            console.error('Error fetching attendee counts:', error);
        }
    }

    async function fetchShowRatings() {
        if (shows.length === 0) return;
        
        try {
            const showIds = shows.map(s => s.show_id);
            
            const { data, error } = await supabase
                .from('show_ratings')
                .select('show_id, rating')
                .in('show_id', showIds);
            
            if (error) throw error;
            
            const ratings: Record<string, number> = {};
            shows.forEach(show => {
                const showRatingsData = data?.filter(r => r.show_id === show.show_id) || [];
                if (showRatingsData.length > 0) {
                    const average = showRatingsData.reduce((sum, r) => sum + r.rating, 0) / showRatingsData.length;
                    ratings[show.show_id] = Math.round(average * 100) / 100;
                } else {
                    ratings[show.show_id] = 0;
                }
            });
            
            setShowRatings(ratings);
        } catch (error) {
            console.error('Error fetching show ratings:', error);
        }
    }

    async function fetchShows() {
        try {
            onProgressUpdate(5);
            
            // Get count of shows with completed category lists
            const { count: showCount, error: countError } = await supabase
                .from('shows')
                .select('*', { count: 'exact', head: true })
                .not('show_listcategorycomplete', 'is', null)
                .neq('show_listcategorycomplete', '');

            if (countError) throw countError;

            const batchSize = 1000;
            const totalShowBatches = Math.ceil((showCount || 0) / batchSize);
            let allShows: any[] = [];

            for (let i = 0; i < totalShowBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (showCount || 0) - 1);

                const batchProgress = 5 + ((i + 1) / totalShowBatches) * 90;
                onProgressUpdate(Math.round(batchProgress));

                const { data: showsBatch, error: showsError } = await supabase
                    .from('shows')
                    .select(`
                        show_id,
                        show_date,
                        show_group,
                        show_tour,
                        show_subvenue,
                        show_venue_location,
                        show_detail,
                        show_alert,
                        show_wl_link,
                        show_length,
                        show_rarity,
                        show_gap,
                        show_listcategorycomplete,
                        subvenues:show_subvenue(
                            venues:subvenue_venue(
                                venue_id
                            )
                        ),
                        tours:show_tour(
                            tour_id
                        )
                    `)
                    .not('show_listcategorycomplete', 'is', null)
                    .neq('show_listcategorycomplete', '')
                    .order('show_date', { ascending: true })
                    .range(start, end);

                if (showsError) throw showsError;
                if (showsBatch) allShows = [...allShows, ...showsBatch];
            }

            onProgressUpdate(95);

            // Format shows data
            const formattedShows = allShows.map(show => ({
                show_id: show.show_id,
                show_date: show.show_date,
                show_group: show.show_group,
                show_tour: show.show_tour,
                tour_id: show.tours?.tour_id,
                show_subvenue: show.show_subvenue,
                show_venue_location: show.show_venue_location,
                show_detail: show.show_detail,
                show_alert: show.show_alert,
                show_wl_link: show.show_wl_link,
                venue_id: show.subvenues?.venues?.venue_id,
                show_length: show.show_length || '-',
                show_rarity: show.show_rarity !== null && show.show_rarity !== undefined
                    ? `${show.show_rarity.toFixed(2)}%`
                    : null,
                show_gap: show.show_gap !== null && show.show_gap !== undefined
                    ? show.show_gap.toFixed(2)
                    : null,
                show_listcategorycomplete: show.show_listcategorycomplete,
                category_artwork: null // Will be fetched separately
            }));

            setShows(formattedShows);
            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching shows:', error);
            onProgressUpdate(100);
        } finally {
            setLoading(false);
        }
    }

    const navigateToVenue = (venueId: string) => {
        if (venueId) {
            navigate(`/venue/${venueId}`);
        }
    };

    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading shows...</div>
        );
    }

    if (shows.length === 0) {
        return (
            <div className="text-fifth text-center py-8">No shows found</div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
                <thead>
                    <tr className="bg-canvas">
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap w-[40px]">
                            #
                        </th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">
                            Date
                        </th>
                        {user && (
                            <th className="w-8 px-1 py-1 text-center">
                                <Check size={16} className="text-fifth mx-auto" strokeWidth={4} />
                            </th>
                        )}
                        <th className="w-10 px-1 py-1 text-center">
                            <img 
                                src="https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg" 
                                alt="Category" 
                                className="w-6 h-6 mx-auto rounded object-cover border border-secondary"
                            />
                        </th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">
                            Tour
                        </th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">
                            Length
                        </th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">
                            Rarity
                        </th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">
                            Gap
                        </th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">
                            Venue
                        </th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">
                            Location
                        </th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">
                            Rating
                        </th>
                        <th className="w-8 px-1 py-0.5 text-center">
                            <div className="flex justify-center items-center">
                                <div className="text-primary bg-[#006400] rounded p-1">
                                    <FileMusic size={16} strokeWidth={2} />
                                </div>
                            </div>
                        </th>
                        <th className="w-8 px-1 py-0.5 text-center">
                            <div className="flex justify-center items-center">
                                <div className="text-primary bg-[#7c2128] rounded p-1">
                                    <AudioLines size={16} strokeWidth={2} />
                                </div>
                            </div>
                        </th>
                        <th className="px-2 py-1 text-center text-s font-medium text-fifth">
                            <Users size={16} className="text-fifth mx-auto" strokeWidth={2} />
                        </th>
                        <th className="w-8 px-1 py-1 text-center">
                            <img src={wlImage} alt="WysteriaLane" className="w-4 h-4 mx-auto" />
                        </th>
                        <th className="px-2 py-1 text-left text-s font-medium text-fifth whitespace-nowrap">
                            Detail
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                    {shows.map((show, index) => (
                        <tr
                            key={show.show_id}
                            className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-tertiary/40 transition-colors text-xs`}
                        >
                            <td className="px-2 py-0.5 text-center font-semibold text-[0.875rem] text-fifth">
                                {index + 1}
                            </td>
                            <td className="px-2 py-0.5 text-center whitespace-nowrap">
                                <button
                                    onClick={() => navigate(`/setlist/${show.show_id}`)}
                                    className="font-medium hover:underline transition-colors text-fifth"
                                >
                                    {formatInTimeZone(new Date(show.show_date), 'UTC', 'MM.dd.yy')}
                                </button>
                            </td>
                            {user && (
                                <td className="w-8 text-center">
                                    {attendedShowIds.includes(show.show_id) && (
                                        <div className="flex justify-center items-center h-full">
                                            <div className="rounded-full p-0.5 bg-green-600">
                                                <Check size={12} className="text-white" strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </td>
                            )}
                            <td className="w-10 text-center relative">
                                {categoryArtwork[show.show_listcategorycomplete] && (
                                    <div 
                                        className="flex justify-center items-center h-full cursor-pointer"
                                        onMouseEnter={(e) => {
                                            if (!isMobile) {
                                                setHoveredCategory(show.show_id);
                                                setMousePosition({ x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        onMouseMove={(e) => {
                                            if (!isMobile) {
                                                setMousePosition({ x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            if (!isMobile) {
                                                setHoveredCategory(null);
                                            }
                                        }}
                                    >
                                        <img 
                                            src={categoryArtwork[show.show_listcategorycomplete]} 
                                            alt={show.show_listcategorycomplete}
                                            className="w-5 h-5 rounded object-cover"
                                        />
                                        {!isMobile && hoveredCategory === show.show_id && (
                                            <div 
                                                className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border font-light border-secondary shadow-lg min-w-max z-[9999] text-left"
                                                style={{
                                                    left: `${mousePosition.x + 10}px`,
                                                    top: `${mousePosition.y - 10}px`
                                                }}
                                            >
                                                <div className="font-medium">
                                                    {show.show_listcategorycomplete}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                                <button
                                    onClick={() => navigate(`/tours/${show.tour_id}`)}
                                    className="hover:underline transition-colors"
                                >
                                    {show.show_tour}
                                </button>
                            </td>
                            <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap text-center">
                                {show.show_length !== '-' ? formatShowLength(show.show_length) : '-'}
                            </td>
                            <td className="px-2 py-0 whitespace-nowrap text-center">
                                {show.show_rarity ? (
                                    <span
                                        className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block"
                                        style={{
                                            backgroundColor: getRarityColor(show.show_rarity)
                                        }}
                                    >
                                        {show.show_rarity}
                                    </span>
                                ) : (
                                    <span className="text-fifth"></span>
                                )}
                            </td>
                            <td className="px-2 py-0 whitespace-nowrap text-center">
                                {show.show_gap ? (
                                    <span
                                        className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block"
                                        style={{
                                            backgroundColor: getGapColor(show.show_gap)
                                        }}
                                    >
                                        {show.show_gap}
                                    </span>
                                ) : (
                                    <span className="text-fifth"></span>
                                )}
                            </td>
                            <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                                <button
                                    onClick={() => navigateToVenue(show.venue_id)}
                                    className="hover:underline transition-colors"
                                >
                                    {show.show_subvenue}
                                </button>
                            </td>
                            <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                                {show.show_venue_location}
                            </td>
                            <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
                                <div className="relative flex items-center justify-center group">
                                    <div className={`flex items-center transition-opacity ${showRatings[show.show_id] > 0 ? 'group-hover:opacity-30' : ''}`}>
                                        {[1, 2, 3, 4, 5].map((starNumber) => {
                                            const rating = showRatings[show.show_id] || 0;
                                            const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);

                                            return (
                                                <div key={starNumber} className="relative">
                                                    <Star
                                                        size={16}
                                                        className="text-secondary"
                                                        fill="none"
                                                        stroke="currentColor"
                                                    />
                                                    <div
                                                        className="absolute inset-0 overflow-hidden"
                                                        style={{ width: `${fillPercentage * 100}%` }}
                                                    >
                                                        <Star
                                                            size={16}
                                                            className="text-tertiary"
                                                            fill="currentColor"
                                                            stroke="currentColor"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {showRatings[show.show_id] > 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-fifth pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            {showRatings[show.show_id].toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="w-8 text-center align-middle">
                                {showsWithSetlists.has(show.show_id) && (
                                    <div className="flex justify-center items-center h-full">
                                        <button
                                            onClick={() => navigate(`/setlist/${show.show_id}`, { state: { openChangesModal: true } })}
                                            className="text-[#006400] hover:text-primary hover:bg-[#006400] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
                                        >
                                            <FileMusic size={14.5} strokeWidth={2} />
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="w-8 text-center align-middle">
                                {showsWithReleases.has(show.show_id) && (
                                    <div className="flex justify-center items-center h-full">
                                        <button
                                            onClick={() => navigate(`/setlist/${show.show_id}`)}
                                            className="text-[#7c2128] hover:text-primary hover:bg-[#7c2128] hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]"
                                        >
                                            <AudioLines size={14.5} strokeWidth={2} />
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="w-8 text-center text-fifth">
                                <span className="text-xs font-medium">
                                    {attendeeCounts[show.show_id] || 0}
                                </span>
                            </td>
                            <td className="w-8 text-center align-middle">
                                {show.show_wl_link && (
                                    <div className="flex justify-center items-center h-full">
                                        <button
                                            onClick={() => window.open(show.show_wl_link, '_blank')}
                                            className="hover:text-[#a9682e] hover:bg-[#78b1a1]/30 hover:shadow-[0_0_0_1px_#78b1a1] rounded transition-all p-[1px]"
                                        >
                                            <img src={wlImage} alt="WysteriaLane" className="w-[14.5px] h-[14.5px]" />
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                                {show.show_detail && show.show_detail}
                                {show.show_detail && show.show_alert && <>&nbsp;&nbsp;</>}
                                {show.show_alert && <span className="text-[#CE1126] font-medium">[{show.show_alert}]</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}