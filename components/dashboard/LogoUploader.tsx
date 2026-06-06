"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  businessId: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
}

export function LogoUploader({ businessId, currentUrl, onUploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Máximo 5 MB");
      return;
    }

    setError(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    const form = new FormData();
    form.append("file", file);
    form.append("business_id", businessId);

    try {
      const res = await fetch("/api/cloudinary/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir");
      setPreview(json.url);
      onUploaded(json.url);
    } catch (e: any) {
      setError(e.message);
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-navy/10 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-coral/40 transition-colors cursor-pointer group"
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Logo"
              className="w-20 h-20 rounded-2xl object-cover shadow-md"
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-coral animate-spin" />
              </div>
            )}
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  onUploaded("");
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center group-hover:bg-coral/5 transition-colors">
            {uploading ? (
              <Loader2 className="w-7 h-7 text-coral animate-spin" />
            ) : (
              <Upload className="w-7 h-7 text-navy/30 group-hover:text-coral transition-colors" />
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-sm font-bold text-navy">
            {uploading ? "Subiendo..." : preview ? "Cambiar logo" : "Subir logo"}
          </p>
          <p className="text-xs text-navy/40 mt-0.5">
            PNG, JPG, WebP — máx. 5 MB
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium px-1">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
