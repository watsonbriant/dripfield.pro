import React from 'react';
import { X } from 'lucide-react';

interface SetlistGameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetlistGameRulesModal({ isOpen, onClose }: SetlistGameRulesModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-primary rounded-lg border border-black shadow-xl w-full max-w-[600px] max-h-[80vh] overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3.5 pt-1.5 pb-0.5 rounded-full border border-black">Setlist Game Rules</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-black bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-black/70" />
          </button>
        </div>
        
        <div className="space-y-4 text-black text-sm">
          
          <div>
            <h4 className="text-base font-semibold text-black">Scoring System</h4>
            <div className="space-y-1 mt-1">
              <div><span className="text-green-700 font-semibold">+2 points</span> for correctly picking a <span className="font-bold text-[#a9682e]">song</span>.<br /><span className="text-xs text-black/70 px-6 block">If you pick Arcadia, and it was played at any point during the show, +2 points.</span></div>
              <div><span className="text-green-700 font-semibold">+2 points</span> for correctly picking a <span className="font-bold text-[#a9682e]">song</span> in the correct <span className="font-bold text-[#a9682e]">set</span>.<br /><span className="text-xs text-black/70 px-6 block">If you pick Arcadia to be played in Set 1, and it was played during Set 1, +2 points.&nbsp;&nbsp;If it was played in Set 2 or the Encore, no points.</span></div>
              <div><span className="text-green-700 font-semibold">+3 points</span> for correctly picking a <span className="font-bold text-[#a9682e]">song</span> in the correct <span className="font-bold text-[#a9682e]">spot</span> in the correct <span className="font-bold text-[#a9682e]">set</span>.<br /><span className="text-xs text-black/70 px-6 block">If you pick Arcadia to be played as the third song in Set 1, and it was played in that exact spot, +3 points.&nbsp;&nbsp;If it was played in any other set or spot, no points.</span></div>
              <div><span className="text-green-700 font-semibold">+2 points</span> for correctly picking a <span className="font-bold text-[#a9682e]">song</span> as a <span className="font-bold text-[#a9682e]">set opener</span> or <span className="font-bold text-[#a9682e]">set closer</span>.<br /><span className="text-xs text-black/70 px-6 block">If you pick Arcadia to be played as Set 1 Opener, and it opened any non-encore set, +2 points.</span></div>
              <div><span className="text-green-700 font-semibold">+3 points</span> for correctly picking a <span className="font-bold text-[#a9682e]">song</span> as a <span className="font-bold text-[#a9682e]">set opener</span> or <span className="font-bold text-[#a9682e]">set closer</span> in the correct <span className="font-bold text-[#a9682e]">set</span>.<br /><span className="text-xs text-black/70 px-6 block">If you pick Arcadia to be played as Set 1 Opener, and it opened Set 1, +3 points.&nbsp;&nbsp;If it opened any other non-encore set, no points.</span></div>
              <div><span className="text-green-700 font-semibold">+3 points</span> for correctly picking the <span className="font-bold text-[#a9682e]">final song</span> of the show, known as a show closer.<br /><span className="text-xs text-black/70 px-6 block">If you pick Arcadia to close the show, and it's played as such, +3 points, regardless if you have it closing a regular set or an encore set.</span></div>
            </div>
          </div>
          
          <hr className="border-black/10" />
          
          <div>
            <h4 className="text-base font-semibold text-black">Penalties</h4>
            <div className="space-y-1 mt-1">
              <div><span className="text-red-700 font-semibold">-3 points</span> for every <span className="font-bold text-[#a9682e]">extra song</span> you pick for a show.<br /><span className="text-xs text-black/70 px-6 block">If you pick 14 songs, and the band only plays 12, six points will be deducted.</span></div>
            </div>
          </div>
          
          <hr className="border-black/10" />
          
          <div>
            <h4 className="text-base font-semibold text-black">Guidelines</h4>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Users can select <span className="font-bold text-[#a9682e]">one setlist per show</span>, including up to <span className="font-bold text-[#a9682e]">five regular sets</span> and <span className="font-bold text-[#a9682e]">three encore sets</span>, with an infinite amount of songs per set.</li>
              <li>Submissions will close <span className="font-bold text-[#a9682e]">one hour prior to the show's local start time</span>.&nbsp;&nbsp;If the show is taking place at a festival, the cutoff time will be one hour prior to the band's set time.</li>
              <li>Scoring for shows takes place once a show's recording is available on Bandcamp, nugs.net, YouTube, or tape.&nbsp;&nbsp;This to ensure the setlist is properly entered into our database.</li>
              <li>Compared to the band's recordings on Bandcamp, and other setlist tracking sites, we track all performances of every song, regardless if the band lists them in Coach's Notes.&nbsp;&nbsp;For example, songs like <span className="font-bold text-[#a9682e]">Interlude II</span>, <span className="font-bold text-[#a9682e]">(dawn)</span>, <span className="font-bold text-[#a9682e]">Travelers I</span>, <span className="font-bold text-[#a9682e]">Welcome to Delta</span>, and others are available to be selected for your submission, and will be included in the setlist if they're played.</li>
              <li>Submissions are timestamped, so if a submission is received after the cutoff date, it will be removed.</li>
            </ul>
          </div>
          
          <div className="bg-[#f9ae37] p-3 rounded-lg border border-black mt-4">
            <p className="text-sm text-black">
              If you experience unforeseen errors, <span className="font-bold text-black underline"><a href="https://dripfield.pro/submit" className="hover:underline hover:text-black/70">submit a bug report here</a></span>.
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}