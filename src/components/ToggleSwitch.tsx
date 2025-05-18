import coachLogo from '../img/Coach.png';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch = ({ checked, onChange }: ToggleSwitchProps) => {
  return (
    <div className="flex items-center gap-2">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-12 border border-black items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ec742e]/50 ${
          checked ? 'bg-[#f9ae37]' : 'bg-primary'
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-[#172330] transition-transform duration-200 ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
      <img 
        src={coachLogo} 
        alt="Coach Notes" 
        className="h-8 w-auto"
      />
    </div>
  );
};

export default ToggleSwitch;