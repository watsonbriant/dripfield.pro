import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserX, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShowAttendButtonProps {
  showId: string;
  className?: string;
  onAttendanceChange?: (isAttending: boolean) => void;
}

// Simple modal component for non-logged-in users styled to match the app's aesthetic
const LoginModal: React.FC<{ onClose: () => void, onLogin: () => void }> = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-primary border border-secondary rounded-lg p-4 max-w-sm mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-medium text-fifth mb-3">Login Required</h3>
        <p className="mb-4 text-fifth text-sm font-light">You must be logged in to add this show to your attended list.</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 pt-1.5 pb-0.5 border border-secondary rounded-lg text-fifth hover:bg-red-500/50 transition-colors text-sm font-mohr bg-red-500"
          >
            Cancel
          </button>
          <button 
            onClick={onLogin}
            className="px-4 pt-1.5 pb-0.5 bg-tertiary border border-secondary rounded-lg text-fifth hover:bg-primary transition-colors text-sm font-mohr"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

const ShowAttendButton: React.FC<ShowAttendButtonProps> = React.memo(({ 
  showId, 
  className = '',
  onAttendanceChange 
}) => {
  const { user, addAttendedShow, removeAttendedShow, checkShowAttendance } = useAuth();
  const [isAttended, setIsAttended] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Use useCallback to memoize the function
  const checkAttendance = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
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
    } else {
      setIsLoading(false);
    }
  }, [user, showId, checkAttendance]);

  const handleToggleAttendance = async (e: React.MouseEvent) => {
    // Prevent event propagation to avoid parent elements' event handlers
    e.stopPropagation();
    
    if (!user) {
      setShowModal(true);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      if (isAttended) {
        await removeAttendedShow(showId);
        setIsAttended(false);
        // Notify parent component that user is no longer attending
        if (onAttendanceChange) onAttendanceChange(false);
      } else {
        await addAttendedShow(showId);
        setIsAttended(true);
        // Notify parent component that user is now attending
        if (onAttendanceChange) onAttendanceChange(true);
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      setError('Failed to update attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setShowModal(false);
    navigate('/login');
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <>
      <button
        onClick={handleToggleAttendance}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={isLoading}
        title={
          error ? error : 
          !user ? "Log in to mark as attended" : 
          isAttended ? "Remove from attended shows" : 
          "Mark as attended"
        }
        className={`p-1 rounded-lg transition-all ${
          error ? 'bg-red-800 text-primary' :
          !user ? 'text-fifth border-secondary border bg-tertiary hover:bg-tertiary/80' :
          isAttended
            ? 'border border-secondary bg-green-600 hover:bg-red-600 text-primary'
            : 'text-primary border-secondary border bg-fourth hover:bg-green-600 hover:text-primary'
        } ${className}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-primary border-t-white rounded-full animate-spin"></div>
        ) : error ? (
          <UserX size={16} />
        ) : !user ? (
          <UserPlus size={16} />
        ) : isAttended ? (
          isHovering ? <UserX size={16} /> : <UserCheck size={16} />
        ) : (
          <UserPlus size={16} />
        )}
      </button>

      {showModal && (
        <LoginModal onClose={handleCloseModal} onLogin={handleLogin} />
      )}
    </>
  );
});

export default ShowAttendButton;