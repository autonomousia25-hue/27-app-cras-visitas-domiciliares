# Documento de Arquitetura de Software (SDD)
## CRAS Visitas — Sistema de Gestão Socioassistencial
**Versão:** 1.0.0 (Piloto)  
**Projeto:** `27-app-cras-visitas-domiciliares`  
**Data:** 10 de Novembro de 2026  
**Status:** APROVADO PELO CORTEX HUB

---

## 1. Visão Geral e Modelo de Negócio

O **CRAS Visitas** é uma aplicação web desenhada para modernizar o controle e a realização de visitas domiciliares a famílias beneficiárias do **Bolsa Família / CadÚnico** atendidas pelos Centros de Referência de Assistência Social (CRAS).

O sistema elimina o gargalo da digitação manual de fichas de papel rasuradas, fornecendo:
1. Interface limpa, responsiva e acessível para a operadora piloto (**Marília**).
2. Sincronização em tempo real com a **Planilha Oficial do Google Sheets** (`1VypcdcEoNt3eFb8FsLkaO5NL_CTuvTk4pSloVsLIcak`).
3. Módulo de auditoria e dupla conferência (`CadÚnico` vs `Sistema Local`).
4. Painel de indicadores (Dashboard) em tempo real com os 6 status oficiais do CRAS.

---

## 2. Padrões de Referência (Context by Reference — GitHub First)

Em conformidade com as diretrizes do esquadrão, a arquitetura do projeto absorve as melhores práticas consolidadas de engenharia:

- **Referência 1 (CRUD & Mutações):** [`wpcodevo/nextjs-crud-app-google-sheets`](https://github.com/wpcodevo/nextjs-crud-app-google-sheets)
  - *Inteligência Absorvida:* Estrutura de Server Actions para mutação atômica em linhas de planilha do Google Sheets, isolando as credenciais no lado do servidor e retornando estados com feedback visual imediato.
- **Referência 2 (Database Layer com Google Sheets):** [`hshiferaw/nextjs-google-sheets-database`](https://github.com/hshiferaw/nextjs-google-sheets-database)
  - *Inteligência Absorvida:* Camada de abstração de dados (DAL) tipada via TypeScript, tratando cada linha da aba `Visitas Domiciliares` como uma entidade de domínio estruturada.
- **Referência 3 (Dashboard e UI):** Padrões modernos do Tailwind CSS v4 e componentes Shadcn-inspired para dashboards com cartões de métricas e tabelas paginadas.

---

## 3. Arquitetura da Solução

### 3.1 Diagrama de Blocos

```
┌────────────────────────────────────────────────────────┐
│             Navegador Web / Mobile (PWA)               │
│                                                        │
│  [Tela de Login] ──> [Dashboard] ──> [Ficha de Visita] │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS (Next.js API Routes / Server Actions)
┌──────────────────────────▼─────────────────────────────┐
│               Servidor Next.js (Node.js)               │
│                                                        │
│  • Middleware de Autenticação (Sessão Segura)          │
│  • Camada DAL (Data Access Layer - Google Sheets API)  │
│  • Validador de CPF e Formatador de Máscaras           │
└──────────────────────────┬─────────────────────────────┘
                           │ Google Sheets API v4 (OAuth2 / Service Token)
┌──────────────────────────▼─────────────────────────────┐
│          Google Drive / Google Sheets (Nuvem)          │
│                                                        │
│  Arquivo: "Visitas Domiciliares CRAS BF"               │
│  • Aba: 'Visitas Domiciliares' (A7:Z)                  │
│  • Aba: 'Dashboard' (Totais e fórmulas automáticas)   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Estrutura de Dados e Contrato da Planilha (Migração A-J Homologada)

### Colunas Oficiais (Aba `Visitas Domiciliares` - A7:J):
| Coluna | Campo | Tipo | Descrição |
| :---: | :--- | :--- | :--- |
| **A** | `Data` | String (DD/MM/AAAA) | Data agendada ou de realização da visita domiciliar |
| **B** | `Usuário` | String | Nome completo do Responsável Familiar (RF) |
| **C** | `CPF` | String (XXX.XXX.XXX-XX) | CPF validado matematicamente do Responsável Familiar |
| **D** | `Bairro` | String | Bairro de residência (para roteirização geográfica de campo) |
| **E** | `Endereço` | String | Logradouro, número e complemento do domicílio |
| **F** | `Ponto de Referência` | String | Ponto de apoio para localização física da casa em campo |
| **G** | `Telefone` | String | Telefone de contato do beneficiário (com atalho para WhatsApp) |
| **H** | `Status da Visita` | Enum | Um dos 6 status socioassistenciais homologados pelo CRAS |
| **I** | `CadÚnico Atualizado` | Booleano (SIM/NÃO) | Dupla checagem: conferido e atualizado no sistema CadÚnico oficial |
| **J** | `Observações` | String | Ocorrências técnicas, relato de visita ou notas da equipe |

### Taxonomia Oficial dos Status:
1. `Visita Realizada` (Verde - Sucesso em campo)
2. `Pendência` (Amarelo - Documentação pendente)
3. `Omissão de Componente Familiar` (Roxo - Averiguação cadastral)
4. `Usuário não Encontrado` (Azul - Ausente no domicílio)
5. `Endereço não Localizado` (Vermelho - Endereço inexistente ou não encontrado)
6. `Agendamento no CRAS` (Ciano - Convocação para atendimento presencial)

---

## 5. Módulos do Sistema

### 5.1 Módulo de Autenticação (Login Individual)
- Tela de login individual para a operadora piloto (**Marília**).
- Sessão segura persistida via cookie `HttpOnly` com criptografia.
- Preparado para expansão futura multi-usuário (administrador, técnicos de campo, coordenação).

### 5.2 Módulo Dashboard (Painel de Indicadores)
- 6 Cards no topo com as métricas em tempo real (Total de Visitas, Realizadas, Pendências, etc.).
- Gráfico de barras com distribuição de status.
- Alerta visual para casos críticos (Omissão de Componente Familiar e Endereço não Localizado).

### 5.3 Módulo de Gestão de Visitas (Tabela & Cadastro Rápido)
- Busca instantânea por Nome, CPF e Bairro.
- Edição rápida do Status da Visita e do checkbox de atualização no CadÚnico.
- Formulário para inserção de novas famílias com validação de CPF e máscara em tempo real.
- **Integração com Google Maps (Universal Search & Deep-Linking):**
  - Geração dinâmica de links de rota e localização combinando `[Endereço, Bairro, "São Luís - MA"]`.
  - Atalho `Rota Maps` na tabela de visitas e botão `Ver no Google Maps` no modal de edição.
  - Deep-link compatível com dispositivos móveis (abre automaticamente o app do Google Maps / Waze para o técnico de campo iniciar a rota via GPS).

### 5.4 Rodapé Institucional Mandatório
Toda tela renderiza o componente oficial de marca:
```tsx
<footer className="w-full py-4 border-t text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
  <span>Desenvolvido por</span>
  <a
    href="https://www.autonomousia.com.br/"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors group"
  >
    <span>Autonomous IA</span>
    <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </a>
</footer>
```

---

## 6. Plano de Entrega (TDD e Fases do Esquadrão)

1. **Fase 1 (Design & Prototipagem):**
   - Criação da estrutura base do Next.js na pasta `ui/`.
   - Setup dos componentes de UI (Tailwind CSS v4 + Lucide Icons).
2. **Fase 2 (Integração Google Sheets):**
   - Implementação das rotas de API `/api/visitas` (GET, POST, PATCH).
   - Testes automatizados de leitura e escrita.
3. **Fase 3 (Telas Operacionais & Dashboard):**
   - Interface de Login, Tabela dinâmica e Cards de KPI.
4. **Fase 4 (Validação com Marília / Usuário Final):**
   - Testes de ponta a ponta com os 60 registros existentes.

