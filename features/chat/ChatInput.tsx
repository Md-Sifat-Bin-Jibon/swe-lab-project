"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatInputProps {
  disabled?: boolean;
  sending?: boolean;
  onSend: (text: string) => Promise<void> | void;
  onTyping?: (isTyping: boolean) => void;
  onSendImage?: (file: File) => Promise<void> | void;
  onSendVoice?: (file: File) => Promise<void> | void;
}

export function ChatInput({
  disabled = false,
  sending = false,
  onSend,
  onTyping,
  onSendImage,
  onSendVoice,
}: ChatInputProps) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<number | null>(null);
  const wasTypingRef = useRef(false);

  function notifyTyping(next: boolean) {
    if (!onTyping) return;
    if (wasTypingRef.current === next) return;
    wasTypingRef.current = next;
    onTyping(next);
  }

  function handleValueChange(next: string) {
    setValue(next);
    if (!onTyping || disabled) return;

    if (next.trim()) {
      notifyTyping(true);
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
        notifyTyping(false);
      }, 1500);
    } else {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      notifyTyping(false);
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      notifyTyping(false);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend() {
    const text = value.trim();
    if (!text || disabled || sending) return;
    setValue("");
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    notifyTyping(false);
    await onSend(text);
  }

  async function handleImageChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !onSendImage || disabled || sending) return;
    setAttachOpen(false);
    await onSendImage(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function startRecording() {
    if (!onSendVoice || disabled || sending || recording) return;
    setRecordError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = preferred
        ? new MediaRecorder(stream, { mimeType: preferred })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setRecordError("Recording failed. Try again.");
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const rawType = recorder.mimeType || preferred || "audio/webm";
        const baseType = rawType.split(";")[0]?.trim() || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: baseType });
        chunksRef.current = [];
        setRecording(false);

        if (blob.size < 200) {
          setRecordError("Recording was too short. Hold a bit longer.");
          return;
        }

        const ext = baseType.includes("ogg")
          ? "ogg"
          : baseType.includes("mp4")
            ? "m4a"
            : "webm";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, {
          type: baseType,
        });
        void onSendVoice(file);
      };

      // Timeslice keeps chunks flowing on Chrome/Edge.
      recorder.start(250);
      setRecording(true);
      setAttachOpen(false);
    } catch {
      setRecordError("Microphone permission is needed for voice messages.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      if (recorder.state === "recording") recorder.requestData();
    } catch {
      // Some browsers throw if requestData is unavailable.
    }
    recorder.stop();
  }

  return (
    <div className="border-t border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          aria-label="Add attachment"
          disabled={disabled || sending}
          onClick={() => setAttachOpen((open) => !open)}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
        <input
          type="text"
          value={value}
          disabled={disabled || sending || recording}
          onChange={(event) => handleValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder={recording ? "Recording…" : "Type a message..."}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-swapspot-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-swapspot-blue/20 disabled:opacity-60"
        />
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600"
            aria-label="Stop recording"
          >
            <span className="h-3 w-3 rounded-sm bg-white" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || sending || !value.trim()}
            onClick={() => void handleSend()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-swapspot-blue text-white transition hover:bg-[#3f52c4] disabled:opacity-50"
            aria-label="Send message"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m22 2-7 20-4-9-9-4 20-7Z" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div
        className={`${
          attachOpen ? "flex" : "hidden"
        } flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-3`}
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => void handleImageChange(event.target.files)}
        />
        <button
          type="button"
          disabled={disabled || sending || !onSendImage}
          onClick={() => imageInputRef.current?.click()}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          Photo
        </button>
        <button
          type="button"
          disabled={disabled || sending || !onSendVoice}
          onClick={() => void startRecording()}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
        >
          Voice
        </button>
        {recordError ? (
          <p className="text-xs text-rose-600">{recordError}</p>
        ) : (
          <p className="text-xs text-slate-500">
            Share a photo, or tap Voice then the red stop button to send.
          </p>
        )}
        <button
          type="button"
          className="ml-auto text-slate-500 hover:text-slate-700"
          aria-label="Close attachments"
          onClick={() => setAttachOpen(false)}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
