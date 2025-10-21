import { useNavigate } from 'react-router-dom';
import { Check, Star, FileMusic, Users, AudioLines } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import wlImage from '../../../img/WL.png';
import { getRarityColor, getGapColor, formatShowLength } from './ColorUtils';
import { formatInTimeZone } from 'date-fns-tz';

// Utility components
const StarRating = ({ rating }: { rating: number }) => (
    <div className="relative flex items-center justify-center group">
        <div className={`flex items-center transition-opacity ${rating > 0 ? 'group-hover:opacity-30' : ''}`}>
            {[1, 2, 3, 4, 5].map((starNumber) => {
                const fillPercentage = Math.min(Math.max(rating - starNumber + 1, 0), 1);
                return (
                    <div key={starNumber} className="relative">
                        <Star size={16} className="text-secondary" fill="none" stroke="currentColor" />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
                            <Star size={16} className="text-tertiary" fill="currentColor" stroke="currentColor" />
                        </div>
                    </div>
                );
            })}
        </div>
        {rating > 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-fifth pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {rating.toFixed(2)}
            </div>
        )}
    </div>
);

const IconButton = ({ 
    icon: Icon, 
    color, 
    hoverBg, 
    onClick, 
    size = 14.5 
}: { 
    icon: any; 
    color: string; 
    hoverBg: string; 
    onClick: () => void; 
    size?: number;
}) => (
    <button
        onClick={onClick}
        className={`${color} hover:text-primary hover:${hoverBg} hover:shadow-[0_0_0_1px_black] rounded transition-all p-[1px]`}
    >
        <Icon size={size} strokeWidth={2} />
    </button>
);

const CategoryTooltip = ({ 
    category, 
    artwork, 
    hoveredCategory, 
    showId, 
    mousePosition, 
    isMobile, 
    setHoveredCategory, 
    setMousePosition 
}: {
    category: string;
    artwork: string;
    hoveredCategory: string | null;
    showId: string;
    mousePosition: { x: number; y: number } | undefined;
    isMobile: boolean | undefined;
    setHoveredCategory: ((category: string | null) => void) | undefined;
    setMousePosition: ((position: { x: number; y: number }) => void) | undefined;
}) => (
    <div 
        className="flex justify-center items-center h-full cursor-pointer"
        onMouseEnter={(e) => {
            if (!isMobile && setHoveredCategory && setMousePosition) {
                setHoveredCategory(showId);
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
        <img src={artwork} alt={category} className="w-5 h-5 rounded object-cover" />
        {!isMobile && hoveredCategory === showId && mousePosition && (
            <div 
                className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border font-light border-secondary shadow-lg min-w-max z-[9999] text-left"
                style={{ left: `${mousePosition.x + 10}px`, top: `${mousePosition.y - 10}px` }}
            >
                <div className="font-medium">{category}</div>
            </div>
        )}
    </div>
);

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
    const baseHeaderClass = "px-2 py-1 text-s font-medium text-fifth whitespace-nowrap";
    
    return (
        <thead>
            <tr className="bg-canvas">
                {showRanking && <th className={`${baseHeaderClass} text-center w-[40px]`}>#</th>}
                <th className={`${baseHeaderClass} text-center`}>Date</th>
                {user && (
                    <th className="w-8 px-1 py-1 text-center">
                        <Check size={16} className="text-fifth mx-auto" strokeWidth={4} />
                    </th>
                )}
                {showCategoryColumn && (
                    <th className="w-10 px-1 py-1 text-center">
                        <img src="https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg" alt="Category" className="w-6 h-6 mx-auto rounded object-cover border border-secondary" />
                    </th>
                )}
                <th className={`${baseHeaderClass} text-left`}>Tour</th>
                <th className={`${baseHeaderClass} text-center`}>Length</th>
                <th className={`${baseHeaderClass} text-center`}>Rarity</th>
                <th className={`${baseHeaderClass} text-center`}>Gap</th>
                <th className={`${baseHeaderClass} text-left`}>Venue</th>
                <th className={`${baseHeaderClass} text-left`}>Location</th>
                <th className={`${baseHeaderClass} text-center`}>Rating</th>
                <th className="w-8 px-1 py-0.5 text-center">
                    <div className="text-primary bg-[#006400] rounded p-1 mx-auto w-fit">
                        <FileMusic size={16} strokeWidth={2} />
                    </div>
                </th>
                <th className="w-8 px-1 py-0.5 text-center">
                    <div className="text-primary bg-[#7c2128] rounded p-1 mx-auto w-fit">
                        <AudioLines size={16} strokeWidth={2} />
                    </div>
                </th>
                <th className="px-2 py-1 text-center text-s font-medium text-fifth">
                    <Users size={16} className="text-fifth mx-auto" strokeWidth={2} />
                </th>
                <th className="w-8 px-1 py-1 text-center">
                    <img src={wlImage} alt="WysteriaLane" className="w-4 h-4 mx-auto" />
                </th>
                <th className={`${baseHeaderClass} text-left`}>Detail</th>
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
    const baseCellClass = "px-2 py-0.5 text-fifth font-light whitespace-nowrap";
    const bgClass = show.bgGroup ? (show.bgGroup % 2 === 0 ? 'bg-canvas' : 'bg-primary') : (index % 2 === 0 ? 'bg-primary' : 'bg-canvas');

    return (
        <tr className={`${bgClass} hover:bg-tertiary/40 transition-colors text-xs`}>
            {showRanking && (
                <td className="px-2 py-0.5 text-center font-semibold text-[0.875rem] text-fifth">
                    {show.displayRank !== null ? show.displayRank : ''}
                </td>
            )}
            <td className="px-2 py-0.5 text-center whitespace-nowrap">
                <button onClick={() => navigate(`/setlist/${show.show_id}`)} className="font-medium hover:underline transition-colors text-fifth">
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
                        <CategoryTooltip
                            category={showListcategorycomplete || ''}
                            artwork={categoryArtwork[showListcategorycomplete || '']}
                            hoveredCategory={hoveredCategory || null}
                            showId={show.show_id}
                            mousePosition={mousePosition}
                            isMobile={isMobile}
                            setHoveredCategory={setHoveredCategory}
                            setMousePosition={setMousePosition}
                        />
                    )}
                </td>
            )}
            <td className={baseCellClass}>
                <button onClick={() => navigate(`/tours/${show.tour_id}`)} className="hover:underline transition-colors">
                    {show.show_tour}
                </button>
            </td>
            <td className={`${baseCellClass} text-center`}>
                {show.show_length !== '-' ? formatShowLength(show.show_length) : '-'}
            </td>
            <td className="px-2 py-0 whitespace-nowrap text-center">
                {show.show_rarity ? (
                    <span className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block" style={{ backgroundColor: getRarityColor(show.show_rarity) }}>
                        {show.show_rarity}
                    </span>
                ) : <span className="text-fifth"></span>}
            </td>
            <td className="px-2 py-0 whitespace-nowrap text-center">
                {show.show_gap ? (
                    <span className="text-white font-normal px-1.5 py-0.5 rounded-md inline-block" style={{ backgroundColor: getGapColor(show.show_gap) }}>
                        {show.show_gap}
                    </span>
                ) : <span className="text-fifth"></span>}
            </td>
            <td className={baseCellClass}>
                <button onClick={() => show.venue_id && navigate(`/venue/${show.venue_id}`)} className="hover:underline transition-colors">
                    {show.show_subvenue}
                </button>
            </td>
            <td className={baseCellClass}>{show.show_venue_location}</td>
            <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
                <StarRating rating={showRatings[show.show_id] || 0} />
            </td>
            <td className="w-8 text-center align-middle">
                {showsWithSetlists.has(show.show_id) && (
                    <div className="flex justify-center items-center h-full">
                        <IconButton
                            icon={FileMusic}
                            color="text-[#006400]"
                            hoverBg="bg-[#006400]"
                            onClick={() => navigate(`/setlist/${show.show_id}`, { state: { openChangesModal: true } })}
                        />
                    </div>
                )}
            </td>
            <td className="w-8 text-center align-middle">
                {showsWithReleases.has(show.show_id) && (
                    <div className="flex justify-center items-center h-full">
                        <IconButton
                            icon={AudioLines}
                            color="text-[#7c2128]"
                            hoverBg="bg-[#7c2128]"
                            onClick={() => navigate(`/setlist/${show.show_id}`)}
                        />
                    </div>
                )}
            </td>
            <td className="w-8 text-center text-fifth">
                <span className="text-xs font-medium">{attendeeCounts[show.show_id] || 0}</span>
            </td>
            <td className="w-8 text-center align-middle">
                {show.show_wl_link && (
                    <div className="flex justify-center items-center h-full">
                        <button onClick={() => window.open(show.show_wl_link, '_blank')} className="hover:text-[#a9682e] hover:bg-[#78b1a1]/30 hover:shadow-[0_0_0_1px_#78b1a1] rounded transition-all p-[1px]">
                            <img src={wlImage} alt="WysteriaLane" className="w-[14.5px] h-[14.5px]" />
                        </button>
                    </div>
                )}
            </td>
            <td className={baseCellClass}>
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
