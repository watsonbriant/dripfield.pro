export interface ShowChange {
    show_change_uuid: string;
    show_id: string;
    change_type: string;
    change_order: number;
    change: string;
}

export interface SetlistEntry {
    entry_id: string;
    entry_song: string;
    entry_short: string | null;
    entry_segue: string | null;
    entry_placement: string;
    entry_setorder: number;
    entry_set: string;
    entry_setnum: number;
    songs: {
        song_id: string;
    };
}

export interface ShowData {
    show_date: string;
    show_subvenue: string;
    show_venue_location: string;
    show_group: string;
}

export interface ShowChangesProps {
    showId: string;
    className?: string;
    openModal?: boolean;
    setOpenModal?: (open: boolean) => void;
}
