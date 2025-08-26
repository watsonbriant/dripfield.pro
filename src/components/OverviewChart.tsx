import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ShowByYear {
  year: string;
  gooseCount: number;
  otherCount: number;
}

// CircularProgress component for reuse
const CircularProgress = ({ value }: { value: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);
  
  return (
    <div className="relative inline-flex justify-center items-center">
      <svg className="w-24 h-24" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#fdfdfd" 
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle 
          cx="50" 
          cy="50" 
          r={radius} 
          fill="transparent" 
          stroke="#8e6c7a" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute text-lg font-semibold text-fifth">
        {Math.round(value)}%
      </div>
    </div>
  );
};

interface OverviewChartProps {
  userId?: string;
}

const OverviewChart: React.FC<OverviewChartProps> = ({ userId }) => {
  const [showData, setShowData] = useState<ShowByYear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [username, setUsername] = useState<string | null>(null);
  const { user } = useAuth();

  // Determine effective user ID (use provided userId or current user's ID)
  const effectiveUserId = userId || (user ? user.id : null);
  
  // Is this the current user's profile or someone else's?
  const isOwnProfile = !userId || (user && user.id === userId);

  // Fetch username if viewing someone else's profile
  useEffect(() => {
    if (!isOwnProfile && userId) {
      const fetchUsername = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error('Error fetching username:', error);
            return;
          }
          
          if (data?.username) {
            setUsername(data.username);
          }
        } catch (error) {
          console.error('Error in username fetch:', error);
        }
      };
      
      fetchUsername();
    }
  }, [userId, isOwnProfile, user]);

  useEffect(() => {
    const fetchShowData = async () => {
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadingProgress(5);
        
        // Get all shows the user has attended with pagination
        let allAttendedShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select('show_id')
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data];
            page++;
            
            // Update progress based on pagination (0-50%)
            setLoadingProgress(Math.min(50, 5 + (page * 10)));
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        if (allAttendedShows.length === 0) {
          setShowData([]);
          setLoadingProgress(100);
          setLoading(false);
          return;
        }
        
        const showIds = allAttendedShows.map(show => show.show_id);
        setLoadingProgress(60);
        
        // Get details for all attended shows with pagination
        let allShowDetails = [];
        page = 0;
        hasMore = true;
        
        // Split showIds into chunks if there are many of them
        const showIdChunks = [];
        const chunkSize = 500; // Supabase has limits on IN clause size
        
        for (let i = 0; i < showIds.length; i += chunkSize) {
          showIdChunks.push(showIds.slice(i, i + chunkSize));
        }
        
        for (let i = 0; i < showIdChunks.length; i++) {
          const currentChunk = showIdChunks[i];
          page = 0;
          hasMore = true;
          
          while (hasMore) {
            
            const { data, error } = await supabase
              .from('shows')
              .select('show_date, show_group')
              .in('show_id', currentChunk)
              .range(page * pageSize, (page + 1) * pageSize - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
              allShowDetails = [...allShowDetails, ...data];
              page++;
              
              // Update progress based on pagination (60-90%)
              const progressPerChunk = 30 / showIdChunks.length;
              const chunkProgress = (i / showIdChunks.length) * 30;
              const pageProgress = (page * 5) / Math.ceil(currentChunk.length / pageSize);
              setLoadingProgress(Math.min(90, 60 + chunkProgress + (pageProgress * (progressPerChunk / 100))));
              
              // If we got fewer records than the page size, we're done with this chunk
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
        }
        
        setLoadingProgress(95);
        
        // Process data to group by year and show_group
        const yearData: { [year: string]: { gooseCount: number, otherCount: number } } = {};
        
        allShowDetails.forEach(show => {
          if (!show.show_date) return;
          
          const year = new Date(show.show_date).getFullYear().toString();
          
          if (!yearData[year]) {
            yearData[year] = { gooseCount: 0, otherCount: 0 };
          }
          
          if (show.show_group === 'Goose') {
            yearData[year].gooseCount += 1;
          } else {
            yearData[year].otherCount += 1;
          }
        });
        
        // Convert to array format for chart and fill in missing years
        let chartData = Object.entries(yearData)
          .map(([year, counts]) => ({
            year,
            gooseCount: counts.gooseCount,
            otherCount: counts.otherCount
          }))
          .sort((a, b) => parseInt(a.year) - parseInt(b.year));

        // Fill in missing years between first and last show
        if (chartData.length > 0) {
          const firstYear = parseInt(chartData[0].year);
          const lastYear = parseInt(chartData[chartData.length - 1].year);
          
          const completeData = [];
          for (let year = firstYear; year <= lastYear; year++) {
            const existingData = chartData.find(d => parseInt(d.year) === year);
            if (existingData) {
              completeData.push(existingData);
            } else {
              completeData.push({
                year: year.toString(),
                gooseCount: 0,
                otherCount: 0
              });
            }
          }
          chartData = completeData;
        }

        setShowData(chartData);
        setLoadingProgress(100);
      } catch (error) {
        console.error('Error fetching show data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchShowData();
  }, [effectiveUserId]);

  // Get personalized loading message
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading shows data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} shows data...`;
    }
  };

  // Get personalized empty state message
  const getEmptyStateMessage = () => {
    if (isOwnProfile) {
      return "No show data available. Start adding shows you've attended!";
    } else if (username) {
      return `${username} hasn't added any attended shows yet.`;
    } else {
      return "This user hasn't added any attended shows yet.";
    }
  };

  // Get chart title based on profile ownership
  const getChartTitle = () => {
    if (isOwnProfile) {
      return "Shows Per Year";
    } else if (username) {
      return `Shows Per Year`;
    } else {
      return "Shows Per Year";
    }
  };

  if (loading) {
    return (
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">{getLoadingMessage()}</p>
        </div>
      </div>
    );
  }

  if (showData.length === 0) {
    return <div className="text-center text-fifth py-10 bg-primary p-4 rounded-lg border border-secondary">
      {getEmptyStateMessage()}
    </div>;
  }
  
  // Filter out years with no shows if needed
  return (
    <div className="bg-primary p-3 rounded-lg border border-secondary">
      <h3 className="text-lg font-medium bg-fourth text-primary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">{getChartTitle()}</h3>
      <div className="overflow-x-auto">
        <div className="h-80 min-w-[768px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={showData}
              margin={{ top: 15, right: 25, left: -25, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="year" 
                stroke="#333"
                tick={{ fill: '#000', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#333' }}
                tickLine={{ stroke: '#333' }}
                dy={10} // Add padding above x-axis values
              />
              <YAxis 
                stroke="#333" 
                allowDecimals={false}
                domain={[0, 'auto']}
                tick={{ fill: '#000', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#333' }}
                tickLine={{ stroke: '#333' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#e7e7e7', 
                  borderColor: '#e7e7e7',
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: '1px solid #000'
                }}
                formatter={(value, name) => [`${value}`, `${name}`]}
                labelFormatter={(year) => `${year}`}
                separator=" – "
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '10px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                iconSize={10}
                iconType="circle"
              />
              <Area 
                type="linear" 
                dataKey="gooseCount" 
                name="Goose" 
                stroke="#4c9381" 
                fill="#8ec1b6" 
                fillOpacity={1.0}
              />
              <Area 
                type="linear" 
                dataKey="otherCount" 
                name="Other" 
                stroke="#8e6c7a" 
                fill="#8e6c7a"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OverviewChart;