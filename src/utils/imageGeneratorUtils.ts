import { formatInTimeZone } from 'date-fns-tz';

export interface SetlistEntry {
    entry_id: string;
    entry_song: string;
    entry_short: string | null;
    entry_segue: string | null;
    entry_set: string;
    entry_placement: string;
    entry_coachnotes?: string | null;
}

export interface Show {
    show_id: string;
    show_date: string;
    show_group: string;
    show_detail: string | null;
    show_subvenue: string;
    show_venue_location: string;
    show_alert: string | null;
    show_canonid: number | null;
    show_tour: string | null;
    tour_id?: string;
    show_wl_link?: string | null;
}

export const cleanSongName = (songName: string): string => {
    return songName
        .replace(/\[/g, '(')
        .replace(/\]/g, ')')
        .replace(/ñ/g, 'n')
        .replace(/ü/g, 'u')
        .replace(/–/g, '-')
        .replace(/…/g, '...')
        .replace(/∆/g, 'a');
};

export const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] => {
    ctx.font = font;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
};

export const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill = true,
    stroke = false
) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
};

export const getPlacementColor = (placement: string): string => {
    const colorMap: { [key: string]: string } = {
        'Set 1 Opener': '#047857',
        'Set 1 Closer': '#1e40af',
        'Set 2 Opener': '#10b981',
        'Set 3 Opener': '#10b981',
        'Set 4 Opener': '#10b981',
        'Set 5 Opener': '#10b981',
        'Set 2 Closer': '#3b82f6',
        'Set 3 Closer': '#3b82f6',
        'Set 4 Closer': '#3b82f6',
        'Set 5 Closer': '#3b82f6',
        'Encore 1': '#be123c',
        'Encore 2': '#f43f5e',
        'Encore 3': '#f43f5e'
    };
    
    if (placement.startsWith('Main Set')) {
        return 'transparent';
    }
    
    return colorMap[placement] || '#0c1d27';
};

export const isMainSet = (set: string): boolean => {
    return ['1', '2', '3', '4', '5'].includes(set);
};

export const shouldShowSetBreak = (currentSet: string, nextSet: string): boolean => {
    return isMainSet(currentSet) && isMainSet(nextSet) && currentSet !== nextSet;
};

export const getEncoreLabel = (set: string): string => {
    switch (set) {
        case 'E1': return 'Encore';
        case 'E2': return '2nd Encore';
        case 'E3': return '3rd Encore';
        default: return '';
    }
};

export const formatShowDate = (showDate: string): string => {
    return formatInTimeZone(new Date(showDate), 'UTC', 'MM.dd.yy');
};
