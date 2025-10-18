import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, FileMusic, Users, AudioLines } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import wlImage from '../../../img/WL.png';
import { getRarityColor, getGapColor, formatShowLength } from './ColorUtils';
import { formatInTimeZone } from 'date-fns-tz';

interface ShowTableProps {
    shows: any[];
    attendedShowIds: string[];
    showsWithSetlists: Set<string>;
    showsWithReleases: Set<string>;
    attendeeCounts: Record<string, number>;
    showRatings: Record<string, number>;
    categoryArtwork?: Record<string, string>;
    hoveredCategory?: string | null;
    setHoveredCategory?: (category: string | null) => void;
    mousePosition?: { x: number; y: number };
    setMousePosition?: (position: { x: number; y: number }) => void;
    isMobile?: boolean;
    showCategoryColumn?: boolean;
    showRanking?: boolean;
}

export function ShowTableHeader({ showCategoryColumn, showRanking }: { showCategoryColumn?: boolean; showRanking?: boolean }) {
    const { user } = useAuth();

    return (
        <thead>
            <tr className="bg-canvas">
                {showRanking && (
                    <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap w-[40px]">
                        #
                    </th>
                )}
                <th className="px-2 py-1 text-center text-s font-medium text-fifth whitespace-nowrap">
                    Date
                </th>
                {user && (
                    <th className="w-8 px-1 py-1 text-center">
                        <Check size={16} className="text-fifth mx-auto" strokeWidth={4} />
                    </th>
                )}
                {showCategoryColumn && (
                    <th className="w-10 px-1 py-1 text-center">
                        <img 
                            src="https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg" 
                            alt="Category" 
                            className="w-6 h-6 mx-auto rounded object-cover border border-secondary"
                        />
                    </th>
                )}
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
    );
}

export function ShowTableRow({
    show,
    index,
    attendedShowIds,
    showsWithSetlists,
    showsWithReleases,
    attendeeCounts,
    showRatings,
    categoryArtwork,
    hoveredCategory,
    setHoveredCategory,
    mousePosition,
    setMousePosition,
    isMobile,
    showCategoryColumn,
    showListcategorycomplete,
    showRanking
}: {
    show: any;
    index: number;
    attendedShowIds: string[];
    showsWithSetlists: Set<string>;
    showsWithReleases: Set<string>;
    attendeeCounts: Record<string, number>;
    showRatings: Record<string, number>;
    categoryArtwork?: Record<string, string>;
    hoveredCategory?: string | null;
    setHoveredCategory?: (category: string | null) => void;
    mousePosition?: { x: number; y: number };
    setMousePosition?: (position: { x: number; y: number }) => void;
    isMobile?: boolean;
    showCategoryColumn?: boolean;
    showListcategorycomplete?: string;
    showRanking?: boolean;
}) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const navigateToVenue = (venueId: string) => {
        if (venueId) {
            navigate(`/venue/${venueId}`);
        }
    };

    return (
        <tr
            key={show.show_id}
            className={`${show.bgGroup ? (show.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary') : (index % 2 === 0 ? 'bg-primary' : 'bg-canvas')} hover:bg-tertiary/40 transition-colors text-xs`}
        >
            {showRanking && (
                <td className="px-2 py-0.5 text-center font-semibold text-[0.875rem] text-fifth">
                    {show.displayRank !== null ? show.displayRank : ''}
                </td>
            )}
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
            {showCategoryColumn && categoryArtwork && (
                <td className="w-10 text-center relative">
                    {categoryArtwork[showListcategorycomplete || ''] && (
                        <div 
                            className="flex justify-center items-center h-full cursor-pointer"
                            onMouseEnter={(e) => {
                                if (!isMobile && setHoveredCategory && setMousePosition) {
                                    setHoveredCategory(show.show_id);
                                    setMousePosition({ x: e.clientX, y: e.clientY });
                                }
                            }}
                            onMouseMove={(e) => {
                                if (!isMobile && setMousePosition) {
                                    setMousePosition({ x: e.clientX, y: e.clientY });
                                }
                            }}
                            onMouseLeave={() => {
                                if (!isMobile && setHoveredCategory) {
                                    setHoveredCategory(null);
                                }
                            }}
                        >
                            <img 
                                src={categoryArtwork[showListcategorycomplete || '']} 
                                alt={showListcategorycomplete}
                                className="w-5 h-5 rounded object-cover"
                            />
                            {!isMobile && hoveredCategory === show.show_id && mousePosition && (
                                <div 
                                    className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border font-light border-secondary shadow-lg min-w-max z-[9999] text-left"
                                    style={{
                                        left: `${mousePosition.x + 10}px`,
                                        top: `${mousePosition.y - 10}px`
                                    }}
                                >
                                    <div className="font-medium">
                                        {showListcategorycomplete}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </td>
            )}
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
    );
}

export function ShowTable({
    shows,
    attendedShowIds,
    showsWithSetlists,
    showsWithReleases,
    attendeeCounts,
    showRatings,
    categoryArtwork,
    hoveredCategory,
    setHoveredCategory,
    mousePosition,
    setMousePosition,
    isMobile,
    showCategoryColumn,
    showRanking
}: ShowTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
                <ShowTableHeader showCategoryColumn={showCategoryColumn} showRanking={showRanking} />
                <tbody className="divide-y divide-black/5">
                    {shows.map((show, index) => (
                        <ShowTableRow
                            key={show.show_id}
                            show={show}
                            index={index}
                            attendedShowIds={attendedShowIds}
                            showsWithSetlists={showsWithSetlists}
                            showsWithReleases={showsWithReleases}
                            attendeeCounts={attendeeCounts}
                            showRatings={showRatings}
                            categoryArtwork={categoryArtwork}
                            hoveredCategory={hoveredCategory}
                            setHoveredCategory={setHoveredCategory}
                            mousePosition={mousePosition}
                            setMousePosition={setMousePosition}
                            isMobile={isMobile}
                            showCategoryColumn={showCategoryColumn}
                            showListcategorycomplete={show.show_listcategorycomplete}
                            showRanking={showRanking}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
