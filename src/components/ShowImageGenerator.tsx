import React, { useState } from 'react';
import { Share, X, Copy, ArrowDownToLine } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import logoImage from '../img/Logo2_Text.png';
import backgroundImage from '../img/bg3.jpg';

interface SetlistEntry {
    entry_id: string;
    entry_song: string;
    entry_short: string | null;
    entry_segue: string | null;
    entry_set: string;
    entry_placement: string;
    entry_coachnotes?: string | null;
}

interface ShowImageGeneratorProps {
    show: {
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
    };
    setlist?: SetlistEntry[];
    className?: string;
}

const cleanSongName = (songName: string): string => {
    return songName
        .replace(/\[/g, '(')
        .replace(/\]/g, ')')
        .replace(/ñ/g, 'n')
        .replace(/ü/g, 'u')
        .replace(/–/g, '-')
        .replace(/…/g, '...')
        .replace(/∆/g, 'a');
};

const ShowImageGenerator: React.FC<ShowImageGeneratorProps> = ({
    show,
    setlist = [],
    className = ""
}) => {
    const [imageCopied, setImageCopied] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    const handleGenerateImage = async () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to get canvas context');

            // Load logo and background first to calculate dimensions
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

            // Set initial canvas size (we'll resize after rendering)
            const padding = 50;
            const textSpacing = 80;
            const lineHeight = 60;

            // Start with a large canvas that we know will fit everything
            canvas.width = canvasWidth;
            canvas.height = 2000; // Temporary large height

            // Draw background image (centered and scaled to cover full width, minimum)
            const bgAspectRatio = background.width / background.height;
            let bgWidth = canvasWidth;
            let bgHeight = bgWidth / bgAspectRatio;

            if (bgHeight < canvas.height) {
                bgHeight = canvas.height;
                bgWidth = bgHeight * bgAspectRatio;
            }

            const bgX = (canvasWidth - bgWidth) / 2;
            const bgY = 0;

            ctx.drawImage(background, bgX, bgY, bgWidth, bgHeight);

            // Draw logo (full width)
            const logoX = (canvas.width - logoWidth) / 2;
            ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

            // Helper function to wrap text
            const wrapText = (text: string, maxWidth: number, font: string): string[] => {
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

            // Calculate text positions - single centered column
            const contentStartY = logoY + logoHeight + textSpacing;
            const centerX = canvasWidth / 2;
            const maxTextWidth = 700;
            let currentY = contentStartY;

            // Calculate container dimensions for top 5 elements
            const containerPadding = 10;
            const containerWidth = maxTextWidth + (containerPadding * 2);
            const containerX = (canvasWidth - containerWidth) / 2;
            const containerStartY = currentY - 60;

            // Estimate container height by calculating all text heights
            let estimatedHeight = 0;
            const tempY = currentY;

            // Date height estimation
            const dateFont = '500 48px "Rubik", "Inter", system-ui, sans-serif';
            const formattedDate = formatInTimeZone(new Date(show.show_date), 'UTC', 'MM.dd.yy');
            const dateLines = wrapText(formattedDate, maxTextWidth, dateFont);
            estimatedHeight += (dateLines.length * 60) + 0;

            // Group height estimation  
            const groupFont = '500 36px "Rubik", "Inter", system-ui, sans-serif';
            const groupLines = wrapText(show.show_group, maxTextWidth, groupFont);
            estimatedHeight += (groupLines.length * 60) + 0;

            // Detail height estimation
            const detailFont = '28px "Rubik", "Inter", system-ui, sans-serif';
            let detailLines: string[] = [];
            if (show.show_detail) {
                detailLines = wrapText(show.show_detail, maxTextWidth, detailFont);
                estimatedHeight += (detailLines.length * 60) + 5;
            }

            // Subvenue height estimation
            const subvenueFont = '500 28px "Rubik", "Inter", system-ui, sans-serif';
            const subvenueLines = wrapText(show.show_subvenue, maxTextWidth, subvenueFont);
            estimatedHeight += (subvenueLines.length * 60) + 0;

            // Location height estimation
            const locationFont = '24px "Rubik", "Inter", system-ui, sans-serif';
            const locationLines = wrapText(show.show_venue_location, maxTextWidth, locationFont);
            estimatedHeight += (locationLines.length * 60) + 0;

            const containerHeight = estimatedHeight + (containerPadding * 2) - 50;

            // Draw container background with rounded corners and border
            const cornerRadius = 18; // Adjust this value to change corner roundness

            // Helper function to draw rounded rectangle
            const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, fill = true, stroke = false) => {
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

            // Draw container background
            ctx.fillStyle = 'rgb(240, 240, 240)';
            drawRoundedRect(containerX, containerStartY, containerWidth, containerHeight, cornerRadius, true, false);

            // Draw container border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            drawRoundedRect(containerX, containerStartY, containerWidth, containerHeight, cornerRadius, false, true);

            // Reset fill style for text
            ctx.fillStyle = '#000000';

            // Show Date
            currentY -= 0;
            ctx.font = dateFont;
            ctx.textAlign = 'center';

            for (const line of dateLines) {
                ctx.fillText(line, centerX, currentY);
                currentY += lineHeight;
            }
            currentY += 0;

            // Show Group
            ctx.font = groupFont;
            ctx.textAlign = 'center';

            for (const line of groupLines) {
                ctx.fillText(line, centerX, currentY);
                currentY += lineHeight;
            }
            currentY += 0;

            // Show Detail (if exists)
                if (show.show_detail) {
                    currentY -= 25;
                    ctx.font = detailFont;
                    ctx.textAlign = 'center';

                for (const line of detailLines) {
                    ctx.fillText(line, centerX, currentY);
                    currentY += lineHeight;
                }
                currentY += 30;
            }

            // Show Subvenue
            currentY -= 30;
            ctx.font = subvenueFont;
            ctx.textAlign = 'center';

            for (const line of subvenueLines) {
                ctx.fillText(line, centerX, currentY);
                currentY += lineHeight;
            }
            currentY += 0;

            // Venue Location
            currentY -= 30;
            ctx.font = locationFont;
            ctx.textAlign = 'center';

            for (const line of locationLines) {
                ctx.fillText(line, centerX, currentY);
                currentY += lineHeight;
            }
            currentY += 0;

            // Add extra padding after container
            currentY += 0;

            // Add setlist if provided
            if (setlist.length > 0) {
                currentY += 40;

                // Calculate setlist container dimensions
                const setlistContainerPadding = 10;
                const setlistContainerWidth = maxTextWidth + (setlistContainerPadding * 2);
                const setlistContainerX = (canvasWidth - setlistContainerWidth) / 2;
                const setlistContainerStartY = currentY - 30;

                // More accurate setlist height calculation
                let estimatedSetlistHeight = 0;
                const uniquePlacements = new Set(setlist.map(entry => entry.entry_placement));
                const hasSinglePlacementType = uniquePlacements.size === 1;
                
                // Count actual breaks that will be rendered
                let actualBreaks = 0;
                
                setlist.forEach((entry, index) => {
                    const prevEntry = index > 0 ? setlist[index - 1] : null;
                    
                    // Count encore dividers
                    if (!hasSinglePlacementType && prevEntry && entry.entry_set.startsWith('E')) {
                        if (!prevEntry.entry_set.startsWith('E') || prevEntry.entry_set !== entry.entry_set) {
                            actualBreaks++;
                        }
                    }
                    
                    // Count set breaks
                    if (!hasSinglePlacementType && prevEntry && 
                        ['1', '2', '3', '4', '5'].includes(prevEntry.entry_set) && 
                        ['1', '2', '3', '4', '5'].includes(entry.entry_set) && 
                        prevEntry.entry_set !== entry.entry_set) {
                        actualBreaks++;
                    }
                    
                    // Add height for this entry
                    if (entry.entry_coachnotes) {
                        // Entry with coach notes: base height + coach notes height
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = entry.entry_coachnotes;
                        const plainTextNotes = tempDiv.textContent || tempDiv.innerText || '';
                        const noteLines = wrapText(plainTextNotes, maxTextWidth - 60, '16px "Rubik", "Inter", system-ui, sans-serif');
                        estimatedSetlistHeight += 28 + (noteLines.length * 20) + 8; // offset + note lines + spacing
                    } else {
                        // Regular entry
                        estimatedSetlistHeight += 36;
                    }
                });
                
                // Add height for breaks
                estimatedSetlistHeight += actualBreaks * 36;
                
                const setlistContainerHeight = estimatedSetlistHeight + (setlistContainerPadding * 2);

                // Draw setlist container background
                ctx.fillStyle = 'rgb(240, 240, 240)';
                drawRoundedRect(setlistContainerX, setlistContainerStartY, setlistContainerWidth, setlistContainerHeight, cornerRadius, true, false);

                // Draw setlist container border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                drawRoundedRect(setlistContainerX, setlistContainerStartY, setlistContainerWidth, setlistContainerHeight, cornerRadius, false, true);

                // Helper function to get placement color (matching FullSetlistDisplay)
                const getPlacementColor = (placement: string): string => {
                    const colorMap: { [key: string]: string } = {
                        'Set 1 Opener': '#006400',
                        'Set 1 Closer': '#995905',
                        'Set 2 Opener': '#019B7A',
                        'Set 3 Opener': '#019B7A',
                        'Set 4 Opener': '#019B7A',
                        'Set 5 Opener': '#019B7A',
                        'Set 2 Closer': '#E17401',
                        'Set 3 Closer': '#E17401',
                        'Set 4 Closer': '#E17401',
                        'Set 5 Closer': '#E17401',
                        'Encore 1': '#7C2128',
                        'Encore 2': '#CE1126',
                        'Encore 3': '#AF1E2D'
                    };
                    
                    if (placement.startsWith('Main Set')) {
                        return 'transparent';
                    }
                    
                    return colorMap[placement] || '#0c1d27';
                };

                // Process setlist the same way as FullSetlistDisplay
                const skipNumberingShorts = ["fake", "tease", "reprise", "aborted"];
                const songsWithNumbers = new Set<string>();
                let currentRunningNumber = 1;

                // Helper functions for set breaks and encore labels
                const isMainSet = (set: string): boolean => {
                    return ['1', '2', '3', '4', '5'].includes(set);
                };

                const shouldShowSetBreak = (currentSet: string, nextSet: string): boolean => {
                    return isMainSet(currentSet) && isMainSet(nextSet) && currentSet !== nextSet;
                };

                const getEncoreLabel = (set: string): string => {
                    switch (set) {
                        case 'E1': return 'Encore';
                        case 'E2': return '2nd Encore';
                        case 'E3': return '3rd Encore';
                        default: return '';
                    }
                };

                setlist.forEach((entry, index) => {
                const prevEntry = index > 0 ? setlist[index - 1] : null;
                
                // Only show set breaks and encore dividers if we have multiple placement types
                if (!hasSinglePlacementType) {
                    // Add encore divider if needed
                    if (prevEntry && entry.entry_set.startsWith('E')) {
                        // Only show encore divider when transitioning from non-encore or different encore
                        if (!prevEntry.entry_set.startsWith('E') || prevEntry.entry_set !== entry.entry_set) {
                            // Draw encore label
                            ctx.fillStyle = 'rgba(142, 108, 122, 0.5)';
                            drawRoundedRect((canvasWidth - maxTextWidth) / 2, currentY - 20, maxTextWidth, 28, 6, true, false);
                            
                            ctx.fillStyle = '#000000';
                            ctx.font = '500 20px "Rubik", "Inter", system-ui, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.fillText(getEncoreLabel(entry.entry_set), canvasWidth / 2, currentY);
                            currentY += 36;
                        }
                    }
                    
                    // Add set break if needed
                    if (prevEntry && shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)) {
                        // Draw set break
                        ctx.fillStyle = 'rgba(127, 195, 182, 0.5)';
                        drawRoundedRect((canvasWidth - maxTextWidth) / 2, currentY - 20, maxTextWidth, 28, 6, true, false);
                        
                        ctx.fillStyle = '#000000';
                        ctx.font = '500 20px "Rubik", "Inter", system-ui, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText('Set Break', canvasWidth / 2, currentY);
                        currentY += 36;
                    }
                }
                
                // Same numbering logic as FullSetlistDisplay
                const shouldSkipNumbering = entry.entry_short &&
                    skipNumberingShorts.includes(entry.entry_short.toLowerCase());
                const alreadyHasNumber = songsWithNumbers.has(entry.entry_song);
                const displayNumber = (!alreadyHasNumber && !shouldSkipNumbering) ?
                    currentRunningNumber++ : null;

                if (displayNumber !== null) {
                    songsWithNumbers.add(entry.entry_song);
                }

                // Draw number with background color (matching FullSetlistDisplay styling)
                const numberX = (canvasWidth - maxTextWidth) / 2;
                const placementColor = getPlacementColor(entry.entry_placement);
                
                // Draw number background if not transparent
                if (placementColor !== 'transparent') {
                    ctx.fillStyle = placementColor;
                    const numberWidth = 44;
                    const numberHeight = 28;
                    drawRoundedRect(numberX, currentY - 20, numberWidth, numberHeight, 6, true, false);
                }

                // Draw number text
                ctx.fillStyle = placementColor !== 'transparent' ? '#ffffff' : '#000000';
                ctx.font = '500 24px "Rubik", "Inter", system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    displayNumber?.toString() || '', 
                    numberX + 22, 
                    currentY + 2
                );

                // Draw song name (bold, black)
                ctx.fillStyle = '#000000';
                ctx.font = '500 28px "Traditional", "Inter", system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(cleanSongName(entry.entry_song), numberX + 60, currentY + 2);

                // Measure song name width to position additional elements
                const songWidth = ctx.measureText(cleanSongName(entry.entry_song)).width;
                let currentX = numberX + 63 + songWidth;

                // Draw entry_short in red if present
                if (entry.entry_short) {
                    currentX += 6; // Add padding before short
                    ctx.fillStyle = '#dc2626'; // red-600 equivalent
                    ctx.font = '500 16px "Rubik", "Inter", system-ui, sans-serif';
                    const shortText = `[${entry.entry_short}]`; // Removed leading space since we're adding padding
                    ctx.fillText(shortText, currentX, currentY);
                    currentX += ctx.measureText(shortText).width;
                }

                // Draw segue arrow in red if present
                if (entry.entry_segue) {
                    currentX += 12; // Add padding before arrow (increased from 8)
                    ctx.strokeStyle = '#dc2626'; // red-600 equivalent - same as entry_short
                    
                    // Draw right arrow icon (similar to MoveRight lucide icon)
                    const arrowX = currentX;
                    const arrowY = currentY - 6; // Center vertically with text
                    const arrowSize = 16; // Size of the arrow
                    
                    ctx.beginPath();
                    // Arrow shaft (horizontal line) - extends to meet the arrowhead
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX + arrowSize - 4, arrowY);
                    
                    // Arrow head (triangle) - connected to the shaft
                    ctx.moveTo(arrowX + arrowSize - 8, arrowY - 4);
                    ctx.lineTo(arrowX + arrowSize - 4, arrowY);
                    ctx.lineTo(arrowX + arrowSize - 8, arrowY + 4);
                    
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }

                // Add coach notes if present
                if (entry.entry_coachnotes) {
                    currentY += 24; // Move down for coach notes
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Slightly transparent black
                    ctx.font = '14px "Rubik", "Inter", system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    
                    // Parse HTML and convert to plain text for canvas rendering
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = entry.entry_coachnotes;
                    const plainTextNotes = tempDiv.textContent || tempDiv.innerText || '';
                    
                    // Wrap the coach notes text
                    const noteLines = wrapText(plainTextNotes, maxTextWidth - 60, '16px "Rubik", "Inter", system-ui, sans-serif');
                    
                    for (const line of noteLines) {
                        ctx.fillText(line, numberX + 60, currentY + 2);
                        currentY += 20; // Line height for coach notes
                    }
                    
                    currentY += 12; // Extra spacing after coach notes
                } else {
                    currentY += 36; // Normal spacing if no coach notes
                }
                });
            } // End of setlist if block

            // Add final padding and create new canvas with exact height (moved outside setlist condition)
            const finalHeight = currentY + 30; // Add small bottom margin
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');
            if (!finalCtx) throw new Error('Failed to get final canvas context');

            // Set final canvas size
            finalCanvas.width = canvasWidth;
            finalCanvas.height = finalHeight;

            // Draw background on final canvas first
            let finalBgWidth = canvasWidth;
            let finalBgHeight = finalBgWidth / bgAspectRatio;

            if (finalBgHeight < finalHeight) {
                finalBgHeight = finalHeight;
                finalBgWidth = finalBgHeight * bgAspectRatio;
            }

            const finalBgX = (canvasWidth - finalBgWidth) / 2;
            finalCtx.drawImage(background, finalBgX, 0, finalBgWidth, finalBgHeight);

            // Copy the rendered content to the final canvas
            finalCtx.drawImage(canvas, 0, 0);

            // Use finalCanvas instead of canvas for the blob conversion
            finalCanvas.toBlob(async (blob) => {
                if (blob) {
                    const imageUrl = URL.createObjectURL(blob);
                    setGeneratedImageUrl(imageUrl);
                    setShowModal(true);
                }
            }, 'image/png');
        } catch (err) {
            console.error('Failed to generate image:', err);
        }
    };

    const handleCopyImage = async () => {
        if (!generatedImageUrl) return;
        
        try {
            // Check if we're on a mobile device or if clipboard.write is not supported
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const hasClipboardWrite = 'clipboard' in navigator && 'write' in navigator.clipboard;
            
            if (!isMobile && hasClipboardWrite) {
                // Desktop: Use clipboard API
                const response = await fetch(generatedImageUrl);
                const blob = await response.blob();
                
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
                
                setImageCopied(true);
                setTimeout(() => setImageCopied(false), 2000);
            } else {
                // Mobile/fallback: Auto-download the image
                const link = document.createElement('a');
                link.href = generatedImageUrl;
                link.download = `${show.show_group}-${formatInTimeZone(new Date(show.show_date), 'UTC', 'MM-dd-yy')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Show feedback that download started
                setImageCopied(true);
                setTimeout(() => setImageCopied(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy/download image:', err);
            // Fallback to download if clipboard fails
            handleSaveImage();
        }
    };

    const handleSaveImage = () => {
        if (!generatedImageUrl) return;
        
        const link = document.createElement('a');
        link.href = generatedImageUrl;
        link.download = `${show.show_group}-${formatInTimeZone(new Date(show.show_date), 'UTC', 'MM-dd-yy')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <button
                onClick={handleGenerateImage}
                className={`p-1.5 rounded border transition-all duration-200 ${
                    imageCopied 
                        ? 'bg-green-500 text-white border-green-600' 
                        : 'bg-tertiary text-fifth border-secondary hover:bg-white'
                } ${className}`}
                title="Generate Show Image"
            >
                <Share size={16} />
            </button>
            
            {/* Image Modal */}
            {showModal && generatedImageUrl && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-primary border border-secondary rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">
                                Generated Setlist Image
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="flex items-center justify-center w-10 h-10 rounded-md bg-red-600 hover:bg-primary transition-colors border border-secondary"
                            >
                                <X className="w-6 h-6 text-fifth" />
                            </button>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex justify-center gap-3 mb-4">
                            <button
                                onClick={handleCopyImage}
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-200 ${
                                    imageCopied 
                                        ? 'bg-green-500 text-white font-medium border-green-600' 
                                        : 'bg-tertiary text-fifth font-medium border-secondary hover:bg-white'
                                }`}
                                title="Copy to Clipboard (Desktop) / Download (Mobile)"
                            >
                                <Copy size={16} />
                                {imageCopied ? 'Success!' : 'Copy/Download'}
                            </button>
                        </div>
                        
                        <img src={generatedImageUrl} alt="Generated show image" className="max-w-full h-auto border border-secondary" />
                    </div>
                </div>
            )}
        </>
    );
};

export default ShowImageGenerator;