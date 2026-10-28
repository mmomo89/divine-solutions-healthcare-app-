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

from cms.extra_data_utils import format_extra_value, humanize_key
from xml.sax.saxutils import escape as _xml_escape

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
        "SectionHeading", parent=styles["Heading2"], textColor=BRAND_PRIMARY, fontSize=12, spaceBefore=9, spaceAfter=4,
    )
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10.5, leading=15)
    cell_style = ParagraphStyle("Cell", parent=styles["Normal"], fontSize=9.5, leading=13)

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

    extra = submission.extra_data or {}
    if not isinstance(extra, dict):
        extra = {}

    if submission.form_type == "careers":
        labels = {
            "middleInitial": "Middle Initial",
            "address": "Street Address",
            "city": "City",
            "state": "State",
            "zip": "ZIP / Postal Code",
            "dateOfApplication": "Date of Application",
            "positionAppliedFor": "Position Applied For",
            "dateAvailableToStart": "Available Start Date",
            "desiredSalary": "Desired Salary",
            "employment_desired": "Employment Type(s) Desired",
            "legallyAuthorized": "Legally Authorized to Work?",
            "requireSponsorship": "Will You Require Sponsorship?",
            "atLeast18": "At Least 18 Years Old?",
            "appliedBefore": "Previously Applied Here?",
            "convictedFelony": "Felony Conviction Disclosure",
            "hsLocation": "School / Location",
            "hsYears": "Years Attended",
            "hsDiploma": "Diploma / Degree",
            "hsMajor": "Major / Course of Study",
            "collegeLocation": "College / University",
            "collegeYears": "Years Attended",
            "collegeDiploma": "Diploma / Degree",
            "collegeMajor": "Major / Course of Study",
            "otherLocation": "School / Location",
            "otherYears": "Years Attended",
            "otherDiploma": "Diploma / Certificate",
            "otherMajor": "Major / Course of Study",
            "ethnicity_race": "Race / Ethnicity",
            "veteranStatus": "Veteran Status",
            "signatureName": "Applicant Signature (Typed Name)",
            "signatureDate": "Signature Date",
        }

        def field_label(key):
            if key in labels:
                return labels[key]
            return humanize_key(key)

        def display_value(value):
            if value is None or value == "":
                return "\u2014"
            if isinstance(value, bool):
                return "Yes" if value else "No"
            if isinstance(value, list):
                return ", ".join(str(item) for item in value) if value else "\u2014"
            if isinstance(value, dict):
                return "\u2014"
            text = str(value).strip()
            from datetime import date
            try:
                if len(text) == 10 and text[4] == "-" and text[7] == "-":
                    text = date.fromisoformat(text).strftime("%B %d, %Y")
            except ValueError:
                pass
            return text or "\u2014"

        def add_fields(title, pairs):
            if not pairs:
                return
            story.append(Paragraph(_xml_escape(title), heading_style))
            rows = []
            for key, value in pairs:
                label = Paragraph(_xml_escape(field_label(key)), cell_style)
                text = _xml_escape(display_value(value)).replace("\\n", "<br/>")
                rows.append([label, Paragraph(text or "\u2014", cell_style)])

            table = Table(rows, colWidths=[1.7 * inch, 4.3 * inch])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f2f6f0")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d8e3d6")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(table)

        add_fields("Applicant Contact Details", [
            ("Full Name", submission.full_name),
            ("Email Address", submission.email),
            ("Phone Number", submission.phone),
        ])

        add_fields("Personal Information", [
            (key, extra[key])
            for key in ("middleInitial", "address", "city", "state", "zip")
            if key in extra
        ])

        groups = [
            ("Application Details", [
                "dateOfApplication", "positionAppliedFor",
                "dateAvailableToStart", "desiredSalary", "employment_desired",
            ]),
            ("Eligibility Questions", [
                "legallyAuthorized", "requireSponsorship", "atLeast18",
                "appliedBefore", "convictedFelony",
            ]),
            ("Education - High School", [
                "hsLocation", "hsYears", "hsDiploma", "hsMajor",
            ]),
            ("Education - College / University", [
                "collegeLocation", "collegeYears", "collegeDiploma", "collegeMajor",
            ]),
            ("Education - Other / Trade School", [
                "otherLocation", "otherYears", "otherDiploma", "otherMajor",
            ]),
            ("Additional Applicant Information", [
                "ethnicity_race", "veteranStatus",
            ]),
        ]

        for title, keys in groups:
            add_fields(title, [
                (key, extra[key]) for key in keys
                if key in extra and extra[key] not in (None, "")
            ])

        employment = extra.get("employment_history", [])
        if isinstance(employment, list) and employment:
            story.append(Paragraph("Employment History", heading_style))
            for index, entry in enumerate(employment, 1):
                if not isinstance(entry, dict):
                    continue
                pairs = [
                    (key, value) for key, value in entry.items()
                    if value not in (None, "")
                ]
                if pairs:
                    story.append(Paragraph(
                        f"Employment Record {index}", cell_style
                    ))
                    add_fields("", pairs)

        certification_text = {
            "cert1": (
                "Accuracy of Information",
                "I certify that the information provided is true and complete "
                "to the best of my knowledge.",
            ),
            "cert2": (
                "Authorization to Verify Information",
                "I authorize the Company to verify information and contact "
                "previous employers, references, and educational institutions.",
            ),
            "cert3": (
                "At-Will Employment",
                "I understand this application is not a contract of employment "
                "and employment may be terminated by either party, with or "
                "without notice.",
            ),
            "cert4": (
                "Privacy Policy Consent",
                "I consent to the collection and processing of my information "
                "in accordance with the Privacy Policy.",
            ),
        }

        cert_pairs = []
        for key, (title, statement) in certification_text.items():
            if key in extra:
                cert_pairs.append((
                    title,
                    f"{display_value(extra[key])} - {statement}",
                ))
        add_fields("Applicant Certifications", cert_pairs)

        add_fields("Applicant Signature", [
            (key, extra[key])
            for key in ("signatureName", "signatureDate")
            if key in extra
        ])

        known = {
            "firstName", "lastName", "middleInitial", "address", "city",
            "state", "zip", "phone", "email", "dateOfApplication",
            "positionAppliedFor", "dateAvailableToStart", "desiredSalary",
            "employmentDesired", "employment_desired", "legallyAuthorized",
            "requireSponsorship", "atLeast18", "appliedBefore",
            "convictedFelony", "hsLocation", "hsYears", "hsDiploma", "hsMajor",
            "collegeLocation", "collegeYears", "collegeDiploma", "collegeMajor",
            "otherLocation", "otherYears", "otherDiploma", "otherMajor",
            "employment", "employment_history", "ethnicity", "ethnicity_race",
            "veteranStatus", "cert1", "cert2", "cert3", "cert4",
            "signatureName", "signatureDate", "notRobot", "hp_field",
        }
        add_fields("Additional Information", [
            (key, value) for key, value in extra.items()
            if key not in known and value not in (None, "")
        ])

    else:
        story.append(Paragraph("Submitted Information", heading_style))
        info_rows = [
            ["Full Name", Paragraph(_xml_escape(submission.full_name or "\u2014"), cell_style)],
            ["Email", Paragraph(_xml_escape(submission.email or "\u2014"), cell_style)],
            ["Phone", Paragraph(_xml_escape(submission.phone or "\u2014"), cell_style)],
        ]
        for key, val in extra.items():
            formatted = format_extra_value(val, multiline=True)
            formatted = _xml_escape(formatted).replace("\\n", "<br/>")
            info_rows.append([humanize_key(key), Paragraph(formatted, cell_style)])

        info_table = Table(info_rows, colWidths=[1.7 * inch, 4.3 * inch])
        info_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9.5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e5e5")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ]))
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
