import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { getStatBgColor, copyToClipboard, formatTimeInterval } from '../utils/userStatsUtils';

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
    <div className="bg-primary border border-fourth w-full h-full relative shadow-xl">
      <div className={`relative ${getStatBgColor(type)} px-1 pt-0.5 pb-0.5 mb-0.5`}>
        <div className="flex justify-between items-center">
          <h3 className={`text-sm font-medium pl-1 ${
            type === 'showOpeners' || type === 'setOpeners' || type === 'setClosers' || type === 'encoreSongs' || type === 'notSeenSongs'
              ? 'text-white' 
              : 'text-fifth'
          }`}>
            {title}
          </h3>
          {!loading && data.length > 0 && showCopyButton && (
            <button
              onClick={handleCopy}
              className={`relative z-10 rounded ${
                isCopied ? 'bg-green-600' : 'bg-fourth hover:bg-fourth/60'
              } border border-fourth p-0.5 transition-colors`}
              title="Copy to clipboard"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <Copy className="w-3 h-3 text-white" />
              )}
            </button>
          )}
        </div>
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
          <table className="w-full border-collapse mb-0.5">
            <tbody className="divide-y divide-white/5">
              {data.map((item, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                    } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="pl-2 text-fifth">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="text-fifth text-xs text-left items-center">
                          <Link 
                            to={`/song/${item[songIdKey]}`}
                            className='font-medium hover:underline cursor-pointer'
                          >
                            {item[songNameKey]}
                          </Link>
                          {showDate && item.show_date && (
                            <Link 
                              to={`/setlist/${item.show_id}`}
                              className="hover:underline font-light text-[0.625rem] text-fifth ml-3 cursor-pointer"
                            >
                              [{item.show_date}]
                            </Link>
                          )}
                        </div>
                      </div>
                      {item.category_artwork && (
                        <img
                          src={item.category_artwork}
                          alt={`${item[songNameKey]} artwork`}
                          className="w-4 h-4 rounded object-cover border border-fourth ml-3"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="pl-2 pr-2 w-[40px] text-center font-medium text-fifth">
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
