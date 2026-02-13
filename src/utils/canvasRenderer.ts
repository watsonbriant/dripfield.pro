import { formatInTimeZone } from 'date-fns-tz';
import { 
    SetlistEntry, 
    Show, 
    wrapText, 
    drawRoundedRect, 
    getPlacementColor, 
    shouldShowSetBreak, 
    getEncoreLabel 
} from './imageGeneratorUtils';

const LINE_HEIGHT = 60;

const renderTextLinesCentered = (
    ctx: CanvasRenderingContext2D,
    lines: string[],
    centerX: number,
    currentY: number,
    font: string
): number => {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    for (const line of lines) {
        ctx.fillText(line, centerX, currentY);
        currentY += LINE_HEIGHT;
    }
    return currentY;
};

/** Rebuild: renders show image with dynamic dimensions. Step 1: tiled bg. Step 2: logo. Step 3: show info. */
export const renderShowImageRebuild = async (
    show: Show,
    _setlist: SetlistEntry[],
    backgroundTileSrc: string,
    logoSrc: string,
    width: number,
    _height: number
): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    const [tileImg, logoImg] = await Promise.all([
        new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load background tile'));
            img.src = backgroundTileSrc;
        }),
        new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load logo'));
            img.src = logoSrc;
        })
    ]);

    const maxTextWidth = Math.min(700, width - 100);
    const centerX = width / 2;
    const containerPadding = 10;
    const containerWidth = maxTextWidth + (containerPadding * 2);
    const containerX = (width - containerWidth) / 2;
    const cornerRadius = 18;

    // Measure show info container height
    const dateFont = '500 36px "Rubik", "Inter", system-ui, sans-serif';
    const groupFont = '500 28px "Rubik", "Inter", system-ui, sans-serif';
    const detailFont = '20px "Rubik", "Inter", system-ui, sans-serif';
    const subvenueFont = '500 24px "Rubik", "Inter", system-ui, sans-serif';
    const locationFont = '20px "Rubik", "Inter", system-ui, sans-serif';

    const formattedDate = formatInTimeZone(new Date(show.show_date), 'UTC', 'MM.dd.yy');
    const dateLines = wrapText(ctx, formattedDate, maxTextWidth, dateFont);
    const groupLines = wrapText(ctx, show.show_group, maxTextWidth, groupFont);
    const subvenueLines = wrapText(ctx, show.show_subvenue || '', maxTextWidth, subvenueFont);
    const locationLines = wrapText(ctx, show.show_venue_location || '', maxTextWidth, locationFont);
    const detailLines = show.show_detail ? wrapText(ctx, show.show_detail, maxTextWidth, detailFont) : [];

    let showInfoHeight = (containerPadding * 2);
    showInfoHeight += dateLines.length * LINE_HEIGHT;
    showInfoHeight += groupLines.length * LINE_HEIGHT - 20;
    showInfoHeight += subvenueLines.length * LINE_HEIGHT - 25;
    showInfoHeight += locationLines.length * LINE_HEIGHT - 33;
    if (show.show_detail) {
        showInfoHeight += detailLines.length * LINE_HEIGHT;
    }

    // Logo layout
    const logoWidth = Math.min(600, width - 100);
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    const logoPadding = 10;
    const logoY = 50;
    const logoContainerWidth = logoWidth + (logoPadding * 2);
    const logoContainerHeight = logoHeight + (logoPadding * 2);
    const logoContainerX = (width - logoContainerWidth) / 2;
    const logoContainerY = logoY - logoPadding;
    const logoX = (width - logoWidth) / 2;
    const logoBottom = logoContainerY + logoContainerHeight;

    const textSpacing = 80;
    const showInfoStartY = logoBottom + textSpacing;
    const showInfoContainerY = showInfoStartY - 50;
    const contentBottom = showInfoContainerY + showInfoHeight;

    const finalHeight = contentBottom + 30;
    canvas.width = width;
    canvas.height = finalHeight;

    const pattern = ctx.createPattern(tileImg, 'repeat');
    if (!pattern) throw new Error('Failed to create background pattern');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, finalHeight);

    // Logo container
    ctx.fillStyle = 'rgb(254, 229, 188)';
    drawRoundedRect(ctx, logoContainerX, logoContainerY, logoContainerWidth, logoContainerHeight, cornerRadius, true, false);
    ctx.strokeStyle = '#4e4e4e';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, logoContainerX, logoContainerY, logoContainerWidth, logoContainerHeight, cornerRadius, false, true);
    ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

    // Show info container
    ctx.fillStyle = 'rgb(224, 220, 195)';
    drawRoundedRect(ctx, containerX, showInfoContainerY, containerWidth, showInfoHeight, cornerRadius, true, false);
    ctx.strokeStyle = '#4e4e4e';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, containerX, showInfoContainerY, containerWidth, showInfoHeight, cornerRadius, false, true);

    let textY = showInfoContainerY + 50;
    textY = renderTextLinesCentered(ctx, dateLines, centerX, textY, dateFont);
    textY -= 20;
    textY = renderTextLinesCentered(ctx, groupLines, centerX, textY, groupFont);
    textY -= 25;
    textY = renderTextLinesCentered(ctx, subvenueLines, centerX, textY, subvenueFont);
    textY -= 33;
    textY = renderTextLinesCentered(ctx, locationLines, centerX, textY, locationFont);
    if (show.show_detail) {
        textY = renderTextLinesCentered(ctx, detailLines, centerX, textY, detailFont);
    }

    // Border around entire image (border-fourth: #4e4e4e)
    ctx.strokeStyle = '#4e4e4e';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, width - 1, finalHeight - 1);

    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            if (blob) {
                resolve(URL.createObjectURL(blob));
            } else {
                reject(new Error('Failed to create blob'));
            }
        }, 'image/png');
    });
};

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
    const logoWidth = 600;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoY = 50;
    const padding = 50;
    const textSpacing = 80;
    const lineHeight = 60;

    canvas.width = canvasWidth;
    canvas.height = 2000; // Temporary large height

    // Draw background - scaled and centered
    drawBackground(ctx, background, canvasWidth, canvas.height);

    // Draw logo container with border and rounded corners
    const logoPadding = 10;
    const logoContainerWidth = logoWidth + (logoPadding * 2);
    const logoContainerHeight = logoHeight + (logoPadding * 2);
    const logoContainerX = (canvas.width - logoContainerWidth) / 2;
    const logoContainerY = logoY - logoPadding;
    const cornerRadius = 18;

    // Draw logo container background
    ctx.fillStyle = 'rgb(254, 229, 188)';
    drawRoundedRect(ctx, logoContainerX, logoContainerY, logoContainerWidth, logoContainerHeight, cornerRadius, true, false);

    // Draw logo container border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, logoContainerX, logoContainerY, logoContainerWidth, logoContainerHeight, cornerRadius, false, true);

    // Draw logo
    const logoX = (canvas.width - logoWidth) / 2;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Render show info
    const contentStartY = logoY + logoHeight + textSpacing;
    const centerX = canvasWidth / 2;
    const maxTextWidth = 700;
    let currentY = contentStartY;

    const showInfoResult = renderShowInfo(ctx, show, centerX, currentY, maxTextWidth, lineHeight);
    currentY = showInfoResult.currentY;
    const showInfoContainerBottom = showInfoResult.containerBottom;

    // Render setlist if provided
    let setlistContainerBottom = showInfoContainerBottom;
    if (setlist.length > 0) {
        // Calculate spacing to match logo-to-show-info gap (10px)
        const containerGap = 10;
        const setlistStartY = showInfoContainerBottom + containerGap;
        currentY = renderSetlist(ctx, setlist, canvasWidth, setlistStartY, maxTextWidth, lineHeight);
        // Calculate setlist container bottom for spacing
        setlistContainerBottom = currentY;
    }

    // Render show coachnotes container if provided
    if (show.show_coachnotes) {
        const containerGap = 10;
        const coachnotesStartY = setlistContainerBottom + containerGap;
        currentY = renderShowCoachnotes(ctx, show, canvasWidth, coachnotesStartY, maxTextWidth, lineHeight);
        setlistContainerBottom = currentY;
    }

    // Render show callbacks container if provided
    if (show.show_callbacks) {
        const containerGap = 10;
        const callbacksStartY = setlistContainerBottom + containerGap;
        currentY = renderShowCallbacks(ctx, show, canvasWidth, callbacksStartY, maxTextWidth, lineHeight);
    }

    // Create final canvas with exact height
    const finalHeight = currentY + 30;
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) throw new Error('Failed to get final canvas context');

    finalCanvas.width = canvasWidth;
    finalCanvas.height = finalHeight;

    // Draw background on final canvas - scaled and centered
    drawBackground(finalCtx, background, canvasWidth, finalHeight);

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

// Helper function to draw background image scaled and centered
const drawBackground = (
    ctx: CanvasRenderingContext2D,
    background: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
) => {
    const bgAspectRatio = background.width / background.height;
    
    let bgWidth: number;
    let bgHeight: number;
    let bgX: number;
    let bgY: number;
    
    // If canvas is taller than wide, scale to 100% height and center horizontally
    if (canvasHeight > canvasWidth) {
        bgHeight = canvasHeight;
        bgWidth = bgHeight * bgAspectRatio;
        bgX = (canvasWidth - bgWidth) / 2;
        bgY = 0;
    } else {
        // If canvas is wider than tall, scale to 100% width and center vertically
        bgWidth = canvasWidth;
        bgHeight = bgWidth / bgAspectRatio;
        bgX = 0;
        bgY = (canvasHeight - bgHeight) / 2;
    }
    
    ctx.drawImage(background, bgX, bgY, bgWidth, bgHeight);
};

const renderShowInfo = (
    ctx: CanvasRenderingContext2D,
    show: Show,
    centerX: number,
    currentY: number,
    maxTextWidth: number,
    lineHeight: number
): { currentY: number; containerBottom: number } => {
    const containerPadding = 10;
    const containerWidth = maxTextWidth + (containerPadding * 2);
    const containerX = (centerX - containerWidth / 2);
    const containerStartY = currentY - 50;

    // Calculate container height based on actual spacing adjustments
    let estimatedHeight = 0;
    
    const dateFont = '500 36px "Rubik", "Inter", system-ui, sans-serif';
    const formattedDate = formatInTimeZone(new Date(show.show_date), 'UTC', 'MM.dd.yy');
    const dateLines = wrapText(ctx, formattedDate, maxTextWidth, dateFont);
    estimatedHeight += (dateLines.length * 60);

    const groupFont = '500 28px "Rubik", "Inter", system-ui, sans-serif';
    const groupLines = wrapText(ctx, show.show_group, maxTextWidth, groupFont);
    estimatedHeight += (groupLines.length * 60);
    // Date to Group spacing adjustment: -20
    estimatedHeight -= 20;

    const detailFont = '20px "Rubik", "Inter", system-ui, sans-serif';
    let detailLines: string[] = [];
    if (show.show_detail) {
        detailLines = wrapText(ctx, show.show_detail, maxTextWidth, detailFont);
        // Group to Detail spacing: -30 before, +30 after (net 0), Detail to Subvenue: -40
        estimatedHeight += (detailLines.length * 60);
        estimatedHeight -= 40; // before subvenue (net effect: -30 before detail + +30 after detail - 40 before subvenue = -40)
    } else {
        // Group to Subvenue spacing adjustment: -25
        estimatedHeight -= 25;
    }

    const subvenueFont = '500 24px "Rubik", "Inter", system-ui, sans-serif';
    const subvenueLines = wrapText(ctx, show.show_subvenue, maxTextWidth, subvenueFont);
    estimatedHeight += (subvenueLines.length * 60);
    // Subvenue to Location spacing adjustment: -33
    estimatedHeight -= 33;

    const locationFont = '20px "Rubik", "Inter", system-ui, sans-serif';
    const locationLines = wrapText(ctx, show.show_venue_location, maxTextWidth, locationFont);
    estimatedHeight += (locationLines.length * 60);

    const containerHeight = estimatedHeight + (containerPadding * 2);
    const cornerRadius = 18;

    // Draw container
    ctx.fillStyle = 'rgb(224, 220, 195)';
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, true, false);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, false, true);

    ctx.fillStyle = '#000000';

    // Render text elements
    currentY = renderTextLines(ctx, dateLines, centerX, currentY, lineHeight, dateFont);
    currentY -= 20;
    currentY = renderTextLines(ctx, groupLines, centerX, currentY, lineHeight, groupFont);
    
    if (show.show_detail) {
        currentY -= 30;
        currentY = renderTextLines(ctx, detailLines, centerX, currentY, lineHeight, detailFont);
        currentY += 30;
        currentY -= 40;
    } else {
        currentY -= 25;
    }
    currentY = renderTextLines(ctx, subvenueLines, centerX, currentY, lineHeight, subvenueFont);
    
    currentY -= 33;
    currentY = renderTextLines(ctx, locationLines, centerX, currentY, lineHeight, locationFont);

    const containerBottom = containerStartY + containerHeight;
    return { currentY, containerBottom };
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

    const setlistContainerPadding = 10;
    const setlistContainerWidth = maxTextWidth + (setlistContainerPadding * 2);
    const setlistContainerX = (canvasWidth - setlistContainerWidth) / 2;
    const setlistContainerStartY = currentY;

    // Calculate setlist height
    // Start with the initial offset that's added to content start position
    let estimatedSetlistHeight = 20;
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
            const noteLines = wrapText(ctx, plainTextNotes, maxTextWidth - 60, '18px "Rubik", "Inter", system-ui, sans-serif');
            // Match actual rendering: 21 + (noteLines.length * 20) + 12
            estimatedSetlistHeight += 21 + (noteLines.length * 20) + 11;
        } else {
            estimatedSetlistHeight += 32;
        }
    });
    
    // Match actual rendering: breaks return currentY + 36, which adds 36 pixels
    estimatedSetlistHeight += actualBreaks * 27;
    
    const setlistContainerHeight = estimatedSetlistHeight + (setlistContainerPadding * 2);
    const cornerRadius = 18;

    // Draw setlist container
    ctx.fillStyle = 'rgb(254, 229, 188)';
    drawRoundedRect(ctx, setlistContainerX, setlistContainerStartY, setlistContainerWidth, setlistContainerHeight, cornerRadius, true, false);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, setlistContainerX, setlistContainerStartY, setlistContainerWidth, setlistContainerHeight, cornerRadius, false, true);

    // Render setlist entries - adjust currentY to account for container padding
    const setlistContentStartY = setlistContainerStartY + setlistContainerPadding + 20;
    return renderSetlistEntries(ctx, setlist, canvasWidth, setlistContentStartY, maxTextWidth, hasSinglePlacementType);
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
            currentY += 21;
            currentY = renderCoachNotes(ctx, entry.entry_coachnotes, canvasWidth, currentY, maxTextWidth);
            currentY += 11;
        } else {
            currentY += 33;
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
    ctx.font = '500 22px "Rubik", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(displayNumber?.toString() || '', numberX + 22, currentY + 1);

    // Draw song name
    ctx.fillStyle = '#000000';
    ctx.font = '500 24px "Rubik", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(entry.entry_song, numberX + 60, currentY + 2);

    // Draw additional elements
    const songWidth = ctx.measureText(entry.entry_song).width;
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
        
        currentX += arrowSize;
    }

    // Draw TD, LIB, or Debut indicators if present
    if (entry.last_count) {
        let indicatorText = '';
        let indicatorColor = '';
        
        if (entry.last_count.includes('TD')) {
            indicatorText = 'TD';
            indicatorColor = '#059669'; // emerald-600
        } else if (entry.last_count.includes('LIB')) {
            indicatorText = 'LIB';
            indicatorColor = '#ca8a04'; // yellow-600
        } else if (entry.last_count.includes('Debut')) {
            indicatorText = 'Debut';
            indicatorColor = '#e11d48'; // rose-600
        }
        
        if (indicatorText && indicatorColor) {
            currentX += 20;
            ctx.font = '500 18px "Rubik", "Inter", system-ui, sans-serif';
            const textMetrics = ctx.measureText(indicatorText);
            const badgePadding = 4;
            const badgeWidth = textMetrics.width + (badgePadding * 2);
            const badgeHeight = 24;
            const badgeX = currentX;
            const badgeY = currentY - 8 - badgeHeight / 2;
            
            // Draw badge background
            ctx.fillStyle = indicatorColor;
            drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 4, true, false);
            
            // Draw badge text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(indicatorText, badgeX + badgePadding, currentY - 2);
            
            currentX += badgeWidth;
        }
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = '18px "Rubik", "Inter", system-ui, sans-serif';
    ctx.textAlign = 'left';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = coachNotes;
    const plainTextNotes = tempDiv.textContent || tempDiv.innerText || '';
    
    const noteLines = wrapText(ctx, plainTextNotes, maxTextWidth - 60, '18px "Rubik", "Inter", system-ui, sans-serif');
    const numberX = (canvasWidth - maxTextWidth) / 2;
    
    for (const line of noteLines) {
        ctx.fillText(line, numberX + 60, currentY + 2);
        currentY += 20;
    }
    
    return currentY;
};

// Helper function to render HTML content on canvas with styling support
const renderHTMLContent = (
    ctx: CanvasRenderingContext2D,
    html: string,
    startX: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
    baseFont: string,
    baseColor: string,
    linkColor?: string
): number => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let currentX = startX;
    let currentY = startY;
    let currentColor = baseColor;
    let isBold = false;
    let isItalic = false;
    let isInLink = false; // Track if we're inside an <a> tag
    let isStartOfLine = true; // Track if we're at the start of a line
    
    // Parse base font to extract size
    const fontMatch = baseFont.match(/(\d+)px/);
    const fontSize = fontMatch ? fontMatch[1] : '16';
    
    const buildFontString = (): string => {
        let weight = 'normal';
        let style = 'normal';
        
        // Links should be semibold (600 weight)
        if (isBold && isItalic) {
            weight = 'bold';
            style = 'italic';
        } else if (isBold) {
            weight = 'bold';
        } else if (isInLink && isItalic) {
            weight = '600'; // semibold
            style = 'italic';
        } else if (isInLink) {
            weight = '600'; // semibold
        } else if (isItalic) {
            style = 'italic';
        }
        
        return `${style} ${weight} ${fontSize}px "Rubik", "Inter", system-ui, sans-serif`;
    };
    
    const walkNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            const trimmedText = text.trim();
            if (trimmedText) {
                ctx.font = buildFontString();
                ctx.fillStyle = currentColor;
                
                // Handle text wrapping - filter out empty strings from split
                const words = trimmedText.split(/\s+/).filter(word => word.length > 0);
                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    // Only add space if not at start of line and not the last word
                    const testText = (isStartOfLine ? '' : ' ') + word;
                    const metrics = ctx.measureText(testText);
                    
                    if (currentX + metrics.width > startX + maxWidth && currentX > startX) {
                        currentX = startX;
                        currentY += lineHeight;
                        isStartOfLine = true;
                        // Re-measure without leading space since we're on a new line
                        const newMetrics = ctx.measureText(word);
                        ctx.fillText(word, currentX, currentY);
                        currentX += newMetrics.width;
                        isStartOfLine = false;
                    } else {
                        ctx.fillText(testText, currentX, currentY);
                        currentX += metrics.width;
                        isStartOfLine = false;
                    }
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            
            // Save current state
            const prevBold = isBold;
            const prevItalic = isItalic;
            const prevColor = currentColor;
            const prevInLink = isInLink;
            
            // Apply tag styling
            if (tagName === 'br') {
                // Handle line break - don't process children
                currentX = startX;
                currentY += lineHeight;
                isStartOfLine = true; // Mark that we're at the start of a new line
                return; // Don't process children for br tags
            } else if (tagName === 'b' || tagName === 'strong') {
                isBold = true;
            } else if (tagName === 'i' || tagName === 'em') {
                isItalic = true;
            } else if (tagName === 'a') {
                isInLink = true;
                if (linkColor) {
                    currentColor = linkColor;
                }
            }
            
            // Process child nodes (skip for br tags)
            Array.from(element.childNodes).forEach(child => walkNodes(child));
            
            // Restore previous state
            isBold = prevBold;
            isItalic = prevItalic;
            currentColor = prevColor;
            isInLink = prevInLink;
        }
    };
    
    Array.from(tempDiv.childNodes).forEach(child => walkNodes(child));
    
    return currentY + lineHeight;
};

// Helper function to estimate height of HTML content including <br /> tags
const estimateHTMLHeight = (
    html: string,
    maxWidth: number,
    font: string,
    lineHeight: number
): number => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return 0;
    
    tempCtx.font = font;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let lineCount = 0;
    let currentLineWidth = 0;
    
    const countLines = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (text.trim()) {
                const words = text.split(' ');
                for (const word of words) {
                    const testText = word + ' ';
                    const metrics = tempCtx.measureText(testText);
                    
                    if (currentLineWidth + metrics.width > maxWidth && currentLineWidth > 0) {
                        lineCount++;
                        currentLineWidth = metrics.width;
                    } else {
                        currentLineWidth += metrics.width;
                    }
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            
            if (tagName === 'br') {
                lineCount++;
                currentLineWidth = 0;
            } else {
                Array.from(element.childNodes).forEach(child => countLines(child));
            }
        }
    };
    
    Array.from(tempDiv.childNodes).forEach(child => countLines(child));
    
    // Add one more line if there's content on the current line
    if (currentLineWidth > 0) {
        lineCount++;
    }
    
    return lineCount * lineHeight;
};

const renderShowCoachnotes = (
    ctx: CanvasRenderingContext2D,
    show: Show,
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number,
    lineHeight: number
): number => {
    const containerPadding = 10;
    const containerWidth = maxTextWidth + (containerPadding * 2);
    const containerX = (canvasWidth - containerWidth) / 2;
    const containerStartY = currentY;

    const notesFont = '20px "Rubik", "Inter", system-ui, sans-serif';
    const lineHeightValue = 20;
    
    // Estimate height including <br /> tags
    const contentHeight = estimateHTMLHeight(
        show.show_coachnotes || '',
        maxTextWidth,
        notesFont,
        lineHeightValue
    );
    const estimatedHeight = contentHeight + (containerPadding * 2);
    
    const containerHeight = estimatedHeight;
    const cornerRadius = 18;

    // Draw container background (same as show info)
    ctx.fillStyle = 'rgb(224, 220, 195)';
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, true, false);

    // Draw container border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, false, true);

    // Render HTML content
    const contentStartX = containerX + containerPadding;
    const contentStartY = containerStartY + containerPadding + 16;
    renderHTMLContent(
        ctx,
        show.show_coachnotes || '',
        contentStartX,
        contentStartY,
        maxTextWidth,
        lineHeightValue,
        notesFont,
        '#000000'
    );

    return containerStartY + containerHeight;
};

const renderShowCallbacks = (
    ctx: CanvasRenderingContext2D,
    show: Show,
    canvasWidth: number,
    currentY: number,
    maxTextWidth: number,
    lineHeight: number
): number => {
    const containerPadding = 10;
    const containerWidth = maxTextWidth + (containerPadding * 2);
    const containerX = (canvasWidth - containerWidth) / 2;
    const containerStartY = currentY;

    const callbacksFont = '20px "Rubik", "Inter", system-ui, sans-serif';
    const lineHeightValue = 20;
    
    // Estimate height including <br /> tags
    const contentHeight = estimateHTMLHeight(
        show.show_callbacks || '',
        maxTextWidth,
        callbacksFont,
        lineHeightValue
    );
    const estimatedHeight = contentHeight + (containerPadding * 2);
    
    const containerHeight = estimatedHeight;
    const cornerRadius = 18;

    // Draw container background (dark purple like Callbacks component)
    ctx.fillStyle = '#3c1e40'; // bg-fourth
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, true, false);

    // Draw container border
    ctx.strokeStyle = '#4e4e4e'; // border-fourth
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, containerX, containerStartY, containerWidth, containerHeight, cornerRadius, false, true);

    // Render HTML content with link color (emerald-400 like Callbacks component)
    const contentStartX = containerX + containerPadding;
    const contentStartY = containerStartY + containerPadding + 14;
    renderHTMLContent(
        ctx,
        show.show_callbacks || '',
        contentStartX,
        contentStartY,
        maxTextWidth,
        lineHeightValue,
        callbacksFont,
        '#ffffff',
        '#34d399' // emerald-400 for links
    );

    return containerStartY + containerHeight;
};
