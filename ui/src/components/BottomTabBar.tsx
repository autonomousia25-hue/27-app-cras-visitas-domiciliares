"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  UserPlus,
  FileSpreadsheet,
} from "lucide-react";

export function BottomTabBar() {
  const pathname = usePathname();

  // Ocultar na tela de login
  if (pathname === "/login") {
    return null;
  }

  const tabs = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isExternal: false,
    },
    {
      href: "/visitas",
      label: "Visitas",
      icon: ClipboardList,
      isExternal: false,
    },
    {
      href: "/cadastro",
      label: "Novo / CSV",
      icon: UserPlus,
      isExternal: false,
    },
    {
      href: "https://docs.google.com/spreadsheets/d/1VypcdcEoNt3eFb8FsLkaO5NL_CTuvTk4pSloVsLIcak/edit",
      label: "Planilha",
      icon: FileSpreadsheet,
      isExternal: true,
    },
  ];

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,8px)]"
    >
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          if (tab.isExternal) {
            return (
              <a
                key={tab.label}
                href={tab.href}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir Planilha Google Sheets"
                className="flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-emerald-600 transition-colors py-1 group"
              >
                <div className="p-1 rounded-xl group-hover:bg-emerald-50 transition-colors">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-[10px] font-medium leading-none text-slate-600 group-hover:text-emerald-700">
                  {tab.label}
                </span>
              </a>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 transition-all py-1 group ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-xs scale-105"
                    : "group-hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
              </div>
              <span
                className={`text-[10px] leading-none transition-colors ${
                  isActive ? "text-blue-700 font-semibold" : "text-slate-600 font-medium"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
