import { formatarHora, iniciais, cn } from "@/lib/utils";
import type { Mensagem } from "@/lib/types";
import { Bot, User } from "lucide-react";

interface ChatBubbleProps {
  mensagem: Mensagem;
  acsUid?: string;
}

export function ChatBubble({ mensagem, acsUid }: ChatBubbleProps) {
  const { autor, texto, criado_em, autor_nome } = mensagem;
  const hora = formatarHora(criado_em);

  if (autor === "sistema") {
    return (
      <div className="flex justify-center my-2">
        <div className="bubble-sistema">{texto}</div>
      </div>
    );
  }

  if (autor === "usuario") {
    return (
      <div className="flex items-end gap-2.5 group">
        <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
          <User className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="max-w-[70%]">
          <div className="bubble-user">{texto}</div>
          <p className="text-xs text-slate-400 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {hora}
          </p>
        </div>
      </div>
    );
  }

  if (autor === "bot") {
    return (
      <div className="flex items-end gap-2.5 group">
        <div className="w-7 h-7 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
          <Bot className="w-3.5 h-3.5 text-sky-600" />
        </div>
        <div className="max-w-[70%]">
          <div className="bubble-bot whitespace-pre-line">{texto}</div>
          <p className="text-xs text-slate-400 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Bot · {hora}
          </p>
        </div>
      </div>
    );
  }

  if (autor === "acs") {
    return (
      <div className="flex items-end justify-end gap-2.5 group">
        <div className="max-w-[70%]">
          <div className="bubble-acs whitespace-pre-line">{texto}</div>
          <p className="text-xs text-sky-400/70 mt-1 mr-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            {autor_nome || "ACS"} · {hora}
          </p>
        </div>
        <div className="w-7 h-7 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
          <span className="text-white text-xs font-bold">
            {iniciais(autor_nome)}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">
        {date}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}
