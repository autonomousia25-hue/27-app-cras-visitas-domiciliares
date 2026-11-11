"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  UserPlus, 
  LogOut, 
  Building2,
  FileSpreadsheet
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/visitas", label: "Visitas", icon: ClipboardList },
    { href: "/cadastro", label: "Novo Cadastro / CSV", icon: UserPlus },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight text-sm sm:text-base">
              CRAS Visitas
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Gestão de Visitas Domiciliares • Bolsa Família
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}

          <a
            href="https://docs.google.com/spreadsheets/d/1VypcdcEoNt3eFb8FsLkaO5NL_CTuvTk4pSloVsLIcak/edit"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir Planilha Online do Google Sheets"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">Planilha Sheets</span>
          </a>

          <button
            onClick={handleLogout}
            title="Sair do sistema"
            className="p-2 ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}

