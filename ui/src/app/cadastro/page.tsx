"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UserPlus, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  Trash2
} from "lucide-react";
import { formatCPF, validateCPF } from "@/lib/cpf";

interface CSVPreviewRow {
  usuario: string;
  cpf: string;
  cpfValido: boolean;
  bairro?: string;
  endereco?: string;
  referencia?: string;
  telefone?: string;
}

export default function CadastroPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");

  // Form State (Manual)
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [bairro, setBairro] = useState("Jordoa");
  const [endereco, setEndereco] = useState("");
  const [referencia, setReferencia] = useState("");
  const [telefone, setTelefone] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState("");

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<CSVPreviewRow[]>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState<number | null>(null);
  const [csvError, setCsvError] = useState("");

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");
    setManualSuccess(false);

    if (!validateCPF(cpf)) {
      setManualError("O CPF informado é matematicamente inválido. Verifique os dígitos.");
      return;
    }

    setManualLoading(true);
    try {
      const res = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: nome.toUpperCase().trim(),
          cpf: cpf.trim(),
          bairro: bairro.trim(),
          endereco: endereco.trim(),
          referencia: referencia.trim(),
          telefone: telefone.trim(),
          observacoes: "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar na planilha");
      }

      setManualSuccess(true);
      setNome("");
      setCpf("");
      setEndereco("");
      setReferencia("");
      setTelefone("");
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setManualLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Nome;CPF;Bairro;Endereco;Referencia;Telefone\nMaria da Silva;123.456.789-01;Jordoa;Rua da Uniao 16;Em frente ao Pop Car;98989132323\nJoao dos Santos;234.567.890-12;Filipinho;Rua da Alegria 18 A;Antiga Rua da Vala;989074970";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modelo_visitas_cras.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setCsvError("O arquivo CSV precisa conter cabeçalho e pelo menos 1 linha de dados.");
      return;
    }

    // Detect separator (; or ,)
    const headerLine = lines[0];
    const separator = headerLine.includes(";") ? ";" : ",";

    const parsed: CSVPreviewRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(separator).map((p) => p.replace(/^"|"$/g, "").trim());
      const rawNome = parts[0] || "";
      const rawCpf = parts[1] || "";
      if (!rawNome && !rawCpf) continue;

      const formatted = formatCPF(rawCpf);
      parsed.push({
        usuario: rawNome.toUpperCase(),
        cpf: formatted,
        cpfValido: validateCPF(formatted),
        bairro: parts[2] || "",
        endereco: parts[3] || "",
        referencia: parts[4] || "",
        telefone: parts[5] || "",
      });
    }

    setCsvRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    setCsvSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (csvRows.length === 0) return;
    setCsvLoading(true);
    setCsvError("");

    try {
      const payload = csvRows.map((r) => ({
        usuario: r.usuario,
        cpf: r.cpf,
        bairro: r.bairro || "",
        endereco: r.endereco || "",
        referencia: r.referencia || "",
        telefone: r.telefone || "",
        observacoes: "",
      }));

      const res = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar lote na planilha");
      }

      const data = await res.json();
      setCsvSuccess(data.count || payload.length);
      setCsvRows([]);
      setCsvFile(null);
    } catch (err: unknown) {
      setCsvError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Adicionar Visitas à Fila
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cadastre novas famílias manualmente ou importe lotes inteiros via arquivo CSV
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("manual")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "manual"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastro Manual Unitário</span>
        </button>

        <button
          onClick={() => setActiveTab("csv")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "csv"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Importação em Lote (CSV)</span>
        </button>
      </div>

      {/* TAB 1: CADASTRO MANUAL */}
      {activeTab === "manual" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {manualSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Beneficiário cadastrado e adicionado com sucesso à planilha online!</span>
              </div>
              <button
                onClick={() => router.push("/visitas")}
                className="text-xs font-semibold text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver fila</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {manualError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome do Responsável Familiar (RF) *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria de Fátima Silva"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  CPF do RF *
                </label>
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    cpf.length === 14
                      ? validateCPF(cpf)
                        ? "border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500"
                        : "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                  }`}
                />
                {cpf.length === 14 && (
                  <p className={`text-[11px] mt-1 ${validateCPF(cpf) ? "text-emerald-600" : "text-rose-600"}`}>
                    {validateCPF(cpf) ? "✓ CPF válido" : "✗ CPF inválido"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bairro / Localidade
                </label>
                <select
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Jordoa">Jordoa</option>
                  <option value="João Paulo">João Paulo</option>
                  <option value="Filipinho">Filipinho</option>
                  <option value="Redenção">Redenção</option>
                  <option value="Bares">Bares</option>
                  <option value="Outro">Outro Bairro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(98) 99999-9999"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Endereço (Rua, Travessa e Número)
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Ex: Rua da União, nº 18"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ponto de Referência (Essencial para Visitas em Campo)
              </label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ex: Em frente ao Pop Car / Próximo à Escola Darcy Ribeiro"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={manualLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-70 cursor-pointer"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando na Planilha...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Família</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: IMPORTAÇÃO CSV EM LOTE */}
      {activeTab === "csv" && (
        <div className="space-y-6">
          {/* Instruções e Modelo */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Modelo Oficial de Importação
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                O arquivo CSV deve conter as colunas: <strong>Nome, CPF, Bairro, Endereco, Referencia, Telefone</strong>. Baixe o modelo pronto se desejar preencher direto no Excel.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Baixar Modelo CSV</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-8 text-center transition-colors">
            <input
              type="file"
              accept=".csv"
              id="csvUpload"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="csvUpload" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {csvFile ? csvFile.name : "Clique para selecionar o arquivo CSV"}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Formato suportado: .CSV (separado por vírgula ou ponto e vírgula)
              </span>
            </label>
          </div>

          {csvError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

          {csvSuccess !== null && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>{csvSuccess} famílias</strong> importadas com sucesso para a planilha online!
                </span>
              </div>
              <button
                onClick={() => router.push("/visitas")}
                className="text-xs font-semibold text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver fila completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Preview Table */}
          {csvRows.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Prévia dos Dados ({csvRows.length} registros encontrados)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Confira os dados antes de gravar na planilha oficial do Google Sheets.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCsvRows([]);
                      setCsvFile(null);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Descartar lote"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleBulkSubmit}
                    disabled={csvLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 cursor-pointer"
                  >
                    {csvLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando Lote...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Confirmar e Gravar {csvRows.length} Registros</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Nome do RF</th>
                      <th className="py-2.5 px-3">CPF</th>
                      <th className="py-2.5 px-3">Bairro</th>
                      <th className="py-2.5 px-3">Endereço & Ref.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{row.usuario}</td>
                        <td className="py-2 px-3 font-mono">
                          <span className={`inline-flex items-center gap-1 ${row.cpfValido ? "text-slate-700" : "text-rose-600 font-semibold"}`}>
                            {!row.cpfValido && <ShieldAlert className="w-3 h-3 text-rose-500" />}
                            {row.cpf}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.bairro || "—"}</td>
                        <td className="py-2 px-3 text-slate-500 truncate max-w-xs">
                          {[row.endereco, row.referencia].filter(Boolean).join(" • ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

