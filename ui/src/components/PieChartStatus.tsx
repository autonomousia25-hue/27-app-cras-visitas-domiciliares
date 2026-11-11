"use client";

import React, { useState, useMemo } from "react";
import { 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  AlertTriangle, 
  UserMinus, 
  UserX, 
  MapPinOff, 
  Calendar,
  Sparkles,
  Info
} from "lucide-react";
import type { MetricSummary } from "@/lib/sheets";

interface PieChartStatusProps {
  metrics: MetricSummary | null;
}

interface SliceData {
  label: string;
  count: number;
  percentage: number;
  color: string;
  hoverColor: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function PieChartStatus({ metrics }: PieChartStatusProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const rawData = useMemo(() => {
    return [
      {
        label: "Visita Realizada",
        count: metrics?.realizada || 0,
        color: "#10b981", // emerald-500
        hoverColor: "#059669",
        bgLight: "bg-emerald-50",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        icon: CheckCircle2,
      },
      {
        label: "Pendência",
        count: metrics?.pendencia || 0,
        color: "#f59e0b", // amber-500
        hoverColor: "#d97706",
        bgLight: "bg-amber-50",
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        icon: AlertTriangle,
      },
      {
        label: "Usuário não Encontrado",
        count: metrics?.naoEncontrado || 0,
        color: "#0ea5e9", // sky-500
        hoverColor: "#0284c7",
        bgLight: "bg-sky-50",
        textColor: "text-sky-700",
        borderColor: "border-sky-200",
        icon: UserX,
      },
      {
        label: "Omissão Comp. Familiar",
        count: metrics?.omissao || 0,
        color: "#a855f7", // purple-500
        hoverColor: "#9333ea",
        bgLight: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
        icon: UserMinus,
      },
      {
        label: "Endereço não Localizado",
        count: metrics?.enderecoNaoLocalizado || 0,
        color: "#f43f5e", // rose-500
        hoverColor: "#e11d48",
        bgLight: "bg-rose-50",
        textColor: "text-rose-700",
        borderColor: "border-rose-200",
        icon: MapPinOff,
      },
      {
        label: "Agendamento no CRAS",
        count: metrics?.agendamentoCras || 0,
        color: "#6366f1", // indigo-500
        hoverColor: "#4f46e5",
        bgLight: "bg-indigo-50",
        textColor: "text-indigo-700",
        borderColor: "border-indigo-200",
        icon: Calendar,
      },
    ];
  }, [metrics]);

  const totalComStatus = useMemo(() => {
    return rawData.reduce((acc, cur) => acc + cur.count, 0);
  }, [rawData]);

  const slices: SliceData[] = useMemo(() => {
    return rawData.map((d) => ({
      ...d,
      percentage: totalComStatus > 0 ? (d.count / totalComStatus) * 100 : 0,
    }));
  }, [rawData, totalComStatus]);

  // Taxa de Sucesso em Campo (Visita Realizada)
  const taxaSucesso = useMemo(() => {
    if (totalComStatus === 0) return 0;
    const realizadas = metrics?.realizada || 0;
    return Math.round((realizadas / totalComStatus) * 100);
  }, [metrics, totalComStatus]);

  // Generate SVG Arc Paths for Donut Chart
  const svgArcs = useMemo(() => {
    if (totalComStatus === 0) return [];

    let currentAngle = -Math.PI / 2; // Start at 12 o'clock
    const cx = 120;
    const cy = 120;
    const outerR = 92;
    const innerR = 58;

    return slices.map((slice, index) => {
      if (slice.count === 0) return null;

      const sliceAngle = (slice.count / totalComStatus) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const isHovered = hoveredIndex === index;
      const r = isHovered ? outerR + 4 : outerR;
      const ir = isHovered ? innerR - 2 : innerR;

      // Special case: 100% of circle in single slice
      if (slice.count === totalComStatus) {
        return {
          index,
          slice,
          isFullCircle: true,
          d: "",
          cx,
          cy,
          r,
          ir,
        };
      }

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const ix1 = cx + ir * Math.cos(endAngle);
      const iy1 = cy + ir * Math.sin(endAngle);
      const ix2 = cx + ir * Math.cos(startAngle);
      const iy2 = cy + ir * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const d = [
        `M ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        "Z",
      ].join(" ");

      return {
        index,
        slice,
        isFullCircle: false,
        d,
      };
    });
  }, [slices, totalComStatus, hoveredIndex]);

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Distribuição dos Status de Visita (Gráfico em Pizza)
            </h3>
            <p className="text-xs text-slate-500">
              Proporção percentual dos desfechos de campo sincronizados com a aba Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Efetividade: {taxaSucesso}% Sucesso
          </span>
        </div>
      </div>

      {/* Grid Principal: Gráfico Donut (Esquerda) + Tabela de Distribuição (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado Esquerdo: Donut / Pie SVG Interativo */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[240px] h-[240px]">
            {totalComStatus === 0 ? (
              <div className="w-full h-full rounded-full border-8 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-4">
                <Info className="w-8 h-8 text-slate-300 mb-1" />
                <span className="text-xs font-semibold text-slate-500">Sem Desfechos</span>
                <span className="text-[11px] text-slate-400">Registre status nas visitas para visualizar o gráfico</span>
              </div>
            ) : (
              <svg
                viewBox="0 0 240 240"
                className="w-full h-full transform -rotate-0 drop-shadow-xs"
              >
                {svgArcs.map((arc) => {
                  if (!arc) return null;

                  if (arc.isFullCircle) {
                    return (
                      <circle
                        key={arc.index}
                        cx={arc.cx}
                        cy={arc.cy}
                        r={(arc.r! + arc.ir!) / 2}
                        fill="none"
                        stroke={arc.slice.color}
                        strokeWidth={arc.r! - arc.ir!}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredIndex(arc.index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  }

                  return (
                    <path
                      key={arc.index}
                      d={arc.d}
                      fill={hoveredIndex === arc.index ? arc.slice.hoverColor : arc.slice.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer transition-all duration-200 hover:opacity-95"
                      onMouseEnter={() => setHoveredIndex(arc.index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>
            )}

            {/* Centro Informativo do Donut */}
            {totalComStatus > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {activeSlice ? (
                  <div className="animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate max-w-[110px]">
                      {activeSlice.label}
                    </span>
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {activeSlice.count}
                    </span>
                    <span className="text-xs font-bold text-blue-600 block mt-0.5">
                      {activeSlice.percentage.toFixed(1).replace(".", ",")}%
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total Avaliado
                    </span>
                    <span className="text-3xl font-black text-slate-900 leading-tight">
                      {totalComStatus}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 block">
                      visitas com status
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Passe o mouse sobre os setores para destacar detalhes
          </p>
        </div>

        {/* Lado Direito: Tabela e Barras de Distribuição */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-1 border-b border-slate-100">
            <span>Status da Visita</span>
            <div className="flex items-center gap-6">
              <span>Qtd</span>
              <span className="w-12 text-right">Part. %</span>
            </div>
          </div>

          <div className="space-y-2">
            {slices.map((slice, i) => {
              const Icon = slice.icon;
              const isHovered = hoveredIndex === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? `${slice.bgLight} ${slice.borderColor} ring-1 ring-blue-500/30 shadow-xs scale-[1.01]`
                      : "bg-slate-50/50 border-slate-200/70 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <Icon className={`w-3.5 h-3.5 ${slice.textColor}`} />
                      <span className="font-semibold text-slate-800">
                        {slice.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="font-bold text-slate-900">
                        {slice.count}
                      </span>
                      <span className="w-12 text-right font-mono font-semibold text-slate-600">
                        {slice.percentage.toFixed(1).replace(".", ",")}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual */}
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${slice.percentage}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Painel de Diagnóstico Operacional (Idêntico ao da aba Dashboard do Sheets) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Diagnóstico Operacional & Diretrizes Técnicas (CRAS)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              🟢 Efetividade de Campo ({taxaSucesso}%)
            </span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              {taxaSucesso >= 70
                ? `${metrics?.realizada || 0} visitas concluídas com sucesso. O fluxo opera com alta resolutividade.`
                : `${metrics?.realizada || 0} de ${totalComStatus} visitas foram concluídas. Acompanhar retornos de famílias pendentes.`}
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              ⚠️ Inconsistências & Localização
            </span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              {(metrics?.naoEncontrado || 0) + (metrics?.enderecoNaoLocalizado || 0)} ausências ou endereços não localizados. Recomenda-se confirmação prévia via WhatsApp antes do deslocamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

