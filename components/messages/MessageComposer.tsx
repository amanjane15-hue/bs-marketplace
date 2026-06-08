"use client";

import React, { useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { sanitizeFileName } from "@/lib/storage/sanitizeFileName";

const MAX_MESSAGE_LENGTH = 1000;
const SEND_COOLDOWN_MS = 1000;
const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_CHAT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export type Msg = {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  read_at?: string | null;
  image_path?: string | null;
  message_type?: "text" | "image" | "text_image";
};

interface Props {
  conversationId: string;
  onMessageSent?: (msg: Msg) => void;
}

export default function MessageComposer({ conversationId, onMessageSent }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowAttachMenu(false);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!ALLOWED_CHAT_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Only JPG, PNG, WEBP, or GIF images are allowed.");
      }
      if (file.size > MAX_CHAT_IMAGE_SIZE) {
        throw new Error("Image must be smaller than 5 MB.");
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      toast(err.message || "Invalid file.", "error");
      clearSelectedFile();
    }
  };

  const send = async () => {
    if (sending || uploading) return;
    
    const trimmedMessage = value.trim();
    if (!trimmedMessage && !selectedFile) {
      toast("Message cannot be empty.", "error");
      return;
    }

    if (!user) return;

    const now = Date.now();
    if (now - lastSentAt < SEND_COOLDOWN_MS) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let imagePath: string | null = null;

    if (selectedFile) {
      setUploading(true);
      try {
        const safeFileName = sanitizeFileName(selectedFile.name);
        imagePath = `conversations/${conversationId}/${user.id}/${crypto.randomUUID()}_${safeFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("chat-images")
          .upload(imagePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedFile.type,
          });

        if (uploadError) throw uploadError;
      } catch (err: any) {
        setUploading(false);
        console.error("Upload error:", err);
        toast("Unable to upload image. Please try again.", "error");
        return;
      }
    }

    setSending(true);

    const { data, error } = await supabase.rpc("send_message", {
      p_conversation_id: conversationId,
      p_content: trimmedMessage || null,
      p_image_path: imagePath,
    });

    if (error) {
      console.error("Failed to send message:", error);
      if (error.message === "Too many messages. Please wait a minute and try again." || 
          error.message.includes("Message cannot exceed") ||
          error.message.includes("Message cannot be empty")) {
        toast(error.message, "error");
      } else {
        toast("Failed to send message.", "error");
      }

      // Cleanup orphaned image if DB insert failed
      if (imagePath) {
        try {
          await supabase.storage.from("chat-images").remove([imagePath]);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    } else if (data) {
      setLastSentAt(Date.now());
      // Optimistic: notify parent immediately so message appears without waiting for realtime
      onMessageSent?.(data as Msg);

      // Also bump conversation updated_at so inbox re-sorts
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
        
      setValue("");
      clearSelectedFile();
    }

    setSending(false);
    setUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  if (user?.isSuspended) {
    return (
      <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-900">
        Your account is suspended. You cannot send messages.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {selectedFile && previewUrl && (
        <div className="mb-1 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <img
            src={previewUrl}
            alt="Selected attachment preview"
            className="h-16 w-16 rounded-xl object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">
              {selectedFile.name}
            </p>

            <p className="text-xs text-slate-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={clearSelectedFile}
            className="rounded-full px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex w-full items-center gap-3 relative">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-2xl font-light text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Attach image"
            disabled={sending || uploading}
          >
            +
          </button>

          {showAttachMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAttachMenu(false)}
              />
              <div className="absolute bottom-14 left-0 z-50 flex w-48 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Choose photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cameraInputRef.current?.click();
                  }}
                  className="px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 md:hidden"
                >
                  Take photo
                </button>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(false)}
                  className="px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className="relative flex-1">
          <input
            maxLength={MAX_MESSAGE_LENGTH}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full rounded-full border border-slate-300 bg-white py-3 pl-5 pr-20 text-sm text-slate-950 placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <div 
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] sm:text-xs font-medium ${
              value.length >= MAX_MESSAGE_LENGTH ? 'text-rose-600' : value.length > 900 ? 'text-amber-500' : 'text-slate-400'
            }`}
          >
            {value.length} / {MAX_MESSAGE_LENGTH}
          </div>
        </div>
        <button
          onClick={() => void send()}
          disabled={sending || uploading || (!value.trim() && !selectedFile)}
          className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {uploading ? "Uploading..." : sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
