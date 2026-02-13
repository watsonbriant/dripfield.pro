import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Share, X, Copy } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import bgTile from '../img/bg_tile.jpg';
import logoImage from '../img/Logo7-2_Header.jpg';
import { SetlistEntry, Show } from '../utils/imageGeneratorUtils';
import { renderShowImageRebuild } from '../utils/canvasRenderer';

interface ShowImageGeneratorProps {
    show: Show;
    setlist?: SetlistEntry[];
    className?: string;
}

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
            // Dynamic dimensions - starting size for step 1 (tiled background only)
            const width = 800;
            const height = 600;
            const imageUrl = await renderShowImageRebuild(show, setlist, bgTile, logoImage, width, height);
            setGeneratedImageUrl(imageUrl);
            setShowModal(true);
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

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showModal) {
            // Save current scroll position
            const scrollY = window.scrollY;
            // Lock body scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore scroll position when modal closes
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [showModal]);

    // Render modal using portal to escape parent container's stacking context
    const modalContent = showModal && generatedImageUrl ? createPortal(
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/70 z-[49999]"
                onClick={() => setShowModal(false)}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    minHeight: '100dvh' // Dynamic viewport height for better mobile support
                }}
            />
            
            {/* Modal Content - centered in viewport */}
            <div 
                className="fixed inset-0 z-[50000] flex items-center justify-center p-4 pointer-events-none"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    minHeight: '100dvh' // Dynamic viewport height for better mobile support
                }}
            >
                <div 
                    className="bg-primary border border-fourth rounded-lg p-4 max-w-lg max-h-[90vh] overflow-auto pointer-events-auto" 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth">
                            Generated Setlist Image
                        </h3>
                        <button 
                            onClick={() => setShowModal(false)}
                            className="flex items-center justify-center w-10 h-10 rounded-md bg-red-600 hover:bg-primary transition-colors border border-fourth"
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
                                    : 'bg-tertiary text-fifth font-medium border-fourth hover:bg-white'
                            }`}
                            title="Copy to Clipboard (Desktop) / Download (Mobile)"
                        >
                            <Copy size={14} />
                            {imageCopied ? 'Success!' : 'Copy/Download'}
                        </button>
                    </div>
                    
                    <img src={generatedImageUrl} alt="Generated show image" className="max-w-full h-auto border border-fourth" />
                </div>
            </div>
        </>,
        document.body
    ) : null;

    return (
        <>
            <button
                onClick={handleGenerateImage}
                className={`p-0.5 rounded border transition-all duration-200 ${
                    imageCopied 
                        ? 'bg-green-500 text-white border-green-600' 
                        : 'bg-tertiary text-fifth border-fourth hover:bg-fourth hover:text-white'
                } ${className}`}
                title="Generate Show Image"
            >
                <Share size={13} />
            </button>
            
            {/* Image Modal - rendered via portal */}
            {modalContent}
        </>
    );
};

export default ShowImageGenerator;