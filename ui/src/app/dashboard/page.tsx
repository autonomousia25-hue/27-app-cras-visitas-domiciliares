"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  UserX, 
  MapPinOff, 
  UserMinus, 
  RefreshCw, 
  ArrowRight,
  FileSpreadsheet,
  UserPlus,
  CalendarCheck,
  Calendar
} from "lucide-react";
import type { MetricSummary, Visita } from "@/lib/sheets";
import PieChartStatus from "@/components/PieChartStatus";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/visitas", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics);
        setVisitas(data.visitas || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const hojeVisitas = useMemo(() => {
    return visitas.filter((v) => v.data === todayStr);
  }, [visitas, todayStr]);

  const cards = [
    {
      title: "Total de Visitas",
      count: metrics?.total ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      description: "Cadastradas na base",
    },
    {
      title: "Visitas Realizadas",
      count: metrics?.realizada ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      description: "Concluídas em campo",
    },
    {
      title: "Pendências",
      count: metrics?.pendencia ?? 0,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      description: "Requer complementação",
    },
    {
      title: "Omissão Familiar",
      count: metrics?.omissao ?? 0,
      icon: UserMinus,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      description: "Inconsistência CadÚnico",
    },
    {
      title: "Não Encontrado",
      count: metrics?.naoEncontrado ?? 0,
      icon: UserX,
      color: "text-sky-600 bg-sky-50 border-sky-200",
      description: "Ausente no domicílio",
    },
    {
      title: "Endereço Inexistente",
      count: metrics?.enderecoNaoLocalizado ?? 0,
      icon: MapPinOff,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      description: "Localização não localizada",
    },
    {
      title: "Agendamento CRAS",
      count: metrics?.agendamentoCras ?? 0,
      icon: Calendar,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      description: "Convocação presencial",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Painel de Monitoramento
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Indicadores e controle de visitas do Centro de Referência de Assistência Social
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>{refreshing ? "Atualizando..." : "Sincronizar"}</span>
          </button>

          <Link
            href="/cadastro"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo / Importar CSV</span>
          </Link>
        </div>
      </div>

      {/* Agenda de Hoje Callout Banner */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Agenda de Hoje ({todayStr})
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                {hojeVisitas.length} {hojeVisitas.length === 1 ? "visita" : "visitas"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {hojeVisitas.length > 0 
                ? "Existem visitas programadas para o expediente de hoje. Acompanhe a realização em campo."
                : "Nenhuma visita com a data de hoje agendada no momento. Você pode consultar ou agendar na aba Visitas."}
            </p>
          </div>
        </div>

        <Link
          href="/visitas"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-100/50 shadow-xs transition-colors shrink-0"
        >
          <span>Consultar Agenda Completa</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {loading ? <span className="text-slate-300">--</span> : card.count}
              </div>

              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Gráfico em Pizza / Distribuição de Status */}
      <PieChartStatus metrics={metrics} />

      {/* Main Content Split: Overview & Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Planilha & Action Box */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold leading-tight">
              Base Google Sheets Conectada
            </h3>
            <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
              Os dados são sincronizados em tempo real com a planilha oficial do Drive. Toda alteração no app reflete na nuvem sem intermediários.
            </p>

            <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between">
              <span className="text-xs text-blue-200">ID da Planilha Ativa</span>
              <span className="text-xs font-mono bg-white/15 px-2 py-0.5 rounded">
                ...LIcak
              </span>
            </div>

            <a
              href="https://docs.google.com/spreadsheets/d/1VypcdcEoNt3eFb8FsLkaO5NL_CTuvTk4pSloVsLIcak/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white text-blue-900 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <span>Abrir no Google Sheets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h4 className="font-semibold text-sm text-slate-800 mb-2">
              Dica Operacional de Campo
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Você pode filtrar as visitas por período temporal (Hoje, Passadas ou Próximas) direto na aba <strong>Visitas</strong>.
            </p>
          </div>
        </div>

        {/* Right Column: Recent Visits Snapshot */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Fila de Visitas Recentes
                </h3>
                <p className="text-xs text-slate-500">
                  Beneficiários aguardando realização ou atualização
                </p>
              </div>

              <Link
                href="/visitas"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                <span>Ver todas as {metrics?.total ?? 0}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 overflow-hidden">
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Carregando registros...
                </div>
              ) : visitas.slice(0, 7).map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-4">
                    <p className="font-medium text-slate-800 truncate">
                      {item.usuario}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 font-mono">
                        CPF: {item.cpf}
                      </p>
                      {item.data && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                          • <Calendar className="w-3 h-3 text-slate-400" /> {item.data}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      item.status.includes("Realizada")
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : item.status.includes("Pendência")
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : item.status.includes("Omissão")
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : item.status.includes("não Encontrado")
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : item.status.includes("Endereço")
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      {item.status || "Pendente de Visita"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Visualizando primeiras 7 visitas</span>
            <Link href="/visitas" className="font-medium text-blue-600 hover:underline">
              Ir para tela operacional de Visitas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
