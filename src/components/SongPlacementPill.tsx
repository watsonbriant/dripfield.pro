import React, { useState, useRef, useEffect } from 'react';
import { ChartBarDecreasing } from 'lucide-react';

// Using the same placement colors from PerformanceChart component
const placementColors: Record<string, string> = {
    'Set 1 Opener': '#006400',
    'Set 1 Closer': '#995905',
    'Set 2 Opener': '#019B7A',
    'Set 3 Opener': '#019B7A',
    'Set 4 Opener': '#019B7A',
    'Set 5 Opener': '#019B7A',
    'Set 2 Closer': '#E17401',
    'Set 3 Closer': '#E17401',
    'Set 4 Closer': '#E17401',
    'Set 5 Closer': '#E17401',
    'Encore 1': '#7C2128',
    'Encore 2': '#CE1126',
    'Encore 3': '#AF1E2D'
};

// Tooltip styles similar to PerformanceChart
const tooltipStyles = `
  @media (max-width: 768px) {
    .tooltip-bubble {
      display: none !important;
    }
    .mobile-stats-container {
      display: block !important;
    }
    .stats-toggle-button {
      display: none !important;
    }
  }
  @media (min-width: 769px) {
    .mobile-stats-container {
      display: none !important;
    }
  }
`;

interface PlacementStat {
    placement: string;
    count: number;
    percentage: number;
    order?: number; // Optional placement order for sorting
}

interface SongPlacementPillProps {
    placementStats: PlacementStat[];
}

// TextFitOrHide component to handle text fitting logic
interface TextFitOrHideProps {
    text: string;
    containerRef: HTMLDivElement | null;
}

const TextFitOrHide: React.FC<TextFitOrHideProps> = ({ text, containerRef }) => {
    const [shouldShow, setShouldShow] = useState(false);
    const textRef = useRef<HTMLSpanElement>(null);
    
    useEffect(() => {
        if (containerRef && textRef.current) {
            const containerWidth = containerRef.getBoundingClientRect().width;
            const textWidth = textRef.current.getBoundingClientRect().width;
            setShouldShow(textWidth <= containerWidth * 0.9); // 90% threshold for comfort
        }
    }, [containerRef]);
    
    return (
        <>
            <span ref={textRef} className="invisible absolute whitespace-nowrap px-1">{text}</span>
            {shouldShow && <span className="px-1">{text}</span>}
        </>
    );
};

const SongPlacementPill: React.FC<SongPlacementPillProps> = ({ placementStats }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [hoveredSection, setHoveredSection] = useState<PlacementStat | null>(null);
    const [showAllStats, setShowAllStats] = useState(false);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    if (!placementStats || placementStats.length === 0) {
        return null;
    }

    const totalPerformances = placementStats.reduce((sum, stat) => sum + stat.count, 0);

    // Sort by placement_order for the visual pill, if available
    const sortedStats = [...placementStats].sort((a, b) => {
        // If both have order, sort by order
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        // If only one has order, prioritize the one with order
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // If neither has order, sort by placement name
        return a.placement.localeCompare(b.placement);
    });

    // Sort by count for the "all stats" tooltip (most common first)
    const statsForDisplay = [...placementStats].sort((a, b) => {
        // If both have order, sort by order
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        // If only one has order, prioritize the one with order
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // If neither has order, sort by placement name
        return a.placement.localeCompare(b.placement);
    });

    return (
        <>
            <style>{tooltipStyles}</style>
            <div>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">
                            Set Placements
                        </h2>
                        {/* Info icon moved inline with heading */}
                        <button
                            className="ml-2 bg-[#f9ae37] hover:bg-[#f9ae37]/80 text-black text-xs font-semibold p-2 rounded-full flex items-center justify-center border border-black z-10 stats-toggle-button"
                            onMouseEnter={(e) => {
                                setShowAllStats(true);
                                setMousePosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => {
                                setMousePosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => {
                                setShowAllStats(false);
                            }}
                        >
                            <ChartBarDecreasing className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="flex overflow-hidden h-8 rounded-full border border-black">
                        {sortedStats.map((stat, index) => {
                            const minWidth = stat.percentage < 5 ? '5px' : undefined;
                            return (
                                <div
                                    key={index}
                                    ref={el => sectionRefs.current[index] = el}
                                    style={{
                                        width: `${stat.percentage}%`,
                                        backgroundColor: placementColors[stat.placement] || '#000000',
                                        minWidth: minWidth
                                    }}
                                    className="h-full flex items-center justify-center text-white text-xs font-bold transition-all hover:opacity-90 cursor-pointer relative"
                                    onMouseEnter={(e) => {
                                        setHoveredSection(stat);
                                        setMousePosition({ x: e.clientX, y: e.clientY });
                                    }}
                                    onMouseMove={(e) => {
                                        setMousePosition({ x: e.clientX, y: e.clientY });
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredSection(null);
                                    }}
                                >
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tooltip for hovered section */}
                {hoveredSection && (
                    <div
                        className="fixed bg-secondary text-black px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble border border-black"
                        style={{
                            left: `${mousePosition.x + 10}px`,
                            top: `${mousePosition.y - 10}px`,
                            maxWidth: '250px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal',
                            backgroundColor: 'tertiary'
                        }}
                    >
                        <div className="space-y-0.5">
                            <div className="font-bold">{hoveredSection.placement}</div>
                            <div>Times played: <span className="font-semibold">&nbsp;&nbsp;{hoveredSection.count}</span></div>
                            <div>Percentage: <span className="font-semibold">&nbsp;&nbsp;{hoveredSection.percentage.toFixed(1)}%</span></div>
                        </div>
                    </div>
                )}

                {/* All Stats Tooltip - use same positioning as section tooltips */}
                {showAllStats && (
                    <div
                        className="fixed bg-secondary text-black px-3 py-1.5 rounded shadow-lg z-[9999] text-xs tooltip-bubble border border-black"
                        style={{
                            left: `${mousePosition.x + 10}px`,
                            top: `${mousePosition.y - 10}px`,
                            maxWidth: '300px',
                            wordWrap: 'break-word',
                            whiteSpace: 'normal',
                            backgroundColor: 'tertiary'
                        }}
                    >
                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {statsForDisplay.map((stat, index) => (
                                <div key={index} className="flex items-center">
                                    <div
                                        className="w-3 h-3 mr-2 flex-shrink-0"
                                        style={{ backgroundColor: placementColors[stat.placement] || '#000000' }}
                                    ></div>
                                    <div className="flex justify-between w-full">
                                        <span>{stat.placement}:</span>
                                        <span className="font-semibold ml-4">{stat.count} ({stat.percentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile stats display - shows below the pill on mobile */}
                <div className="mobile-stats-container mt-4 bg-secondary text-black px-3 py-2 rounded shadow-md border border-black hidden">
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                        {statsForDisplay.map((stat, index) => (
                            <div key={index} className="flex items-center">
                                <div
                                    className="w-3 h-3 mr-2 flex-shrink-0 rounded-sm"
                                    style={{ backgroundColor: placementColors[stat.placement] || '#000000' }}
                                ></div>
                                <div className="flex justify-between w-full text-xs">
                                    <span>{stat.placement}:</span>
                                    <span className="font-semibold ml-4">{stat.count}&nbsp;&nbsp;({stat.percentage.toFixed(1)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SongPlacementPill;