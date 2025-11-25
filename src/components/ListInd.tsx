import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import { LongestPerformancesList } from './lists/LongestPerformancesList';
import { PopularPlacementsList } from './lists/PopularPlacementsList';
import { UnfinishedReprisedList } from './lists/UnfinishedReprisedList';
import { SeguesList } from './lists/SeguesList';
import { LongestShowsList } from './lists/LongestShowsList';
import { CategoryCompleteShowsList } from './lists/CategoryCompleteShowsList';
import { JiveCompleteShowsList } from './lists/JiveCompleteShowsList';
import { DripfieldCompleteShowsList } from './lists/DripfieldCompleteShowsList';

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
    '37cdd57e-6a16-474e-9715-ba05e95e0217': SeguesList,
    '45a4b90e-adbe-4af5-9051-2f4d212069fc': LongestShowsList,
    'ce613616-28bc-40dd-a6a8-1dd5fe6b0456': LongestShowsList,
    '81dbe56c-7cc4-466b-b8d7-47c1ca041afc': CategoryCompleteShowsList,
    'c66cfb55-12a8-4cfe-9147-547d9e6c1736': JiveCompleteShowsList,
    '6b47d70f-202b-45fe-a5b1-203c031c6aad': DripfieldCompleteShowsList
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
    const isShowsList = listId === '45a4b90e-adbe-4af5-9051-2f4d212069fc' || 
                        listId === 'ce613616-28bc-40dd-a6a8-1dd5fe6b0456' ||
                        listId === 'c66cfb55-12a8-4cfe-9147-547d9e6c1736' ||
                        listId === '81dbe56c-7cc4-466b-b8d7-47c1ca041afc' ||
                        listId === '6b47d70f-202b-45fe-a5b1-203c031c6aad';
    const containerMaxWidth = isSeguesList ? 'max-w-[500px]' : isShowsList ? 'max-w-[1280px]' : 'max-w-[936px]';

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
            <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
                <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
                        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                    </div>
                    <p className="text-fifth mt-4">Loading list...</p>
                </div>
            </div>
        );
    }

    if (!list) {
        return (
            <div className="lg:max-w-none lg:mx-0 max-w-[1280px] mx-auto">
                <div className="text-center py-12 bg-primary border border-fourth rounded-lg p-3">
                    <p className="text-fifth">List not found</p>
                </div>
            </div>
        );
    }

    // Check if this is a special list
    const SpecialListComponent = listId ? SPECIAL_LIST_COMPONENTS[listId] : null;

    return (
        <div className="max-w-[1024px]">
            <div className="mb-4">
                <div className="bg-primary border border-fourth">
                    <div className="bg-tertiary text-fifth px-2 py-0.5 flex flex-col">
                        <button
                            onClick={() => navigate('/lists')}
                            className="flex items-center bg-canvas rounded-lg px-1 border border-fourth text-fifth hover:underline transition-colors text-xs font-semibold w-fit mt-0.5"
                        >
                            <ArrowLeft className="w-3 h-3 mr-1" />
                            Back to Lists
                        </button>
                        <h1 className="text-sm font-semibold">
                            {list.list_name}
                        </h1>
                    </div>
                    {list.list_description && (
                        <div className="px-2 py-1">
                            <p className="text-[0.625rem] leading-[0.75rem] text-fifth/70">{list.list_description}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-primary border border-fourth">
                {SpecialListComponent ? (
                    <SpecialListComponent 
                        listId={listId} 
                        onProgressUpdate={handleProgressUpdate}
                    />
                ) : (
                    <div className="p-2">
                        {items.length > 0 ? (
                            <div className="space-y-0">
                                {items.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemClick(item.list_item_id, list.list_category)}
                                        className="block w-full text-left text-[0.625rem] text-fifth hover:underline transition-colors font-medium cursor-pointer hover:bg-tertiary/40 px-2 py-0.5 rounded"
                                    >
                                        <span className="mr-2">{index + 1}.</span>
                                        {item.list_item_name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[0.625rem] text-fifth/70 text-center py-4">No items in this list</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}