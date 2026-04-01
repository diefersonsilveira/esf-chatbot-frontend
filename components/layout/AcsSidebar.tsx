"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  Inbox,
  MessageSquare,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider copy";
import { iniciais } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/acs", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/acs/fila", icon: Inbox, label: "Fila de Atendimento" },
  { href: "/acs/meus-atendimentos", icon: MessageSquare, label: "Meus Atendimentos" },
];

export function AcsSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showUser, setShowUser] = useState(false);

  return (
    <aside className="sidebar flex flex-col">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">ESF Painel</p>
          <p className="text-slate-500 text-xs">ACS</p>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-6 py-2 text-slate-600 text-xs font-semibold uppercase tracking-wider">
          Menu
        </p>
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <span className={cn("sidebar-item", active && "active")}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={() => setShowUser(!showUser)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {iniciais(user?.displayName)}
            </span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate">
              {user?.displayName || "ACS"}
            </p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-500 transition-transform",
              showUser && "rotate-180"
            )}
          />
        </button>

        {showUser && (
          <div className="mt-1 px-2">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
