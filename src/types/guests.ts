export type Guest = {
  guest_id: string;
  guest: string;
  guest_category: string;
  song_count: number;
  show_count: number;
};

export type GuestsByCategory = {
  [category: string]: {
    guests: Guest[];
    count: number;
  };
};
