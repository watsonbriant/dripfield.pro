import { GiWhistle } from "react-icons/gi";

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
        className={`relative inline-flex h-6 w-[3.125rem] border border-fourth hover:bg-secondary items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-tertiary/50 ${
          checked ? 'bg-tertiary' : 'bg-primary'
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-[#172330] transition-transform duration-200 ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
      <GiWhistle className="h-8 w-auto" />
    </div>
  );
};

export default ToggleSwitch;