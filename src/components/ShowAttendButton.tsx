import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserX, UserPlus } from 'lucide-react';

interface ShowAttendButtonProps {
  showId: string;
  className?: string;
}

const ShowAttendButton: React.FC<ShowAttendButtonProps> = React.memo(({ showId, className = '' }) => {
  const { user, addAttendedShow, removeAttendedShow, checkShowAttendance } = useAuth();
  const [isAttended, setIsAttended] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use useCallback to memoize the function
  const checkAttendance = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const attended = await checkShowAttendance(showId);
      setIsAttended(attended);
    } catch (error) {
      console.error('Error checking attendance:', error);
      setError('Failed to check attendance');
    } finally {
      setIsLoading(false);
    }
  }, [user, showId, checkShowAttendance]);

  // Run when component mounts or when showId changes
  useEffect(() => {
    if (user && showId) {
      checkAttendance();
    }
  }, [user, showId, checkAttendance]);

  const handleToggleAttendance = async (e: React.MouseEvent) => {
    // Prevent event propagation to avoid parent elements' event handlers
    e.stopPropagation();
    
    if (!user) {
      alert('Please log in to mark shows as attended');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      if (isAttended) {
        await removeAttendedShow(showId);
        setIsAttended(false);
      } else {
        await addAttendedShow(showId);
        setIsAttended(true);
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      setError('Failed to update attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  if (!user) {
    return null; // Don't show button if user is not logged in
  }

  return (
    <button
      onClick={handleToggleAttendance}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={isLoading}
      title={error ? error : isAttended ? "Remove from attended shows" : "Mark as attended"}
      className={`p-1 rounded-lg transition-all ${
        error ? 'bg-red-800 text-white' :
        isAttended
          ? 'bg-green-600 hover:bg-red-600 text-white'
          : 'text-white border-[#fce7ca]/80 hover:bg-green-600 hover:text-white'
      } ${className}`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      ) : error ? (
        <UserX size={16} />
      ) : isAttended ? (
        isHovering ? <UserX size={16} /> : <UserCheck size={16} />
      ) : (
        <UserPlus size={16} />
      )}
    </button>
  );
});

export default ShowAttendButton;