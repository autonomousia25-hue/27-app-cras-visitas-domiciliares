import fs from "fs";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1VypcdcEoNt3eFb8FsLkaO5NL_CTuvTk4pSloVsLIcak";
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || "C:/Users/Usuário/.gemini/antigravity/plugin_data/gdrive/token.json";

export interface Visita {
  rowNumber: number; // 7-indexed in Sheets
  data: string; // Col A
  usuario: string; // Col B
  cpf: string; // Col C
  bairro: string; // Col D
  endereco: string; // Col E
  referencia: string; // Col F
  telefone: string; // Col G
  status: string; // Col H
  cadUnicoAtualizado: boolean; // Col I
  observacoes: string; // Col J
}

export interface MetricSummary {
  total: number;
  realizada: number;
  pendencia: number;
  omissao: number;
  naoEncontrado: number;
  enderecoNaoLocalizado: number;
  agendamentoCras: number;
}

function getTokenData(): any {
  if (process.env.GOOGLE_TOKEN_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_TOKEN_JSON);
    } catch {
      throw new Error("Invalid GOOGLE_TOKEN_JSON environment variable");
    }
  }
  if (TOKEN_PATH && fs.existsSync(TOKEN_PATH)) {
    const raw = fs.readFileSync(TOKEN_PATH, "utf-8");
    return JSON.parse(raw);
  }
  throw new Error(`Token credentials not found in GOOGLE_TOKEN_JSON or at ${TOKEN_PATH}`);
}

function saveTokenData(data: any): void {
  try {
    if (TOKEN_PATH && fs.existsSync(TOKEN_PATH)) {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
  } catch (e) {
    console.warn("Could not save refreshed token to disk (serverless environment):", e);
  }
}

async function getAccessToken(): Promise<string> {
  const data = getTokenData();

  const tokenObj = data.token || {};
  let accessToken = tokenObj.access_token;
  const refreshToken = tokenObj.refresh_token;
  const clientId = data.client_id;
  const clientSecret = data.client_secret;

  // Function to refresh token
  const refresh = async (): Promise<string> => {
    if (!refreshToken || !clientId || !clientSecret) {
      return accessToken;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (res.ok) {
      const refreshed = await res.json();
      data.token.access_token = refreshed.access_token;
      saveTokenData(data);
      return refreshed.access_token;
    }
    return accessToken;
  };

  // If expiry is in the past, refresh proactively
  if (tokenObj.expiry) {
    const expiryDate = new Date(tokenObj.expiry);
    if (new Date() >= expiryDate) {
      accessToken = await refresh();
    }
  }

  return accessToken;
}

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = await getAccessToken();
  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If 401, force refresh and retry once
  if (res.status === 401) {
    const data = getTokenData();
    const params = new URLSearchParams({
      client_id: data.client_id,
      client_secret: data.client_secret,
      refresh_token: data.token.refresh_token,
      grant_type: "refresh_token",
    });

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (refreshRes.ok) {
      const refreshed = await refreshRes.json();
      data.token.access_token = refreshed.access_token;
      saveTokenData(data);
      token = refreshed.access_token;

      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return res;
}

export async function fetchVisitas(): Promise<{ visitas: Visita[]; metrics: MetricSummary }> {
  // Read columns A to J from row 7 to 1000
  const range = encodeURIComponent("Visitas Domiciliares!A7:J1000");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;

  const res = await authenticatedFetch(url, { cache: "no-store" });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch from Google Sheets: ${res.status} ${errText}`);
  }

  const json = await res.json();
  const rows: string[][] = json.values || [];

  const visitas: Visita[] = [];
  const metrics: MetricSummary = {
    total: 0,
    realizada: 0,
    pendencia: 0,
    omissao: 0,
    naoEncontrado: 0,
    enderecoNaoLocalizado: 0,
    agendamentoCras: 0,
  };

  rows.forEach((row, idx) => {
    const usuario = row[1]?.trim() || "";
    if (!usuario) return; // skip empty rows

    // Columns mapping:
    // A (0): Data
    // B (1): Usuário
    // C (2): CPF
    // D (3): Bairro
    // E (4): Endereço
    // F (5): Ponto de Referência
    // G (6): Telefone
    // H (7): Status da Visita
    // I (8): CadÚnico Atualizado
    // J (9): Observações
    const status = row[7]?.trim() || "";
    const cadUnicoRaw = (row[8] || "").toLowerCase().trim();
    const cadUnicoAtualizado = cadUnicoRaw === "sim" || cadUnicoRaw === "ok" || cadUnicoRaw === "true";

    metrics.total++;
    if (status.includes("Realizada")) metrics.realizada++;
    else if (status.includes("Pendência") || status.includes("Pendencia")) metrics.pendencia++;
    else if (status.includes("Omissão") || status.includes("Omissao")) metrics.omissao++;
    else if (status.includes("não Encontrado") || status.includes("nao Encontrado")) metrics.naoEncontrado++;
    else if (status.includes("Endereço") || status.includes("Endereco")) metrics.enderecoNaoLocalizado++;
    else if (status.includes("Agendamento")) metrics.agendamentoCras++;

    visitas.push({
      rowNumber: 7 + idx,
      data: row[0] || "",
      usuario,
      cpf: row[2] || "",
      bairro: row[3] || "",
      endereco: row[4] || "",
      referencia: row[5] || "",
      telefone: row[6] || "",
      status,
      cadUnicoAtualizado,
      observacoes: row[9] || "",
    });
  });

  return { visitas, metrics };
}

export async function updateVisitaStatus(
  rowNumber: number,
  status?: string,
  cadUnicoAtualizado?: boolean,
  data?: string,
  observacoes?: string,
  bairro?: string,
  endereco?: string,
  referencia?: string,
  telefone?: string
): Promise<void> {
  const range = encodeURIComponent(`Visitas Domiciliares!A${rowNumber}:J${rowNumber}`);
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`;
  const getRes = await authenticatedFetch(getUrl);
  const current = (await getRes.json()).values?.[0] || ["", "", "", "", "", "", "", "", "", ""];

  const updatedData = data !== undefined ? data : current[0] || "";
  const updatedUsuario = current[1] || "";
  const updatedCpf = current[2] || "";
  const updatedBairro = bairro !== undefined ? bairro : current[3] || "";
  const updatedEndereco = endereco !== undefined ? endereco : current[4] || "";
  const updatedRef = referencia !== undefined ? referencia : current[5] || "";
  const updatedTel = telefone !== undefined ? telefone : current[6] || "";
  const updatedStatus = status !== undefined ? status : current[7] || "";
  const updatedCadUnico = cadUnicoAtualizado !== undefined 
    ? (cadUnicoAtualizado ? "SIM" : "NÃO") 
    : current[8] || "";
  const updatedObs = observacoes !== undefined ? observacoes : current[9] || "";

  const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
  const body = {
    range: `Visitas Domiciliares!A${rowNumber}:J${rowNumber}`,
    majorDimension: "ROWS",
    values: [[
      updatedData,
      updatedUsuario,
      updatedCpf,
      updatedBairro,
      updatedEndereco,
      updatedRef,
      updatedTel,
      updatedStatus,
      updatedCadUnico,
      updatedObs
    ]],
  };

  const putRes = await authenticatedFetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    throw new Error(`Failed to update row ${rowNumber}: ${await putRes.text()}`);
  }
}

export async function appendVisitas(
  newRows: Array<{ 
    usuario: string; 
    cpf: string; 
    bairro?: string; 
    endereco?: string; 
    referencia?: string; 
    telefone?: string; 
    data?: string; 
    status?: string;
    observacoes?: string; 
  }>
): Promise<number> {
  const range = encodeURIComponent("Visitas Domiciliares!A:J");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const values = newRows.map((r) => [
    r.data || new Date().toLocaleDateString("pt-BR"), // Col A: Data
    r.usuario,                                        // Col B: Usuário
    r.cpf,                                            // Col C: CPF
    r.bairro || "",                                   // Col D: Bairro
    r.endereco || "",                                 // Col E: Endereço
    r.referencia || "",                               // Col F: Referência
    r.telefone || "",                                 // Col G: Telefone
    r.status || "",                                   // Col H: Status
    "NÃO",                                            // Col I: CadÚnico
    r.observacoes || "",                              // Col J: Observações
  ]);

  const res = await authenticatedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    throw new Error(`Failed to append visits: ${await res.text()}`);
  }

  const json = await res.json();
  return json.updates?.updatedRows || values.length;
}
