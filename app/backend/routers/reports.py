"""API router for PDF report endpoints."""
import os
from datetime import date
from io import BytesIO

from fastapi import APIRouter, Query, Response
from fastapi.responses import StreamingResponse

from app.backend.schemas.reports import MonthlyReportParams
from app.backend.services.reports_service import build_monthly_report_data
from app.backend.pdf.generator import generate_monthly_pdf


router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/monthly")
async def get_monthly_report(
    month: str = Query(..., description="Month in YYYY-MM format", example="2025-11")
):
    """
    Generate and download PDF report for a specific month.
    
    Parameters:
    - month: Month in YYYY-MM format (e.g., "2025-11")
    
    Returns:
    - PDF file as attachment with name Report_MAD_Podolsk_MM-YYYY.pdf
    """
    # Validate parameters
    params = MonthlyReportParams(month=month)
    
    # Build report data
    report_data = build_monthly_report_data(params.month)
    
    # Generate PDF
    pdf_bytes = generate_monthly_pdf(report_data)
    
    # Format filename: Report_MAD_Podolsk_MM-YYYY.pdf
    year, month_num = params.month.split("-")
    filename = f"Report_MAD_Podolsk_{month_num}-{year}.pdf"
    
    # Return as streaming response with proper headers
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes))
        }
    )
