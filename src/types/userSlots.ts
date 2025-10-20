export interface SongEntryWithId {
  song: string;
  setnum: number;
  song_id?: string;
}

export interface SlotData {
  show_id: string;
  Show_Date: string;
  Set_1_Opener: SongEntryWithId[] | null;
  Set_1_Closer: SongEntryWithId[] | null;
  Set_2_Opener: SongEntryWithId[] | null;
  Set_2_Closer: SongEntryWithId[] | null;
  Set_3_Opener: SongEntryWithId[] | null;
  Set_3_Closer: SongEntryWithId[] | null;
  Set_4_Opener: SongEntryWithId[] | null;
  Set_4_Closer: SongEntryWithId[] | null;
  Set_5_Opener: SongEntryWithId[] | null;
  Set_5_Closer: SongEntryWithId[] | null;
  Encore_1: SongEntryWithId[] | null;
  Encore_2: SongEntryWithId[] | null;
  Encore_3: SongEntryWithId[] | null;
  [key: string]: string | SongEntryWithId[] | null;
}

export interface UserSlotsProps {
  userId?: string;
}
