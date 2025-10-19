export interface SetlistEntryData {
  entry_id: string;
  entry_set: string | null;
  entry_setnum: number;
  entry_setorder: number;
  entry_song: string | null;
  entry_short: string | null;
  entry_segue: string | null;
  entry_length: string | null;
  entry_placement: string | null;
  entry_coachnotes: string | null;
  entry_show: string;
  entry_new: string | null;
}

export interface SetOptions {
  set: string;
}

export interface SetnumOptions {
  setnums: string;
}

export interface SegueOptions {
  segues: string;
}

export interface PlacementOptions {
  placements: string;
}

export interface SongOptions {
  song: string;
  song_id: string;
}

export interface ShortOptions {
  song_shorts: string;
}

export interface GuestOption {
  guest_id: string;
  guest: string;
  guest_displayname: string;
  guest_category: string;
  guest_instrument: string;
}

export interface GuestCategory {
  category: string;
  guests: GuestOption[];
}

export interface SetlistEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SetlistEntryData | null;
  onSave: () => void;
  onSaveStatusUpdate: (status: 'idle' | 'processing' | 'done' | 'error') => void;
  isNewEntry?: boolean;
}
