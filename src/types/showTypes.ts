export interface ShowData {
    show_id: string;
    show_date: string;
    show_canonid: number | null;
    show_group: string;
    show_tour: string;
    show_subvenue: string;
    show_subvenue_venue: string | null;
    show_venue_location: string | null;
    show_iscanon: boolean;
    show_year: string;
    show_issetlistgame: boolean;
    show_detail: string | null;
    show_alert: string | null;
    show_coachnotes: string | null;
    show_time: string | null;
    show_callbacks: string | null;
    show_wl_link: string | null;
}

export interface GroupData {
    group: string;
}

export interface TourData {
    tour: string;
    tour_canonid: number;
}

export interface SubvenueData {
    subvenue: string;
    subvenue_venue_location: string | null;
}

export interface YearData {
    year: string;
}

export interface SongData {
    song: string;
    song_id: string;
}

export interface ReleaseShow {
    release_id: string;
    release_order: number;
    releases: {
        release_displayname: string;
        release_service: string | null;
    };
}
