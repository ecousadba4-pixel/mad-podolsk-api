"""PDF generation using WeasyPrint and Jinja2 templates."""
import os
from io import BytesIO
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

from app.backend.schemas.reports import MonthlyReportData


# Path to templates directory
TEMPLATES_DIR = Path(__file__).parent / "templates"

# Path to fonts (used in frontend, accessible via file path)
FONTS_DIR = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "fonts" / "manrope"


def get_jinja_env() -> Environment:
    """Create Jinja2 environment with templates directory."""
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True
    )


def format_number(value: float, decimals: int = 2) -> str:
    """Format number with thousands separator and decimals."""
    if value is None:
        return "—"
    if decimals == 0:
        return f"{int(value):,}".replace(",", " ")
    return f"{value:,.{decimals}f}".replace(",", " ")


def format_month_russian(month_start) -> str:
    """Format month to Russian like 'Ноябрь 2025'."""
    months = {
        1: "Январь", 2: "Февраль", 3: "Март", 4: "Апрель",
        5: "Май", 6: "Июнь", 7: "Июль", 8: "Август",
        9: "Сентябрь", 10: "Октябрь", 11: "Ноябрь", 12: "Декабрь"
    }
    return f"{months.get(month_start.month, '')} {month_start.year}"


def format_date_russian(dt) -> str:
    """Format date to Russian format like '9 декабря 2025'."""
    months = {
        1: "января", 2: "февраля", 3: "марта", 4: "апреля",
        5: "мая", 6: "июня", 7: "июля", 8: "августа",
        9: "сентября", 10: "октября", 11: "ноября", 12: "декабря"
    }
    return f"{dt.day} {months.get(dt.month, '')} {dt.year}"


def generate_monthly_pdf(data: MonthlyReportData) -> bytes:
    """
    Generate PDF report from MonthlyReportData.
    
    Steps:
    1. Load Jinja2 template
    2. Render HTML with data
    3. Convert HTML to PDF via WeasyPrint
    4. Return PDF bytes
    """
    env = get_jinja_env()
    
    # Add custom filters
    env.filters["format_number"] = format_number
    env.filters["format_number_int"] = lambda x: format_number(x, 0)
    
    template = env.get_template("monthly_report.html")
    
    # Calculate total rows for auto-scaling
    total_rows = sum(len(g.items) + 1 for g in data.smeta_groups)  # +1 for subtotal row
    total_rows += 1  # Grand total row
    
    # Prepare context
    context = {
        "data": data,
        "month_title": format_month_russian(data.month_start),
        "report_date": format_date_russian(data.report_date),
        "data_loaded_at": data.data_loaded_at or "—",
        "total_rows": total_rows,
        "fonts_dir": str(FONTS_DIR.absolute()),
    }
    
    html_content = template.render(**context)
    
    # Configure fonts
    font_config = FontConfiguration()
    
    # Generate PDF
    html = HTML(string=html_content, base_url=str(TEMPLATES_DIR))
    
    # Load print CSS
    css_path = TEMPLATES_DIR / "print.css"
    stylesheets = []
    if css_path.exists():
        stylesheets.append(CSS(filename=str(css_path), font_config=font_config))
    
    pdf_bytes = html.write_pdf(
        stylesheets=stylesheets,
        font_config=font_config
    )
    
    return pdf_bytes
