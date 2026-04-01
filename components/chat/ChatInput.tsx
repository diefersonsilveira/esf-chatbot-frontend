"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (texto: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Digite sua mensagem...",
}: ChatInputProps) {
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const msg = texto.trim();
    if (!msg || sending || disabled) return;

    setSending(true);
    setTexto("");

    try {
      await onSend(msg);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [texto, sending, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTexto(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-3">
      <div
        className={cn(
          "flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 transition-all",
          "focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Assuma o atendimento para responder" : placeholder}
          disabled={disabled || sending}
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
          style={{ minHeight: "24px", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={!texto.trim() || sending || disabled}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
            texto.trim() && !disabled
              ? "bg-sky-600 text-white hover:bg-sky-700"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          {sending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-1.5 pl-1">
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </div>
  );
}
