"""Server-side PDF generation for a single form submission.

Produces a clean, professional, branded A4/Letter PDF using reportlab
(a real generated PDF file - not a browser print-to-pdf hack).
"""
import io

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

BRAND_PRIMARY = colors.HexColor("#1f2a24")
BRAND_ACCENT = colors.HexColor("#9ad176")


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(0.75 * inch, 0.5 * inch, "Divine Solutions Healthcare LLC \u2014 Confidential Submission Record")
    canvas.drawRightString(LETTER[0] - 0.75 * inch, 0.5 * inch, f"Page {doc.page}")
    canvas.restoreState()


def generate_submission_pdf(submission) -> bytes:
    buffer = io.BytesIO()
    doc = BaseDocTemplate(
        buffer,
        pagesize=LETTER,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=_footer)])

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "BrandTitle", parent=styles["Title"], textColor=BRAND_PRIMARY, fontSize=20, spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "BrandSubtitle", parent=styles["Normal"], textColor=colors.HexColor("#557a5c"), fontSize=11, spaceAfter=14,
    )
    heading_style = ParagraphStyle(
        "SectionHeading", parent=styles["Heading2"], textColor=BRAND_PRIMARY, fontSize=13, spaceBefore=14, spaceAfter=6,
    )
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10.5, leading=15)

    story = []
    story.append(Paragraph("Divine Solutions Healthcare LLC", title_style))
    story.append(Paragraph(f"{submission.get_form_type_display()} \u2014 Submission Record", subtitle_style))

    meta_table = Table(
        [
            ["Submission ID", str(submission.id)],
            ["Date / Time", submission.created_at.strftime("%B %d, %Y %I:%M %p %Z")],
            ["Status", submission.get_status_display()],
            ["Source Page", submission.source_page or "\u2014"],
        ],
        colWidths=[1.7 * inch, 4.3 * inch],
    )
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f2f6f0")),
                ("TEXTCOLOR", (0, 0), (0, -1), BRAND_PRIMARY),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8e3d6")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(meta_table)

    story.append(Paragraph("Submitted Information", heading_style))
    info_rows = [
        ["Full Name", submission.full_name],
        ["Email", submission.email],
        ["Phone", submission.phone or "\u2014"],
    ]
    for key, val in (submission.extra_data or {}).items():
        info_rows.append([key.replace("_", " ").title(), str(val)])

    info_table = Table(info_rows, colWidths=[1.7 * inch, 4.3 * inch])
    info_table.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e5e5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ]
        )
    )
    story.append(info_table)

    if submission.message:
        story.append(Paragraph("Message", heading_style))
        story.append(Paragraph(submission.message.replace("\n", "<br/>"), body_style))

    story.append(Paragraph("Privacy Policy Acknowledgement", heading_style))
    ack = "Accepted at time of submission." if submission.privacy_accepted else "Not recorded."
    story.append(Paragraph(ack, body_style))

    if submission.admin_notes:
        story.append(Paragraph("Admin Notes", heading_style))
        story.append(Paragraph(submission.admin_notes.replace("\n", "<br/>"), body_style))

    story.append(Spacer(1, 0.3 * inch))

    doc.build(story)
    return buffer.getvalue()
