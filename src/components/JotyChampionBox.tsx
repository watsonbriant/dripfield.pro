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
  if (!championship) return null;
  
  const champion = championship.team1.percentage > championship.team2.percentage 
    ? championship.team1 
    : championship.team2;
  
  return (
    <div className="py-2 text-center">
      <div className="inline-block bg-primary border border-fourth p-2">
        <p className="text-xs font-semibold text-fifth mb-1">{selectedYear} Jam of the Year</p>
        <p className="text-sm font-medium text-fifth">{champion.name}</p>
        {champion.date && champion.venue && (
          <p className="text-[0.625rem] text-fifth mt-1 font-medium">
            {champion.date}.{selectedYear.toString().slice(2)}<br /><span className="font-light">{champion.venue}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default ChampionBox;
