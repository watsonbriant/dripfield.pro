import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { cleanSongName, getStatBgColor, copyToClipboard, formatTimeInterval } from '../utils/userStatsUtils';

interface StatBoxProps {
  title: string;
  data: any[];
  loading: boolean;
  countKey?: string;
  showDate?: boolean;
  showLength?: boolean;
  songNameKey?: string;
  songIdKey?: string;
  type: string;
  showCopyButton?: boolean;
}

const StatBox: React.FC<StatBoxProps> = ({
  title,
  data,
  loading,
  countKey = 'play_count',
  showDate = false,
  showLength = false,
  songNameKey = 'song',
  songIdKey = 'song_id',
  type,
  showCopyButton = true
}) => {
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    copyToClipboard(data, songNameKey, countKey, showLength, title, type);
    setIsCopied(true);
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  return (
    <div className="bg-primary border border-fourth rounded-lg p-3 w-full h-full relative">
      <div className="flex justify-between items-start">
        <h3 className={`text-lg font-semibold ${getStatBgColor(type)} ${
          type === 'showOpeners' || type === 'setOpeners' || type === 'setClosers' || type === 'encoreSongs' || type === 'notSeenSongs'
            ? 'text-white' 
            : 'text-fifth'
        } inline-block px-3 pt-0.5 pb-0.5 rounded-lg border border-fourth mb-2`}>
          {title}
        </h3>
        {!loading && data.length > 0 && showCopyButton && (
          <button
            onClick={handleCopy}
            className={`${
              isCopied ? 'bg-green-600' : 'bg-secondary hover:bg-tertiary'
            } border border-fourth rounded-lg p-1.5 transition-colors`}
            title="Copy to clipboard"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Copy className="w-4 h-4 text-fifth" />
            )}
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-lg h-6 w-6 border-t-2 border-b-2 border-fourth"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center h-40 flex items-center justify-center">
          <p className="text-fifth">No data available</p>
        </div>
      ) : (
        <div className="relative">
          <table className="w-full border-collapse">
            <tbody className="divide-y divide-white/5">
              {data.map((item, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                    } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="pl-4 text-fifth">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="text-fifth text-[1rem] leading-[0.875rem] text-left items-center pb-0.5">
                          <span 
                            onClick={() => navigate(`/song/${item[songIdKey]}`)}
                            className='font-trad hover:underline cursor-pointer'
                          >
                            {cleanSongName(item[songNameKey])}
                          </span>
                          {showDate && item.show_date && (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/setlist/${item.show_id}`);
                              }}
                              className="hover:underline font-light text-xs text-fifth ml-2 cursor-pointer"
                            >
                              [{item.show_date}]
                            </span>
                          )}
                        </div>
                      </div>
                      {item.category_artwork && (
                        <img
                          src={item.category_artwork}
                          alt={`${item[songNameKey]} artwork`}
                          className="w-5 h-5 rounded object-cover border border-fourth ml-3"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="pl-2 pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                    {showLength ? formatTimeInterval(item.length) : item[countKey]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StatBox;
