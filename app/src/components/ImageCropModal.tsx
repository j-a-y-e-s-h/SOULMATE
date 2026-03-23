import { useState, useRef, useCallback, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onConfirm: (croppedBlob: Blob) => void;
}

const CONTAINER_SIZE = 360;
const OUTPUT_SIZE = 1200;

export function ImageCropModal({ open, onClose, imageSrc, onConfirm }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Base scale = cover the container
  const baseScale =
    imgSize.w && imgSize.h
      ? Math.max(CONTAINER_SIZE / imgSize.w, CONTAINER_SIZE / imgSize.h)
      : 1;
  const totalScale = baseScale * zoom;

  const clamp = useCallback(
    (pos: { x: number; y: number }, scale: number) => ({
      x: Math.min(0, Math.max(CONTAINER_SIZE - imgSize.w * scale, pos.x)),
      y: Math.min(0, Math.max(CONTAINER_SIZE - imgSize.h * scale, pos.y)),
    }),
    [imgSize],
  );

  // Reset when a new image source is provided
  useEffect(() => {
    if (!imageSrc) return;

    // Create a fresh ref to avoid stale closures
    imgRef.current = null;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const s = Math.max(CONTAINER_SIZE / w, CONTAINER_SIZE / h);
      setImgSize({ w, h });
      setZoom(1);
      setPosition({ x: (CONTAINER_SIZE - w * s) / 2, y: (CONTAINER_SIZE - h * s) / 2 });
      setImgLoaded(true);
    };
    img.src = imageSrc;

    // Cleanup: mark as not loaded so old image doesn't flash
    return () => {
      setImgLoaded(false);
    };
  }, [imageSrc]);

  // --- Pointer handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition(
      clamp(
        { x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y },
        totalScale,
      ),
    );
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleZoom = (v: number) => {
    const next = Math.max(1, Math.min(3, v));
    const nextScale = baseScale * next;
    // Keep visually centered while zooming
    const cx = CONTAINER_SIZE / 2;
    const cy = CONTAINER_SIZE / 2;
    const imgCx = (cx - position.x) / totalScale;
    const imgCy = (cy - position.y) / totalScale;
    setZoom(next);
    setPosition(clamp({ x: cx - imgCx * nextScale, y: cy - imgCy * nextScale }, nextScale));
  };

  // --- Crop & confirm ---
  const handleConfirm = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d')!;

    // Map container visible area back to source image coords
    const cropX = -position.x / totalScale;
    const cropY = -position.y / totalScale;
    const cropSize = CONTAINER_SIZE / totalScale;

    ctx.drawImage(imgRef.current, cropX, cropY, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
          <Dialog.Title className="text-xl font-bold text-[#1f2330]">
            Crop & Adjust Photo
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-[#62584d]">
            Drag to reposition. Zoom to adjust framing.
          </Dialog.Description>

          {/* Crop viewport */}
          <div
            className="relative mx-auto mt-5 overflow-hidden rounded-[24px] bg-[#1f2330] touch-none select-none"
            style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, cursor: isDragging ? 'grabbing' : 'grab' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {imgLoaded && (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="pointer-events-none absolute select-none"
                style={{
                  transformOrigin: '0 0',
                  transform: `translate(${position.x}px, ${position.y}px) scale(${totalScale})`,
                  maxWidth: 'none',
                }}
                draggable={false}
              />
            )}

            {/* Rule-of-thirds grid */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
              <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
              <div className="absolute inset-0 rounded-[24px] ring-2 ring-white/40" />
            </div>
          </div>

          {/* Zoom controls */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoom(zoom - 0.25)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3e5d6]/60 text-[#1f2330] hover:bg-[#f3e5d6] transition"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => handleZoom(zoom + 0.25)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3e5d6]/60 text-[#1f2330] hover:bg-[#f3e5d6] transition"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} className="btn-primary flex-1 justify-center">
              <Check className="h-4 w-4" />
              Confirm Crop
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f3e5d6]/50 text-[#62584d] hover:bg-[#f3e5d6] transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
