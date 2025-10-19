import React from 'react';
import aatLogo from '../img/AAT.jpg';
import nugsLogo from '../img/NugsColor.png';

interface JotyHeaderProps {
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

const JotyHeader: React.FC<JotyHeaderProps> = ({ selectedYear, availableYears, onYearChange }) => {
  return (
    <div className="mb-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary whitespace-nowrap">
            Jam of the Year
          </h2>
          
          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-tertiary"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        {/* Credits with logos */}
        <div className="flex items-center gap-3">
          {/* Logos */}
          <div className="flex items-center gap-2">
            <a href="https://www.osirispod.com/podcasts/always-almost-there/" target="_blank">
              <img src={aatLogo} alt="Always Almost There" className="h-8 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" />
            </a>
            <a href="https://www.nugs.net/" target="blank"><img src={nugsLogo} alt="nugs" className="h-8 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" /></a>
          </div>
          
          {/* Credits */}
          <div className="bg-fourth border border-secondary rounded-lg px-3 py-1.5 max-w-[350px]">
            <p className="text-xs font-medium text-primary">Jam of the Year is an annual bracket-style ranking initiative presented by Always Almost There and powered by nugs.</p>
          </div>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">
            Jam of the Year
          </h2>
          
          {/* Year Dropdown */}
          <div className="mt-4">
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-fourth/40 transition-colors text-lg font-semibold appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-tertiary"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Logos */}
          <div className="flex items-center justify-center gap-3 mt-4 mb-4">
            <a href="https://www.osirispod.com/podcasts/always-almost-there/" target="_blank">
              <img src={aatLogo} alt="Always Almost There" className="h-10 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" />
            </a>
            <a href="https://www.nugs.net/" target="_blank">
              <img src={nugsLogo} alt="nugs" className="h-10 w-auto rounded-full hover:shadow-[0_0_0_2px_#8ec1b6]" />
            </a>
          </div>
        </div>
        
        {/* Credits */}
        <div className="bg-fourth border border-secondary rounded-lg px-3 py-1.5 mb-4 mx-auto max-w-[350px]">
          <p className="text-xs font-medium text-primary text-center">Jam of the Year is an annual bracket-style ranking initiative presented by Always Almost There and powered by nugs.</p>
        </div>
      </div>
    </div>
  );
};

export default JotyHeader;
