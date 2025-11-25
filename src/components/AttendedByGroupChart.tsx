import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Define colors outside the component
const COLORS = [
  '#3498DB', '#E74C3C', '#2ECC71', '#F39C12', 
  '#9B59B6', '#FF6B81', '#F1C40F', '#FFFFFF',
  '#34495E'
];

// CircularProgress component
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
          stroke="#e5e5e5" 
          strokeWidth="8"
        />
        {/* Progress circle */}
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
      <div className="absolute text-lg font-bold text-fifth">
        {Math.round(value)}%
      </div>
    </div>
  );
};

interface AttendedByGroupChartProps {
  userId?: string;
}

// Updated component to accept userId prop
const AttendedByGroupChart: React.FC<AttendedByGroupChartProps> = ({ userId }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [userId, isOwnProfile]);

  useEffect(() => {
    const fetchAttendedShowsByGroup = async () => {
      if (!effectiveUserId) {
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
        return;
      }
      
      try {
        setLoading(true);
        setLoadingProgress(5);
        
        // Get attended shows with pagination
        let allAttendedShows = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;
        
        while (hasMore) {
          
          const { data, error } = await supabase
            .from('user_attended_shows')
            .select(`
              shows!inner (
                show_id,
                show_group
              )
            `)
            .eq('user_id', effectiveUserId)
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allAttendedShows = [...allAttendedShows, ...data];
            page++;
            
            // Update progress based on pagination (5-75%)
            // We don't know the total number of pages, so let's make an estimate
            // that we'll likely need no more than 5 pages for most users
            const estimatedProgress = Math.min(75, 5 + (page * 15));
            setLoadingProgress(estimatedProgress);
            
            // If we got fewer records than the page size, we're done
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        setLoadingProgress(80);
        
        // Count shows by group
        const groupCounts: Record<string, number> = {};
        
        if (allAttendedShows.length > 0) {
          allAttendedShows.forEach(item => {
            const group = item.shows.show_group;
            if (group) {
              groupCounts[group] = (groupCounts[group] || 0) + 1;
            }
          });
        }
        
        setLoadingProgress(90);
        
        // Format data for pie chart
        const formattedData = Object.entries(groupCounts).map(([name, value]) => ({
          name,
          value
        }));
        
        // Sort the data by value in descending order to highlight main groups
        formattedData.sort((a, b) => b.value - a.value);
        
        setChartData(formattedData);
        setLoadingProgress(100);
        
        // Small delay before removing the loading screen for smooth transition
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('Error fetching attended shows by group:', error);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchAttendedShowsByGroup();
  }, [effectiveUserId]);

  // Get the appropriate title based on whose profile we're viewing
  const getTitle = () => {
    if (isOwnProfile) {
      return "Shows by Group";
    } else if (username) {
      return `Shows by Group`;
    } else {
      return "Shows by Group";
    }
  };

  // Get the appropriate empty state message
  const getEmptyMessage = () => {
    if (isOwnProfile) {
      return "No attended shows found.";
    } else if (username) {
      return `${username} hasn't attended any shows yet.`;
    } else {
      return "This user hasn't attended any shows yet.";
    }
  };

  // Get loading message
  const getLoadingMessage = () => {
    if (isOwnProfile) {
      return "Loading chart data...";
    } else {
      return `Loading ${username ? username + "'s" : "their"} chart data...`;
    }
  };

  return (
    <div className="bg-primary p-3 rounded-lg border border-fourth">
      <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth">{getTitle()}</h3>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center h-56">
          <CircularProgress value={loadingProgress} />
          <p className="text-fifth mt-4">{getLoadingMessage()}</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="text-fifth flex justify-center items-center h-40">{getEmptyMessage()}</div>
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => {
                  const label = value === 1 ? '1 show' : `${value} shows`;
                  return [`${name} - ${label}`, ''];
                }}
                separator=""
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#000000',
                  borderWidth: '1px',
                  fontSize: '0.85rem',
                  padding: '4px 8px'
                }}
                itemStyle={{ 
                  color: '#000000',
                  fontWeight: 600
                }}
                wrapperStyle={{ outline: 'none' }}
                isAnimationActive={false}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AttendedByGroupChart;