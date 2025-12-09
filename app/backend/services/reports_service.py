"""Service layer for PDF report generation."""
from collections import defaultdict
from datetime import date
from typing import List

from app.backend.repositories.reports_repo import (
    get_last_loaded_at,
    get_monthly_report_data,
    format_date_russian,
)
from app.backend.schemas.reports import (
    MonthlyReportData,
    ReportWorkItem,
    SmetaGroup,
)


def build_monthly_report_data(month: str) -> MonthlyReportData:
    """
    Build structured data for monthly PDF report.
    
    Steps:
    1. Parse month string to date
    2. Fetch raw data from repository
    3. Group by smeta_code
    4. Sort items within each group by fact_amount_done DESC
    5. Calculate subtotals per group and grand total
    6. Return MonthlyReportData DTO
    """
    # Parse month
    year, month_num = map(int, month.split("-"))
    month_start = date(year, month_num, 1)
    
    # Get raw data
    raw_data = get_monthly_report_data(month_start)
    
    # Get last loaded date
    data_loaded_at = get_last_loaded_at()
    
    # Group by smeta_code
    grouped = defaultdict(list)
    for row in raw_data:
        item = ReportWorkItem(
            smeta_code=row["smeta_code"] or "",
            description=row["description"] or "",
            unit=row["unit"],
            fact_volume_done=row["fact_volume_done"] or 0,
            fact_amount_done=row["fact_amount_done"] or 0,
        )
        grouped[item.smeta_code].append(item)
    
    # Build SmetaGroup list with subtotals
    smeta_groups: List[SmetaGroup] = []
    grand_total = 0.0
    
    # Sort groups by total amount descending
    sorted_groups = sorted(
        grouped.items(),
        key=lambda x: sum(item.fact_amount_done for item in x[1]),
        reverse=True
    )
    
    for smeta_code, items in sorted_groups:
        # Sort items within group by fact_amount_done DESC
        sorted_items = sorted(items, key=lambda x: x.fact_amount_done, reverse=True)
        subtotal = sum(item.fact_amount_done for item in sorted_items)
        grand_total += subtotal
        
        smeta_groups.append(SmetaGroup(
            smeta_code=smeta_code,
            items=sorted_items,
            subtotal=subtotal
        ))
    
    return MonthlyReportData(
        month_start=month_start,
        report_date=date.today(),
        data_loaded_at=data_loaded_at,
        smeta_groups=smeta_groups,
        grand_total=grand_total
    )
