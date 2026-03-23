import { useState, useRef, useCallback } from 'react';
import { Camera, GripVertical, Loader2, Star, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropModal } from './ImageCropModal';
import {
  validateFile,
  prepareForCrop,
  uploadPhoto,
  deletePhoto,
  detectFace,
  getPublicUrl,
  isSupabaseUrl,
  extractFilePath,
} from '@/lib/photoUpload';

interface PhotoUploaderProps {
  photos: string[];
  userId: string;
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ photos, userId, onPhotosChange, maxPhotos = 6 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  // --- File selection ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      const objectUrl = await prepareForCrop(file);
      setCropSrc(objectUrl);
      setCropOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not process this image.');
    }
  };

  // --- After crop → upload ---
  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropOpen(false);
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }

    setUploading(true);
    try {
      // Face detection (warn only, don't block)
      const faceResult = await detectFace(croppedBlob);
      if (!faceResult.hasFace) {
        toast.warning('We could not detect a face in this photo. Profile photos with clear faces get better responses.', { duration: 5000 });
      }

      // Upload to Supabase
      const filePath = await uploadPhoto(userId, croppedBlob);
      const publicUrl = getPublicUrl(filePath);

      onPhotosChange([...photos, publicUrl]);
      toast.success('Photo uploaded successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCropClose = () => {
    setCropOpen(false);
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  };

  // --- Remove photo ---
  const handleRemove = async (index: number) => {
    const url = photos[index];
    const next = photos.filter((_, i) => i !== index);
    onPhotosChange(next);

    // Delete from Supabase if it's a real upload (not a demo photo)
    if (isSupabaseUrl(url)) {
      const path = extractFilePath(url);
      if (path) {
        try {
          await deletePhoto(path);
        } catch {
          // Photo already removed from UI; storage cleanup failure is non-critical
        }
      }
    }
    toast.success('Photo removed.');
  };

  // --- Set as profile photo (move to index 0) ---
  const setAsProfile = (index: number) => {
    if (index === 0) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onPhotosChange(next);
    toast.success('Profile photo updated!');
  };

  // --- Drag-and-reorder ---
  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
  };

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      const fromIndex = dragItemRef.current;
      if (fromIndex === null || fromIndex === dropIndex) return;

      const next = [...photos];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(dropIndex, 0, moved);
      onPhotosChange(next);
      dragItemRef.current = null;
    },
    [photos, onPhotosChange],
  );

  const handleDragEnd = () => {
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="glass-card p-5 sm:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8c7c6c]">Photos</p>
          <h2 className="mt-3 text-[clamp(2rem,8vw,2.8rem)] text-[#1f2330]">
            Build a stronger first impression.
          </h2>
        </div>
        <span className="chip bg-[#fff2ee] text-[#b84f45]">
          {photos.length} / {maxPhotos}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-[#62584d]">
        Upload up to {maxPhotos} photos. JPG, PNG, HEIC accepted · 5 MB max · drag to reorder.
      </p>

      {/* Photo grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <div
            key={`${photo}-${index}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`group relative overflow-hidden rounded-[24px] transition-all ${
              dragOverIndex === index
                ? 'ring-4 ring-[#b84f45]/40 scale-[1.03]'
                : 'ring-1 ring-black/5'
            }`}
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="aspect-square w-full object-cover"
              draggable={false}
            />

            {/* Profile badge on first photo */}
            {index === 0 && (
              <div className="absolute left-3 top-3 rounded-full bg-[#b84f45] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                Profile Photo
              </div>
            )}

            {/* Drag handle */}
            <div className="absolute left-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#17161c]/60 text-white/80 opacity-0 transition-opacity group-hover:opacity-100 cursor-grab">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Action buttons */}
            <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              {/* Set as profile photo */}
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => setAsProfile(index)}
                  title="Set as profile photo"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17161c]/60 text-white backdrop-blur-md hover:bg-[#efc18d] hover:text-[#1f2330] transition-all"
                >
                  <Star className="h-4 w-4" />
                </button>
              )}
              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                title="Remove photo"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17161c]/60 text-white backdrop-blur-md hover:bg-red-500 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Uploading indicator */}
        {uploading && (
          <div className="surface-muted flex aspect-square flex-col items-center justify-center rounded-[24px] p-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#b84f45]" />
            <span className="mt-3 text-sm font-semibold text-[#62584d]">Uploading…</span>
          </div>
        )}

        {/* Add photo button */}
        {canAddMore && !uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="surface-muted flex aspect-square flex-col items-center justify-center rounded-[24px] p-4 transition hover:bg-white/85 hover:shadow-md group/add"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff2ee] text-[#b84f45] transition-transform group-hover/add:scale-110">
              <Camera className="h-7 w-7" />
            </div>
            <span className="mt-3 text-sm font-semibold text-[#1f2330]">Add photo</span>
            <span className="mt-1 text-[11px] text-[#8c7c6c]">JPG · PNG · HEIC</span>
          </button>
        )}
      </div>

      {/* Drag-and-drop banner for empty state */}
      {photos.length === 0 && !uploading && (
        <div
          onClick={() => inputRef.current?.click()}
          className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[28px] border-2 border-dashed border-[#eadcca] bg-[#fdf8f3] p-10 transition-colors hover:border-[#b84f45]/40 hover:bg-[#fff2ee]/50"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff2ee]">
            <Upload className="h-7 w-7 text-[#b84f45]" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#1f2330]">Upload your first photo</p>
            <p className="mt-1 text-sm text-[#62584d]">
              Click or tap to choose a photo. Profiles with clear face photos get 3× more interest.
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heif,image/heic,.heic,.heif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Crop modal */}
      {cropSrc && (
        <ImageCropModal
          open={cropOpen}
          onClose={handleCropClose}
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
