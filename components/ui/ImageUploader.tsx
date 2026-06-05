"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ImageUploaderProps = {
  onUploadComplete?: (urls: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
};

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

export default function ImageUploader({ onUploadComplete, onUploadingChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateFiles = (files: File[]) => {
    const errors: string[] = [];
    const validFiles: File[] = [];
    const remainingSlots = MAX_IMAGES - uploadedUrls.length;

    if (files.length > remainingSlots) {
      errors.push(`You can upload up to ${MAX_IMAGES} images. ${files.length - remainingSlots} file(s) will be skipped.`);
    }

    files.slice(0, remainingSlots).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name} is not a supported format. Use JPG, PNG, or WEBP.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} is too large. Files must be 5MB or less.`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setValidationErrors([]);
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    const { validFiles, errors } = validateFiles(selectedFiles);
    if (errors.length > 0) {
      setValidationErrors(errors);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    onUploadingChange?.(true);

    const supabase = getSupabaseBrowserClient();
    const newUrls: string[] = [];

    for (const file of validFiles) {
      try {
        const safeFileName = sanitizeFileName(file.name);
        const filePath = `listings/${Date.now()}_${crypto.randomUUID()}_${safeFileName}`;

        const { error: uploadErr } = await supabase.storage.from("listing-images").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadErr) {
          setValidationErrors((prev) => [...prev, uploadErr.message || "Upload failed"]);
          continue;
        }

        const { data: publicData } = await supabase.storage.from("listing-images").getPublicUrl(filePath);
        const publicUrl = (publicData as any)?.publicUrl ?? (publicData as any)?.publicURL ?? "";
        if (publicUrl) newUrls.push(publicUrl);
      } catch (err) {
        setValidationErrors((prev) => [...prev, (err as Error)?.message ?? String(err)]);
      }
    }

    const all = [...uploadedUrls, ...newUrls];
    setUploadedUrls(all);
    onUploadComplete?.(all);

    setUploading(false);
    onUploadingChange?.(false);
  };

  const handleRemove = (index: number) => {
    const next = uploadedUrls.filter((_, i) => i !== index);
    setUploadedUrls(next);
    onUploadComplete?.(next);
  };

  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Photos</p>
          <p className="mt-1 text-sm text-slate-600">Upload up to 6 images. Tap an image to remove it before publishing.</p>
          <p className="mt-1 text-xs text-slate-500">{uploadedUrls.length} of {MAX_IMAGES} uploaded</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || uploadedUrls.length >= MAX_IMAGES}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
        >
          {uploading ? "Uploading..." : uploadedUrls.length >= MAX_IMAGES ? "Limit reached" : "Upload images"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {validationErrors.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Upload issues</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationErrors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {uploadedUrls.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {uploadedUrls.map((url, idx) => (
            <div key={`${url}-${idx}`} className="relative rounded-3xl overflow-hidden bg-white shadow-sm">
              <img src={url} alt={`Uploaded ${idx + 1}`} className="h-36 w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm text-rose-600 shadow"
                aria-label={`Remove image ${idx + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No images uploaded yet.
        </div>
      )}
    </div>
  );
}
