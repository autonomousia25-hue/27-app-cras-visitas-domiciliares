import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "CRAS Visitas — Manual de Testes e Homologação Piloto")
            self.drawRightString(612 - 54, 750, "Versão 1.0.0 (Piloto)")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 612 - 54, 744)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        
        footer_text = "Desenvolvido por Autonomous IA • www.autonomousia.com.br"
        self.drawString(54, 32, footer_text)
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(612 - 54, 32, page_str)
        self.restoreState()

def build_pdf(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # 54pt = 0.75in margins
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1E3A8A'), # Navy Blue
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E40AF'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1E293B')
    )

    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#1D4ED8')
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("CRAS Visitas — Manual de Testes e Homologação", title_style))
    story.append(Paragraph("Sistema de Gestão Socioassistencial e Roteirização Georreferenciada • Versão Piloto 1.0.0", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=12))

    # Access Info Box (Table)
    access_data = [
        [
            Paragraph("<b>URL OFICIAL:</b>", callout_style),
            Paragraph("https://27-app-cras-visitas-domiciliares.pages.dev", code_style)
        ],
        [
            Paragraph("<b>E-MAIL PILOTO:</b>", callout_style),
            Paragraph("marilia.cras@saoluis.ma.gov.br", code_style)
        ],
        [
            Paragraph("<b>SENHA PILOTO:</b>", callout_style),
            Paragraph("cras2026", code_style)
        ],
        [
            Paragraph("<b>PERFIL / PERMISSÃO:</b>", callout_style),
            Paragraph("Operadora de Campo • Assistente Social CRAS", callout_style)
        ]
    ]
    access_table = Table(access_data, colWidths=[120, 384])
    access_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#93C5FD')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DBEAFE')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(access_table)
    story.append(Spacer(1, 10))

    # Section 1: Instalação Mobile (PWA)
    story.append(Paragraph("1. Instalação como Aplicativo no Celular (PWA)", h1_style))
    story.append(Paragraph(
        "A aplicação é um <b>Progressive Web App (PWA)</b> completo. Ao ser adicionada à tela inicial, ela é executada em tela cheia (sem as barras do navegador), oferecendo performance e ergonomia idênticas às de um app nativo de smartphone.",
        body_style
    ))
    
    pwa_data = [
        [
            Paragraph("<b>No iPhone (iOS / Safari):</b>", h2_style),
            Paragraph("<b>No Android (Google Chrome):</b>", h2_style)
        ],
        [
            Paragraph("1. Acesse o link no navegador <b>Safari</b>.<br/>2. Toque no ícone de <b>Compartilhar</b> (quadrado com seta para cima <b>↑</b> no rodapé).<br/>3. Selecione <b>'Adicionar à Tela de Início'</b>.<br/>4. Confirme o nome <b>CRAS Visitas</b> e toque em <b>Adicionar</b>.", body_style),
            Paragraph("1. Acesse o link no <b>Google Chrome</b>.<br/>2. Toque no aviso inferior que sugere <b>'Instalar aplicativo'</b> ou nos 3 pontos no topo.<br/>3. Toque em <b>'Instalar aplicativo'</b>.<br/>4. Confirme a instalação na tela de início.", body_style)
        ]
    ]
    pwa_table = Table(pwa_data, colWidths=[246, 258])
    pwa_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(pwa_table)
    story.append(Spacer(1, 8))

    # Section 2: Navegação Mobile & Topo
    story.append(Paragraph("2. Ergonomia Operacional: Barra Inferior (Bottom Tab Bar)", h1_style))
    story.append(Paragraph(
        "Para garantir agilidade em campo, o sistema possui layout responsivo híbrido: em telas de celular, o topo é despoluído (mantendo apenas o logo e o botão de <b>Sair</b>) e a navegação fica posicionada na <b>Bottom Tab Bar</b> na base da tela, permitindo uso confortável com o polegar:",
        body_style
    ))
    story.append(Paragraph("• <b>📊 Dashboard:</b> Painel macro de metas, totais de famílias e distribuição percentual.", bullet_style))
    story.append(Paragraph("• <b>📋 Visitas:</b> Núcleo operacional diário com roteirização GPS e controle de atendimentos.", bullet_style))
    story.append(Paragraph("• <b>➕ Novo / CSV:</b> Formulário de inclusão rápida e importação de planilhas de famílias.", bullet_style))
    story.append(Paragraph("• <b>📑 Planilha:</b> Atalho seguro que abre a Planilha Oficial do Google Sheets sincronizada.", bullet_style))
    story.append(Spacer(1, 8))

    # Section 3: Gestão de Visitas e Rota Maps
    story.append(Paragraph("3. Gestão de Visitas e Roteirização Inteligente no Google Maps", h1_style))
    story.append(Paragraph(
        "A tela de <b>Visitas</b> (`/visitas`) divide-se em 3 módulos de visualização especializada:",
        body_style
    ))
    story.append(Paragraph(
        "<b>A) Agenda do Dia:</b> Apresenta as famílias agendadas para a data selecionada no calendário. Para testar a roteirização, localize na data de hoje o registro <b>TESTE CRAS - FAMÍLIA SILVA</b> e toque no botão <b>[ Rota Maps ↗ ]</b>. O Google Maps abrirá no aparelho calculando automaticamente o trajeto para a <i>Praça Pedro II, Centro, São Luís - MA</i>.",
        body_style
    ))
    story.append(Paragraph(
        "<b>B) Fila de Espera (Aguardando Data):</b> Centraliza as 60 famílias cadastradas que ainda necessitam de agendamento. Permite <b>agendamento em lote</b>: basta marcar as famílias pelas caixas de seleção, definir a data no topo e clicar em <i>Agendar Selecionadas</i>.",
        body_style
    ))
    story.append(Paragraph(
        "<b>C) Todas as Visitas (Paginadas):</b> Permite busca textual rápida por nome, CPF ou bairro, além de filtros seletivos por status e paginação de 15 em 15 registros.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Section 4: Registro e Google Sheets
    story.append(Paragraph("4. Registro de Visita e Sincronização em Tempo Real", h1_style))
    story.append(Paragraph(
        "Ao tocar no botão <b>Registrar Visita</b> em qualquer família listada, abre-se o modal operacional para:<br/>"
        "1. Atualizar o status (<i>Visita Realizada, Pendência Cadastral, Omissão Familiar, etc.</i>).<br/>"
        "2. Alternar o indicador de <b>CadÚnico Atualizado (SIM / NÃO)</b>.<br/>"
        "3. Complementar telefones, referências e observações técnicas.<br/>"
        "<b>Garantia de Sincronização:</b> Ao clicar em <i>Salvar Alterações</i>, o dado é transmitido via Edge Runtime e gravado atomicamente na planilha do Google Sheets, sem delay e sem sobrescrever dados de outros técnicos.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # Section 5: Checklist de Homologação
    story.append(Paragraph("5. Roteiro e Checklist de Homologação", h1_style))
    story.append(Paragraph("Itens prioritários a serem validados pela equipe durante o período de homologação:", body_style))

    check_data = [
        [Paragraph("<b>Item / Funcionalidade</b>", h2_style), Paragraph("<b>Critério de Aceite / Desfecho Esperado</b>", h2_style), Paragraph("<b>Status</b>", h2_style)],
        [Paragraph("Login e Sessão", body_style), Paragraph("Acesso liberado com marilia.cras / cras2026 e persistência segura.", body_style), Paragraph("OK", code_style)],
        [Paragraph("Instalação PWA", body_style), Paragraph("Ícone criado na tela de início do celular e abertura em tela cheia.", body_style), Paragraph("OK", code_style)],
        [Paragraph("Bottom Tab Bar", body_style), Paragraph("Navegação fluida no rodapé entre Dashboard, Visitas, Novo e Sheets.", body_style), Paragraph("OK", code_style)],
        [Paragraph("Botão Rota Maps ↗", body_style), Paragraph("Google Maps abre no trajeto correto em São Luís - MA com 1 toque.", body_style), Paragraph("OK", code_style)],
        [Paragraph("Fila de Espera", body_style), Paragraph("Seleção múltipla e agendamento em lote atribuindo data às visitas.", body_style), Paragraph("OK", code_style)],
        [Paragraph("Mutações no Sheets", body_style), Paragraph("Alterações salvas refletem imediatamente na planilha Google Sheets.", body_style), Paragraph("OK", code_style)],
        [Paragraph("Dashboard", body_style), Paragraph("Total de 61 famílias e contadores de status consistentes.", body_style), Paragraph("OK", code_style)]
    ]
    check_table = Table(check_data, colWidths=[120, 320, 64])
    check_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E2E8F0')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(check_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")

if __name__ == '__main__':
    target = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'docs',
        'MANUAL_DE_HOMOLOGACAO.pdf'
    )
    build_pdf(target)
