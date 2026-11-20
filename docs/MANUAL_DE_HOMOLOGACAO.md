# Manual de Testes e Homologação Piloto
## CRAS Visitas — Sistema de Gestão Socioassistencial

**Versão da Aplicação:** 1.0.0 (Piloto de Campo)  
**Ambiente:** Produção (Cloudflare Pages)  
**Link de Acesso Oficial:** [https://27-app-cras-visitas-domiciliares.pages.dev](https://27-app-cras-visitas-domiciliares.pages.dev)  
**Data de Emissão:** Novembro de 2026  
**Público-Alvo:** Assistentes Sociais, Técnicos do CadÚnico/Bolsa Família e Coordenação do CRAS  

---

## 1. Dados de Acesso para Homologação

Para iniciar a avaliação do sistema, utilize a credencial piloto configurada para a equipe de campo:

* **URL de Acesso:** `https://27-app-cras-visitas-domiciliares.pages.dev`
* **E-mail de Login:** `marilia.cras@saoluis.ma.gov.br`
* **Senha:** `cras2026`

---

## 2. Instalação como Aplicativo no Celular (PWA)

O sistema foi arquitetado como **Progressive Web App (PWA)**, permitindo ser instalado na tela inicial do celular com abertura em tela cheia (sem as barras do navegador), oferecendo sensação idêntica à de um aplicativo nativo.

### No iPhone (iOS / Safari):
1. Abra o link da aplicação no navegador **Safari**.
2. Toque no botão de **Compartilhar** (ícone quadrado com uma seta para cima `↑` no rodapé da tela).
3. Role as opções para baixo e selecione **"Adicionar à Tela de Início"** (*Add to Home Screen*).
4. Confirme o nome **CRAS Visitas** e toque em **Adicionar** no canto superior direito.
5. Um ícone azul institucional será criado na sua tela de aplicativos.

### No Android (Google Chrome):
1. Abra o link da aplicação no **Chrome**.
2. Toque no aviso inferior que sugere **"Instalar aplicativo"** ou toque nos **3 pontinhos verticais** no canto superior direito.
3. Selecione **"Instalar aplicativo"** (ou *"Adicionar à tela inicial"*).
4. Confirme a instalação.

---

## 3. Guia Operacional Passo a Passo

### Etapa 1: Navegação Mobile Ergonômica (Bottom Tab Bar)
Ao utilizar no celular, observe que a barra superior permanece limpa e a navegação principal fica posicionada no rodapé da tela, facilitando o uso com uma mão só:
* **📊 Dashboard:** Visão macro dos indicadores e cumprimento de metas.
* **📋 Visitas:** Painel operacional de rotas, agenda do dia e fila de espera.
* **➕ Novo / CSV:** Formulário ágil de cadastro de nova família em campo.
* **📑 Planilha:** Acesso direto à planilha Google Sheets oficial sincronizada na nuvem.
* **Sair:** Botão de encerramento de sessão localizado no topo à direita.

---

### Etapa 2: Painel de Indicadores (Dashboard)
1. Acesse a aba **Dashboard**.
2. Verifique o total de famílias cadastradas (61 registros ativos na base piloto).
3. Analise a distribuição dos 6 status socioassistenciais oficiais:
   * *Visita Realizada*
   * *Pendência Cadastral*
   * *Omissão Familiar*
   * *Usuário Não Encontrado*
   * *Endereço Não Localizado*
   * *Agendamento no CRAS*
4. Teste o botão **"Sincronizar"** para validar a consulta em tempo real à base de dados.

---

### Etapa 3: Gestão de Visitas & Rota Inteligente no Google Maps
Acesse a aba **Visitas** (`/visitas`) para testar o núcleo operacional do sistema:

#### A. Agenda do Dia:
1. Veja que o topo exibe o seletor de datas. Na data de hoje (`16/11/2026`), você encontrará o registro:
   * **Beneficiário:** `TESTE CRAS - FAMÍLIA SILVA`
   * **Bairro:** `Centro` — *Praça Pedro II, s/n (Próximo ao Palácio dos Leões)*
2. Toque no botão verde destacado **`Rota Maps ↗`**.
3. O Google Maps abrirá automaticamente já traçando a rota geográfica para o endereço da família em São Luís - MA.

#### B. Fila de Espera (Famílias sem data definida):
1. Toque na aba **"Fila de Espera (Aguardando Data)"**.
2. Veja as 60 famílias aguardando agendamento.
3. Selecione as caixas de seleção (*checkboxes*) de uma ou mais famílias.
4. Escolha uma data no seletor de lote e clique em **"Agendar Selecionadas"**. As famílias serão automaticamente transferidas para a agenda daquele dia.

#### C. Todas as Visitas & Filtros Avançados:
1. Toque na aba **"Todas as Visitas (Paginadas)"**.
2. Teste o campo de busca digitando o nome de um beneficiário, CPF ou bairro.
3. Teste o filtro seletivo de **Bairros** ou de **Status da Visita**.
4. Navegue entre as páginas (1 a 5) no rodapé.

---

### Etapa 4: Registro de Visita e Sincronização com Google Sheets
1. Em qualquer família listada, toque no botão **"Registrar Visita"** (ícone de prancheta).
2. No modal que se abrirá, você poderá:
   * Alterar o status da visita (ex.: de *Pendência* para *Visita Realizada*).
   * Marcar se o **CadÚnico foi atualizado** (Sim / Não).
   * Atualizar telefone de contato ou adicionar observações técnicas da visita domiciliar.
3. Toque em **"Salvar Alterações"**.
4. **Validação:** A alteração é gravada imediatamente na linha correspondente da Planilha Google Sheets na nuvem, sem necessidade de recarregar a tela.

---

### Etapa 5: Novo Cadastro e Importação de Dados
1. Acesse a aba **"Novo / CSV"** (`/cadastro`).
2. **Cadastro Individual:** Preencha os campos básicos de uma nova família (Nome do Responsável Familiar, CPF, Bairro, Endereço e Ponto de Referência) e salve.
3. **Importação CSV:** Visualize a área de importação em massa, ideal para recepcionar listagens periódicas encaminhadas pela Secretaria ou pelo CadÚnico Central.

---

## 4. Checklist para Homologação da Equipe

Durante os testes de campo, solicitamos especial atenção aos seguintes itens:

- [ ] Abertura rápida e fluida no navegador do celular (Safari e Chrome).
- [ ] Instalação bem-sucedida na Tela de Início via PWA.
- [ ] Abertura precisa do Google Maps ao tocar em **`Rota Maps ↗`**.
- [ ] Facilidade de toque e leitura na barra inferior (**Bottom Tab Bar**).
- [ ] Agendamento de visitas pela Fila de Espera.
- [ ] Atualização do status de uma visita com conferência na planilha Google Sheets.
- [ ] Clareza visual dos cartões de métricas no Dashboard.

---

**Suporte Técnico e Observações:** Qualquer dúvida, instabilidade ou sugestão de melhoria identificada durante os testes pode ser reportada diretamente à equipe de engenharia da **Autonomous IA**.
