import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { LongestPerformancesList } from './lists/LongestPerformancesList';
import { PopularPlacementsList } from './lists/PopularPlacementsList';
import { UnfinishedReprisedList } from './lists/UnfinishedReprisedList';
import { SeguesList } from './lists/SeguesList';

interface List {
    id: number;
    list_id: string;
    list_name: string;
    list_category: string;
    list_description: string | null;
    list_order: number;
}

interface ListItem {
    id: number;
    list_item_name: string;
    list_item_order: number;
    list_item_id: string;
}

// CircularProgress component
const CircularProgress = ({ value }: { value: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - value / 100);

    return (
        <div className="relative inline-flex justify-center items-center">
            <svg className="w-16 h-16" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#b4b2b2"
                    strokeWidth="8"
                    strokeOpacity="0.3"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#8ec1b6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-300 ease-in-out"
                />
            </svg>
            <div className="absolute text-sm font-bold text-fifth">
                {Math.round(value)}%
            </div>
        </div>
    );
};

// Map of special list UUIDs to their corresponding components
const SPECIAL_LIST_COMPONENTS: Record<string, React.ComponentType<any>> = {
    '1fdc862c-bef0-4a7c-92f7-f6686b7efbd8': LongestPerformancesList,
    '3657a3a7-bcb4-483b-b8ef-e4ae28495a61': LongestPerformancesList,
    'a9fcbc3a-c3de-42b4-a274-1974badd283c': PopularPlacementsList,
    'f0989de4-b27d-4b8f-98c2-5e3d51a310b4': UnfinishedReprisedList,
    '37cdd57e-6a16-474e-9715-ba05e95e0217': SeguesList
};

export function ListInd() {
    const { listId } = useParams<{ listId: string }>();
    const navigate = useNavigate();
    const [list, setList] = useState<List | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);

    // Determine if this is the segues list that needs narrow width
    const isSeguesList = listId === '37cdd57e-6a16-474e-9715-ba05e95e0217';
    const containerMaxWidth = isSeguesList ? 'max-w-[500px]' : 'max-w-[936px]';

    useEffect(() => {
        if (listId) {
            fetchListData();
        }
    }, [listId]);

    async function fetchListData() {
        try {
            setLoadingProgress(5);

            // Fetch list details
            const { data: listData, error: listError } = await supabase
                .from('lists')
                .select('*')
                .eq('list_id', listId)
                .single();

            if (listError) throw listError;
            setList(listData);

            setLoadingProgress(10);

            // Check if this is a special list
            if (listId && SPECIAL_LIST_COMPONENTS[listId]) {
                // Special lists handle their own data fetching
                setLoadingProgress(100);
            } else {
                // Fetch regular list items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('list_items')
                    .select('*')
                    .eq('list_id', listId)
                    .order('list_item_order', { ascending: true });

                if (itemsError) throw itemsError;
                setItems(itemsData || []);
                setLoadingProgress(100);
            }
        } catch (error) {
            console.error('Error fetching list data:', error);
            setLoadingProgress(100);
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    }

    const handleItemClick = (itemId: string, category: string) => {
        if (category === 'songs') {
            navigate(`/song/${itemId}`);
        } else if (category === 'shows') {
            navigate(`/setlist/${itemId}`);
        }
    };

    const handleProgressUpdate = (progress: number) => {
        setLoadingProgress(progress);
    };

    if (loading) {
        return (
            <div className={`${containerMaxWidth} mx-auto`}>
                <div className="max-h-[320px] overflow-y-auto">
                    <div className="flex items-center justify-center py-6">
                        <CircularProgress value={loadingProgress} />
                    </div>
                </div>
            </div>
        );
    }

    if (!list) {
        return (
            <div className={`${containerMaxWidth} mx-auto`}>
                <div className="text-fifth text-center py-8">List not found</div>
            </div>
        );
    }

    // Check if this is a special list
    const SpecialListComponent = listId ? SPECIAL_LIST_COMPONENTS[listId] : null;

    return (
        <div className={`${containerMaxWidth} mx-auto`}>
            <button
                onClick={() => navigate('/lists')}
                className="flex items-center bg-tertiary rounded-lg py-1 px-2 border border-secondary hover:underline transition-colors font-medium text-sm text-fifth mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lists
            </button>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
                        {list.list_name}
                    </h1>
                    {list.list_description && (
                        <p className="text-fifth font-light text-xs mt-2 bg-primary rounded-lg px-2 py-1 border border-secondary">{list.list_description}</p>
                    )}
                </div>
            </div>

            <div className="bg-primary border border-secondary rounded-lg p-3">
                {SpecialListComponent ? (
                    <SpecialListComponent 
                        listId={listId} 
                        onProgressUpdate={handleProgressUpdate}
                    />
                ) : (
                    <div className="space-y-2">
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.list_item_id, list.list_category)}
                                    className="block w-full text-left px-3 py-2 bg-canvas hover:bg-tertiary hover:text-fifth transition-colors rounded border border-secondary text-fourth"
                                >
                                    <span className="font-medium mr-2">{index + 1}.</span>
                                    {item.list_item_name}
                                </button>
                            ))
                        ) : (
                            <div className="text-fifth text-center py-8">No items in this list</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}