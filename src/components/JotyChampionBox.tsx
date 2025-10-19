import React from 'react';
import { Team } from './JotyMatchup';

interface ChampionBoxProps {
  championship: {
    game: number;
    team1: Team;
    team2: Team;
  } | undefined;
  selectedYear: number;
}

const ChampionBox: React.FC<ChampionBoxProps> = ({ championship, selectedYear }) => {
  // Clean song names for display
  const cleanSongName = (songName: string): string => {
    return songName
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
      .replace(/–/g, '-')
      .replace(/…/g, '...')
      .replace(/∆/g, 'a');
  };

  if (!championship) return null;
  
  const champion = championship.team1.percentage > championship.team2.percentage 
    ? championship.team1 
    : championship.team2;
  
  return (
    <div className="pt-8 text-center">
      <div className="inline-block bg-tertiary/80 border border-secondary rounded-lg p-2">
        <p className="text-sm font-semibold text-fifth mb-1">{selectedYear} Jam of the Year</p>
        <p className="text-2xl font-trad text-[1.5rem] leading-[1.5rem] pb-1 text-fifth">{cleanSongName(champion.name)}</p>
        {champion.date && champion.venue && (
          <p className="text-sm text-fifth mt-1 font-medium">
            {champion.date}.{selectedYear.toString().slice(2)}<br /><span className="font-light">{champion.venue}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ChampionBox;
