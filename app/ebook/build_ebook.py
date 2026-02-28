#!/usr/bin/env python3
"""
Let's go free – Krypto Ebook
Text 1:1 aus Original-PDF, Schweizer Rechtschreibung, genehmigtes Design.
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from PIL import Image, ImageDraw
import io, os

# ── Fonts ─────────────────────────────────────────────────────────────────────
def reg(name, path):
    if os.path.exists(path):
        pdfmetrics.registerFont(TTFont(name, path))

reg('H-Bold',   '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf')
reg('H-Med',    '/usr/share/fonts/truetype/google-fonts/Poppins-Medium.ttf')
reg('Body',     '/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf')
reg('Body-L',   '/usr/share/fonts/truetype/google-fonts/Poppins-Light.ttf')
reg('Mono',     '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')
reg('Mono-B',   '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf')

# ── Farben ────────────────────────────────────────────────────────────────────
DARK      = HexColor('#0f0d0a')
DARK2     = HexColor('#1a1612')
DARK3     = HexColor('#2a2218')
DARK4     = HexColor('#1e1a14')
GOLD      = HexColor('#C9A882')
GOLD_D    = HexColor('#8B7355')
GOLD_DEEP = HexColor('#4a3d2a')
CREAM     = HexColor('#F0E8DC')
CREAM2    = HexColor('#faf7f3')
CREAM3    = HexColor('#F5E6D3')
BODY      = HexColor('#2a1f14')
MUTED     = HexColor('#7a6a58')
LINE      = HexColor('#e0ceba')

W, H = A4   # 595.27 × 841.89 pt
ML = 40     # Left margin
MR = 40     # Right margin
TW = W - ML - MR


# ─────────────────────────────────────────────────────────────────────────────
class P:
    """Page/Document wrapper"""

    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=A4)
        self.c.setTitle('Dein Weg zu finanzieller Selbstbestimmung')
        self.c.setAuthor('Chris Müller | letsgofree.me')
        self.y = H
        self.pg = 0
        self.dark = False

    # ── Grundoperationen ──────────────────────────────────────────────────────
    def rect(self, x, y, w, h, fill, stroke=None, lw=0):
        self.c.setFillColor(fill)
        if stroke:
            self.c.setStrokeColor(stroke)
            self.c.setLineWidth(lw)
            self.c.rect(x, y, w, h, fill=1, stroke=1)
        else:
            self.c.rect(x, y, w, h, fill=1, stroke=0)

    def draw_emoji(self, emoji, cx, cy, px=28):
        """Rendert ein Emoji via PIL und bettet es zentriert auf cx/cy ein."""
        from PIL import Image, ImageDraw, ImageFont
        import io
        font = ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', 109)
        size = 120
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.text((0, 0), emoji, font=font, embedded_color=True)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        # Zentriert platzieren
        self.c.drawImage(
            __import__('reportlab.lib.utils', fromlist=['ImageReader']).ImageReader(buf),
            cx - px / 2, cy - px / 2, width=px, height=px, mask='auto'
        )

    def line(self, x0, y0, x1, y1, col=LINE, lw=0.5):
        self.c.setStrokeColor(col)
        self.c.setLineWidth(lw)
        self.c.line(x0, y0, x1, y1)

    # ── Seiten-Grundlayout ────────────────────────────────────────────────────
    def _bg(self):
        if self.dark:
            self.rect(0, 0, W, H, DARK)
            # Diagonale Linien
            self.c.setStrokeColor(HexColor('#141008'))
            self.c.setLineWidth(0.8)
            for i in range(-4, 22):
                x0 = i * 50 - 80
                self.c.line(x0, 0, x0 + H * 0.65, H)
        else:
            self.rect(0, 0, W, H, CREAM2)

    def _sidebar(self):
        self.rect(0, H * 0.66, 5, H * 0.34, GOLD_D)
        self.rect(0, H * 0.33, 5, H * 0.33, GOLD)
        self.rect(0, 0, 5, H * 0.33, GOLD_D)

    def _topstripe(self):
        self.rect(0, H - 4, W, 4, GOLD)

    def new_page(self, dark=False):
        if self.pg > 0:
            self.c.showPage()
        self.pg += 1
        self.dark = dark
        self.y = H - 56
        self._bg()
        self._sidebar()
        self._topstripe()

    def need(self, h):
        return self.y - h > 52

    def flow_diagram(self, nodes):
        """
        Zeichnet ein horizontales 3-Node-Flow-Diagramm mit Emojis.
        nodes = [(emoji, title, sub, connector_label), ...]
        letzter Node hat kein connector_label (wird ignoriert).
        """
        node_w  = 124
        node_h  = 72
        gap     = 52   # Platz für Connector-Text + Pfeil
        n       = len(nodes)
        total_w = n * node_w + (n - 1) * gap
        sx      = ML + (TW - total_w) / 2
        self.guard(node_h + 24)
        ny = self.y - node_h

        # Pass 1: alle Rechtecke
        for i in range(n):
            nx = sx + i * (node_w + gap)
            self.rect(nx, ny, node_w, node_h, DARK3, GOLD_DEEP, 0.6)

        # Pass 2: Connector-Linien, Pfeile und Labels
        for i, (emoji, title, sub, lbl) in enumerate(nodes[:-1]):
            nx = sx + i * (node_w + gap)
            ax  = nx + node_w          # Beginn Connector-Zone
            cx  = ax + gap / 2         # Mitte Connector
            ay  = ny + node_h / 2      # Vertikale Mitte

            # Linie
            self.c.setStrokeColor(GOLD_D)
            self.c.setLineWidth(1)
            self.c.line(ax + 4, ay, ax + gap - 8, ay)

            # Pfeilspitze
            self.c.setFillColor(GOLD_D)
            p = self.c.beginPath()
            p.moveTo(ax + gap - 8, ay)
            p.lineTo(ax + gap - 14, ay + 4)
            p.lineTo(ax + gap - 14, ay - 4)
            p.close()
            self.c.drawPath(p, fill=1, stroke=0)

            # Label über dem Pfeil
            if lbl:
                self.c.setFillColor(GOLD)
                self.c.setFont('Body-L', 7)
                self.c.drawCentredString(cx, ay + 8, lbl)

        # Pass 3: Emojis und Texte (immer über Rechtecken)
        for i, (emoji, title, sub, lbl) in enumerate(nodes):
            nx  = sx + i * (node_w + gap)
            mcx = nx + node_w / 2

            # Emoji
            self.draw_emoji(emoji, mcx, ny + node_h - 18, px=26)

            # Titel
            self.c.setFillColor(GOLD)
            self.c.setFont('H-Med', 8.5)
            self.c.drawCentredString(mcx, ny + node_h - 38, title)

            # Untertitel (2 Zeilen möglich)
            self.c.setFillColor(GOLD_D)
            self.c.setFont('Body-L', 7)
            sub_lines = sub.split('\n')
            ty = ny + node_h - 50
            for sl in sub_lines:
                self.c.drawCentredString(mcx, ty, sl)
                ty -= 10

        self.y = ny - 12

    def guard(self, h, dark=None):
        if not self.need(h):
            self.new_page(self.dark if dark is None else dark)

    def pgnum(self, n):
        col = GOLD_D if not self.dark else GOLD_DEEP
        self.c.setFillColor(col)
        self.c.setFont('Mono', 7)
        self.c.drawRightString(W - 18, 20, str(n))

    # ── Mono-Tag ──────────────────────────────────────────────────────────────
    def tag(self, txt, x=ML, y=None):
        if y is None:
            y = self.y + 4
        bg = DARK3 if not self.dark else HexColor('#221c14')
        tw = self.c.stringWidth(txt, 'Mono', 6)
        self.rect(x - 2, y - 8, tw + 8, 13, bg)
        self.c.setFillColor(GOLD)
        self.c.setFont('Mono', 6)
        self.c.drawString(x + 1, y, txt)

    # ── Überschriften ─────────────────────────────────────────────────────────
    def h1(self, txt, col=None):
        self.guard(34)
        if col is None:
            col = CREAM if self.dark else BODY
        self.c.setFillColor(col)
        self.c.setFont('H-Bold', 20)
        self.c.drawString(ML, self.y, txt)
        self.y -= 28

    def h2(self, txt, col=None):
        self.guard(26)
        if col is None:
            col = GOLD
        self.c.setFillColor(col)
        self.c.setFont('H-Bold', 13)
        self.c.drawString(ML, self.y, txt)
        self.y -= 20

    def h3(self, txt, col=None):
        self.guard(22)
        if col is None:
            col = GOLD_D if not self.dark else GOLD
        self.c.setFillColor(col)
        self.c.setFont('H-Med', 10.5)
        self.c.drawString(ML, self.y, txt)
        self.y -= 17

    def rule(self, col=None):
        if col is None:
            col = LINE if not self.dark else GOLD_DEEP
        self.line(ML, self.y, W - MR, self.y, col=col, lw=0.4)
        self.y -= 10

    def sp(self, h=8):
        self.y -= h

    # ── Absätze ───────────────────────────────────────────────────────────────
    def wrap_text(self, txt, font, size, max_w):
        words = txt.split()
        lines, cur = [], []
        for w in words:
            if self.c.stringWidth(' '.join(cur + [w]), font, size) <= max_w:
                cur.append(w)
            else:
                if cur:
                    lines.append(' '.join(cur))
                cur = [w]
        if cur:
            lines.append(' '.join(cur))
        return lines

    def para(self, txt, font='Body-L', size=9.5, indent=0, col=None, leading_factor=1.6):
        if not txt or not txt.strip():
            return
        if col is None:
            col = HexColor('#a89880') if self.dark else BODY
        leading = size * leading_factor
        x = ML + indent
        mw = TW - indent
        lines = self.wrap_text(txt, font, size, mw)
        for line in lines:
            self.guard(leading + 3)
            self.c.setFillColor(col)
            self.c.setFont(font, size)
            self.c.drawString(x, self.y, line)
            self.y -= leading
        self.y -= 3

    def bold_para(self, txt, size=9.5, indent=0):
        self.para(txt, font='H-Med', size=size, indent=indent,
                  col=CREAM if self.dark else BODY)

    def bullet(self, txt, sym='·', indent=0):
        self.guard(18)
        self.c.setFillColor(GOLD)
        self.c.setFont('H-Med', 10)
        self.c.drawString(ML + indent, self.y, sym)
        self.para(txt, indent=indent + 14)

    def check_item(self, txt):
        self.guard(22)
        # Box
        self.c.setStrokeColor(GOLD_D)
        self.c.setLineWidth(0.8)
        self.c.rect(ML, self.y - 1, 10, 10, fill=0, stroke=1)
        # Trennlinie
        self.line(ML, self.y - 8, W - MR, self.y - 8,
                  col=LINE if not self.dark else GOLD_DEEP, lw=0.3)
        col = HexColor('#a89880') if self.dark else BODY
        # Text
        if ':' in txt:
            parts = txt.split(':', 1)
            self.c.setFillColor(GOLD)
            self.c.setFont('H-Med', 9.5)
            bw = self.c.stringWidth(parts[0] + ': ', 'H-Med', 9.5)
            self.c.drawString(ML + 14, self.y, parts[0] + ':')
            self.c.setFillColor(col)
            self.c.setFont('Body-L', 9.5)
            self.c.drawString(ML + 14 + bw, self.y, parts[1].strip())
        else:
            self.c.setFillColor(col)
            self.c.setFont('Body-L', 9.5)
            self.c.drawString(ML + 14, self.y, txt)
        self.y -= 20

    def warn(self, txt):
        self.guard(22)
        self.c.setFillColor(GOLD)
        self.c.setFont('H-Med', 9.5)
        self.c.drawString(ML, self.y, '⚠')
        self.para(txt, font='H-Med', size=9.5, indent=16,
                  col=GOLD if self.dark else GOLD_D)

    def tip(self, txt):
        self.guard(22)
        self.c.setFillColor(GOLD_D)
        self.c.setFont('H-Med', 9.5)
        self.c.drawString(ML, self.y, '\u2192')
        self.para(txt, font='Body-L', size=9.5, indent=16,
                  col=HexColor('#a89880') if self.dark else MUTED)

    # ── Highlight-Box (dunkel mit Goldrand) ───────────────────────────────────
    def hl_box(self, label, txt, font='H-Med', size=10):
        lines = self.wrap_text(txt, font, size, TW - 22)
        bh = 14 + len(lines) * (size * 1.5) + 16
        self.guard(bh + 10)
        bx, by = ML - 4, self.y - bh
        bg = DARK if not self.dark else HexColor('#141008')
        self.rect(bx, by, TW + 8, bh, bg)
        self.rect(bx, by, 4, bh, GOLD)
        # Label
        self.c.setFillColor(GOLD_D)
        self.c.setFont('Mono', 6)
        self.c.drawString(bx + 12, by + bh - 12, label.upper())
        # Text
        ty = by + bh - 24
        self.c.setFillColor(GOLD)
        self.c.setFont(font, size)
        for line in lines:
            self.c.drawString(bx + 12, ty, line)
            ty -= size * 1.5
        self.y = by - 10

    # ── Info-Box ──────────────────────────────────────────────────────────────
    def info_box(self, title, items, bg=None):
        if bg is None:
            bg = CREAM3 if not self.dark else DARK4
        row_h = 15
        bh = 20 + len(items) * row_h + 8
        self.guard(bh + 10)
        bx, by = ML - 4, self.y - bh
        self.rect(bx, by, TW + 8, bh, bg)
        self.rect(bx, by, 4, bh, GOLD_D)
        self.c.setFillColor(GOLD_D)
        self.c.setFont('H-Med', 9)
        self.c.drawString(bx + 12, by + bh - 14, title)
        ty = by + bh - 26
        for item in items:
            self.c.setFillColor(GOLD_D)
            self.c.setFont('Body', 8.5)
            self.c.drawString(bx + 12, ty, '→')
            self.c.setFillColor(BODY if not self.dark else HexColor('#a89880'))
            self.c.setFont('Body-L', 8.5)
            self.c.drawString(bx + 24, ty, item)
            ty -= row_h
        self.y = by - 10

    # ── Zweispaltige Info-Box ─────────────────────────────────────────────────
    def two_box(self, title1, items1, title2, items2, col1=CREAM3, col2=CREAM3):
        rows = max(len(items1), len(items2))
        row_h = 14
        bh = 22 + rows * row_h + 8
        self.guard(bh + 10)
        hw = TW // 2 - 4
        bx1, bx2 = ML - 4, ML + hw + 4
        by = self.y - bh
        # Linke Box
        self.rect(bx1, by, hw, bh, col1 if not self.dark else DARK4)
        self.rect(bx1, by, 4, bh, GOLD_D)
        self.c.setFillColor(GOLD_D)
        self.c.setFont('H-Med', 9)
        self.c.drawString(bx1 + 10, by + bh - 14, title1)
        ty = by + bh - 26
        for item in items1:
            self.c.setFillColor(BODY if not self.dark else HexColor('#a89880'))
            self.c.setFont('Body-L', 8)
            self.c.drawString(bx1 + 10, ty, item)
            ty -= row_h
        # Rechte Box
        self.rect(bx2, by, hw, bh, col2 if not self.dark else DARK4)
        self.rect(bx2, by, 4, bh, GOLD)
        self.c.setFillColor(GOLD)
        self.c.setFont('H-Med', 9)
        self.c.drawString(bx2 + 10, by + bh - 14, title2)
        ty = by + bh - 26
        for item in items2:
            self.c.setFillColor(BODY if not self.dark else HexColor('#a89880'))
            self.c.setFont('Body-L', 8)
            self.c.drawString(bx2 + 10, ty, item)
            ty -= row_h
        self.y = by - 10

    # ── Tabelle ───────────────────────────────────────────────────────────────
    def table(self, rows, col_widths=None):
        if col_widths is None:
            cw = TW // len(rows[0])
            col_widths = [cw] * len(rows[0])
        row_h = 16
        for i, row in enumerate(rows):
            self.guard(row_h + 4)
            is_hdr = (i == 0)
            bg = DARK3 if (not self.dark and is_hdr) else (CREAM3 if not self.dark and i % 2 == 0 else (DARK4 if self.dark and i % 2 == 0 else None))
            if bg:
                self.rect(ML - 4, self.y - 4, TW + 8, row_h, bg)
            x = ML
            for j, cell in enumerate(row):
                font = 'H-Med' if is_hdr else 'Body-L'
                size = 8.5
                col = (GOLD if is_hdr else (HexColor('#a89880') if self.dark else BODY))
                # Wrap if needed
                mw = col_widths[j] - 6
                lines = self.wrap_text(str(cell), font, size, mw)
                self.c.setFillColor(col)
                self.c.setFont(font, size)
                self.c.drawString(x + 3, self.y, lines[0] if lines else '')
                x += col_widths[j]
            self.y -= row_h
        self.y -= 4

    # ── Tabelle mit Zeilenumbruch und optionaler URL-Zeile ───────────────────
    def table_wrapped(self, rows, col_widths=None):
        """
        rows: list of rows. Each cell is either a string or a tuple (main_text, url_text).
        Header row (first) uses H-Med, data rows use Body-L.
        Cells wrap automatically; url_text is rendered smaller and muted below main_text.
        """
        if col_widths is None:
            cw = TW // len(rows[0])
            col_widths = [cw] * len(rows[0])

        main_size = 8.5
        url_size  = 7.5
        leading   = 12
        url_lead  = 11
        pad_v     = 5   # vertical padding top + bottom

        for i, row in enumerate(rows):
            is_hdr = (i == 0)
            # ── Zeilenhöhe berechnen ──────────────────────────────────────────
            row_h = 0
            cell_data = []   # list of (main_lines, url_text) per cell
            for j, cell in enumerate(row):
                if isinstance(cell, tuple):
                    main_txt, url_txt = cell
                else:
                    main_txt, url_txt = str(cell), ''
                mw = col_widths[j] - 8
                font = 'H-Med' if is_hdr else 'Body-L'
                main_lines = self.wrap_text(main_txt, font, main_size, mw)
                cell_h = len(main_lines) * leading
                if url_txt:
                    cell_h += url_lead
                cell_h += pad_v * 2
                if cell_h > row_h:
                    row_h = cell_h
                cell_data.append((main_lines, url_txt))

            self.guard(row_h + 4)
            # ── Hintergrund ───────────────────────────────────────────────────
            bg = DARK3 if (not self.dark and is_hdr) else \
                 (CREAM3 if not self.dark and i % 2 == 0 else \
                 (DARK4 if self.dark and i % 2 == 0 else None))
            if bg:
                self.rect(ML - 4, self.y - row_h, TW + 8, row_h, bg)

            # ── Zellinhalt ────────────────────────────────────────────────────
            x = ML
            # Ascender: in ReportLab ist drawString die Baseline; Grossbuchstaben
            # ragen ~72% der Schriftgrösse über die Baseline hinaus.
            ascender = int(main_size * 0.72)
            for j, (main_lines, url_txt) in enumerate(cell_data):
                font  = 'H-Med' if is_hdr else 'Body-L'
                col   = GOLD if is_hdr else (HexColor('#a89880') if self.dark else BODY)
                # Inhaltshöhe für vertikale Zentrierung
                content_h = len(main_lines) * leading + (url_lead if url_txt else 0)
                inner_h = row_h - pad_v * 2
                offset = max(0, (inner_h - content_h) // 2)
                # Baseline der ersten Zeile: oben minus Padding, Ascender und Offset
                ty = self.y - pad_v - ascender - offset
                for ml in main_lines:
                    self.c.setFillColor(col)
                    self.c.setFont(font, main_size)
                    self.c.drawString(x + 4, ty, ml)
                    ty -= leading
                if url_txt:
                    url_col = GOLD_D if is_hdr else MUTED
                    self.c.setFillColor(url_col)
                    self.c.setFont('Body-L', url_size)
                    self.c.drawString(x + 4, ty, url_txt)
                x += col_widths[j]

            self.y -= row_h
        self.y -= 4

    # ── Step-Box ──────────────────────────────────────────────────────────────
    def step(self, num, title, lines):
        row_h = 13
        bh = 30 + len(lines) * row_h + 6
        self.guard(bh + 10)
        bx, by = ML - 4, self.y - bh
        bg = CREAM3 if not self.dark else DARK4
        self.rect(bx, by, TW + 8, bh, bg)
        self.rect(bx, by, 4, bh, GOLD)
        # Nummer-Kreis
        self.c.setFillColor(GOLD)
        self.c.circle(bx + 16, by + bh - 12, 9, fill=1, stroke=0)
        self.c.setFillColor(DARK)
        self.c.setFont('H-Bold', 8)
        nw = self.c.stringWidth(str(num), 'H-Bold', 8)
        self.c.drawString(bx + 16 - nw / 2, by + bh - 15, str(num))
        # Titel
        self.c.setFillColor(BODY if not self.dark else CREAM)
        self.c.setFont('H-Med', 10)
        self.c.drawString(bx + 30, by + bh - 15, title)
        # Inhalt
        ty = by + bh - 28
        for line in lines:
            is_warn = line.startswith('!')
            txt = line[1:].strip() if is_warn else line
            self.c.setFillColor(GOLD if is_warn else (BODY if not self.dark else HexColor('#a89880')))
            self.c.setFont('H-Med' if is_warn else 'Body-L', 8.5)
            self.c.drawString(bx + 14, ty, txt)
            ty -= row_h
        self.y = by - 10

    # ── Seiten-Header für Kapitel-Opener (dunkel) ─────────────────────────────
    def chapter_opener(self, num, title, subtitle=''):
        self.new_page(dark=True)
        # Grosse Nummer
        self.c.setFillColor(HexColor('#1a1410'))
        self.c.setFont('H-Bold', 240)
        self.c.drawRightString(W + 10, -20, str(num))
        # Chapter-Tag
        self.tag('KAPITEL ' + str(num), x=ML, y=H - 70)
        # Titel
        self.c.setFillColor(GOLD)
        self.c.setFont('H-Bold', 11)
        self.c.drawString(ML, H - 86, 'Kapitel ' + str(num))
        self.c.setFillColor(CREAM)
        self.c.setFont('H-Bold', 34)
        # Langer Titel → zweizeilig
        if len(title) > 22:
            words = title.split()
            mid = len(words) // 2
            l1 = ' '.join(words[:mid])
            l2 = ' '.join(words[mid:])
            self.c.drawString(ML, H - 120, l1)
            self.c.drawString(ML, H - 154, l2)
            self.c.setFillColor(GOLD_D)
            self.c.setFont('Body-L', 11)
            if subtitle:
                self.c.drawString(ML, H - 174, subtitle)
            self.y = H - 200
        else:
            self.c.drawString(ML, H - 120, title)
            self.c.setFillColor(GOLD_D)
            self.c.setFont('Body-L', 11)
            if subtitle:
                self.c.drawString(ML, H - 144, subtitle)
            self.y = H - 170
        self.rule(col=GOLD_DEEP)

    # ── Bild einfügen (runder Kreis) ──────────────────────────────────────────
    def circle_image(self, path, cx, cy, r):
        try:
            img = Image.open(path).convert('RGBA')
            # Zuerst auf quadratischen Ausschnitt zuschneiden (Proportionen beibehalten)
            w, h = img.size
            side = min(w, h)
            left = (w - side) // 2
            # Leicht nach oben verschoben für Portrait-Fotos (Gesicht im Mittelpunkt)
            top = max(0, (h - side) // 4)
            img = img.crop((left, top, left + side, top + side))
            # Hoch aufgelöst rendern für scharfe PDF-Darstellung
            render_size = max(r * 8, 400)
            size = r * 2
            img = img.resize((render_size, render_size), Image.LANCZOS)
            mask = Image.new('L', (render_size, render_size), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, render_size - 1, render_size - 1), fill=255)
            result = Image.new('RGBA', (render_size, render_size), (0, 0, 0, 0))
            result.paste(img, (0, 0), mask)
            tmp = '/tmp/circle_img.png'
            result.save(tmp, dpi=(300, 300))
            self.c.drawImage(tmp, cx - r, cy - r, width=size, height=size,
                             mask='auto')
        except Exception as e:
            print(f'  Bild-Fehler: {e}')

    def insert_image(self, path, caption=None, max_w=None, max_h=None):
        """
        Bild einfügen, skaliert auf max_w (Standard: TW) unter Beibehaltung
        des Seitenverhältnisses. max_h begrenzt zusätzlich die Höhe.
        Optionaler caption-Text darunter.
        """
        if max_w is None:
            max_w = TW
        try:
            img = Image.open(path)
            iw, ih = img.size
            # Skalierung auf max_w
            scale = max_w / iw
            draw_w = max_w
            draw_h = ih * scale
            # Höhenbegrenzung
            if max_h and draw_h > max_h:
                scale = max_h / ih
                draw_w = iw * scale
                draw_h = max_h
            cap_h = 16 if caption else 0
            total = draw_h + cap_h + 6
            self.guard(total + 10)
            # Zentriert auf der Textbreite
            x = ML + (TW - draw_w) / 2
            self.c.drawImage(path, x, self.y - draw_h,
                             width=draw_w, height=draw_h,
                             preserveAspectRatio=True, mask='auto')
            self.y -= draw_h + 4
            if caption:
                self.c.setFillColor(MUTED)
                self.c.setFont('Body-L', 7.5)
                cw = self.c.stringWidth(caption, 'Body-L', 7.5)
                self.c.drawString(ML + (TW - cw) / 2, self.y, caption)
                self.y -= 14
            self.y -= 6
        except Exception as e:
            print(f'  Bild-Fehler: {e}')

    def save(self):
        self.c.showPage()
        self.c.save()


# ─────────────────────────────────────────────────────────────────────────────
# COVER
# ─────────────────────────────────────────────────────────────────────────────
def cover(d: P):
    d.new_page(dark=True)
    c = d.c
    # Grosse Deko-5
    c.setFillColor(HexColor('#141008'))
    c.setFont('H-Bold', 320)
    c.drawRightString(W + 22, -50, '5')
    # Gold-Top-Stripe (schon durch new_page gesetzt)
    # Brand
    c.setFillColor(GOLD_D)
    c.setFont('Mono', 7)
    c.drawRightString(W - ML, H - 18, "LET'S GO FREE · letsgofree.me")
    # Eyebrow-Tag
    d.tag('DER KOMPLETTE KRYPTO-EINSTIEG FÜR ANFÄNGER', x=ML, y=H - 58)
    # Titel
    c.setFillColor(GOLD)
    c.setFont('H-Bold', 13)
    c.drawString(ML, H - 86, 'Dein Weg zu')
    c.setFillColor(CREAM)
    c.setFont('H-Bold', 62)
    c.drawString(ML - 2, H - 148, 'finanzieller')
    c.setFillColor(GOLD)
    c.setFont('H-Bold', 62)
    c.drawString(ML - 2, H - 210, 'Selbst-')
    c.drawString(ML - 2, H - 272, 'bestimmung.')
    # Trennlinie
    c.setStrokeColor(GOLD_DEEP)
    c.setLineWidth(1.5)
    c.line(ML, H - 292, ML + 200, H - 292)
    # Untertitel
    c.setFillColor(GOLD_D)
    c.setFont('Body-L', 11)
    c.drawString(ML, H - 314, 'Der komplette Krypto-Einstieg für Anfänger')
    c.setFont('Body-L', 9.5)
    c.drawString(ML, H - 330, 'Raus aus dem alten System, rein in die finanzielle Freiheit')
    # Phasen-Balken
    phases = ['1 Vorbereitung', '2 Wallet', '3 Erster Kauf', '4 DeFi', '5 Sicherheit']
    px = ML
    py = H - 375
    for i, ph in enumerate(phases):
        bw = (TW - 8) / 5
        col = GOLD if i == 4 else (GOLD_D if i < 4 else HexColor('#2a2218'))
        c.setFillColor(col)
        c.roundRect(px, py, bw - 3, 22, 3, fill=1, stroke=0)
        c.setFillColor(DARK if col == GOLD or col == GOLD_D else GOLD_D)
        c.setFont('Mono', 6)
        tw = c.stringWidth(ph, 'Mono', 6)
        c.drawString(px + (bw - 3 - tw) / 2, py + 8, ph)
        px += bw
    # Profil
    d.circle_image('/mnt/user-data/uploads/profil.jpg',
                   cx=int(W - ML - 55), cy=int(H - 450), r=55)
    # Autor
    c.setFillColor(GOLD_D)
    c.setFont('H-Med', 9.5)
    c.drawRightString(W - ML, H - 515, 'Chris Müller | Let\'s go free')


# ─────────────────────────────────────────────────────────────────────────────
# INHALTSVERZEICHNIS
# ─────────────────────────────────────────────────────────────────────────────
def toc(d: P):
    d.new_page(dark=True)
    d.tag('INHALTSVERZEICHNIS')
    d.sp(16)
    d.h1('Was dich erwartet')
    d.sp(8)
    entries = [
        ('Über dieses eBook',                      '3'),
        ('Kapitel 1: Meine Geschichte',             '5'),
        ('Kapitel 2: Die Wahrheit über Krypto',     '8'),
        ('Kapitel 3: Phase 1 – Vorbereitung',       '19'),
        ('Kapitel 4: Phase 2 – Dein erstes Wallet', '23'),
        ('Kapitel 5: Phase 3 – Der erste Kauf',     '27'),
        ('Kapitel 6: Phase 4 – DeFi verstehen',     '37'),
        ('Kapitel 7: Phase 5 – Langfristige Sicherheit', '41'),
        ('Kapitel 8: Deine nächsten Schritte',      '47'),
        ('Anhang: Glossar',                         '51'),
    ]
    for i, (title, pg) in enumerate(entries):
        d.guard(20)
        bg = DARK3 if i % 2 == 0 else DARK2
        d.rect(ML - 4, d.y - 4, TW + 8, 18, bg)
        d.c.setFillColor(GOLD)
        d.c.setFont('H-Med', 9.5)
        d.c.drawString(ML + 4, d.y, title)
        d.c.setFillColor(GOLD_D)
        d.c.setFont('Mono', 8)
        d.c.drawRightString(W - MR - 4, d.y, pg)
        d.y -= 20


# ─────────────────────────────────────────────────────────────────────────────
# ÜBER DIESES EBOOK
# ─────────────────────────────────────────────────────────────────────────────
def about(d: P):
    d.new_page(dark=False)
    d.tag('ÜBER DIESES EBOOK')
    d.sp(16)
    d.h1('Über dieses eBook')
    d.rule()
    d.sp(4)

    d.para('Dieses E-Book ist keine Begriffe-Sammlung und kein Investment-Ratgeber. Es ist die ehrliche Geschichte meines Wegs aus dem traditionellen Bankensystem in die Welt der Kryptowährungen – und dein praktischer Leitfaden, um denselben Schritt zu wagen.')
    d.para('Im Sommer 2023 traf ich die Entscheidung: Ich will mehr Freiheit und Selbstbestimmung in meinem Leben. Über 25 Jahre als Applikationsmanager, sicherer Job, gutes Gehalt – aber das Hamsterrad drehte sich immer schneller. Als meine Frau durch eine Freundin auf Krypto aufmerksam wurde, war das der Anstoss, den ich brauchte. Heute begleite ich Menschen wie dich auf genau diesem Weg. Was du hier liest, ist keine Theorie – es ist die Essenz aus eigenen Erfahrungen und unzähligen Coaching-Sessions.')
    d.sp(6)
    d.h3('Für wen ist dieses Buch?')
    for txt in [
        'Du bist frustriert vom traditionellen Bankensystem',
        'Du willst die Kontrolle über dein Geld zurück',
        'Du hast von Krypto gehört, aber keine Ahnung wo du anfangen sollst',
        'Du suchst keine Investment-Tipps, sondern echte finanzielle Selbstbestimmung',
        'Du bist bereit, Verantwortung für dein Geld zu übernehmen',
    ]:
        d.bullet(txt)

    d.sp(6)
    d.h3('Was du hier NICHT findest:')
    for txt in [
        'Trading-Strategien oder Investment-Tipps',
        'Versprechen von schnellem Reichtum',
        'Komplizierte technische Erklärungen ohne Praxisbezug',
        'Den nächsten heissen Coin-Tipp',
    ]:
        d.bullet(txt, sym='×')

    d.sp(6)
    d.para('Stattdessen bekommst du einen klaren, erprobten Weg in fünf Phasen. Von der mentalen Vorbereitung über dein erstes Wallet bis hin zu DeFi und langfristiger Sicherheit. Schritt für Schritt. Ehrlich. Praktisch.')
    d.sp(4)
    d.hl_box('LOS GEHTS', 'Los geht\'s auf deinen Weg zu finanzieller Selbstbestimmung.')


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 1 – MEINE GESCHICHTE
# ─────────────────────────────────────────────────────────────────────────────
def kap1(d: P):
    d.chapter_opener(1, 'Warum ich 2023 den Sprung gewagt habe')

    d.new_page(dark=False)
    d.tag('KAPITEL 1 · MEINE GESCHICHTE')
    d.sp(16)

    # Profil-Kachel (wie im HTML: Name + Rolle)
    bh = 52
    bx, by = ML - 4, d.y - bh
    d.rect(bx, by, TW + 8, bh, CREAM3)
    d.rect(bx, by, 4, bh, GOLD)
    # Profilbild
    d.circle_image('/mnt/user-data/uploads/profil.jpg',
                   cx=int(bx + 34), cy=int(by + bh // 2), r=22)
    # Name + Rolle
    d.c.setFillColor(GOLD)
    d.c.setFont('H-Med', 10)
    d.c.drawString(bx + 64, by + bh - 18, 'Chris Müller')
    d.c.setFillColor(HexColor('#a89880'))
    d.c.setFont('Body-L', 9)
    d.c.drawString(bx + 64, by + bh - 32, 'Krypto-Coach | Let\'s go free')
    d.y = by - 14

    d.para('Sommer 2023. Ich bin 50 Jahre alt, habe über 25 Jahre als Applikationsmanager gearbeitet. Sicherer Job. Gutes Gehalt. Aber etwas fehlte. Das Hamsterrad drehte sich immer schneller – und ich mittendrin. Keine echte Freiheit. Kein Gefühl, mein Leben wirklich selbst zu gestalten.')
    d.para('Dann kam der Moment, der alles veränderte: Meine Frau wurde durch eine gute Freundin auf das Thema Krypto aufmerksam. Und plötzlich stand dieses Thema auch bei mir im Raum. Dezentrale Finanzen. DeFi. Blockchain.')

    d.sp(4)
    d.h3('Meine erste Reaktion: Skepsis')
    d.para('Ich war sehr skeptisch. Das klang nach etwas für Nerds und Insider. Kompliziert. Riskant. Vielleicht sogar unseriös. Als Applikationsmanager war ich es gewohnt, Systeme zu verstehen und zu steuern – aber Krypto? Das war eine komplett andere Welt.')
    d.para('Doch je mehr ich mich damit beschäftigte, desto klarer wurde mir: Hier steckt eine echte Chance. Eine Chance, das Finanzsystem zu verstehen, Kontrolle zurückzugewinnen und die eigene Zukunft selbst in die Hand zu nehmen.')

    d.sp(4)
    d.h3('Das Problem mit dem klassischen System')
    d.para('Kommt dir das bekannt vor? Du hast Geld auf der Bank, aber keine echte Kontrolle darüber. Gebühren, Sperren, Öffnungszeiten, willkürliche Regeln – andere entscheiden, was du darfst. Dein Geld verliert jedes Jahr an Kaufkraft durch Inflation. Überweisungen dauern Tage, Auslands-Transaktionen kosten extra.')
    d.para('Ich war es leid, fremdbestimmt zu sein. Ich wollte nicht mehr nur ein Rädchen im System sein. Ich wollte die Kontrolle zurück.')

    d.sp(4)
    d.h3('Meine ersten Schritte')
    d.para('Ich begann Schritt für Schritt. Öffnete mein erstes Wallet. Lernte, wie man Fiat in Krypto tauscht. Verstand, was Swaps und Bridging bedeuten. Probierte aus, wie man wieder zurück in Fiat wechselt. Richtete eine Cold Wallet ein und entwickelte ein Risikomanagement.')
    d.para('Ja, ich habe Fehler gemacht. Aber ich habe daraus gelernt. Und genau diese Erfahrungen – das praktische, erprobte Wissen – gebe ich heute weiter.')

    d.sp(4)
    d.h3('Was sich seitdem verändert hat')
    d.para('Heute bin ich meine eigene Bank. Ich verwalte mein Geld selbst – unabhängig von Banken oder Öffnungszeiten. Ich entscheide, wo mein Geld liegt und wie es geschützt ist. Niemand kann mir willkürlich Gebühren aufzwingen oder mein Konto sperren.')
    d.para('Das Beste daran? Das Gefühl von Freiheit und Selbstbestimmung. Zu wissen, dass ich die Kontrolle habe. Dass ich verstehe, was mit meinem Geld passiert.')

    d.sp(6)
    d.hl_box('MEIN MOTTO', '"Finanzielle Selbstbestimmung beginnt mit dem ersten Schritt. Du musst kein Experte sein – du musst nur anfangen."')

    d.sp(6)
    d.para('Genau deshalb habe ich mein 1:1-Coaching entwickelt. Ich begleite Menschen wie dich persönlich und Schritt für Schritt in die Krypto-Welt – von den Grundlagen bis zur sicheren Anwendung in der Praxis. Statt endloser Videos bekommst du klare Antworten, echte Erfahrung und individuelle Unterstützung.')
    d.para('Mein Ziel? Dass du am Ende selbstbewusst und selbstbestimmt mit deinem Geld umgehst – mit einem klaren Verständnis, echten Ergebnissen und dem guten Gefühl, die Kontrolle wieder in der eigenen Hand zu haben.')


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 2 – DIE WAHRHEIT ÜBER KRYPTO
# ─────────────────────────────────────────────────────────────────────────────
def kap2(d: P):
    d.chapter_opener(2, 'Die Wahrheit über Krypto')

    d.new_page(dark=False)
    d.tag('KAPITEL 2 · DIE WAHRHEIT ÜBER KRYPTO')
    d.sp(16)
    d.para('Lass uns ehrlich sein: Wenn du bisher von Krypto gehört hast, dann wahrscheinlich im Zusammenhang mit Bitcoin-Millionären, abgestürzten Coins oder kryptischen Hackern. Das ist das Bild, das die Medien zeichnen. Aber das ist nicht die ganze Geschichte.')

    d.sp(4)
    d.h2('Was Krypto NICHT ist')

    d.h3('Kein schneller Reichtum')
    d.para('Ja, es gibt Stories von Leuten, die früh in Bitcoin investiert haben und reich wurden. Aber das ist nicht der Normalfall. Krypto ist kein Casino und kein Get-Rich-Quick-Schema.')

    d.h3('Keine Investmentstrategie')
    d.para('Dieses Buch ist kein Trading-Guide. Ich zeige dir nicht, welchen Coin du kaufen sollst. Ich zeige dir, wie du die Kontrolle über dein Geld zurückgewinnst.')

    d.h3('Nicht nur für Tech-Nerds')
    d.para('Du musst kein Informatiker sein. Du musst nicht verstehen, wie Blockchain auf technischer Ebene funktioniert. Du musst nur verstehen, WAS du tust und WARUM.')

    d.h3('Kein rechtsfreier Raum')
    d.para('Krypto bedeutet nicht, dass du Steuern umgehen kannst oder sollst. Es geht um Selbstbestimmung, nicht um Illegalität.')

    d.sp(6)
    d.h2('Was Krypto WIRKLICH bedeutet')
    d.para('Krypto – oder genauer gesagt: dezentrale Finanzsysteme – bedeutet, dass DU die Kontrolle hast. Nicht die Bank. Nicht der Staat. DU.')

    d.h3('Selbstbestimmung')
    d.para('Du entscheidest, wo dein Geld liegt und wer darauf zugreifen kann. Du bist die Bank.')

    d.h3('Verantwortung')
    d.para('Mit grosser Freiheit kommt grosse Verantwortung. Wenn du deine Seedphrase verlierst, ist dein Geld weg. Kein Kundenservice, der dir hilft. Das ist der Preis der Freiheit.')

    d.h3('Transparenz')
    d.para('Jede Transaktion ist nachvollziehbar. Keine versteckten Gebühren. Keine Überraschungen.')

    d.h3('Unabhängigkeit')
    d.para('Egal wo du bist auf der Welt – dein Geld ist bei dir. Kein Land, keine Bank kann dir den Zugang verwehren.')

    d.sp(6)
    d.hl_box('EHRLICH GESAGT', '"Krypto ist kein Trend. Es ist eine Alternative zu einem System, das viele von uns nicht mehr für sich arbeiten sehen."')

    # ── Zentral vs. Dezentral ─────────────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 2 · ZENTRAL VS. DEZENTRAL')
    d.sp(16)
    d.h2('Zentral vs. Dezentral – der Unterschied auf einen Blick')
    d.para('Der vielleicht wichtigste Unterschied zwischen klassischem Banking und Krypto ist die Frage der Kontrolle: Wer hat sie – du oder jemand anderes?')

    d.sp(4)
    d.h3('Das zentralisierte System: Einer kontrolliert alles')
    d.para('Im traditionellen Bankensystem gibt es immer eine zentrale Instanz, die alles kontrolliert. Deine Bank entscheidet, ob du Geld überweisen darfst. Sie entscheidet, welche Beträge erlaubt sind. Sie kann dein Konto sperren, Transaktionen blockieren oder Gebühren erheben – jederzeit, ohne deine Zustimmung.')
    d.para('Das klingt vielleicht übertrieben? Denk an Menschen in Venezuela, die über Nacht nicht mehr auf ihre Ersparnisse zugreifen konnten. Oder an Kanadier, deren Konten eingefroren wurden. Oder einfach an den Frust, wenn eine Auslandsüberweisung drei Tage dauert und 30 Franken kostet. Das ist die Realität eines zentralisierten Systems.')

    d.sp(4)
    d.h3('Das dezentralisierte System: Niemand kontrolliert alles')
    d.para('Bei einer dezentralen Blockchain gibt es keine zentrale Instanz mehr. Tausende von Computern weltweit – sogenannte Nodes – speichern gemeinsam eine identische Kopie des Kassenbuchs. Kein einzelner Computer, kein Unternehmen, keine Regierung hat die Kontrolle über das gesamte Netzwerk.')
    d.para('Eine Transaktion wird nicht von einer Bank "genehmigt". Sie wird von allen Nodes gleichzeitig geprüft und bestätigt – nach festen mathematischen Regeln. Entweder stimmt die Transaktion, dann wird sie akzeptiert. Oder sie stimmt nicht, dann wird sie abgelehnt. Kein Ermessensspielraum. Keine Willkür. Keine Öffnungszeiten.')

    d.sp(4)
    d.h3('Was das für dich bedeutet')
    for txt in [
        'Niemand kann dein Wallet sperren oder einfrieren.',
        'Niemand kann dir vorschreiben, wie viel du überweisen darfst.',
        'Kein Land, keine Bank kann dir den Zugang zu deinem Geld verweigern.',
        'Deine Transaktionen laufen 24/7 – an Weihnachten, um 3 Uhr nachts, aus jedem Land der Welt.',
        'Du zahlst keine versteckten Gebühren an Zwischenhändler.',
    ]:
        d.bullet(txt)

    d.sp(6)
    d.insert_image(
        '/mnt/user-data/uploads/ebook-img-zentral.jpg',
        caption='Zentralisierte Banksysteme vs. dezentralisierte Blockchain-Technologie',
        max_w=TW,
        max_h=150
    )
    d.sp(4)
    d.hl_box('DER PREIS DER FREIHEIT', 'Mit dieser Freiheit kommt Verantwortung. Wenn du einen Fehler machst – falsche Adresse, Seedphrase verloren – gibt es niemanden, der dir hilft. Du bist die Bank. Und das ist genau das, wofür du hier bist.')
    d.new_page(dark=False)
    d.tag('KAPITEL 2 · DIE GRUNDLAGEN')
    d.sp(16)
    d.h2('Die Grundlagen: Was du wissen musst')
    d.para('Bevor wir in die Technik eintauchen, lass uns kurz schauen, woher das alles kommt. Die Geschichte von Krypto ist wichtig, um zu verstehen, WARUM es existiert.')

    d.sp(4)
    d.h3('Die Geburt von Bitcoin – Eine Reaktion auf die Finanzkrise')
    d.para('2008: Die Welt steckt mitten in der grössten Finanzkrise seit den 1930er Jahren. Banken kollabieren. Regierungen drucken Billionen, um sie zu retten. Menschen verlieren ihre Ersparnisse. Das Vertrauen ins Finanzsystem ist am Boden.')
    d.para('Am 31. Oktober 2008 veröffentlicht jemand unter dem Pseudonym "Satoshi Nakamoto" ein Whitepaper mit dem Titel "Bitcoin: A Peer-to-Peer Electronic Cash System". Die Vision: Ein Geldsystem ohne Banken, ohne Regierungen, ohne zentrale Kontrolle. Nur Mathematik und Code.')
    d.para('Am 3. Januar 2009 wird der erste Bitcoin-Block gemined. In diesem Block steht eine Nachricht: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks" – ein Verweis auf die Bankenkrise. Die Botschaft ist klar: Bitcoin ist die Antwort auf ein versagendes System.')

    d.sp(4)
    d.h3('Die Evolution: Von Bitcoin zu Ethereum und DeFi')
    d.para('Bitcoin war nur der Anfang. 2015 startet Vitalik Buterin (damals 21 Jahre alt) Ethereum – eine Blockchain, die nicht nur Geld transferieren kann, sondern auch Programme ausführt. Smart Contracts werden möglich. Plötzlich kann man auf der Blockchain mehr als nur Geld senden:')
    for txt in [
        'Dezentrale Börsen, wo du direkt mit anderen tauschen kannst',
        'Kredit-Protokolle ohne Banken',
        'Automatisierte Investment-Strategien',
        'Digitale Kunst und Sammlerstücke (NFTs)',
    ]:
        d.bullet(txt)
    d.para('Das ist der Beginn von DeFi (Dezentralisierte Finanzen). Heute sind über 100 Milliarden Dollar in DeFi-Protokollen "locked" – Menschen nutzen es wirklich, nicht nur als Spekulation.')
    d.para('Parallel entstehen immer mehr Blockchains: Binance Smart Chain (jetzt BNB Chain) für günstigere Transaktionen, Polygon als Ethereum-Layer-2, Solana für hohe Geschwindigkeit, und viele mehr. Jede versucht, bestimmte Probleme zu lösen.')

    d.sp(4)
    d.h3('Wo wir heute stehen')
    d.para('2025: Krypto ist längst kein Nischen-Experiment mehr. Millionen Menschen nutzen es täglich. Länder wie El Salvador akzeptieren Bitcoin als gesetzliches Zahlungsmittel. Grosse Finanzinstitute bieten Krypto-Services an. Selbst die konservativsten Investoren haben einen kleinen Teil ihres Portfolios in Krypto.')
    d.para('Aber – und das ist wichtig – die ursprüngliche Vision bleibt: Finanzielle Selbstbestimmung. Raus aus einem System, in dem andere über dein Geld bestimmen. Rein in ein System, in dem DU die Kontrolle hast. Genau darum geht es in diesem Buch. Nicht um Trading. Nicht um Reich-werden. Sondern um Selbstbestimmung.')

    # ── Technische Grundlagen ─────────────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 2 · TECHNISCHE GRUNDLAGEN')
    d.sp(16)
    d.h2('Die technischen Grundlagen erklärt')
    d.para('Jetzt wo du weisst, woher das kommt und warum es existiert, schauen wir uns an, wie es funktioniert. Diese Grundlagen helfen dir, die richtigen Entscheidungen zu treffen.')

    d.sp(4)
    d.h3('Blockchain – Das digitale Kassenbuch')
    d.para('Stell dir ein Kassenbuch vor, in dem jede Transaktion aufgeschrieben wird. Bei einer Bank liegt dieses Kassenbuch im Tresor der Bank – nur sie hat Zugriff. Bei einer Blockchain ist es anders: Das Kassenbuch liegt auf tausenden Computern weltweit verteilt. Jeder kann reingucken, aber niemand kann es fälschen.')
    d.para('Jede Transaktion wird in einen "Block" geschrieben. Dieser Block wird dann an die Kette (Chain) der vorherigen Blöcke gehängt. Daher der Name: Block-Chain. Einmal drin, kann niemand mehr nachträglich etwas ändern – das würde sofort auffallen, weil alle anderen Kopien des Kassenbuchs widersprechen würden.')
    d.para('Das macht Blockchain so sicher: Kein einzelner Punkt, der gehackt werden kann. Keine zentrale Autorität, die etwas manipulieren könnte. Nur Mathematik und Konsens.')
    d.sp(6)
    d.insert_image(
        '/mnt/user-data/uploads/ebook-img-blockchain.jpg',
        caption='Wie eine Blockchain-Transaktion von A nach B funktioniert',
        max_w=TW,
        max_h=220
    )
    d.sp(4)
    d.h3('Anonym, aber 100% transparent')
    d.para('Blockchain ist zwar pseudoanonym – dein Name steht nirgends – aber sie ist vollständig transparent. Jede Transaktion, jeder Token-Bestand, jede Wallet-Adresse ist für alle öffentlich einsehbar. Das ist gleichzeitig die grösste Stärke: Niemand kann schummeln.')

    d.sp(4)
    d.h3('Blockchain-Explorer: Dein Fenster in die Chain')
    d.para('Du kannst deine Transaktionen und Token-Bestände jederzeit selbst nachprüfen – ohne App, ohne Login. Jede Blockchain hat ihren eigenen Explorer:')
    d.table([
        ['Blockchain', 'Explorer',    'URL'],
        ['Ethereum',   'Etherscan',   'etherscan.io'],
        ['BNB Chain',  'BscScan',     'bscscan.com'],
        ['Polygon',    'PolygonScan', 'polygonscan.com'],
        ['Bitcoin',    'Blockstream', 'blockstream.info'],
    ], col_widths=[120, 120, TW - 240])
    d.para('Diese einzelnen Explorer sind aber oft unübersichtlich. Viel praktischer sind Multi-Chain-Explorer, die alle deine Wallets und Chains in einer Übersicht zusammenfassen:')
    d.two_box(
        'Zerion – zerion.io', [
            'Portfolio-Übersicht über alle Chains',
            'Transaktions-Historie auf einen Blick',
            'DeFi-Positionen & NFTs integriert',
            'Mobile App verfügbar',
        ],
        'DeBank – debank.com', [
            'Detaillierte DeFi-Analyse',
            'Alle Protokoll-Positionen sichtbar',
            'Wallet-Tracking ohne Login',
            'Ideal für DeFi-Nutzer',
        ],
    )
    d.tip('Meine Empfehlung: Bookmarke zerion.io oder debank.com – damit siehst du mit deiner Wallet-Adresse sofort alle deine Bestände, Transaktionen und DeFi-Positionen auf allen Chains gleichzeitig.')

    d.sp(6)
    d.h2('Kryptowährungen – Digitales Geld ohne Chef')
    d.para('Bitcoin war 2009 die erste Kryptowährung. Die Idee: Geld, das nicht von einer Zentralbank oder Regierung kontrolliert wird. Stattdessen regeln mathematische Regeln, wie viel existiert und wie es funktioniert.')
    d.para('Heute gibt es tausende Kryptowährungen. Die bekanntesten: Bitcoin (BTC) als digitales Gold, Ethereum (ETH) als Plattform für Programme, BNB für die Binance-Blockchain, USDC/USDT als stabile Coins (immer ca. 1 Dollar wert).')
    d.para('Der entscheidende Unterschied zu normalem Geld: Niemand kann einfach mehr davon drucken. Bei Bitcoin gibt es maximal 21 Millionen Stück – das steht im Code fest. Keine Inflation durch Gelddrucken möglich.')

    d.sp(4)
    d.h3('Wallets – Nicht was du denkst')
    d.para('Der Name "Wallet" (Geldbörse) ist eigentlich irreführend. Deine Kryptos liegen nicht im Wallet. Sie liegen auf der Blockchain – für alle sichtbar, aber mit deiner Adresse verknüpft. Das Wallet ist eigentlich ein Schlüsselbund. Es verwaltet deine "Private Keys" – die geheimen Schlüssel, mit denen du beweisen kannst, dass dir eine bestimmte Adresse gehört. Nur mit dem richtigen Schlüssel kannst du Transaktionen von dieser Adresse aus durchführen.')
    d.para('Wichtig zu verstehen: Wenn du dein Wallet "verlierst" (z.B. Handy kaputt), sind deine Kryptos nicht weg. Sie liegen ja auf der Blockchain. Du kannst sie mit deiner Seedphrase auf einem neuen Gerät wiederherstellen. ABER: Ohne Seedphrase kommst du nie wieder ran.')

    d.sp(4)
    d.h3('Private Key & Seedphrase – Dein Zugangscode')
    d.para('Der Private Key ist eine lange Zeichenkette aus Zahlen und Buchstaben – technisch korrekt, aber für Menschen unpraktisch. Deshalb gibt es die Seedphrase: 12 normale Wörter (z.B. "ocean hidden spring mountain..."), aus denen alle deine Private Keys mathematisch berechnet werden.')
    d.para('Wichtig zu verstehen: Alle EVM-kompatiblen Chains – also Ethereum, BNB Chain, Polygon, Arbitrum und andere – teilen sich denselben Private Key und dieselbe Wallet-Adresse. Deine Adresse «0xABC...» auf Ethereum ist identisch mit deiner Adresse auf BNB Chain. Separate Private Keys entstehen nur bei anderen Blockchain-Familien wie Bitcoin oder Solana. Die Seedphrase ist damit der Master-Schlüssel zu allem.')
    d.warn('Wer deine 12 Wörter hat, hat vollen Zugriff auf sämtliche deiner Wallets auf allen Blockchains. Deshalb: Nur auf Papier, niemals digital, an mehreren sicheren Orten aufbewahren.')
    d.sp(6)
    d.insert_image(
        '/mnt/user-data/uploads/ebook-img-keys.png',
        caption='Seedphrase → Private Key → Public Key / Wallet-Adresse',
        max_w=TW,
        max_h=210
    )
    d.new_page(dark=False)
    d.tag('KAPITEL 2 · TECHNISCHE GRUNDLAGEN')
    d.sp(16)

    d.h3('Public Key & Adressen – Deine Kontonummer')
    d.para('Aus deinem Private Key wird auch deine Wallet-Adresse generiert – eine lange Zeichenkette wie "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb". Diese Adresse ist wie deine Kontonummer – öffentlich und du kannst sie jedem geben, der dir Kryptos senden will.')
    d.warn('Jede Blockchain hat ihr eigenes Adress-Format. Du kannst nicht einfach Bitcoin an eine Ethereum-Adresse schicken – das Geld wäre weg.')

    d.sp(4)
    d.h3('Transaktionen – Was passiert beim Senden?')
    d.para('Wenn du Kryptos sendest, erstellt dein Wallet eine Transaktion, signiert sie mit deinem Private Key und schickt sie ins Netzwerk. Miner oder Validatoren prüfen sie, packen sie in einen Block und hängen ihn an die Blockchain. Je nach Blockchain dauert das unterschiedlich lang: Bitcoin ca. 10 Minuten, Ethereum 1-2 Minuten, andere Chains manchmal nur Sekunden.')
    d.warn('KRITISCH: Einmal bestätigt, gibt es kein Zurück. Keine Bank hilft dir. Die Transaktion ist für immer in der Blockchain. Deshalb: IMMER doppelt prüfen, IMMER erst mit kleinen Beträgen testen.')

    d.sp(4)
    d.h3('Gas Fees – Die Transaktionskosten')
    d.para('Jede Transaktion braucht Rechenleistung. Computer (Miner/Validatoren) prüfen und bestätigen sie – dafür werden sie mit Gas Fees bezahlt. Die Höhe hängt von der Netzwerk-Auslastung und der Blockchain ab.')
    d.table([
        ['Blockchain', 'Typische Gebühren'],
        ['Ethereum',   '0.01 – 0.50 $'],
        ['Bitcoin',    '1 – 5 $'],
        ['Polygon',    '0.0001 – 0.10 $'],
        ['BNB Chain',  '0.01 – 0.10 $'],
    ], col_widths=[TW // 2, TW // 2])
    d.tip('Deshalb nutzen viele für kleinere Beträge günstigere Chains wie Polygon oder BNB Chain.')

    d.sp(4)
    d.h3('Verschiedene Blockchains – Ein Ökosystem')
    d.para('Es gibt hunderte Blockchains – jede mit eigenen Stärken. Stell sie dir wie verschiedene Länder vor: Jedes hat seine eigene Währung, seine eigenen Regeln und seine eigenen Gebühren. Du brauchst immer die «Landeswährung» einer Chain, um dort Transaktionen durchzuführen.')
    d.sp(4)
    d.table([
        ['Chain',         'Native Coin',  'Gas Fees',       'Für wen'],
        ['BNB Chain  ★',  'BNB',          '0.01–0.10 $',   'Ideal für Einsteiger – dfx.swiss liefert direkt hier'],
        ['Ethereum',      'ETH',          '0.01–0.50 $',   'Grösste DeFi-Plattform, seit 2024 deutlich günstiger'],
        ['Polygon',       'MATIC/POL',    '< 0.001 $',      'Ethereum-kompatibel, extrem günstige Alternative'],
        ['Bitcoin',       'BTC',          '1–5 $',          'Digitales Gold – kein DeFi, nur Senden/Empfangen'],
    ], col_widths=[90, 72, 75, TW - 237])
    d.warn('Gleicher Token, verschiedene Chains: USDT auf BSC ist ein anderer Token als USDT auf Ethereum. Beide sind 1 Dollar wert – aber auf verschiedenen Netzwerken. Falsche Chain = Tokens weg.')
    d.tip('Für den Anfang: Bleib auf BNB Chain. Günstig, schnell, und dfx.swiss liefert direkt dorthin.')

    d.sp(4)
    d.para('Das waren die wichtigsten Grundlagen. Klingt viel? Ist es auch. Aber du musst nicht alles im Detail verstehen. Wichtig ist, dass du das grosse Bild siehst:')
    d.info_box('Das Wichtigste auf einen Blick', [
        'Blockchain ist ein transparentes, dezentrales System.',
        'Wallets sind Schlüssel, nicht Geldbörsen.',
        'Seedphrases sind heilig.',
        'Transaktionen sind endgültig.',
    ])
    d.para('Mit diesem Verständnis bist du bereit für die Praxis.')

    # ── Stablecoins ───────────────────────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 2 · STABLECOINS')
    d.sp(16)
    d.h2('Stablecoins – Dein sicherer Hafen in Krypto')
    d.para('Eines der grössten Themen für Einsteiger ist die Volatilität: Bitcoin und Ethereum schwanken stark im Preis – heute 50\'000 CHF, morgen 43\'000 CHF. Das macht sie für viele Zwecke unpraktisch. Die Lösung: Stablecoins.')

    d.sp(4)
    d.h3('Was ist ein Stablecoin?')
    d.para('Ein Stablecoin ist eine Kryptowährung, die an eine echte Währung (meistens den US-Dollar) gekoppelt ist. 1 USDC = immer ca. 1 US-Dollar. Der Kurs schwankt kaum. Du hast damit die Vorteile von Krypto (schnelle Transaktionen, eigene Verwahrung, DeFi-Nutzung) ohne das Kursrisiko.')

    d.sp(4)
    d.h3('Warum sind Stablecoins so wichtig?')
    for txt in [
        'Parken: Krypto-Markt fällt? Tausche in USDC und behalte deinen Wert – kein Kursrisiko.',
        'DeFi: Viele DeFi-Plattformen arbeiten mit Stablecoins. Verdiene Zinsen ohne Volatilität.',
        'Überweisungen: Schnell und günstig Geld weltweit schicken – ohne Bank, ohne SWIFT.',
        'Einstieg: Perfekt für erste Schritte. Kaufe USDC/USDT, lerne das System, dann erst Kurs-Risiko eingehen.',
    ]:
        d.bullet(txt)

    d.sp(4)
    d.h3('Die wichtigsten Stablecoins')
    d.table([
        ['Stablecoin', 'Kopplung', 'Herausgeber',              'Empfehlung'],
        ['USDC',       '1 USD',    'Circle (USA, reguliert)',   'Sicherste Wahl'],
        ['USDT',       '1 USD',    'Tether Ltd.',               'Grösste Liquidität'],
        ['EURC',       '1 EUR',    'Circle (USA, reguliert)',   'Für Eurozone'],
        ['DAI',        '1 USD',    'MakerDAO (dezentral)',      'Für Fortgeschrittene'],
    ], col_widths=[70, 60, 180, TW - 310])

    d.sp(4)
    d.h3('Wie funktioniert die Kopplung?')
    d.para('Bei USDC und USDT (zentralisiert): Die herausgebende Firma verwahrt echte Dollars auf Bankkonten. Für jeden ausgegebenen USDC liegt 1 Dollar in Reserve. Bei USDC finden regelmässige Audits statt – transparent und nachvollziehbar.')

    d.sp(4)
    d.hl_box('MEIN TIPP', '"Für den Start empfehle ich USDT oder USDC. Damit kannst du erste Erfahrungen sammeln ohne Angst vor Kursschwankungen. Kein Kursrisiko, trotzdem echte Krypto-Erfahrung. Später kannst du in Bitcoin oder Ethereum tauschen."')

    # ── Coin vs. Token & Token-Arten ─────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 2 · COIN VS. TOKEN')
    d.sp(16)
    d.h2('Coin oder Token – was ist der Unterschied?')
    d.para('Bevor wir uns die verschiedenen Token-Arten anschauen, müssen wir eine Grundunterscheidung klären, die im Alltag ständig auftaucht.')

    d.sp(4)
    d.two_box(
        'Coin', [
            'Gehört direkt zur eigenen Blockchain',
            'Wird für Gas Fees benötigt',
            'Existiert ohne Smart Contract',
            'Beispiele: BTC, ETH, BNB, MATIC',
        ],
        'Token', [
            'Läuft auf einer bestehenden Blockchain',
            'Wird über Smart Contract definiert',
            'Braucht Coin der Host-Chain für Fees',
            'Beispiele: USDC, UNI, AAVE, LINK',
        ],
    )

    d.sp(4)
    d.hl_box('ALLTAGSVERGLEICH', 'Coin = Landeswährung. CHF in der Schweiz, EUR in der EU. Überall gültig. – Token = Gutschein in einem bestimmten Geschäft. Nur dort gültig – und du brauchst trotzdem die Landeswährung, um dorthin zu gelangen.')

    d.sp(4)
    d.warn('Wenn du Tokens besitzt, brauchst du immer auch etwas vom nativen Coin der Blockchain für Gebühren. Tokens auf Ethereum → ETH. Tokens auf BSC → BNB. Tokens auf Polygon → MATIC.')

    d.sp(8)
    d.h2('Token-Arten – ein Überblick')
    d.para('Nicht alle Tokens sind gleich. Je nach Zweck unterscheidet man verschiedene Kategorien. In der Praxis sind viele Tokens Hybrid-Tokens – sie erfüllen mehrere Rollen gleichzeitig.')

    d.sp(4)
    for name, sub, desc, examples in [
        ('Utility Token',
         'Zugang und Funktion',
         'Hat einen konkreten funktionalen Nutzen: Bezahlen von Gebühren, Freischalten von Features oder internes Zahlungsmittel eines Ökosystems. Die häufigste Token-Art im DeFi-Bereich.',
         'Beispiele: BNB, ETH, UNI, LINK'),
        ('Governance Token',
         'Mitspracherecht im Protokoll',
         'Wer diese Tokens hält, kann über Änderungen am Protokoll abstimmen. DeFi-Projekte werden oft als DAO (Decentralized Autonomous Organization) geführt – die Token-Inhaber entscheiden gemeinsam.',
         'Beispiele: AAVE, COMP, CRV'),
        ('Stablecoin',
         'An Fiatwährung gekoppelt',
         'Immer ~1 Dollar oder 1 Euro wert. Kein Kursrisiko. Das Fundament von DeFi – und der ideale Einstiegspunkt. Ausführlicher im vorherigen Abschnitt.',
         'Beispiele: USDT, USDC, EURC, DAI'),
        ('LP Token',
         'Nachweis über bereitgestellte Liquidität',
         'Wenn du Liquidität in einem DeFi-Pool bereitstellst, hinterlegst du immer zwei Kryptowährungen gleichzeitig – z. B. BNB und USDT im gleichen Gegenwert. Als Quittung erhältst du LP Tokens, die deinen Anteil am Pool belegen.',
         'Beispiele: CAKE-LP, UNI-V2'),
        ('NFT',
         'Non-Fungible Token – einzigartig, unteilbar',
         'Jedes NFT ist einmalig – kein Token ist identisch mit einem anderen. Häufig für digitale Kunst, Sammlerstücke oder Zertifikate. Im Gegensatz zu normalen Tokens nicht einfach austauschbar.',
         'Beispiele: BAYC, digitale Kunst, Zertifikate'),
        ('Meme Coin',
         'Community und Hype – hohes Risiko',
         'Meme Coins haben meist keine technische Grundlage oder realen Nutzen. Ihr Kurs wird durch Social Media und kurzfristigen Hype getrieben. Du wirst ihnen begegnen. Investiere dort nie mehr, als du bereit bist vollständig zu verlieren.',
         'Beispiele: DOGE, SHIB, PEPE'),
        ('Security Token',
         'Tokenisierte Wertpapiere – rechtlich reguliert',
         'Repräsentiert reale Werte oder Beteiligungen – ähnlich einer Aktie oder Anleihe, aber auf der Blockchain. Security Tokens sind Wertpapiere im rechtlichen Sinne. Für den DeFi-Einstieg kaum relevant – wichtig ist, den Begriff zu kennen.',
         ''),
    ]:
        row_h = 13
        lines_desc = d.wrap_text(desc, 'Body-L', 8.5, TW - 14)
        lines_ex   = d.wrap_text(examples, 'Body-L', 7.5, TW - 14) if examples else []
        bh = 14 + 12 + len(lines_desc) * row_h + (len(lines_ex) * 11 + 4 if lines_ex else 0) + 10
        d.guard(bh + 8)
        bx, by = ML - 4, d.y - bh
        d.rect(bx, by, TW + 8, bh, DARK3)
        d.rect(bx, by, 4, bh, GOLD_D)
        d.c.setFillColor(GOLD)
        d.c.setFont('H-Med', 9.5)
        d.c.drawString(bx + 12, by + bh - 13, name)
        d.c.setFillColor(GOLD_D)
        d.c.setFont('Body-L', 7.5)
        d.c.drawString(bx + 12, by + bh - 24, sub)
        ty = by + bh - 38
        d.c.setFillColor(HexColor('#a89880'))
        d.c.setFont('Body-L', 8.5)
        for line in lines_desc:
            d.c.drawString(bx + 12, ty, line)
            ty -= row_h
        if lines_ex:
            ty -= 2
            d.c.setFillColor(GOLD_D)
            d.c.setFont('Body-L', 7.5)
            for line in lines_ex:
                d.c.drawString(bx + 12, ty, line)
                ty -= 11
        d.y = by - 8

    d.sp(4)
    d.tip('Tokens können mehreren Kategorien gleichzeitig angehören. BNB ist zum Beispiel gleichzeitig Utility Token und Governance Token. Diese Einteilung ist ein Orientierungsrahmen – kein starres System.')

    d.sp(4)
    d.hl_box('MEIN TIPP', '«Für den Start brauchst du nur zwei Kategorien wirklich zu kennen: Stablecoins für Sicherheit und Utility Coins für Gas Fees. Governance, LP Tokens, NFTs und Security Tokens kommen, wenn du sie brauchst. Schritt für Schritt.»')

    d.new_page(dark=False)
    d.tag('KAPITEL 2 · HÄUFIGE FEHLER')
    d.sp(16)
    d.h2('Die grössten Anfängerfehler (und wie du sie vermeidest)')

    d.h3('Fehler #1: Zu schnell zu viel investieren')
    d.para('Der klassische Fehler: Du hörst von Krypto, bist begeistert und schmeisst direkt dein gesamtes Erspartes rein. NICHT TUN. Fang klein an. Teste mit Beträgen, die du verkraften kannst zu verlieren. Lerne das System kennen, bevor du all-in gehst.')

    d.h3('Fehler #2: Seedphrase digital speichern')
    d.para('Deine Seedphrase ist der Schlüssel zu deinem Geld. Wenn jemand anderes sie hat, hat er dein Geld. Punkt. Sie gehört NIEMALS in eine Datei, ein Foto oder eine Cloud. Nur auf Papier, sicher verwahrt.')

    d.h3('Fehler #3: Auf Exchanges liegen lassen')
    d.para('"Not your keys, not your coins" – das ist kein Spruch, das ist Gesetz. Wenn dein Geld auf einer Exchange liegt, gehört es faktisch der Exchange. Hol es runter in dein eigenes Wallet.')

    d.h3('Fehler #4: Phishing-Links klicken')
    d.para('Die Betrüger werden immer raffinierter. Niemals auf Links in E-Mails klicken, die nach deiner Seedphrase fragen. NIEMALS. Keine seriöse Plattform fragt danach.')

    d.h3('Fehler #5: Panik bei Kursschwankungen')
    d.para('Krypto ist volatil. Der Kurs geht rauf und runter. Wenn du für langfristige Selbstbestimmung dabei bist, sind diese Schwankungen egal. Wenn du nicht schlafen kannst, weil der Kurs fällt, hast du zu viel investiert.')

    d.h3('Fehler #6: Keine Backups machen')
    d.para('Was passiert, wenn dein Haus abbrennt? Wenn du ausgeraubt wirst? Hast du ein Backup deiner Seedphrase an einem anderen Ort? Redundanz ist nicht paranoid, sie ist klug.')

    d.sp(6)
    d.hl_box('ERFAHRUNG', 'Diese Fehler habe ich alle selbst gemacht oder in meinen Coachings beobachtet. Jeder einzelne ist vermeidbar. Und genau darum geht es in diesem Buch: Dir die Abkürzung zu zeigen, die ich nicht hatte.')


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 3 – PHASE 1: VORBEREITUNG
# ─────────────────────────────────────────────────────────────────────────────
def kap3(d: P):
    d.chapter_opener(3, 'Phase 1: Vorbereitung', 'Der mentale Shift')

    d.new_page(dark=False)
    d.tag('KAPITEL 3 · PHASE 1: VORBEREITUNG')
    d.sp(16)
    d.para('Bevor du auch nur einen Cent in Krypto steckst oder dein erstes Wallet anlegst, müssen wir über etwas Grundlegendes sprechen: Deine Einstellung.')
    d.para('Der Wechsel von traditionellem Banking zu Krypto ist nicht nur technisch. Es ist ein kompletter Mindset-Shift. Du gehst von "die Bank kümmert sich" zu "ich kümmere mich selbst". Das ist ein riesiger Unterschied.')

    d.sp(4)
    d.h2('Der Mindset-Check')
    d.para('Beantworte ehrlich diese Fragen für dich:')
    for txt in [
        'Bin ich bereit, Verantwortung für mein Geld zu übernehmen?',
        'Kann ich damit leben, dass es keinen Kundenservice gibt, der mich rettet?',
        'Bin ich bereit, Zeit zu investieren, um das System zu verstehen?',
        'Kann ich mit der Volatilität leben, ohne in Panik zu geraten?',
        'Vertraue ich mir selbst mehr als einer Institution?',
    ]:
        d.bullet(txt)

    d.sp(4)
    d.para('Wenn du auch nur bei einer Frage gezögert hast – gut. Das ist ehrlich. Krypto ist nicht für jeden. Und das ist okay.')
    d.para('Aber wenn dich diese Fragen nicht abschrecken, sondern anziehen – dann bist du bereit.')

    d.sp(6)
    d.h2('Was du brauchst (und was nicht)')

    d.two_box(
        'Du brauchst:', [
            'Ein Smartphone oder Computer',
            'Eine E-Mail-Adresse',
            'Zeit zum Lernen (ca. 5-10 Stunden)',
            'Kleinen Testbetrag (50-200 CHF/EUR)',
            'Papier und Stift für deine Seedphrase',
            'Sicherer Aufbewahrungsort (Tresor, etc.)',
        ],
        'Du brauchst NICHT:', [
            'Tausende von Euro/Franken',
            'Informatik-Kenntnisse',
            'Trading-Erfahrung',
            'Hardware-Wallet (am Anfang)',
            'Komplizierte Software oder Tools',
        ]
    )

    d.sp(6)
    d.h2('Die Sicherheits-Grundlagen')
    d.para('Bevor es praktisch wird, müssen wir über Sicherheit sprechen. Nicht weil ich dich abschrecken will, sondern weil es absolut essentiell ist.')

    d.h3('Seedphrase ist heilig:')
    d.para('Deine Seedphrase (12 Wörter) ist der Master-Key zu deinem Geld. Sie wird NIEMALS digital gespeichert. Niemals fotografiert. Niemals in eine Cloud. Nur auf Papier, an einem sicheren Ort.')

    d.h3('Vertraue niemandem blind:')
    d.para('Nicht dem nettesten Support-Mitarbeiter. Nicht der offiziell aussehenden E-Mail. Niemand, der seriös ist, wird JEMALS nach deiner Seedphrase fragen.')

    d.h3('Teste immer erst klein:')
    d.para('Bevor du grössere Beträge bewegst, teste mit Mini-Beträgen. Schicke dir kleine Beträge (20-200 CHF/EUR). Warte ab. Prüfe. Dann erst mehr.')

    d.h3('Doppelt hält besser:')
    d.para('Ein Backup reicht nicht. Zwei Backups an verschiedenen Orten sind Minimum. Drei sind besser.')

    d.h3('URLs immer prüfen:')
    d.para('Betrüger erstellen Fake-Websites, die täuschend echt aussehen. Tippe URLs immer selbst ein. Nutze Bookmarks. Klicke nie auf Links in E-Mails.')

    d.h3('Kein öffentliches WLAN:')
    d.para('Melde dich NIEMALS in deinem Wallet an, wenn du mit einem öffentlichen WLAN verbunden bist (Café, Hotel, Flughafen, Bahnhof). In öffentlichen Netzwerken können Angreifer deinen Datenverkehr mitlesen. Nutze wenn immer möglich ein VPN (Virtual Private Network). Ein VPN verschlüsselt deinen Internetverkehr, sodass niemand mitlesen kann – auch nicht im öffentlichen WLAN. Empfehlenswerte Anbieter: Mullvad, ProtonVPN, NordVPN.')

    d.sp(4)
    d.h3('Weitere Sicherheits-Empfehlungen:')
    for txt in [
        'Handy & PC immer mit Passwort/PIN/Biometrie schützen',
        'Regelmässige Updates installieren (iOS, Android, Apps, Browser)',
        'Antivirus-Software auf dem PC nutzen (z.B. Malwarebytes)',
        'Wallet-Apps nur aus offiziellen App Stores laden (kein Sideloading)',
        'Separate E-Mail-Adresse nur für Krypto-Accounts verwenden',
        'Passwort-Manager nutzen (z.B. Bitwarden, 1Password) – niemals Passwörter wiederverwenden',
        'Transaktionen immer in Ruhe prüfen – nie unter Zeitdruck handeln',
    ]:
        d.bullet(txt)
    d.new_page(dark=True)
    d.tag('KAPITEL 3 · SICHERHEITS-CHECKLISTE')
    d.sp(16)
    d.h1('Deine Sicherheits-Checkliste', col=CREAM)
    d.sp(4)
    d.para('Diese Checkliste ist dein Fundament. Drucke sie aus, hake ab, und behalte sie griffbereit:', col=HexColor('#a89880'))
    d.sp(8)
    for txt in [
        'Ich habe verstanden, dass meine Seedphrase niemals digital gespeichert wird',
        'Ich habe einen sicheren Aufbewahrungsort für meine Seedphrase',
        'Ich habe einen zweiten Aufbewahrungsort für mein Backup',
        'Ich weiss, dass keine seriöse Firma nach meiner Seedphrase fragt',
        'Ich werde immer erst mit kleinen Beträgen testen',
        'Ich gebe URLs selbst ein und klicke nicht auf Links in E-Mails',
        'Ich habe 2-Faktor-Authentifizierung auf allen relevanten Accounts',
        'Ich bin bereit, Verantwortung für mein Geld zu übernehmen',
        'Ich weiss, dass es keinen Kundenservice gibt, der mich rettet',
        'Ich investiere nur Geld, das ich verkraften kann zu verlieren (am Anfang)',
    ]:
        d.check_item(txt)
    d.sp(6)
    d.hl_box('GRUNDSATZ', '"Sicherheit ist kein Feature. Es ist die Grundlage von allem, was du in Krypto machst."')
    d.sp(6)
    d.para('Wenn du diese Checkliste durchgegangen bist und dich wirklich damit auseinandergesetzt hast – herzlichen Glückwunsch. Du bist bereit für den nächsten Schritt: Dein erstes Wallet.', col=HexColor('#a89880'))


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 4 – PHASE 2: ERSTES WALLET
# ─────────────────────────────────────────────────────────────────────────────
def kap4(d: P):
    d.chapter_opener(4, 'Phase 2: Dein erstes Wallet')

    d.new_page(dark=False)
    d.tag('KAPITEL 4 · DEIN ERSTES WALLET')
    d.sp(16)

    d.h2('Was ist ein Wallet überhaupt?')
    d.para('Ein Wallet ist NICHT ein Ort, wo deine Kryptos gespeichert sind. Deine Kryptos existieren auf der Blockchain. Das Wallet ist nur der Schlüssel, um darauf zuzugreifen. Stell es dir vor wie einen Briefkasten: Die Post (Kryptos) liegt drin, aber nur du hast den Schlüssel (Seedphrase).')

    d.sp(4)
    d.hl_box('BEGRIFFSERKLÄRUNG – «WALLET»',
        'Im Krypto-Bereich sprechen wir mit dem gleichen Wort «Wallet» über zwei verschiedene Dinge. '
        'Wallet als Konzept: dein persönlicher Schlüssel zur Blockchain, unabhängig von einer Software. '
        'Wer deine Seedphrase hat, hat dieses Wallet. Du kannst es jederzeit auf einem anderen Gerät oder in einer anderen App wiederherstellen. – '
        'Wallet als Software: die App oder Browser-Erweiterung, die du nutzt, um auf dein Wallet zuzugreifen '
        '(z. B. MetaMask, Trust Wallet, SafePal). Die Software ist nur das Fenster. Das eigentliche Wallet sind deine Schlüssel.')

    d.sp(4)
    d.h2('Wallet-Typen: Was passt zu dir?')
    d.table_wrapped([
        ['Typ', 'Vorteile', 'Nachteile', 'Für wen?'],
        ['Hot Wallet (App/Browser)', 'Einfach, schnell, kostenlos', 'Online = Risiko, nicht für grosse Beträge', 'Anfänger, kleine Beträge'],
        ['Cold Wallet (Hardware)',   'Max. Sicherheit, offline',    'Kostet Geld, komplexer',                    'Fortgeschrittene, grosse Beträge'],
        ['Paper Wallet',             'Komplett offline, kostenlos', 'Kann verloren/beschädigt werden',           'Langzeit-Aufbewahrung'],
    ], col_widths=[105, 130, 140, 120])

    d.sp(4)
    d.tip('Meine Empfehlung für den Start: Beginne mit einem Hot Wallet (z.B. MetaMask, TokenPocket oder SafePal). Teste damit, lerne das System kennen. Wenn du dann grössere Beträge hältst, investiere in eine Hardware Wallet wie Ledger oder Tangem.')

    d.sp(6)
    d.h2('Schritt-für-Schritt: Dein erstes Wallet')
    d.para('Die Einrichtung eines Wallets ist ein kritischer Moment, der höchste Aufmerksamkeit erfordert. Im Kern geht es um folgende Schritte:')

    for num, title, content in [
        (1, 'Wallet-App herunterladen',
             ['Von der offiziellen Website (URL selbst eintippen!)',
              '! NIEMALS von Drittanbieter-Links – nur offizielle Quellen!']),
        (2, 'Neues Wallet erstellen',
             ['Nach dem Start erscheint die Auswahl: «Neues Wallet erstellen» oder «Bestehendes importieren»',
              'Wir wählen: Neues Wallet erstellen',
              'Starkes Passwort wählen (mind. 12 Zeichen, Gross-/Kleinbuchstaben, Zahlen, Symbole)',
              '→ «Wallet importieren» brauchst du erst später – wenn du auf einem neuen Gerät wiederherstellen willst']),
        (3, 'Seedphrase sichern',
             ['12 Wörter auf Papier schreiben (NIEMALS digital!)',
              '! Kein Screenshot – kein Cloud-Upload – kein Foto!',
              '\u2192 Druckvorlage für das Sicherungsblatt findest du in der App']),
        (4, 'Verifizierung',
             ['Wörter in richtiger Reihenfolge bestätigen',
              'MetaMask prüft ob du sie korrekt notiert hast']),
        (5, 'Sicher aufbewahren',
             ['Seedphrase an sicherem Ort (Tresor/Bankfach)',
              'Verpackt, beschriftet, laminiert']),
        (6, 'Backup erstellen',
             ['Zweite Kopie an anderem Ort deponieren',
              'Drei Backups sind besser als zwei']),
    ]:
        d.step(num, title, content)

    d.sp(4)
    d.hl_box('WICHTIG', '"Die fünf Minuten, die du jetzt in die korrekte Sicherung deiner Seedphrase investierst, können später Tausende Euro/Franken wert sein."')

    d.sp(4)
    d.tip('Was du mit der Seedphrase alles kannst: Wallet auf einem neuen Gerät wiederherstellen, wenn das alte kaputt geht. Wallet gleichzeitig auf mehreren Geräten nutzen. Wallet in einer anderen Wallet-Software öffnen. Zugang zurückgewinnen, wenn du das App-Passwort vergessen hast.')

    d.sp(4)
    d.warn('Diese Flexibilität hat eine Kehrseite: Wer deine Seedphrase kennt, hat denselben Zugang – auf jedem Gerät, sofort. Deshalb gilt: Seedphrase niemals teilen, niemals digital speichern.')

    d.sp(4)
    d.para('Wichtig: Die genaue Durchführung dieser Schritte ist kritisch für deine Sicherheit. In meinem 1:1-Coaching gehen wir jeden Schritt gemeinsam durch, damit nichts schiefgeht. Hier im Buch gebe ich bewusst nur die Grundstruktur weiter – für die sichere Umsetzung empfehle ich professionelle Begleitung.')

    # ── Seedphrase Sicherungsblatt ─────────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 4 · SEEDPHRASE SICHERUNGSBLATT')
    d.sp(16)
    d.h1('Dein Datensicherungsblatt für die Seedphrase')
    d.sp(4)
    d.para('Drucke es aus und fülle es von Hand aus. Du findest es auch in der App zum Ausdrucken.')
    d.sp(6)
    d.insert_image(
        '/mnt/user-data/uploads/ebook-img-sicherungsblatt.png',
        caption='Druckvorlage für dein Seedphrase-Sicherungsblatt.',
        max_w=TW,
        max_h=480
    )


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 5 – PHASE 3: ERSTER KAUF
# ─────────────────────────────────────────────────────────────────────────────
def kap5(d: P):
    d.chapter_opener(5, 'Phase 3: Der erste Kauf')

    d.new_page(dark=False)
    d.tag('KAPITEL 5 · DER ERSTE KAUF')
    d.sp(16)
    d.para('Jetzt hast du dein Wallet. Zeit, es mit Leben zu füllen. Aber bevor du loslegst: Wir fangen klein an. SEHR klein.')

    d.sp(4)
    d.h2('Wo kaufen? Die Optionen')

    d.h3('Fiat-Krypto-Brücken (On-Ramps)')
    d.para('Spezialisierte Dienste, die eine direkte Brücke zwischen deinem Bankkonto und der Blockchain bauen. Du überweist Fiat (CHF/EUR), bekommst Krypto direkt in dein Wallet.')
    d.two_box(
        '✓ Vorteile', ['Schnell, einfach', 'Direkt in dein Wallet', 'Keine Zwischenlagerung'],
        '✗ Nachteile', ['Gebühren ca. 1-3%', 'Weniger Coins verfügbar'],
    )

    d.sp(4)
    d.h3('Zentralisierte Exchanges (CEX)')
    d.para('Plattformen wie Coinbase, Kraken, Binance.')
    d.two_box(
        '✓ Vorteile', ['Grosse Auswahl', 'Günstigere Gebühren', 'Bekannte Marken'],
        '✗ Nachteile', ['Dein Geld liegt bei denen', 'Widerspricht Selbstverwahrung', 'Nur sinnvoll für aktives Trading'],
    )

    d.sp(4)
    d.h3('Bitcoin-Automaten')
    d.para('Bargeld rein, Bitcoin raus.')
    d.two_box(
        '✓ Vorteile', ['Anonym', 'Schnell', 'Überall verfügbar'],
        '✗ Nachteile', ['Hohe Gebühren (5-10%)', 'Nicht überall vorhanden'],
    )

    d.sp(4)
    d.tip('Meine generelle Empfehlung: Nutze eine Fiat-Krypto-Brücke wie dfx.swiss. Das ist der direkteste und sicherste Weg – dein Geld geht sofort in DEIN Wallet, ohne Zwischenstopp. Du behältst die Kontrolle von Anfang an.')

    d.sp(6)
    d.h3('So läuft der Kauf über eine Fiat-Brücke ab:')
    d.sp(4)
    d.flow_diagram([
        ('🏦', 'Dein Bankkonto', 'CHF / EUR\nBanküberweisung', 'CHF / EUR überweisen'),
        ('🌉', 'dfx.swiss',      'tauscht CHF / EUR\nin Krypto',    'Krypto senden'),
        ('👛', 'Dein Wallet',    'MetaMask\nTangem etc.',            ''),
    ])

    d.new_page(dark=False)
    d.tag('KAPITEL 5 · KAUF SCHRITT FÜR SCHRITT')
    d.sp(16)
    d.h2('Schritt-für-Schritt: Kauf über dfx.swiss')
    d.para('dfx.swiss ist ein Schweizer Anbieter und eine der einfachsten Möglichkeiten, CHF direkt in Krypto zu tauschen – ohne CEX, direkt in dein Wallet.')
    d.sp(4)
    d.hl_box('DFX REFERRAL-LINK', 'https://dfx.swiss/app/services/?code=167-982 – Für bessere Konditionen beim Kauf.')

    for num, title, lines in [
        (1, 'Website & Wallet verbinden',
             ['Referral-Link aufrufen',
              '"Buy Crypto" klicken, dann "Connect Wallet" > MetaMask > Verbinden bestätigen',
              'Deine Wallet-Adresse wird automatisch erkannt']),
        (2, 'Ersten Kauf: BNB (wichtig!)',
             ['Blockchain wählen: BNB Chain (BSC)',
              'Token wählen: BNB – das ist der Coin für Transaktionsgebühren',
              '! Betrag: 10-20 $ – ohne BNB kannst du keine Transaktionen auf BNB Chain machen']),
        (3, 'KYC durchführen (einmalig)',
             ['Identifikation mit Ausweis + Adressnachweis',
              'Bestätigung kommt per E-Mail (ca. 1 Werktag)',
              'Nur einmal nötig – danach direkt kaufen ohne neues KYC']),
        (4, 'Banküberweisung',
             ['IBAN von dfx.swiss wird angezeigt',
              '! Verwendungszweck EXAKT kopieren – kein Leerzeichen vergessen!',
              'E-Banking: Überweisung mit genauem Betrag und Verwendungszweck']),
        (5, 'Warten & prüfen',
             ['Überweisung dauert 1-2 Werktage',
              'Du erhältst eine E-Mail von dfx.swiss zur Bestätigung',
              'Tokens erscheinen automatisch in deinem verbundenen Wallet']),
    ]:
        d.step(num, title, lines)

    d.sp(6)
    d.new_page(dark=False)
    d.tag('KAPITEL 5 · ERSTER KAUF GRUNDSCHRITTE')
    d.sp(16)
    d.h2('Dein erster Kauf – Die Grundschritte')
    d.para('Wenn du eine Fiat-Krypto-Brücke nutzt, ist der Ablauf so:')

    for num, title, lines in [
        (1, 'Account erstellen & verifizieren',
             ['KYC – rechtlich nötig für Fiat-Käufe',
              'Ausweis, Adressnachweis, Selfie vorbereiten']),
        (2, 'Geld einzahlen',
             ['Kleiner Testbetrag: 20-200 CHF/EUR',
              'Per Banküberweisung (günstiger als Karte)']),
        (3, 'Krypto kaufen',
             ['Empfehlung für Einsteiger: USDC oder USDT (Stablecoin)',
              'Achte auf die Gebühren!']),
        (4, 'Transfer ins eigene Wallet',
             ['WICHTIGSTER Schritt!',
              '! Erst kleinen Betrag testen, dann Rest übertragen']),
        (5, 'IMMER zuerst testen',
             ['Kleine Menge senden, warten, prüfen',
              'Erst danach den Rest übertragen']),
    ]:
        d.step(num, title, lines)

    d.sp(4)
    d.hl_box('PROFI-TIPP', '"Die Test-Transaktion ist nicht paranoid. Sie ist professionell. Selbst nach Jahren mache ich das bei neuen Wallets."')

    d.sp(4)
    d.para('Im 1:1-Coaching: Wir machen deinen ersten Kauf gemeinsam – Schritt für Schritt, mit Screen-Sharing, damit du genau siehst wie es geht und nichts schiefläuft.')

    d.new_page(dark=False)
    d.tag('KAPITEL 5 · GEBÜHREN & PROBLEME')
    d.sp(16)

    d.h2('Gebühren verstehen: Das solltest du wissen')
    d.para('Krypto hat Gebühren. Nicht so versteckt wie bei Banken, aber sie existieren. Verstehe sie, dann überraschen sie dich nicht:')

    d.h3('Kauf-Gebühren (Fiat-zu-Krypto Brücken):')
    d.para('1% - 3% je nach Anbieter und Methode. Kreditkarte ist teurer als Banküberweisung.')

    d.h3('Netzwerk-Gebühren (Gas Fees):')
    d.para('Das ist die Gebühr für die Blockchain. Bei Ethereum kostet eine einfache Transaktion heute meist nur noch wenige Cents bis rund $0.50 – ein dramatischer Rückgang gegenüber früheren Jahren. Bei hoher Auslastung kann es aber kurzfristig auch auf $10–50 steigen. Bei anderen Chains (z.B. BNB Chain, Polygon) sind es durchgehend nur wenige Cents.')

    d.sp(6)
    d.h2('Was, wenn etwas schief geht?')
    d.para('Ja, Dinge können schief gehen. Bereite dich mental darauf vor:')

    d.h3('Transaktion hängt fest:')
    d.para('Krypto-Transaktionen können manchmal Stunden dauern, besonders wenn das Netzwerk überlastet ist. Lösung: Geduld. Prüfe den Status auf einem Block Explorer (z.B. etherscan.io für Ethereum). Solange die Transaktion "pending" ist, ist alles okay.')

    d.h3('Falsche Adresse eingegeben:')
    d.para('Wenn du eine Adresse falsch eingibst, ist das Geld weg. Unwiederbringlich. Lösung: IMMER copy-paste. IMMER die ersten und letzten 4 Zeichen prüfen. IMMER erst testen.')

    d.sp(6)
    d.hl_box('MEILENSTEIN', 'Wenn du deinen ersten erfolgreichen Transfer in dein eigenes Wallet gemacht hast – herzlichen Glückwunsch. Du bist jetzt offiziell deine eigene Bank. Das Gefühl ist unbezahlbar.')

    # ── Was du mit Tokens machen kannst ──────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 5 · WAS KANNST DU MIT DEINEN TOKENS MACHEN?')
    d.sp(16)
    d.h2('Was du jetzt mit deinen Tokens machen kannst')
    d.para('Du hast deine ersten Tokens im Wallet. Herzlichen Glückwunsch – das ist ein grösserer Schritt, als er vielleicht aussieht. Jetzt stellt sich die nächste Frage: Was machst du damit? Krypto ist kein statisches Konto. Du kannst Tokens empfangen, versenden, gegen andere tauschen oder auf eine andere Blockchain übertragen.')

    d.sp(4)
    d.h2('1 – Tokens empfangen und senden')
    d.para('Tokens empfangen bedeutet: Jemand schickt dir Krypto an deine Wallet-Adresse – egal ob eine Bekannte, eine Plattform oder du selbst von einem anderen Wallet. Tokens senden ist das Gegenteil: Du überweist Krypto an eine andere Adresse. Das Prinzip ist so einfach wie eine Banküberweisung – aber mit einem entscheidenden Unterschied.')
    d.para('Bei der Bank gibt es Storno, Kundenservice und Rückbuchungen. In der Blockchain gibt es das nicht. Was weg ist, ist weg. Deshalb gelten hier eiserne Grundregeln:')
    for txt in [
        'Adresse immer doppelt prüfen: Vergleiche immer die ersten und letzten 4 Zeichen der Empfänger-Adresse. Nie blind aus der Zwischenablage einfügen.',
        'Richtiges Netzwerk wählen: USDT auf BSC ist nicht dasselbe wie USDT auf Ethereum. Wer auf das falsche Netzwerk sendet, verliert die Tokens.',
        'Immer zuerst testen: Schick beim ersten Mal einen minimalen Testbetrag (1–2 $). Erst wenn der sicher ankommt, sendest du den grossen Betrag.',
        'Geduld haben: Tokens erscheinen nicht immer sofort. Je nach Auslastung des Netzwerks kann es 1–5 Minuten dauern – gelegentlich auch länger.',
    ]:
        d.bullet(txt)
    d.warn('Eine Fehlüberweisung ist endgültig. Kein Kundenservice, kein Storno, kein Rückruf. Genau deshalb: Testen, prüfen, testen.')

    d.new_page(dark=False)
    d.tag('KAPITEL 5 · SWAPPEN')
    d.sp(16)
    d.h2('2 – Tokens swappen')
    d.para('Swappen bedeutet: Du tauschst einen Token direkt gegen einen anderen – ohne Börse, ohne Registrierung, ohne KYC. Alles passiert direkt in deinem Wallet oder über eine dezentrale Börse (DEX). Du bist dabei immer der Eigentümer deiner Assets.')

    d.sp(4)
    d.h3('Wozu brauche ich das – wirklich?')
    d.info_box('Einen anderen Token kaufen', [
        'Du hast USDT und möchtest Bitcoin, ETH oder einen anderen Coin kaufen.',
        'Statt zur Börse zu gehen, tauschst du direkt in deiner Wallet – schnell, günstig, 24/7, ohne Account.',
    ])
    d.sp(4)
    d.info_box('Gewinne sichern', [
        'Dein Token ist im Wert gestiegen und du möchtest den Gewinn einloggen.',
        'Du swappst in einen Stablecoin (z.B. USDT oder USDC) – der Wert ist jetzt gesichert, keine Kursschwankungen mehr.',
        'Das ist einer der wichtigsten Moves: Gewinne mitnehmen, ohne alles zu verkaufen.',
    ])
    d.sp(4)
    d.info_box('Gas Fees möglich machen', [
        'Jede Blockchain braucht ihren nativen Coin für Transaktionsgebühren: BSC = BNB, Ethereum = ETH, Polygon = MATIC.',
        'Wenn du keinen davon hast, bewegt sich gar nichts. Swap ist der schnellste Weg, sich etwas davon zu besorgen.',
        'Beispiel: USDT → kleines BNB, damit du deine ersten Transaktionen auf BSC bezahlen kannst.',
    ])

    d.sp(4)
    d.h3('Wo kann ich swappen?')
    d.table_wrapped([
        ['Wo',               'Wie',                                                                     'Für wen'],
        [('MetaMask (intern)', 'portfolio.metamask.io'),
                              ('Direkt in der Wallet, vergleicht automatisch DEXs', ''),               'Einsteiger – einfachste Option'],
        [('PancakeSwap',       'pancakeswap.finance'),
                              ('DEX für BNB Chain – im MetaMask-Browser aufrufen', ''),               'BSC-Nutzer'],
        [('Uniswap',           'app.uniswap.org'),
                              ('DEX für Ethereum/Polygon', ''),                                        'ETH/Polygon-Nutzer'],
        [('THORSwap',          'app.thorswap.finance'),
                              ('Cross-Chain Swaps ohne Wrapped Tokens', ''),                           'Einsteiger bis Fortgeschrittene'],
        [('deBridge',          'app.debridge.finance'),
                              ('Viele Chains, schnell, oft günstig', ''),                              'Fortgeschrittene'],
        [('Synapse Protocol',  'synapseprotocol.com'),
                              ('Breite Chain-Unterstützung, gut für Stablecoins', ''),                'Fortgeschrittene'],
    ], col_widths=[145, 220, TW - 365])
    d.warn('Vor der Bestätigung immer prüfen: Token und Betrag korrekt? Ziel-Wert unter "Min. received" prüfen. Slippage-Toleranz bei wenig liquiden Tokens auf 1–3% setzen. Empfänger-Adresse: erste und letzte 4 Zeichen prüfen.')
    d.tip('Wichtig: Die URLs der DEX-Plattformen (PancakeSwap, Uniswap etc.) gibst du nicht im normalen Browser ein – also nicht in Safari oder Chrome. Du öffnest sie im wallet-internen Browser deiner MetaMask App. Den findest du meistens unter «Entdecken» oder «Erkunden». Nur so ist deine Wallet automatisch verbunden.')

    d.new_page(dark=False)
    d.tag('KAPITEL 5 · BRIDGING')
    d.sp(16)
    d.h3('3 – Bridging: Zwischen Blockchains wechseln')
    d.para('Stell dir vor, du hast Schweizer Franken und reist in die USA. Mit CHF kannst du dort nicht direkt bezahlen – du musst sie umtauschen. Beim Bridging ist das Prinzip ähnlich: Du überträgst deine Tokens von einer Blockchain auf eine andere. Der Token bleibt derselbe – zum Beispiel USDT – aber er lebt danach auf einer anderen Blockchain.')
    d.para('Konkretes Beispiel: Du hast USDT auf BSC (günstige Gebühren), möchtest aber eine DeFi-Plattform nutzen, die nur auf Ethereum verfügbar ist. Du bridgst dein USDT von BSC auf Ethereum. Das dauert ein paar Minuten – fertig.')

    d.sp(4)
    d.h3('Wozu brauche ich Bridging?')
    for txt in [
        'Gebühren optimieren: BSC und Polygon kosten durchgehend nur Cents. Du wechselst dorthin, wo es für dich am günstigsten ist.',
        'Zugang zu Plattformen: Manche DeFi-Protokolle sind nur auf einer bestimmten Blockchain verfügbar. Ohne Bridge kommst du dort nicht ran.',
        'Flexibilität: Du bist nicht auf eine Blockchain festgelegt. Geh dorthin, wo es günstiger ist oder bessere Zinsen gibt.',
    ]:
        d.bullet(txt)

    d.sp(4)
    d.h3('Wie geht Bridging?')
    d.table_wrapped([
        ['Methode',           'Beschreibung',                                                            'Empfehlung'],
        [('MetaMask Bridge',   'portfolio.metamask.io'),
                               ('Integriert in MetaMask, vergleicht Bridge-Anbieter automatisch', ''),  'Einsteiger'],
        [('THORSwap',          'app.thorswap.finance'),
                               ('Cross-Chain ohne Wrapped Tokens', ''),                                  'Einsteiger bis Fortgeschrittene'],
        [('deBridge',          'app.debridge.finance'),
                               ('Viele Chains, schnell, oft günstiger als MetaMask', ''),               'Fortgeschrittene'],
        [('Stargate Finance',  'stargate.finance'),
                               ('ETH, BSC, Polygon, Avalanche, Arbitrum, Base', ''),                    'Fortgeschrittene'],
        [('Synapse Protocol',  'synapseprotocol.com'),
                               ('Breite Chain-Unterstützung, gut für Stablecoins', ''),                 'Fortgeschrittene'],
    ], col_widths=[145, 220, TW - 365])
    for txt in [
        'Du brauchst Gas Fees auf BEIDEN Seiten – auf der Quell-Chain und auf der Ziel-Chain.',
        'Bridging dauert je nach Anbieter und Netzwerk 2–30 Minuten. Einfach warten – die Tokens kommen.',
        'Nur seriöse Bridges nutzen. Fake-Bridge-Websites sind ein bekanntes Betrugsschema. URL selbst eintippen.',
        'Kleinen Testbetrag zuerst. Auch beim Bridging gilt: erst testen, dann den vollen Betrag übertragen.',
    ]:
        d.bullet(txt)
    d.tip('Auch Bridge-Plattformen öffnest du im wallet-internen Browser deiner MetaMask App – nicht in Safari oder Chrome. Nur so ist deine Wallet direkt verbunden. Den integrierten Browser findest du in MetaMask unter «Entdecken» oder «Erkunden».')

    d.new_page(dark=False)
    d.tag('KAPITEL 5 · TOKENS SICHTBAR MACHEN')
    d.sp(16)
    d.h3('4 – Tokens sichtbar machen (Token importieren)')
    d.para('Stell dir vor, du hast Geld auf deinem Bankkonto, aber die Banking-App zeigt es dir nicht an. Das Geld ist da – es wird nur nicht angezeigt. Genau das passiert manchmal bei Krypto-Wallets.')
    d.para('Wenn du einen Token kaufst oder erhältst, den deine Wallet nicht automatisch erkennt, erscheint er zunächst nicht in der Übersicht. Importieren bedeutet schlicht: Token sichtbar machen. Es wird nichts verändert, nichts genehmigt, nichts übertragen.')

    d.sp(4)
    d.h3('So gehst du vor (MetaMask):')
    for num, title, lines in [
        (1, 'Token importieren öffnen',
             ['In MetaMask nach unten scrollen → «Token importieren» tippen']),
        (2, 'Contract-Adresse eingeben',
             ['Adresse des Tokens eingeben (findest du auf CoinMarketCap, CoinGecko oder dem Block-Explorer)',
              'Token-Name und Symbol werden automatisch befüllt']),
        (3, 'Bestätigen',
             ['Token erscheint jetzt in deiner Wallet-Übersicht']),
    ]:
        d.step(num, title, lines)
    d.warn('Contract-Adresse immer von einer vertrauenswürdigen Quelle kopieren: CoinMarketCap, CoinGecko oder die offizielle Projektwebsite. Falsche Adressen führen zu Fake-Tokens.')

    d.sp(4)
    d.h3('Wichtig: Scam-Tokens, die du nicht selbst importiert hast')
    d.para('Manchmal tauchen in deiner Wallet plötzlich Tokens auf, die du nie gekauft hast – sogenannte Airdrop-Scam-Tokens. Jemand hat sie einfach an deine Adresse gesendet, in der Hoffnung dass du damit interagierst.')
    d.para('Das blosse Sichtbarsein dieser Tokens ist ungefährlich. Der Schaden entsteht erst, wenn du versuchst, diese Tokens zu verkaufen oder zu swappen – denn dann führst du eine Transaktion mit einem bösartigen Smart Contract aus, der dein Wallet leeren kann.')

    d.sp(6)
    d.hl_box('SCAM-TOKENS: DIE REGEL', 'Tokens, die du nicht selbst gekauft hast und die plötzlich auftauchen: Ignorieren. Niemals versuchen zu verkaufen, zu swappen oder zu claimen – auch nicht wenn sie auf dem Explorer einen Wert anzeigen. Dieser Wert ist meistens gefälscht.')

    # ── Zurück zu Fiat ──────────────────────────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 5 · ZURÜCK ZU FIAT')
    d.sp(16)
    d.h2('Zurück zu Fiat – Krypto wieder verkaufen')
    d.para('Du weisst jetzt, wie Krypto kaufen geht. Aber irgendwann willst du vielleicht auch wieder verkaufen – einen Teil der Gewinne sichern, Geld für etwas brauchen, oder einfach den Rückweg testen. Das ist kein Rückschritt. Es ist Selbstbestimmung.')
    d.para('Der einfachste Weg: dfx.swiss in die andere Richtung. Derselbe Anbieter, denselben Weg – aber umgekehrt. Du sendest Krypto an dfx.swiss und bekommst CHF oder EUR direkt auf dein Bankkonto.')

    d.sp(6)
    d.flow_diagram([
        ('👛', 'Dein Wallet',    'MetaMask\nTangem etc.',         'Krypto senden'),
        ('🌉', 'dfx.swiss',      'tauscht Krypto\nin CHF / EUR',  'CHF / EUR überweisen'),
        ('🏦', 'Dein Bankkonto', 'CHF / EUR\nauf deiner IBAN',    ''),
    ])

    d.sp(8)
    d.h3('Schritt für Schritt: Krypto verkaufen über dfx.swiss')
    for num, title, lines in [
        (1, 'dfx.swiss öffnen und «Sell» wählen',
             ['Referral-Link: dfx.swiss/app/services/?code=167-982']),
        (2, 'Coin und Netzwerk auswählen',
             ['z.B. USDT auf BNB Chain',
              'Das Netzwerk muss exakt stimmen – genau wie beim Kaufen']),
        (3, 'IBAN eingeben',
             ['Deine Schweizer oder europäische Bankkontonummer']),
        (4, 'Wallet-Adresse von dfx.swiss kopieren',
             ['dfx.swiss zeigt dir eine Empfangsadresse – dorthin sendest du deine Kryptos']),
        (5, 'Betrag aus dem Wallet senden',
             ['In MetaMask oder Tangem den Betrag an die dfx.swiss-Adresse senden',
              '! Netzwerk prüfen – falsche Chain = Tokens weg']),
        (6, 'Warten',
             ['Überweisung auf dein Bankkonto kommt in der Regel innerhalb von 1–3 Werktagen']),
    ]:
        d.step(num, title, lines)

    d.warn('Auch hier gilt: Zuerst mit einem kleinen Testbetrag üben – z.B. 20 CHF. Erst wenn das Geld auf dem Konto angekommen ist, grössere Beträge senden.')
    d.tip('Übe den Rückweg, bevor du ihn brauchst. Sende dir selbst einmal 20 CHF zurück aufs Bankkonto – nur um sicher zu sein, dass du den Prozess kennst.')


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 6 – PHASE 4: DEFI
# ─────────────────────────────────────────────────────────────────────────────
def kap6(d: P):
    d.chapter_opener(6, 'Phase 4: DeFi verstehen')

    d.new_page(dark=False)
    d.tag('KAPITEL 6 · DEFI VERSTEHEN')
    d.sp(16)
    d.para('Jetzt wird es spannend. Du hast Kryptos in deinem Wallet. Aber was machst du damit? Einfach nur halten? Klar, das geht. Aber DeFi (Decentralized Finance) eröffnet dir eine ganz neue Welt.')

    d.sp(4)
    d.h2('Was ist DeFi eigentlich?')
    d.para('DeFi ist Banking ohne Bank. Stell dir vor: Du willst einen Kredit aufnehmen. Normalerweise gehst du zur Bank, beantragst ihn, wartest, hoffst – und eine Bonitätsprüfung entscheidet, ob du ihn bekommst. Bei DeFi? Du gehst zu einer Plattform, hinterlegst Sicherheiten (Collateral), und nimmst sofort einen Kredit auf. Keine Bonitätsprüfung. Keine Wartezeit. Niemand, der über dich entscheidet.')
    d.para('Oder du willst Zinsen verdienen. Bank gibt dir 0,01%? DeFi kann dir 3-10% geben (ja, mit Risiken, dazu gleich mehr). Du "verleihst" deine Kryptos an andere, automatisch, über Smart Contracts.')

    d.sp(6)
    d.h2('Die wichtigsten DeFi-Anwendungen für Anfänger')

    d.h3('1. Lending/Borrowing (Verleihen/Leihen)')
    d.para('Plattformen: Aave (app.aave.com) · Compound (app.compound.finance)')
    d.para('Du hinterlegst deine Kryptos und verdienst Zinsen. Oder du leihst dir gegen Sicherheiten Kryptos.')
    d.para('Risiko: Mittel. Smart Contract Risiko, Liquidationsrisiko bei Krediten.')
    d.para('Für wen: Leute, die ihre Kryptos nicht nur liegen lassen wollen.')

    d.h3('2. Staking')
    d.para('Plattformen: Lido (lido.fi) · Rocket Pool (rocketpool.net) – für Ethereum')
    d.para('Du "stakst" deine Kryptos, um das Netzwerk zu sichern und verdienst dafür Rewards (oft 4–8% pro Jahr).')
    d.para('Risiko: Niedrig bis Mittel. Je nach Plattform können Kryptos "locked" sein (nicht sofort abrufbar).')
    d.para('Für wen: Langfrist-Holder, die passives Einkommen wollen.')

    d.h3('3. Decentralized Exchanges (DEX)')
    d.para('Plattformen: Uniswap (app.uniswap.org) · PancakeSwap (pancakeswap.finance) · SushiSwap (app.sushi.com)')
    d.para('Kryptos tauschen ohne zentrale Exchange. Direkt aus deinem Wallet.')
    d.para('Risiko: Niedrig (solange du bei etablierten DEXes bleibst). Aber: Gas Fees können hoch sein.')
    d.para('Für wen: Jeder, der Kryptos tauschen will ohne CEX.')

    d.h3('4. Liquidity Pools')
    d.para('Plattformen: Uniswap (app.uniswap.org) · Curve (curve.fi)')
    d.para('Du stellst deine Kryptos als Liquidität für Trades bereit und verdienst Gebühren. Dafür hinterlegst du immer zwei Kryptowährungen gleichzeitig – z. B. BNB und USDT im gleichen Gegenwert. Als Bestätigung erhältst du LP Tokens in dein Wallet, die deinen Anteil am Pool belegen.')
    d.tip('Wie LP Tokens funktionieren: Deine LP Tokens liegen sicher in deinem Wallet – sie sind deine Quittung. Die eigentlichen Kryptowährungen liegen im Smart Contract des Pools. Wird dieser kompromittiert, werden deine LP Tokens wertlos – weil nichts mehr dahintersteht. Deshalb: Nur etablierte, geaudittete Plattformen nutzen.')
    d.warn('Risiko: Hoch. "Impermanent Loss" ist real und kann deine Gewinne auffressen. Nur für Fortgeschrittene, nicht für Anfänger.')

    d.new_page(dark=False)
    d.tag('KAPITEL 6 · DIE RISIKEN')
    d.sp(16)

    d.h2('Die Risiken – ehrlich und ungeschönt')
    d.para('DeFi klingt verlockend. Hohe Renditen, keine Banker, volle Kontrolle. Aber – und das ist wichtig – es gibt Risiken. Hier die grössten:')

    d.h3('Smart Contract Risiko:')
    d.para('DeFi läuft auf Code (Smart Contracts). Wenn dieser Code einen Bug hat, können Hacker ihn ausnutzen. Schon mehrfach sind Millionen verloren gegangen durch gehackte Contracts.')
    d.tip('Schutz: Nur etablierte, geaudittete Plattformen nutzen (Aave, Uniswap, etc.). Keine neuen, unbekannten Projekte.')

    d.h3('Impermanent Loss:')
    d.para('Wenn du Liquidität bereitstellst, kann es passieren, dass du weniger rausbekommst als wenn du einfach gehalten hättest. Das ist komplex, aber real.')
    d.tip('Schutz: Verstehe es BEVOR du LP wirst. Viele YouTube-Videos erklären es gut.')

    d.h3('Liquidationsrisiko:')
    d.para('Wenn du Kredit aufnimmst und der Wert deiner Sicherheiten fällt, wirst du liquidiert (= deine Sicherheiten werden verkauft).')
    d.tip('Schutz: Konservative Loan-to-Value Ratios. Lieber weniger leihen.')

    d.h3('Rug Pulls & Scams:')
    d.para('Nicht jedes DeFi-Projekt ist seriös. Manche sind Scams, die verschwinden sobald genug Geld drin ist.')
    d.tip('Schutz: Nur etablierte Protokolle. Wenn es zu gut klingt um wahr zu sein ("1000% APY!"), ist es das auch.')

    d.h3('Gas Fee Schwankungen:')
    d.para('DeFi-Interaktionen kosten Gas Fees. Bei einigen Blockchains können das 2-40 € sein bei hoher Auslastung – aber oft auch nur 0.50-2 € in ruhigen Zeiten. Deine 100 € Investment macht keinen Sinn wenn du 15 € Fees zahlst.')
    d.tip('Schutz: Nutze Layer 2 Lösungen (Arbitrum, Optimism, Base) oder andere Chains (Polygon, BNB Chain) mit niedrigeren Fees (oft unter 0.10 €).')

    d.sp(4)
    d.hl_box('GRUNDREGEL', '\u00abIn DeFi gilt: Verstehe was du tust, BEVOR du es tust. Nicht umgekehrt.\u00bb')

    d.new_page(dark=False)
    d.tag('KAPITEL 6 · DEIN DEFI-START')
    d.sp(16)

    d.h2('Dein DeFi-Start: So gehst du es an')

    for num, title, lines in [
        (1, 'Lerne zuerst, investiere später',
             ['YouTube-Tutorials, Dokumentationen, Basics verstehen',
              'Dann erst mit echtem Geld einsteigen']),
        (2, 'Fang klein an',
             ['Teste mit 50-100 €',
              'Lerne das System, dann skalieren']),
        (3, 'Bleib bei etablierten Plattformen',
             ['Uniswap, PancakeSwap, SushiSwap',
              '! Keine exotischen neuen Projekte']),
        (4, 'Nutze Layer 2 oder günstige Chains',
             ['Ethereum Mainnet ist teuer',
              'BSC und Polygon sind günstiger']),
        (5, 'Verstehe die Risiken VORHER',
             ['Jede Plattform hat Risiken',
              'Lies die Docs, verstehe sie, dann erst nutzen']),
        (6, 'Diversifiziere',
             ['Nicht alles in ein Protokoll',
              'Spread das Risiko auf mehrere Plattformen']),
        (7, 'Check regelmässig',
             ['DeFi ist nicht "set and forget"',
              'Schau regelmässig nach deinen Positionen']),
    ]:
        d.step(num, title, lines)

    d.sp(4)
    d.para('DeFi ist mächtig. Es gibt dir Möglichkeiten, die traditionelles Banking nie bieten kann. Aber mit grosser Macht kommt grosse Verantwortung. Geh es klug an, und DeFi kann ein Game-Changer für deine finanzielle Selbstbestimmung sein.')


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 7 – PHASE 5: LANGFRISTIGE SICHERHEIT
# ─────────────────────────────────────────────────────────────────────────────
def kap7(d: P):
    d.chapter_opener(7, 'Phase 5: Langfristige Sicherheit')

    d.new_page(dark=False)
    d.tag('KAPITEL 7 · LANGFRISTIGE SICHERHEIT')
    d.sp(16)
    d.para('Du hast dein Wallet. Du hast Kryptos gekauft. Vielleicht nutzt du sogar schon DeFi. Jetzt geht es um die langfristige Perspektive: Wie sicherst du dein Vermögen über Jahre?')

    d.sp(4)
    d.h2('Die Speicher-Strategie: Hot vs. Cold')
    d.para('Denke an dein Geld wie an Bargeld. Du hast ein bisschen im Portemonnaie (für den Alltag) und den Rest im Safe (für Sicherheit). Bei Krypto ist es ähnlich:')

    d.h3('Hot Wallet (Portemonnaie)')
    d.para('Das ist dein tägliches Wallet. MetaMask, Trust Wallet, etc. Hier hast du kleine bis mittlere Beträge, die du für DeFi, Transaktionen oder Experimente nutzt.')
    d.warn('Regel: Maximal so viel, wie du bereit bist zu verlieren wenn dein Handy/PC gehackt wird.')

    d.h3('Cold Wallet (Safe)')
    d.para('Das ist deine Hardware Wallet (Ledger, Trezor, Tangem) oder ein separates Air-gapped Wallet. Hier liegt der Grossteil deines Vermögens. Offline. Sicher.')
    d.para('Regel: Nur für langfristiges Holding. Nicht für tägliche Transaktionen.')

    d.tip('Meine Empfehlung: Sobald du mehr als 1.000-2.000 €/CHF in Krypto hast, investiere in eine Hardware Wallet (ca. 60-150 €). Meine klare Empfehlung: Tangem – super sicher und vor allem sehr einfach im Handling. Kein Bildschirm, keine Batterie, einfach Karte ans Handy halten.')
    d.sp(4)
    d.hl_box('TANGEM REFERRAL-LINK', 'https://tangem.com/invite/TNLSKH – Profitiere von einem Rabatt beim Kauf.')

    d.sp(6)
    d.h3('Tangem einrichten – Schritt für Schritt')
    d.para('Du hast eine Tangem gekauft. Gut. Hier ist die Einrichtung – einfach, aber mit ein paar Punkten, die du unbedingt beachten musst.')
    d.warn('Meine klare Empfehlung: Immer das 3er-Karten-Set kaufen. Drei Karten = maximale Redundanz. Falls eine Karte verloren geht oder beschädigt wird, hast du immer noch zwei weitere.')

    for num, title, lines in [
        (1, 'App herunterladen',
             ['App Store (iOS) oder Play Store (Android) → Tangem Wallet suchen',
              '! Nur die offizielle App von Tangem AG – URL prüfen: tangem.com']),
        (2, 'Erste Karte aktivieren & Passwort setzen',
             ['Tangem App öffnen → Karte ans Handy halten (NFC)',
              'Die App erkennt die Karte automatisch – Passwort setzen',
              '! Passwort absolut entscheidend. Separat aufbewahren – getrennt von den Karten.',
              'Passwort vergessen? Mit mind. 1 Backup-Karte wiederherstellbar – Grund für das 3er-Set.']),
        (3, 'Alle Backup-Karten sofort einrichten',
             ['Alle drei Karten jetzt in einem Durchgang einrichten – nicht später',
              'Nacheinander alle Karten ans Handy halten und verknüpfen',
              '! Backup-Karten können nur während des ersten Einrichtens hinzugefügt werden']),
        (4, 'Karten sicher verteilen',
             ['Karte 1: Zu Hause im Tresor',
              'Karte 2: Bankschliessfach oder Vertrauensperson',
              'Karte 3: Reserve oder tägliche Nutzungskarte',
              'Passwort immer separat – niemals zusammen mit einer Karte']),
        (5, 'Testbetrag senden',
             ['In der Tangem App BSC-Adresse kopieren',
              'Kleinen Testbetrag (z.B. 5 USDT) von MetaMask dorthin senden',
              'Wenn der Betrag ankommt: Tangem ist bereit']),
        (6, 'Grössere Beträge verschieben',
             ['Nach erfolgreichem Test schrittweise grössere Beträge von MetaMask auf Tangem',
              'Nie alles auf einmal – immer schrittweise und prüfen']),
    ]:
        d.step(num, title, lines)

    d.tip('Tangem funktioniert anders als andere Hardware Wallets: Es gibt keine klassische Seedphrase. Die Sicherheit liegt in den physischen Karten und dem Passwort. Beides zusammen ist dein Zugang.')

    d.sp(6)
    d.h3('Seedphrase bei Cold Wallets – was du wissen musst')
    d.para('Bei anderen Cold Wallets wie Ledger oder Trezor wird beim ersten Einrichten eine Seedphrase (12 oder 24 Wörter) generiert und auf dem Bildschirm des Geräts angezeigt. Diese musst du sofort auf Papier aufschreiben – denn nur damit kannst du dein Wallet wiederherstellen, falls das Gerät verloren geht oder kaputt geht. Es gibt keine Backup-Geräte wie bei Tangem.')
    d.two_box(
        'Tangem', [
            'Kein Seed-Phrase-Backup nötig (Standard-Setup)',
            'Private Key lebt im Chip – verlässt ihn nie',
            'Backup = die physischen Karten selbst',
            'Deshalb: alle 3 Karten einrichten und verteilen',
        ],
        'Ledger / Trezor', [
            'Seedphrase wird beim Setup angezeigt',
            'Muss zwingend auf Papier gesichert werden',
            'Kein Backup-Gerät – nur die Seedphrase schützt',
            'Seedphrase verloren = Geld weg, wenn Gerät kaputt',
        ],
    )
    d.warn('Wenn du dich für ein Ledger oder Trezor entscheidest: Die Seedphrase, die beim ersten Einrichten erscheint, ist dein einziges Backup. Sie muss sofort, korrekt und mehrfach auf Papier gesichert werden. Verlierst du sie und das Gerät geht kaputt, ist dein Geld unwiederbringlich weg.')

    d.sp(6)
    d.h2('Backup-Strategien: Redundanz ist alles')
    d.para('Ein einziges Backup reicht nicht. Was passiert, wenn dein Haus abbrennt? Wenn du ausgeraubt wirst? Hier meine persönliche Strategie – mit drei verschiedenen Ansätzen:')

    d.h3('Backup 1: Zu Hause (Tresor/Versteck)')
    d.para('Seedphrase auf Papier, laminiert, in einem feuerfesten Umschlag. Das ist deine erste und wichtigste Kopie.')

    d.h3('Backup 2: Aufgesplittet auf zwei Vertrauenspersonen')
    d.para('Teile deine 12 Wörter auf: Wörter 1–6 gibst du Person A, Wörter 7–12 Person B. Beide Hälften sind für sich alleine nutzlos – erst zusammen ergeben sie die vollständige Seedphrase. Sollte eine Person das Blatt verlieren, kann niemand damit etwas anfangen. Das reduziert das Risiko massiv.')
    d.para('Die Druckvorlage für diese aufgesplittete Sicherung findest du in der App.')

    d.guard(120)
    d.h3('Optional – Backup 3: Bankschliessfach')
    d.para('Eine weitere Kopie im Bankschliessfach ist eine solide Ergänzung – aber bewusst als letzte Option, denn Banken haben Öffnungszeiten und können theoretisch den Zugang verwehren. Als zusätzliche Sicherheitsstufe trotzdem sinnvoll.')

    d.new_page(dark=False)
    d.tag('KAPITEL 7 · NOTFALLPLAN & SCAMS')
    d.sp(16)

    d.h2('Der Notfallplan: Wenn du ausfällst')
    d.para('Stell dir vor, dir passiert etwas. Unfall, Krankheit, Schlimmeres. Kann deine Familie an deine Kryptos? Oder sind sie für immer verloren?')
    d.para('Das ist unangenehm, aber wichtig. Wenn du nennenswerte Beträge in Krypto hast, brauchst du einen Notfallplan.')

    d.h3('Brief mit Anleitung')
    d.para('Schreibe einen versiegelten Brief an eine Vertrauensperson mit folgenden Infos:')
    for txt in [
        'Wo liegen deine Backups (Tresor, Bankfach, etc.)',
        'Wie funktioniert der Zugriff (Wallet installieren, Seedphrase eingeben)',
        'Kontaktdaten von 1-2 Personen, die bereit sind, beim Handling im Notfall zu helfen',
        'Wichtig: NICHT die Seedphrase selbst im Brief! Nur WO sie ist.',
    ]:
        d.bullet(txt)
    d.para('Hinterlege den Brief bei deinem Anwalt, im Testament, oder bei der Vertrauensperson selbst (mit klarer Anweisung: "Nur öffnen im Notfall").')

    d.sp(4)
    d.hl_box('WEITSICHT', '"Finanzielle Selbstbestimmung heisst auch: Selbst entscheiden, was nach dir mit deinem Vermögen passiert."')

    d.sp(6)
    d.h2('Häufige Scams erkennen und vermeiden')
    d.para('Die Betrüger schlafen nicht. Je mehr Geld in Krypto fliesst, desto kreativer werden sie. Hier die häufigsten Maschen:')

    d.h3('Phishing-Mails:')
    d.para('Du bekommst eine Mail von "MetaMask Support" oder "Binance Security". Sie sieht echt aus. Link klicken, Seedphrase eingeben – und schon ist dein Geld weg.')
    d.tip('Schutz: NIEMALS auf Links in E-Mails klicken. NIEMAND fragt nach deiner Seedphrase. URLs immer selbst eintippen.')

    d.h3('Fake Websites:')
    d.para('Betrüger erstellen Kopien von echten Websites. Metamask.com wird zu Metammask.com (bemerkt den Unterschied?). Du gibst deine Seedphrase ein – weg ist sie.')
    d.tip('Schutz: Bookmarks für wichtige Seiten. URL IMMER prüfen. Bei Unsicherheit: Neu eintippen.')

    d.h3('Ponzi Schemes / High-Yield Investment Programs:')
    d.para('"Investiere 1 ETH, bekomme 10 ETH zurück in 30 Tagen!" Klingt zu gut? IST zu gut.')
    d.tip('Schutz: Wenn es unrealistisch hohe Renditen verspricht, ist es Betrug. Punkt.')

    d.h3('Fake Support auf Social Media:')
    d.para('Du postest ein Problem auf Twitter/Discord. Sofort meldet sich "Support". Er schickt dir einen Link. Du klickst – und bist gehackt.')
    d.tip('Schutz: Offizieller Support kontaktiert dich NIEMALS direkt. Du gehst auf die offizielle Website, nicht sie zu dir.')

    d.h3('Rug Pulls:')
    d.para('Ein neues DeFi-Projekt mit "unglaublichen" Renditen. Viele investieren. Plötzlich verschwinden die Entwickler mit allem Geld.')
    d.tip('Schutz: Nur etablierte, geaudittete Projekte. Keine brandneuen, unbekannten Tokens.')

    d.sp(6)
    d.hl_box('DIE GOLDENE REGEL', 'Wenn jemand nach deiner Seedphrase fragt, ist es ein Scam. Immer. Ohne Ausnahme. Auch wenn es deine Mutter ist (dann ist sie gehackt worden).')


# ─────────────────────────────────────────────────────────────────────────────
# KAPITEL 8 – NÄCHSTE SCHRITTE
# ─────────────────────────────────────────────────────────────────────────────
def kap8(d: P):
    d.chapter_opener(8, 'Deine nächsten Schritte')

    d.new_page(dark=False)
    d.tag('KAPITEL 8 · DEINE NÄCHSTEN SCHRITTE')
    d.sp(16)
    d.para('Du hast es geschafft. Du hast die fünf Phasen durchlaufen – zumindest in der Theorie. Jetzt geht es darum, das Wissen in die Praxis umzusetzen.')

    d.sp(4)
    d.h2('Dein Aktionsplan für die nächsten 3 Wochen')

    d.h3('Woche 1: Vorbereitung')
    for txt in [
        'Mindset-Check: Bin ich wirklich bereit?',
        'Sichere Aufbewahrungsorte organisieren (Tresor kaufen/Bankfach mieten)',
        'Seedphrase-Blanko-Blatt ausdrucken – Vorlage findest du in der App',
    ]:
        d.bullet(txt)

    d.h3('Woche 2: Wallet erstellen')
    for txt in [
        'MetaMask (oder alternatives Wallet) installieren',
        'Wallet erstellen, Seedphrase sichern',
        'Backup an zweitem Ort deponieren',
        'Test-Transaktion innerhalb des Wallets (0 €, nur zum Verstehen)',
    ]:
        d.bullet(txt)

    d.h3('Woche 3: Erster Kauf')
    for txt in [
        'Fiat-Krypto-Brücke wählen',
        'Account erstellen & verifizieren',
        'Kleinen Betrag (50-200 €/CHF) einzahlen (für USDT oder USDC auf BSC-Netzwerk)',
        'Erste Kryptos kaufen',
        'Nach Erfolg, kleiner Betrag (10 €/CHF) für Gebühren einzahlen (BNB auf BSC-Netzwerk)',
    ]:
        d.bullet(txt)

    d.sp(6)
    d.hl_box('MOTIVATION', '"Der schwierigste Schritt ist der erste. Danach wird es einfacher. Versprochen."')

    # ── Bezahlen mit Krypto ───────────────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 8 · BEZAHLEN MIT KRYPTO')
    d.sp(16)
    d.h2('Bezahlen mit Krypto-Debitkarten')
    d.para('Krypto ist nicht nur etwas, das im Wallet liegt – du kannst es ganz konkret im Alltag einsetzen: beim Einkaufen, auf Reisen, im Restaurant. Der einfachste Weg dazu ist eine Krypto-Debitkarte. Sie ist mit deinem Krypto-Guthaben verknüpft und rechnet beim Bezahlen automatisch in die lokale Währung um.')
    d.para('Die Karten funktionieren überall dort, wo Visa oder Mastercard akzeptiert wird – also praktisch weltweit. Manche bieten sogar Cashback in Krypto an. Alle Anbieter bieten zunächst eine virtuelle Karte an; eine physische Karte muss jeweils separat bestellt werden.')

    d.two_box(
        'RedotPay', [
            'Visa-Karte, weltweit einsetzbar',
            'Krypto auf RedotPay einzahlen und direkt bezahlen',
            'Unterstützt viele Coins: USDT, BTC, ETH u.v.m.',
            'Apple Pay & Google Pay kompatibel',
        ],
        'Trustyfy', [
            'Europäischer Anbieter, SEPA-integriert',
            'Eigenes IBAN-Konto in EUR',
            'Krypto direkt auf Karte laden',
            'Einfache Einrichtung über die App',
        ],
    )
    d.sp(6)
    d.two_box(
        'Nexo', [
            'Weltbekannte Krypto-Plattform',
            'Cashback in NEXO-Token',
            'Kreditlimit gegen Krypto-Sicherheit möglich',
            'Bis zu 2% Cashback auf alle Käufe',
        ],
        'Crypto.com', [
            'Visa-Karte in verschiedenen Stufen',
            'Bis zu 5% Cashback (je nach Stufe)',
            'Gratis Spotify, Netflix und mehr',
            'Weltweit eine der bekanntesten Krypto-Karten',
        ],
    )
    d.sp(6)
    d.two_box(
        'Revolut', [
            'Bekannte Neobank mit Krypto-Funktion',
            'Krypto kaufen, halten und bezahlen',
            'Sehr benutzerfreundliche App',
            'Für Einsteiger ideal – vertraute Oberfläche',
        ],
        'Bitrefill', [
            'Kein Konto, keine Karte nötig',
            'Kaufe Gutscheine mit Krypto (Amazon, Zalando, etc.)',
            'Über 4.000 Anbieter weltweit',
            'Anonym nutzbar – kein KYC',
        ],
    )

    d.sp(4)
    d.tip('Meine Empfehlung: RedotPay für internationale Nutzung ohne viel Aufwand, Trustyfy für einfache CHF/EUR-Integration. Revolut eignet sich gut als Einstieg, da die App für viele bereits vertraut ist.')

    # ── RedotPay Einrichtung ──────────────────────────────────────────────────
    d.new_page(dark=False)
    d.tag('KAPITEL 8 · REDOTPAY EINRICHTEN')
    d.sp(16)
    d.h2('RedotPay einrichten – Schritt für Schritt')
    d.para('RedotPay ist eine Visa-Prepaid-Karte aus Hongkong. Du lädst sie mit USDT oder USDC aus deinem Wallet auf und kannst damit überall bezahlen, wo Visa akzeptiert wird. Über 130 Millionen Händler weltweit – inkl. Apple Pay und Google Pay.')

    d.sp(4)
    d.two_box(
        'Fakten', [
            'Visa Prepaid, virtuell & physisch',
            'Virtuelle Karte: 10 USD einmalig',
            'Coins: USDT, USDC, BTC, ETH, SOL',
            'Netzwerke: BNB Chain, Polygon, Arbitrum u. a.',
            'Apple Pay & Google Pay: ✓',
            'KYC: Ja, ca. 5 Minuten',
        ],
        'Gebühren', [
            'Zahlung in CHF / EUR: 1 %',
            'Zahlung in Fremdwährung: 2,2 %',
            'Krypto einzahlen: nur Gas Fees',
            'KYC / Konto: kostenlos',
            'Aktuelle Gebühren immer in der App prüfen',
        ],
    )

    d.sp(6)
    for num, title, lines in [
        (1, 'App herunterladen & Konto erstellen', [
            'App Store oder Google Play: «RedotPay» suchen',
            'Offizielle Website: redotpay.com – URL selbst eintippen',
            'E-Mail registrieren und bestätigen',
        ]),
        (2, 'KYC abschliessen (Identitätsverifikation)', [
            'In der App «Verify» öffnen',
            'Ausweis oder Pass fotografieren (Vorder- & Rückseite)',
            'Selfie mit Ausweis aufnehmen',
            'Dauert meist weniger als 5 Minuten',
        ]),
        (3, 'Virtuelle Karte erstellen', [
            'In der App auf «Card» tippen',
            '«Virtuelle Karte» wählen – Kosten: 10 USD',
            '! Das 5 USDS Startguthaben kann nicht für die Kartengebühr verwendet werden',
        ]),
        (4, 'Karte aufladen (USDT aus Wallet senden)', [
            'In der App auf «Deposit» tippen',
            'Netzwerk wählen: BNB Chain (BEP20) oder Polygon für tiefe Gas Fees',
            'RedotPay zeigt eine Empfangsadresse an',
            'In MetaMask oder Tangem USDT an diese Adresse senden',
            '! Netzwerk muss exakt übereinstimmen – falsche Chain = Tokens weg',
        ]),
        (5, 'Mit Karte bezahlen', [
            'Online: Kartennummer, Ablaufdatum und CVV aus der App',
            'Im Laden: Apple Pay oder Google Pay (nächster Schritt)',
            'Am Bankomat: Bargeld abheben möglich',
        ]),
    ]:
        d.step(num, title, lines)

    d.sp(6)
    d.h3('Apple Pay einrichten')
    d.para('Sobald die virtuelle Karte aktiv ist, kannst du sie zu Apple Pay hinzufügen und kontaktlos bezahlen.')

    for num, title, lines in [
        (1, 'Direkt aus der RedotPay-App', [
            'App öffnen → «Card» tippen → «Add to Apple Wallet»',
            'Das ist der einfachste Weg – empfohlen',
        ]),
        (2, 'Alternativ: manuell über Apple Wallet', [
            'Apple Wallet öffnen → «+» oben rechts tippen',
            '«Debit- oder Kreditkarte» wählen',
            'Kartennummer, Ablaufdatum und CVV aus der RedotPay-App eingeben',
            'Apple Wallet validiert die Karte automatisch',
        ]),
    ]:
        d.step(num, title, lines)

    d.sp(4)
    d.tip('Stell RedotPay als Standardkarte in Apple Wallet ein, wenn du sie regelmässig nutzt. Die Option findest du direkt in den Einstellungen der Apple Wallet App.')

    d.sp(8)
    d.new_page(dark=False)
    d.tag('KAPITEL 8 · PERSÖNLICHE BEGLEITUNG')
    d.sp(16)
    d.h2('Wenn du mehr Unterstützung brauchst')
    d.para('Du hast jetzt das Fundament. Du weisst, wie ein Wallet funktioniert, wie du Krypto kaufst, sicherst und wieder zurück in Fiat tauschst. Du kannst mit einer Krypto-Karte im Alltag bezahlen. Das ist kein kleines Wissen – das ist Selbstbestimmung.')
    d.para('Manche Schritte macht man lieber nicht alleine. Wenn du jemanden an deiner Seite willst, der mit dir zusammen das Wallet aufsetzt, deine spezifischen Fragen beantwortet und dich durch den gesamten Prozess begleitet – genau dafür ist mein 1: 1 Coaching da.')

    for sess, title, content in [
        ('Session 1', 'Das Fundament verstehen',
         'Was ist Krypto und wie funktioniert Blockchain? Unterschied zu Fiat, verschiedene Blockchains, dezentrale Börsen, Coin vs. Token.'),
        ('Session 2', 'Dein Wallet einrichten',
         'Hot vs. Cold Wallet, gemeinsam Wallet eröffnen, Sicherheits-Checkliste, Backup richtig machen, Phishing/Scams erkennen.'),
        ('Session 3', 'Dein erster Krypto-Kauf',
         'Kaufmöglichkeiten kennenlernen, ersten Kauf durchführen, Tokens empfangen/senden, tauschen und bridgen.'),
        ('Session 4', 'Sicherheit mit Cold Wallet',
         'Warum Cold Wallets wichtig sind, wann nutze ich was, Cold Wallet einrichten, Tokens verschieben.'),
        ('Session 5', 'Krypto im echten Leben',
         'Krypto im Alltag nutzen, zurück aufs Bankkonto, Einblick in Web3, Smart Contracts verstehen.'),
    ]:
        d.guard(50)
        bx, by = ML - 4, d.y - 42
        bg = CREAM3
        d.rect(bx, by, TW + 8, 42, bg)
        d.rect(bx, by, 4, 42, GOLD_D)
        d.c.setFillColor(GOLD_D)
        d.c.setFont('Mono', 6.5)
        d.c.drawString(bx + 12, by + 32, sess.upper())
        d.c.setFillColor(BODY)
        d.c.setFont('H-Med', 10)
        d.c.drawString(bx + 12, by + 20, title)
        d.c.setFillColor(MUTED)
        d.c.setFont('Body-L', 8.5)
        # Wrap content
        words = content.split()
        line, lines_out = [], []
        for w in words:
            test = ' '.join(line + [w])
            if d.c.stringWidth(test, 'Body-L', 8.5) <= TW - 22:
                line.append(w)
            else:
                lines_out.append(' '.join(line))
                line = [w]
        if line:
            lines_out.append(' '.join(line))
        ty = by + 10
        d.c.drawString(bx + 12, ty, lines_out[0] if lines_out else '')
        d.y = by - 8

    # ── Abschluss ──────────────────────────────────────────────────────────────
    d.sp(6)
    d.hl_box('JETZT STARTEN', 'Bereit für den ersten Schritt? Buche dir ein kostenloses 30-minütiges Erstgespräch auf letsgofree.me – wir schauen gemeinsam, wo du stehst und wie ich dich unterstützen kann.')

    d.sp(6)
    d.h2('Was kommt als Nächstes?')
    d.para('Du hast jetzt eine Grundlage, die die meisten Krypto-Einsteiger nie aufbauen. Du verstehst wie das System funktioniert. Du hast dein Wallet, dein erstes Krypto, deine Sicherheits-Strategie.')
    d.para('Was jetzt? Ein ehrlicher Ausblick – ohne Hektik.')

    d.sp(4)
    d.h3('Die nächste Stufe: Was erfahrene Nutzer machen')
    d.two_box(
        'Cold Wallet nutzen', [
            'Hot Wallet für kleine Beträge und Experimente',
            'Tangem für alles Ernste',
            'Verschiebe den Grossteil deines Kryptos dorthin, sobald du dich sicher fühlst',
        ],
        'Rückweg üben', [
            'Sende dir einmal 20 CHF über dfx.swiss zurück aufs Bankkonto',
            'Nur um zu wissen wie es geht – bevor du es brauchst',
            'Kapitel 5 erklärt den Ablauf Schritt für Schritt',
        ],
    )

    d.sp(4)
    d.h3('Was in der Krypto-Welt gerade passiert')
    d.para('Krypto hat sich verändert – nicht ruhiger, aber seriöser. Grosse Fonds investieren. Regulierung kommt. Bitcoin hat seinen vierten Halving hinter sich. Ethereum ist nach dem Dencun-Upgrade deutlich günstiger geworden. Layer-2-Netzwerke wachsen. Die Technologie reift.')
    d.para('Was das bedeutet: Die Chancen bleiben – aber auch die Risiken. Informiere dich laufend, bleib kritisch, vertrau niemandem blind.')

    d.sp(4)
    d.h3('Was ich dir mitgeben möchte')
    d.para('Krypto ist kein Sprint. Die meisten Fehler entstehen aus Ungeduld oder Gier. Die besten Entscheidungen entstehen aus Ruhe und Verständnis. Du musst nicht jeden Trend mitmachen. Du musst nicht alles sofort verstehen. Fang klein an, lerne dabei, und bau dein Wissen in deinem Tempo auf.')

    d.sp(4)
    d.para('Im Sommer 2023 habe ich den Schritt gewagt, obwohl ich zuerst skeptisch war. Meine Frau hatte durch eine Freundin von Krypto gehört, und ich habe mitgemacht. Ich habe mich Schritt für Schritt reingearbeitet, Fehler gemacht, Dinge zweimal falsch verstanden und nochmal von vorne angefangen. Genau so lernt man.')
    d.para('Heute weiss ich, wie mein Geld funktioniert. Ich entscheide selbst, wo es liegt, wie es sich bewegt und wer Zugriff darauf hat. Keine Bank, die mir sagt, was geht und was nicht. Kein System, dem ich blind vertrauen muss. Das ist kein grosses Versprechen – das ist einfach Selbstbestimmung.')
    d.para('Dieser Weg steht auch dir offen. Du hast jetzt das Wissen. Du hast den Plan. Du brauchst nur noch eines: den ersten Schritt zu machen.')

    d.sp(6)
    d.hl_box('WILLKOMMEN', 'Willkommen auf dem Weg zu deiner finanziellen Selbstbestimmung.')


# ─────────────────────────────────────────────────────────────────────────────
# GLOSSAR
# ─────────────────────────────────────────────────────────────────────────────
def glossar(d: P):
    d.new_page(dark=True)
    d.tag('ANHANG · GLOSSAR')
    d.sp(16)
    d.h1('Krypto-Glossar', col=CREAM)
    d.sp(4)
    d.para('Die wichtigsten Begriffe, die du kennen solltest:', col=HexColor('#a89880'))
    d.sp(8)

    terms = [
        ('Blockchain',
         'Die Technologie hinter Kryptowährungen. Eine dezentrale, unveränderbare Datenbank, die alle Transaktionen speichert.'),
        ('Wallet',
         'Deine digitale Geldbörse. Speichert nicht die Kryptos selbst, sondern die Schlüssel für den Zugriff darauf.'),
        ('Seedphrase / Recovery Phrase',
         '12 Wörter, die dein Wallet wiederherstellen. DER wichtigste Sicherheitsaspekt. Niemals digital speichern!'),
        ('Private Key',
         'Der kryptographische Schlüssel zu deinem Wallet. Wer den Private Key hat, hat dein Geld. Wird aus der Seedphrase generiert.'),
        ('Public Key / Address',
         'Deine Wallet-Adresse. Wie eine IBAN – kannst du weitergeben um Zahlungen zu empfangen.'),
        ('Gas Fees',
         'Transaktionsgebühren auf der Blockchain. Bezahlt die Miner/Validatoren, die Transaktionen verarbeiten.'),
        ('CEX (Centralized Exchange)',
         'Zentralisierte Börse wie Coinbase, Binance, Kraken. Einfach zu nutzen, aber: "Not your keys, not your coins".'),
        ('DEX (Decentralized Exchange)',
         'Dezentrale Börse wie Uniswap. Kein Mittelsmann, du behältst die Kontrolle.'),
        ('DeFi (Decentralized Finance)',
         'Finanzdienstleistungen ohne Banken. Kredite, Zinsen, Trading – alles auf der Blockchain.'),
        ('Smart Contract',
         'Selbstausführender Code auf der Blockchain. Macht DeFi möglich, birgt aber auch Risiken (Bugs, Hacks).'),
        ('Staking',
         'Kryptos "einsetzen" um das Netzwerk zu sichern und dafür Rewards zu verdienen. Wie Zinsen, aber dezentral.'),
        ('Liquidity Pool',
         'Ein Pool von Kryptos, der Trades auf DEXes ermöglicht. Du kannst Liquidität bereitstellen und Gebühren verdienen.'),
        ('Impermanent Loss',
         'Verlust, der beim Bereitstellen von Liquidität entstehen kann wenn sich Preise verändern. Komplex, aber wichtig zu verstehen.'),
        ('Layer 1',
         'Die Haupt-Blockchain (z.B. Ethereum, Bitcoin). Oft teuer und langsam.'),
        ('Layer 2',
         'Zusatzschicht auf Layer 1 für schnellere, günstigere Transaktionen (z.B. Arbitrum, Optimism für Ethereum).'),
        ('Hot Wallet',
         'Online Wallet (App/Browser). Bequem, aber höheres Risiko.'),
        ('Cold Wallet',
         'Offline Wallet (Hardware/Paper). Maximum Sicherheit für langfristige Aufbewahrung.'),
        ('KYC (Know Your Customer)',
         'Identitätsprüfung auf Exchanges. Nervig, aber rechtlich nötig für Fiat-zu-Krypto.'),
        ('HODL',
         '"Hold On for Dear Life" – Langfristig halten statt verkaufen bei Kursschwankungen. Ursprünglich Tippfehler, jetzt Krypto-Kultur.'),
        ('Rug Pull',
         'Scam wo Entwickler mit dem investierten Geld verschwinden. Häufig bei neuen, ungeprüften Projekten.'),
        ('Phishing',
         'Betrugsversuch durch gefälschte Websites/E-Mails um an deine Seedphrase oder Keys zu kommen.'),
    ]

    for i, (term, defi) in enumerate(terms):
        d.guard(36)
        bg = DARK2 if i % 2 == 0 else DARK4
        # Höhe schätzen
        lines_est = len(defi) // 65 + 1
        bh = 18 + lines_est * 13 + 6
        bx, by = ML - 4, d.y - bh
        d.rect(bx, by, TW + 8, bh, bg)
        d.rect(bx, by, 3, bh, GOLD_D)
        d.c.setFillColor(GOLD)
        d.c.setFont('H-Med', 9.5)
        d.c.drawString(bx + 10, by + bh - 14, term)
        d.c.setFillColor(HexColor('#a89880'))
        d.c.setFont('Body-L', 8.5)
        # Wrap definition
        words = defi.split()
        line, out = [], []
        mw = TW - 18
        for w in words:
            if d.c.stringWidth(' '.join(line + [w]), 'Body-L', 8.5) <= mw:
                line.append(w)
            else:
                out.append(' '.join(line))
                line = [w]
        if line:
            out.append(' '.join(line))
        ty = by + bh - 26
        for l in out:
            d.c.drawString(bx + 10, ty, l)
            ty -= 13
        d.y = by - 6


# ─────────────────────────────────────────────────────────────────────────────
# RÜCKSEITE
# ─────────────────────────────────────────────────────────────────────────────
def backcover(d: P):
    d.new_page(dark=True)
    c = d.c
    # Diagonale Linien (schon durch _bg gesetzt)
    # Zentriertes Profilbild
    img_cx = int(W / 2)
    img_cy = int(H / 2 + 80)
    d.circle_image('/mnt/user-data/uploads/profil.jpg', img_cx, img_cy, r=70)
    # Goldring
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.circle(img_cx, img_cy, 72, fill=0, stroke=1)
    # Zitat
    c.setFillColor(CREAM)
    c.setFont('H-Med', 14)
    quote = '"Finanzielle Selbstbestimmung'
    tw = c.stringWidth(quote, 'H-Med', 14)
    c.drawString(W / 2 - tw / 2, img_cy - 100, quote)
    c.setFillColor(GOLD)
    c.setFont('H-Med', 14)
    quote2 = 'beginnt mit dem ersten Schritt."'
    tw2 = c.stringWidth(quote2, 'H-Med', 14)
    c.drawString(W / 2 - tw2 / 2, img_cy - 118, quote2)
    # Name
    c.setFillColor(GOLD_D)
    c.setFont('H-Med', 10)
    name = 'Chris Müller | Let\'s go free'
    tnw = c.stringWidth(name, 'H-Med', 10)
    c.drawString(W / 2 - tnw / 2, img_cy - 140, name)
    # Goldene Trennlinie
    c.setStrokeColor(HexColor('#3a3028'))
    c.setLineWidth(0.4)
    c.line(ML, 78, W - MR, 78)
    # Disclaimer oberhalb der Linie
    disclaimer_lines = [
        '© 2026 Chris Müller · Let\'s go free · letsgofree.me',
        'Alle Rechte vorbehalten. Dieses Werk ist urheberrechtlich geschützt.',
        'Kein Teil darf ohne schriftliche Genehmigung des Autors reproduziert,',
        'verbreitet oder in irgendeiner Form weitergegeben werden.',
        'Das E-Book dient ausschliesslich Informations- und Bildungszwecken.',
        'Keine Finanz-, Anlage- oder Steuerberatung. Handel mit Krypto ist mit Risiken verbunden.',
    ]
    c.setFillColor(HexColor('#5a4e42'))
    c.setFont('Body-L', 7)
    line_h = 11
    # Startpunkt: oberste Zeile so platzieren, dass alle Zeilen über y=78 liegen
    total_h = len(disclaimer_lines) * line_h
    dy = 78 + 8 + total_h - line_h   # Baseline der ersten (obersten) Zeile
    for line in disclaimer_lines:
        lw = c.stringWidth(line, 'Body-L', 7)
        c.drawString(W / 2 - lw / 2, dy, line)
        dy -= line_h


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    out = '/mnt/user-data/outputs/letsgofree-ebook-v2.pdf'
    d = P(out)

    print('Cover...')
    cover(d)
    d.pgnum(0)

    print('Inhaltsverzeichnis...')
    toc(d)
    d.pgnum(1)

    print('Über dieses eBook...')
    about(d)
    d.pgnum(2)

    print('Kapitel 1...')
    kap1(d)

    print('Kapitel 2...')
    kap2(d)

    print('Kapitel 3...')
    kap3(d)

    print('Kapitel 4...')
    kap4(d)

    print('Kapitel 5...')
    kap5(d)

    print('Kapitel 6...')
    kap6(d)

    print('Kapitel 7...')
    kap7(d)

    print('Kapitel 8...')
    kap8(d)

    print('Glossar...')
    glossar(d)

    print('Rückseite...')
    backcover(d)

    d.save()
    print(f'Fertig: {out}')
