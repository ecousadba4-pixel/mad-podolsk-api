"""Repository functions for PDF report data retrieval."""
from datetime import date
from typing import List, Optional

from app.backend import db


def get_monthly_report_data(month_start: date) -> List[dict]:
    """
    Fetch monthly fact data for report from skpdi_fact_monthly_total view.
    
    Returns list of dicts with:
        - month_start
        - description (вид работ)
        - unit (единица измерения)
        - fact_volume_done (объем выполненной работы)
        - fact_amount_done (сумма в деньгах)
        - smeta_code (название сметы)
    """
    sql = """
        SELECT 
            month_start,
            smeta_code,
            description,
            unit,
            COALESCE(fact_volume_done, 0)::float AS fact_volume_done,
            COALESCE(fact_amount_done, 0)::float AS fact_amount_done
        FROM skpdi_fact_monthly_total
        WHERE month_start = %s
        ORDER BY smeta_code, fact_amount_done DESC
    """
    return db.query(sql, (month_start,))


def get_last_loaded_at() -> Optional[str]:
    """
    Get the most recent loaded_at date from skpdi_fact_agg table.
    
    Returns formatted date string like "27 ноября 2025" or None.
    """
    sql = """
        SELECT MAX(loaded_at) AS loaded_at
        FROM skpdi_fact_agg
    """
    row = db.query_one(sql)
    if row and row.get("loaded_at"):
        loaded_at = row["loaded_at"]
        # Format date to Russian locale style
        return format_date_russian(loaded_at)
    return None


def format_date_russian(dt) -> str:
    """Format date to Russian format like '27 ноября 2025'."""
    from datetime import datetime
    
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
    elif hasattr(dt, "date"):
        dt = dt
    
    months = {
        1: "января", 2: "февраля", 3: "марта", 4: "апреля",
        5: "мая", 6: "июня", 7: "июля", 8: "августа",
        9: "сентября", 10: "октября", 11: "ноября", 12: "декабря"
    }
    
    day = dt.day
    month = months.get(dt.month, "")
    year = dt.year
    
    return f"{day} {month} {year}"
