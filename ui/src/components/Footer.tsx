import React from "react";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full mt-auto py-5 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          <span>© {new Date().getFullYear()} CRAS Visitas — Sistema de Gestão Socioassistencial</span>
          <span className="hidden sm:inline mx-2">•</span>
          <span className="block sm:inline text-slate-400">Versão Piloto</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <span>Desenvolvido por</span>
          <a
            href="https://www.autonomousia.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-900 hover:text-blue-600 transition-colors group font-semibold"
          >
            <span>Autonomous IA</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}

