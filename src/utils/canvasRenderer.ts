import { formatInTimeZone } from 'date-fns-tz';
import { 
    SetlistEntry, 
    Show, 
    cleanSongName, 
    wrapText, 
    drawRoundedRect, 
    getPlacementColor, 
    shouldShowSetBreak, 
    getEncoreLabel 
} from './imageGeneratorUtils';

export const renderShowImage = async (
    show: Show,
    setlist: SetlistEntry[],
    logoImage: string,
    backgroundImage: string
): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Load images
    const logo = new Image();
    const background = new Image();
    logo.crossOrigin = 'anonymous';
    background.crossOrigin = 'anonymous';

    await Promise.all([
        new Promise<void>((resolve, reject) => {
            logo.onload = () => resolve();
            logo.onerror = () => reject(new Error('Failed to load logo'));
            logo.src = logoImage;
        }),
        new Promise<void>((resolve, reject) => {
            background.onload = () => resolve();
            background.onerror = () => reject(new Error('Failed to load background'));
            background.src = backgroundImage;
        })
    ]);

    // Calculate dimensions
    const canvasWidth = 800;
    const logoWidth = 500;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoY = 50;
    const padding = 50;
    const textSpacing = 80;
    const lineHeight = 60;

    canvas.width = canvasWidth;
    canvas.height = 2000; // Temporary large height

    // Draw background
    const bgAspectRatio = background.width / background.height;
    let bgWidth = canvasWidth;
    let bgHeight = bgWidth / bgAspectRatio;

    if (bgHeight < canvas.height) {
        bgHeight = canvas.height;
        bgWidth = bgHeight * bgAspectRatio;
    }

    const bgX = (canvasWidth - bgWidth) / 2;
    ctx.drawImage(background, bgX, 0, bgWidth, bgHeight);

    // Draw logo
    const logoX = (canvas.width - logoWidth) / 2;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Render show info
    const contentStartY = logoY + logoHeight + textSpacing;
    const centerX = canvasWidth / 2;
    const maxTextWidth = 700;
    let currentY = contentStartY;

    currentY = renderShowInfo(ctx, show, centerX, currentY, maxTextWidth, lineHeight);

    // Render setlist if provided
    if (setlist.length > 0) {
        currentY = renderSetlist(ctx, setlist, canvasWidth, currentY, maxTextWidth, lineHeight);
    }

    // Create final canvas with exact height
    const finalHeight = currentY + 30;
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Failed to get final canvas context');

    finalCanvas.width = canvasWidth;
    finalCanvas.height = finalHeight;

    // Draw background on final canvas
    let finalBgWidth = canvasWidth;
    let finalBgHeight = finalBgWidth / bgAspectRatio;

    if (finalBgHeight < finalHeight) {
        finalBgHeight = finalHeight;
        finalBgWidth = finalBgHeight * bgAspectRatio;
    }

    const finalBgX = (canvasWidth - finalBgWidth) / 2;
    finalCtx.drawImage(background, finalBgX, 0, finalBgWidth, finalBgHeight);

    // Copy rendered content to final canvas
    finalCtx.drawImage(canvas, 0, 0);

    // Convert to blob and return URL
    return new Promise((resolve, reject) => {
        finalCanvas.toBlob(async (blob) => {
            if (blob) {
                resolve(URL.createObjectURL(blob));
            } else {
                reject(new Error('Failed to create blob'));
            }
        }, 'image/png');
    });
};

const renderShowInfo = (
    ctx: CanvasRenderingContext2D,
    show: Show,
    centerX: number,
    currentY: number,
    maxTextWidth: number,
    lineHeight: number
): number => {
    const containerPadding = 10;
    const containerWidth = maxTextWidth + (containerPadding * 2);
    const containerX = (centerX - containerWidth / 2);
    const containerStartY = currentY - 60;

    // Calculate container height
    let estimatedHeight = 0;
    
    const dateFont = '500 48px "Rubik", "Inter", system-ui, sans-serif';
    const formattedDate = formatInTimeZone(new Date(show.show_date), 'UTC', 'MM.dd.yy');
    const dateLines = wrapText(ctx, formattedDate, maxTextWidth, dateFont);
    estimatedHeight += (dateLines.length * 60);

    const groupFont = '500 36px "Rubik", "Inter", system-ui, sans-serif';
    const groupLines = wrapText(ctx, show.show_group, maxTextWidth, groupFont);
    estimatedHeight += (groupLines.length * 60);

    const detailFont = '28px "Rubik", "Inter", system-ui, sans-serif';
    let detailLines: string[] = [];
    if (show.show_detail) {
        detailLines = wrapText(ctx, show.show_detail, maxTextWidth, detailFont);
        estimatedHeight += (detailLines.length * 60) + 5;
    }

    const subvenueFont = '500 28px "Rubik", "Inter", system-ui, sans-serif';
    const subvenueLines = wrapText(ctx, show.show_subvenue, maxTextWidth, subvenueFont);
    estimatedHeight += (subvenueLines.length * 60);

    const locationFont = '24px "Rubik", "Inter", system-ui, sans-serif';
    const locationLines = wrapText(ctx, show.show_venue_location, maxTextWidth, locationFont);
    estimatedHeight += (locationLines.length * 60);

    const containerHeight = estimatedHeight + (containerPadding * 2) - 50;
    const cornerRadius = 18;

    // Draw container
    ctx.fillStyle = 'rgb(240, 240, 240)';
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, true, false);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, false, true);

    ctx.fillStyle = '#000000';

    // Render text elements
    currentY = renderTextLines(ctx, dateLines, centerX, currentY, lineHeight, dateFont);
    currentY = renderTextLines(ctx, groupLines, centerX, currentY, lineHeight, groupFont);
    
    if (show.show_detail) {
        currentY -= 25;
        currentY = renderTextLines(ctx, detailLines, centerX, currentY, lineHeight, detailFont);
        currentY += 30;
    }
    
    currentY -= 30;
    currentY = renderTextLines(ctx, subvenueLines, centerX, currentY, lineHeight, subvenueFont);
    
    currentY -= 30;
    currentY = renderTextLines(ctx, locationLines, centerX, currentY, lineHeight, locationFont);

    return currentY;
};

const renderTextLines = (
    ctx: CanvasRenderingContext2D,
    lines: string[],
    centerX: number,
    currentY: number,
    lineHeight: number,
    font: string
): number => {
    ctx.font = font;
    ctx.textAlign = 'center';

    for (const line of lines) {
        ctx.fillText(line, centerX, currentY);
        currentY += lineHeight;
    }

    return currentY;
};

const renderSetlist = (
    ctx: CanvasRenderingContext2D,
    setlist: SetlistEntry[],
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number,
    lineHeight: number
): number => {
    currentY += 40;

    const setlistContainerPadding = 10;
    const setlistContainerWidth = maxTextWidth + (setlistContainerPadding * 2);
    const setlistContainerX = (canvasWidth - setlistContainerWidth) / 2;
    const setlistContainerStartY = currentY - 30;

    // Calculate setlist height
    let estimatedSetlistHeight = 0;
    const uniquePlacements = new Set(setlist.map(entry => entry.entry_placement));
    const hasSinglePlacementType = uniquePlacements.size === 1;
    
    let actualBreaks = 0;
    
    setlist.forEach((entry, index) => {
        const prevEntry = index > 0 ? setlist[index - 1] : null;
        
        if (!hasSinglePlacementType && prevEntry && entry.entry_set.startsWith('E')) {
            if (!prevEntry.entry_set.startsWith('E') || prevEntry.entry_set !== entry.entry_set) {
                actualBreaks++;
            }
        }
        
        if (!hasSinglePlacementType && prevEntry && 
            ['1', '2', '3', '4', '5'].includes(prevEntry.entry_set) && 
            ['1', '2', '3', '4', '5'].includes(entry.entry_set) && 
            prevEntry.entry_set !== entry.entry_set) {
            actualBreaks++;
        }
        
        if (entry.entry_coachnotes) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = entry.entry_coachnotes;
            const plainTextNotes = tempDiv.textContent || tempDiv.innerText || '';
            const noteLines = wrapText(ctx, plainTextNotes, maxTextWidth - 60, '16px "Rubik", "Inter", system-ui, sans-serif');
            estimatedSetlistHeight += 28 + (noteLines.length * 20) + 8;
        } else {
            estimatedSetlistHeight += 36;
        }
    });
    
    estimatedSetlistHeight += actualBreaks * 36;
    
    const setlistContainerHeight = estimatedSetlistHeight + (setlistContainerPadding * 2);
    const cornerRadius = 18;

    // Draw setlist container
    ctx.fillStyle = 'rgb(240, 240, 240)';
    drawRoundedRect(ctx, setlistContainerX, setlistContainerStartY, setlistContainerWidth, setlistContainerHeight, cornerRadius, true, false);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, setlistContainerX, setlistContainerStartY, setlistContainerWidth, setlistContainerHeight, cornerRadius, false, true);

    // Render setlist entries
    return renderSetlistEntries(ctx, setlist, canvasWidth, currentY, maxTextWidth, hasSinglePlacementType);
};

const renderSetlistEntries = (
    ctx: CanvasRenderingContext2D,
    setlist: SetlistEntry[],
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number,
    hasSinglePlacementType: boolean
): number => {
    const skipNumberingShorts = ["fake", "tease", "reprise", "aborted"];
    const songsWithNumbers = new Set<string>();
    let currentRunningNumber = 1;

    setlist.forEach((entry, index) => {
        const prevEntry = index > 0 ? setlist[index - 1] : null;
        
        // Add breaks and dividers
        if (!hasSinglePlacementType) {
            if (prevEntry && entry.entry_set.startsWith('E')) {
                if (!prevEntry.entry_set.startsWith('E') || prevEntry.entry_set !== entry.entry_set) {
                    currentY = renderEncoreDivider(ctx, canvasWidth, currentY, maxTextWidth, entry.entry_set);
                }
            }
            
            if (prevEntry && shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)) {
                currentY = renderSetBreak(ctx, canvasWidth, currentY, maxTextWidth);
            }
        }
        
        // Render entry and get updated running number
        const result = renderSetlistEntry(ctx, entry, canvasWidth, currentY, maxTextWidth, skipNumberingShorts, songsWithNumbers, currentRunningNumber);
        currentY = result.currentY;
        currentRunningNumber = result.currentRunningNumber;
        
        if (entry.entry_coachnotes) {
            currentY += 24;
            currentY = renderCoachNotes(ctx, entry.entry_coachnotes, canvasWidth, currentY, maxTextWidth);
            currentY += 12;
        } else {
            currentY += 36;
        }
    });

    return currentY;
};

const renderEncoreDivider = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number,
    set: string
): number => {
    ctx.fillStyle = 'rgba(142, 108, 122, 0.5)';
    drawRoundedRect(ctx, (canvasWidth - maxTextWidth) / 2, currentY - 20, maxTextWidth, 28, 6, true, false);
    
    ctx.fillStyle = '#000000';
    ctx.font = '500 20px "Rubik", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(getEncoreLabel(set), canvasWidth / 2, currentY);
    
    return currentY + 36;
};

const renderSetBreak = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number
): number => {
    ctx.fillStyle = 'rgba(127, 195, 182, 0.5)';
    drawRoundedRect(ctx, (canvasWidth - maxTextWidth) / 2, currentY - 20, maxTextWidth, 28, 6, true, false);
    
    ctx.fillStyle = '#000000';
    ctx.font = '500 20px "Rubik", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Set Break', canvasWidth / 2, currentY);
    
    return currentY + 36;
};

const renderSetlistEntry = (
    ctx: CanvasRenderingContext2D,
    entry: SetlistEntry,
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number,
    skipNumberingShorts: string[],
    songsWithNumbers: Set<string>,
    currentRunningNumber: number
): { currentY: number; currentRunningNumber: number } => {
    const shouldSkipNumbering = entry.entry_short &&
        skipNumberingShorts.includes(entry.entry_short.toLowerCase());
    const alreadyHasNumber = songsWithNumbers.has(entry.entry_song);
    const displayNumber = (!alreadyHasNumber && !shouldSkipNumbering) ?
        currentRunningNumber++ : null;

    if (displayNumber !== null) {
        songsWithNumbers.add(entry.entry_song);
    }

    // Draw number
    const numberX = (canvasWidth - maxTextWidth) / 2;
    const placementColor = getPlacementColor(entry.entry_placement);
    
    if (placementColor !== 'transparent') {
        ctx.fillStyle = placementColor;
        drawRoundedRect(ctx, numberX, currentY - 20, 44, 28, 6, true, false);
    }

    ctx.fillStyle = placementColor !== 'transparent' ? '#ffffff' : '#000000';
    ctx.font = '500 24px "Rubik", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(displayNumber?.toString() || '', numberX + 22, currentY + 2);

    // Draw song name
    ctx.fillStyle = '#000000';
    ctx.font = '500 28px "Traditional", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cleanSongName(entry.entry_song), numberX + 60, currentY + 2);

    // Draw additional elements
    const songWidth = ctx.measureText(cleanSongName(entry.entry_song)).width;
    let currentX = numberX + 63 + songWidth;

    if (entry.entry_short) {
        currentX += 6;
        ctx.fillStyle = '#dc2626';
        ctx.font = '500 16px "Rubik", "Inter", system-ui, sans-serif';
        const shortText = `[${entry.entry_short}]`;
        ctx.fillText(shortText, currentX, currentY);
        currentX += ctx.measureText(shortText).width;
    }

    if (entry.entry_segue) {
        currentX += 12;
        ctx.strokeStyle = '#dc2626';
        
        const arrowX = currentX;
        const arrowY = currentY - 6;
        const arrowSize = 16;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + arrowSize - 4, arrowY);
        ctx.moveTo(arrowX + arrowSize - 8, arrowY - 4);
        ctx.lineTo(arrowX + arrowSize - 4, arrowY);
        ctx.lineTo(arrowX + arrowSize - 8, arrowY + 4);
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    return { currentY, currentRunningNumber };
};

const renderCoachNotes = (
    ctx: CanvasRenderingContext2D,
    coachNotes: string,
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number
): number => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Rubik", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'left';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = coachNotes;
    const plainTextNotes = tempDiv.textContent || tempDiv.innerText || '';
    
    const noteLines = wrapText(ctx, plainTextNotes, maxTextWidth - 60, '16px "Rubik", "Inter", system-ui, sans-serif');
    const numberX = (canvasWidth - maxTextWidth) / 2;
    
    for (const line of noteLines) {
        ctx.fillText(line, numberX + 60, currentY + 2);
        currentY += 20;
    }
    
    return currentY;
};
