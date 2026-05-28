import { Link } from 'react-router-dom';

export function MergeAnnouncementBanner() {
  return (
    <Link
      to="/new"
      className="block w-full no-underline hover:no-underline bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-center px-3 py-2 text-xs sm:text-sm font-semibold transition-colors shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] border-b-2 border-red-800"
    >
      Effective July 2026, Dripfield.pro is merging with Wysteria Lane Community.{' '}
      <span className="underline font-bold">Click for more details.</span>
    </Link>
  );
}
