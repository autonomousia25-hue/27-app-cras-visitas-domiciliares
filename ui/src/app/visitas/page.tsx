"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Check, 
  UserPlus, 
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  ListOrdered,
  MapPin,
  CheckSquare,
  Square,
  Phone,
  MessageCircle,
  Home,
  ClipboardCheck
} from "lucide-react";
import type { Visita } from "@/lib/sheets";

const STATUS_OPTIONS = [
  { label: "Visita Realizada", value: "Visita Realizada", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "Pendência", value: "Pendência", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Omissão de Comp. Familiar", value: "Omissão de Componente Familiar", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { label: "Usuário não Encontrado", value: "Usuário não Encontrado", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { label: "Endereço não Localizado", value: "Endereço não Localizado", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { label: "Agendamento no CRAS", value: "Agendamento no CRAS", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

const ITEMS_PER_PAGE = 15;

function parseBRDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return null;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toBRDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("TODOS");
  const [selectedBairro, setSelectedBairro] = useState("TODOS");
  
  // Navigation Mode Tabs:
  // "AGENDA" = View by specific Day
  // "FILA" = Unscheduled backlog
  // "TODAS" = All with pagination
  const [viewMode, setViewMode] = useState<"AGENDA" | "FILA" | "TODAS">("AGENDA");

  // Selected Day for Agenda
  const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));

  // Pagination for "TODAS"
  const [currentPage, setCurrentPage] = useState(1);

  // Batch Scheduling Selection
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [batchDate, setBatchDate] = useState<string>(toISODate(new Date()));
  const [batchLoading, setBatchLoading] = useState(false);

  // Edit / Modal State
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Visita | null>(null);
  const [modalStatus, setModalStatus] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalBairro, setModalBairro] = useState("");
  const [modalEndereco, setModalEndereco] = useState("");
  const [modalReferencia, setModalReferencia] = useState("");
  const [modalTelefone, setModalTelefone] = useState("");
  const [modalObservacoes, setModalObservacoes] = useState("");

  const todayBR = useMemo(() => toBRDate(toISODate(new Date())), []);
  const selectedDateBR = useMemo(() => toBRDate(selectedDate), [selectedDate]);

  const loadVisitas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/visitas", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setVisitas(data.visitas || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitas();
  }, []);

  // Unique Bairros List
  const bairrosList = useMemo(() => {
    const set = new Set<string>();
    visitas.forEach((v) => {
      if (v.bairro && v.bairro.trim()) {
        set.add(v.bairro.trim());
      }
    });
    return Array.from(set).sort();
  }, [visitas]);

  // Quick Day Stepper
  const changeDay = (offset: number) => {
    const cur = new Date(`${selectedDate}T00:00:00`);
    cur.setDate(cur.getDate() + offset);
    setSelectedDate(toISODate(cur));
  };

  const setDayToday = () => {
    setSelectedDate(toISODate(new Date()));
  };

  const handleToggleCadUnico = async (visita: Visita) => {
    setUpdatingRow(visita.rowNumber);
    const newCadUnico = !visita.cadUnicoAtualizado;

    try {
      const res = await fetch(`/api/visitas/${visita.rowNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadUnicoAtualizado: newCadUnico }),
      });

      if (res.ok) {
        setVisitas((prev) =>
          prev.map((v) =>
            v.rowNumber === visita.rowNumber
              ? { ...v, cadUnicoAtualizado: newCadUnico }
              : v
          )
        );
      }
    } catch (err) {
      console.error("Erro ao alternar CadÚnico", err);
    } finally {
      setUpdatingRow(null);
    }
  };

  const handleSaveModal = async () => {
    if (!editingItem) return;
    setUpdatingRow(editingItem.rowNumber);

    try {
      const formattedDate = modalDate ? toBRDate(modalDate) : editingItem.data;
      const res = await fetch(`/api/visitas/${editingItem.rowNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: modalStatus,
          data: formattedDate,
          bairro: modalBairro,
          endereco: modalEndereco,
          referencia: modalReferencia,
          telefone: modalTelefone,
          observacoes: modalObservacoes,
        }),
      });

      if (res.ok) {
        setVisitas((prev) =>
          prev.map((v) =>
            v.rowNumber === editingItem.rowNumber
              ? {
                  ...v,
                  status: modalStatus,
                  data: formattedDate,
                  bairro: modalBairro,
                  endereco: modalEndereco,
                  referencia: modalReferencia,
                  telefone: modalTelefone,
                  observacoes: modalObservacoes,
                }
              : v
          )
        );
        setEditingItem(null);
      }
    } catch (err) {
      console.error("Erro ao atualizar visita", err);
    } finally {
      setUpdatingRow(null);
    }
  };

  // Batch Scheduling handler
  const handleBatchSchedule = async () => {
    if (selectedRows.length === 0 || !batchDate) return;
    setBatchLoading(true);

    try {
      const brDate = toBRDate(batchDate);
      await Promise.all(
        selectedRows.map((rowNum) =>
          fetch(`/api/visitas/${rowNum}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: brDate }),
          })
        )
      );

      setVisitas((prev) =>
        prev.map((v) =>
          selectedRows.includes(v.rowNumber) ? { ...v, data: brDate } : v
        )
      );
      setSelectedRows([]);
    } catch (err) {
      console.error("Erro no agendamento em lote", err);
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleSelectRow = (rowNum: number) => {
    setSelectedRows((prev) =>
      prev.includes(rowNum) ? prev.filter((r) => r !== rowNum) : [...prev, rowNum]
    );
  };

  const toggleSelectAll = (list: Visita[]) => {
    if (selectedRows.length === list.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(list.map((v) => v.rowNumber));
    }
  };

  const openEditModal = (v: Visita) => {
    setEditingItem(v);
    setModalStatus(v.status || "Visita Realizada");
    setModalBairro(v.bairro || "");
    setModalEndereco(v.endereco || "");
    setModalReferencia(v.referencia || "");
    setModalTelefone(v.telefone || "");
    setModalObservacoes(v.observacoes || "");

    if (v.data) {
      const parsed = parseBRDate(v.data);
      setModalDate(parsed ? toISODate(parsed) : "");
    } else {
      setModalDate(selectedDate);
    }
  };

  // Metrics by Category
  const counts = useMemo(() => {
    let diaCount = 0;
    let semDataCount = 0;

    visitas.forEach((v) => {
      if (!v.data) semDataCount++;
      else if (v.data === selectedDateBR) diaCount++;
    });

    return {
      dia: diaCount,
      semData: semDataCount,
      total: visitas.length,
    };
  }, [visitas, selectedDateBR]);

  // Filtered List based on viewMode, Search, Status, and Bairro
  const activeList = useMemo(() => {
    return visitas.filter((v) => {
      // 1. Text Search (Nome, CPF, Endereço ou Bairro)
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        v.usuario.toLowerCase().includes(term) ||
        v.cpf.replace(/\D/g, "").includes(term.replace(/\D/g, "")) ||
        (v.bairro && v.bairro.toLowerCase().includes(term)) ||
        (v.endereco && v.endereco.toLowerCase().includes(term));

      // 2. Status Filter
      const matchesStatus =
        selectedStatus === "TODOS"
          ? true
          : selectedStatus === "SEM_STATUS"
          ? !v.status
          : v.status.includes(selectedStatus);

      // 3. Bairro Filter
      const matchesBairro =
        selectedBairro === "TODOS" ? true : v.bairro === selectedBairro;

      if (!matchesSearch || !matchesStatus || !matchesBairro) return false;

      // 4. View Mode condition
      if (viewMode === "AGENDA") {
        return v.data === selectedDateBR;
      }
      if (viewMode === "FILA") {
        return !v.data || v.data.trim() === "";
      }
      return true; // "TODAS"
    });
  }, [visitas, searchTerm, selectedStatus, selectedBairro, viewMode, selectedDateBR]);

  // Paginated List (used for "TODAS" and as safety guard)
  const paginatedList = useMemo(() => {
    if (viewMode !== "TODAS") return activeList;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeList.slice(start, start + ITEMS_PER_PAGE);
  }, [activeList, viewMode, currentPage]);

  const totalPages = Math.ceil(activeList.length / ITEMS_PER_PAGE) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestão Operacional de Visitas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organização diária, roteirização por bairro e integração completa com Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVisitas}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/cadastro"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo / Importar CSV</span>
          </Link>
        </div>
      </div>

      {/* TOP VIEW MODE TABS */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200">
        <button
          onClick={() => {
            setViewMode("AGENDA");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === "AGENDA"
              ? "bg-white text-blue-700 shadow-sm shadow-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          <span>Agenda do Dia</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${
            viewMode === "AGENDA" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
          }`}>
            {counts.dia}
          </span>
        </button>

        <button
          onClick={() => {
            setViewMode("FILA");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === "FILA"
              ? "bg-white text-amber-800 shadow-sm shadow-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Inbox className="w-4 h-4 text-amber-600" />
          <span>Fila de Espera (Aguardando Data)</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${
            viewMode === "FILA" ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-700"
          }`}>
            {counts.semData}
          </span>
        </button>

        <button
          onClick={() => {
            setViewMode("TODAS");
            setCurrentPage(1);
          }}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === "TODAS"
              ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ListOrdered className="w-4 h-4 text-slate-600" />
          <span>Todas as Visitas (Paginadas)</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${
            viewMode === "TODAS" ? "bg-slate-200 text-slate-800" : "bg-slate-200 text-slate-700"
          }`}>
            {counts.total}
          </span>
        </button>
      </div>

      {/* CONTROLE TEMPORAL ESPECÍFICO QUANDO NO MODO "AGENDA" */}
      {viewMode === "AGENDA" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => changeDay(-1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={setDayToday}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                selectedDateBR === todayBR
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Hoje
            </button>

            <button
              onClick={() => changeDay(1)}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer"
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Calendar className="w-4 h-4 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-semibold text-slate-900 bg-transparent border-0 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 text-right w-full sm:w-auto">
            Data Selecionada: <strong className="text-blue-700 font-bold">{selectedDateBR}</strong>
            {selectedDateBR === todayBR && <span className="ml-1 text-emerald-600 font-medium">(Hoje)</span>}
          </div>
        </div>
      )}

      {/* BARRA DE AGENDAMENTO EM LOTE QUANDO NA "FILA DE ESPERA" */}
      {viewMode === "FILA" && selectedRows.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="text-xs text-amber-900 font-medium">
            <strong>{selectedRows.length} famílias selecionadas</strong> da fila de espera.
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800">Agendar para:</span>
            <input
              type="date"
              value={batchDate}
              onChange={(e) => setBatchDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-amber-300 bg-white font-medium"
            />
            <button
              onClick={handleBatchSchedule}
              disabled={batchLoading}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {batchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarCheck className="w-3.5 h-3.5" />}
              <span>Agendar Selecionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, endereço ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bairro Filter */}
          {bairrosList.length > 0 && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                value={selectedBairro}
                onChange={(e) => setSelectedBairro(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-700 cursor-pointer font-medium"
              >
                <option value="TODOS">Todos os Bairros ({bairrosList.length})</option>
                {bairrosList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-700 cursor-pointer font-medium"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="SEM_STATUS">Aguardando Realização</option>
              <option value="Realizada">Visita Realizada</option>
              <option value="Pendência">Pendência</option>
              <option value="Omissão">Omissão Familiar</option>
              <option value="não Encontrado">Não Encontrado</option>
              <option value="Endereço">Endereço Inexistente</option>
              <option value="Agendamento">Agendamento no CRAS</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE VISITAS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            {viewMode === "FILA" && (
              <button
                onClick={() => toggleSelectAll(activeList)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Selecionar todos"
              >
                {selectedRows.length === activeList.length && activeList.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            <span>
              {viewMode === "AGENDA" && `Visitas Agendadas para ${selectedDateBR} (${activeList.length})`}
              {viewMode === "FILA" && `Fila de Espera aguardando agendamento (${activeList.length})`}
              {viewMode === "TODAS" && `Todas as Visitas Cadastradas (${activeList.length})`}
            </span>
          </div>

          <span className="text-slate-400 font-normal">Sincronizado com Google Sheets (Colunas A-J)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                {viewMode === "FILA" && <th className="py-3 px-3 w-8"></th>}
                <th className="py-3 px-4 font-semibold">Linha</th>
                <th className="py-3 px-4 font-semibold">Data da Visita</th>
                <th className="py-3 px-4 font-semibold">Beneficiário (RF) & Localização</th>
                <th className="py-3 px-4 font-semibold">CPF</th>
                <th className="py-3 px-4 font-semibold">Status da Visita</th>
                <th className="py-3 px-4 font-semibold text-center">CadÚnico Atualizado?</th>
                <th className="py-3 px-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={viewMode === "FILA" ? 8 : 7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Carregando dados da planilha...
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === "FILA" ? 8 : 7} className="py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {viewMode === "AGENDA"
                          ? `Nenhuma visita agendada para ${selectedDateBR}`
                          : "Nenhum registro encontrado"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {viewMode === "AGENDA"
                          ? "Você pode agendar famílias da Fila de Espera para este dia ou alterar o dia no calendário."
                          : "Tente mudar os filtros de busca ou cadastrar novas visitas."}
                      </p>
                      {viewMode === "AGENDA" && (
                        <button
                          onClick={() => setViewMode("FILA")}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Ir para Fila de Espera ({counts.semData} aguardando) →
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((v) => (
                  <tr key={v.rowNumber} className="hover:bg-slate-50/80 transition-colors">
                    {viewMode === "FILA" && (
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleSelectRow(v.rowNumber)}
                          className="cursor-pointer text-slate-400 hover:text-amber-700"
                        >
                          {selectedRows.includes(v.rowNumber) ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}

                    <td className="py-3 px-4 text-xs font-mono text-slate-400">
                      #{v.rowNumber}
                    </td>

                    <td className="py-3 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {v.data ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold ${
                          v.data === todayBR 
                            ? "bg-blue-100 text-blue-800 border border-blue-200" 
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {v.data}
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          Aguardando Data
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>
                        <span>{v.usuario}</span>
                        
                        {/* Endereço, Bairro e Contato estruturados */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {v.bairro && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <MapPin className="w-3 h-3 text-blue-600" />
                              {v.bairro}
                            </span>
                          )}
                          {v.endereco && (
                            <span className="text-xs text-slate-500 truncate max-w-xs" title={v.endereco}>
                              {v.endereco}
                            </span>
                          )}
                          {v.telefone && (
                            <a
                              href={`tel:${v.telefone.replace(/\D/g, "")}`}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hover:underline"
                              title="Ligar para o beneficiário"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {v.telefone}
                            </a>
                          )}
                        </div>

                        {v.referencia && (
                          <p className="text-[11px] text-amber-800/80 italic mt-0.5">
                            Ref: {v.referencia}
                          </p>
                        )}
                        {v.observacoes && (
                          <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                            {v.observacoes}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {v.cpf}
                    </td>

                    <td className="py-3 px-4">
                      {v.status ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          v.status.includes("Realizada")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.status.includes("Pendência")
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : v.status.includes("Omissão")
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : v.status.includes("não Encontrado")
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : v.status.includes("Endereço")
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}>
                          {v.status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Aguardando visita
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleCadUnico(v)}
                        disabled={updatingRow === v.rowNumber}
                        className="inline-flex items-center justify-center p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Clique para alternar conferência no CadÚnico"
                      >
                        {updatingRow === v.rowNumber ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        ) : v.cadUnicoAtualizado ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Check className="w-3.5 h-3.5" />
                            SIM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            NÃO
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(v)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs shrink-0"
                        title="Registrar resultado da visita ou atualizar dados"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Registrar Visita</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {viewMode === "TODAS" && totalPages > 1 && (
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, activeList.length)} de {activeList.length} registros
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>

              <span className="px-2 font-semibold">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DESPACHO E EDIÇÃO DE DADOS */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ficha de Registro da Visita
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Beneficiário: <strong className="text-slate-800">{editingItem.usuario}</strong> (Linha #{editingItem.rowNumber}) • Desfecho & Atualização
                </p>
              </div>

              {modalTelefone && (
                <a
                  href={`https://wa.me/55${modalTelefone.replace(/\D/g, "")}?text=Ol%C3%A1,%20aqui%20%C3%A9%20do%20CRAS%20referente%20%C3%A0%20visita%20domiciliar.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Data Agendada da Visita
              </label>
              <input
                type="date"
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              />
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status da Visita
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setModalStatus(opt.value)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                      modalStatus === opt.value
                        ? `${opt.color} ring-2 ring-blue-500 font-bold`
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {modalStatus === opt.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Localização Fields */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-600" />
                <span>Dados de Localização & Contato</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={modalBairro}
                    onChange={(e) => setModalBairro(e.target.value)}
                    placeholder="Ex: Jordoa"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={modalTelefone}
                    onChange={(e) => setModalTelefone(e.target.value)}
                    placeholder="(98) 9XXXX-XXXX"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Endereço (Rua, Número)</label>
                <input
                  type="text"
                  value={modalEndereco}
                  onChange={(e) => setModalEndereco(e.target.value)}
                  placeholder="Ex: Rua da União, 16"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ponto de Referência</label>
                <input
                  type="text"
                  value={modalReferencia}
                  onChange={(e) => setModalReferencia(e.target.value)}
                  placeholder="Ex: Em frente ao Pop Car"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Observações Técnicas</label>
                <input
                  type="text"
                  value={modalObservacoes}
                  onChange={(e) => setModalObservacoes(e.target.value)}
                  placeholder="Ex: Família comunicou alteração de renda"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={updatingRow === editingItem.rowNumber}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {updatingRow === editingItem.rowNumber ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Salvar na Planilha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
