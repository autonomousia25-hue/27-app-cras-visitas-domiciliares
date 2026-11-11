# CRAS Visitas — Sistema de Gestão Socioassistencial

Aplicação web moderna desenvolvida para modernizar o controle, agendamento e realização de visitas domiciliares a famílias beneficiárias do **Bolsa Família / CadÚnico** atendidas pelos Centros de Referência de Assistência Social (CRAS).

---

## 🚀 Funcionalidades Principais

1. **Painel de Monitoramento (Dashboard):**
   - 6 Cartões de Indicadores em tempo real (Total de Visitas, Realizadas, Pendências, Omissões de Componente Familiar, Usuários não Encontrados, Endereços Inexistentes).
   - Indicador de produtividade e integração direta com a base na nuvem.

2. **Gestão Operacional de Visitas (`/visitas`):**
   - Tabela dinâmica e veloz com busca instantânea por Nome e CPF.
   - Filtros por status de visita e pendência.
   - Atualização de status com 1 toque.
   - Checkbox de conferência rápida: **"Atualizado no CadÚnico"** (elimina a redundância e o retrabalho entre papel, planilha e sistema oficial).

3. **Módulo de Entrada (`/cadastro`):**
   - **Cadastro Manual:** Formulário com validação matemática instantânea de CPF, formatação automática de máscara e campos de endereço com ponto de referência de campo.
   - **Importação em Lote via CSV:** Arraste e solte arquivos `.csv` (com botão de download de modelo pronto). Inclui conferência de dados em tela antes de enviar o lote inteiro diretamente para a planilha online do Google Sheets.

4. **Sincronização com o Google Sheets:**
   - Integração direta com a planilha oficial do projeto via Google Sheets API v4.
   - Toda alteração feita no sistema reflete em tempo real na nuvem.

---

## 📂 Estrutura do Repositório

```
27-app-cras-visitas-domiciliares/
├── docs/
│   ├── DOCS_ARQUITETURA.md       # Documento de Arquitetura de Software (SDD)
│   ├── SPEC.md                   # Especificações e Histórias de Usuário
│   └── Visitas domiciliares...   # Cópia documental das fichas e planilhas originais
├── resources/
│   ├── Visitas_domiciliares_CRAS_BF.pdf   # Fichas digitalizadas originais
│   └── Visitas_Domiciliares_CRAS_BF.xlsx  # Planilha original
├── ui/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx # Painel de KPIs
│   │   │   ├── visitas/page.tsx   # Tabela interativa de visitas
│   │   │   ├── cadastro/page.tsx  # Cadastro manual e importador CSV
│   │   │   ├── login/page.tsx     # Acesso individual da operadora piloto
│   │   │   └── api/               # Endpoints REST de integração Google Sheets
│   │   ├── components/            # Navbar e Rodapé Institucional
│   │   └── lib/                   # Camada DAL Google Sheets e Validador CPF
│   └── package.json
└── README.md
```

---

## 🛠️ Como Executar a Aplicação Localmente

```bash
# 1. Acessar a pasta da interface
cd ui

# 2. Iniciar o servidor de desenvolvimento
pnpm dev
# ou
npm run dev
```

Acesse no navegador: **`http://localhost:3000`**

- **E-mail de acesso (Piloto):** `marilia.cras@saoluis.ma.gov.br`
- **Senha:** `cras2026`

---

Desenvolvido por [Autonomous IA](https://www.autonomousia.com.br/) ↗

