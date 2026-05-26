"use client";

import { useRef, type ChangeEvent } from "react";

type ImageUploaderProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

export default function ImageUploader({ files, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
    onChange(selectedFiles);
    event.target.value = "";
  };

  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-700">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Item photos</p>
          <p className="mt-1 text-sm text-slate-600">Add images to bring your listing to life. Mock upload only.</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:mt-0"
        >
          Upload images
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {files.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{file.name}</p>
              <p className="mt-1 text-xs text-slate-500">{Math.round(file.size / 1024)} KB</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No files selected yet. Choose up to 6 photos for a stronger listing.
        </div>
      )}
    </div>
  );
}
