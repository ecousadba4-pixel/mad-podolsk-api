from typing import List, Optional, Sequence

from app.backend import db


def get_months_from_plan_vs_fact_monthly() -> List[dict]:
    return db.query(
        "SELECT DISTINCT to_char(month_start,'YYYY-MM') AS month FROM skpdi_plan_vs_fact_monthly ORDER BY month DESC"
    )


def get_months_from_plan_fact_backend() -> List[dict]:
    return db.query(
        "SELECT DISTINCT month_key AS month FROM skpdi_plan_fact_monthly_backend ORDER BY month DESC"
    )


def get_months_from_fact_with_money() -> List[dict]:
    return db.query(
        "SELECT DISTINCT to_char(date_done,'YYYY-MM') AS month FROM skpdi_fact_with_money ORDER BY month DESC"
    )


def get_plan_fact_month(month_key: str) -> Optional[dict]:
    return db.query_one(
        """
        SELECT month_key, plan_leto, plan_zima, plan_vnereglament, plan_total, fact_leto, fact_zima, fact_vnereglament, fact_total
        FROM skpdi_plan_fact_monthly_backend
        WHERE month_key = %s
        """,
        (month_key,),
    )


def sum_fact_vnereglament(month_key: str) -> Optional[dict]:
    return db.query_one(
        """
        SELECT COALESCE(SUM(fact_amount_done),0) AS s
        FROM skpdi_plan_vs_fact_monthly
        WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2')
        """,
        (month_key,),
    )


def get_contract_amount_sum() -> Optional[dict]:
    return db.query_one("SELECT COALESCE(SUM(contract_amount),0) AS sum FROM podolsk_mad_2025_contract_amount")


def get_total_fact_amount() -> Optional[dict]:
    """Return total fact amount aggregated across all months.

    Uses the plan_fact backend table which contains monthly fact_total values.
    """
    return db.query_one("SELECT COALESCE(SUM(fact_total),0) AS sum FROM skpdi_plan_fact_monthly_backend")


def get_monthly_items(month_key: str) -> List[dict]:
    return db.query(
        """
        SELECT to_char(month_start,'YYYY-MM-DD') AS month_start, smeta AS smeta, work_name, planned_amount, fact_amount
        FROM skpdi_plan_vs_fact_monthly
        WHERE to_char(month_start,'YYYY-MM')=%s
        ORDER BY planned_amount DESC
        """,
        (month_key,),
    )


def get_last_loaded_row() -> Optional[dict]:
    return db.query_one("SELECT MAX(loaded_at) AS loaded_at FROM skpdi_fact_agg")


def get_plan_rows_by_smeta(month_key: str, smeta_code: str) -> List[dict]:
    return db.query(
        """
        SELECT description, COALESCE(SUM(planned_amount),0) AS plan
        FROM skpdi_plan_vs_fact_monthly
        WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s
        GROUP BY description
        """,
        (month_key, smeta_code),
    )


def get_fact_rows_by_smeta(month_key: str, smeta_codes: Sequence[str]) -> List[dict]:
    if len(smeta_codes) == 1:
        codes_clause = "smeta_code = %s"
        params: Sequence = (month_key, smeta_codes[0])
    else:
        codes_clause = "smeta_code IN ('" + "','".join(smeta_codes) + "')"
        params = (month_key,)
    return db.query(
        f"""
        SELECT description, COALESCE(SUM(fact_amount_done),0) AS fact
        FROM skpdi_plan_vs_fact_monthly
        WHERE to_char(month_start,'YYYY-MM')=%s AND {codes_clause}
        GROUP BY description
        """,
        params,
    )


def get_description_daily_rows(month_key: str, description: str, smeta_codes: Sequence[str]) -> List[dict]:
    is_vnereglament = len(smeta_codes) > 1
    code_clause = "smeta_code IN ('внерегл_ч_1','внерегл_ч_2')" if is_vnereglament else "smeta_code = %s"
    params: Sequence = (month_key, description) if is_vnereglament else (month_key, description, smeta_codes[0])
    return db.query(
        f"""
        SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_volume),0) AS volume,
               MIN(unit) AS unit, COALESCE(SUM(total_amount),0) AS amount
        FROM skpdi_fact_with_money
        WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' AND description=%s AND {code_clause}
        GROUP BY date_done
        ORDER BY date_done
        """,
        params,
    )


def get_monthly_daily_revenue_rows(month_key: str) -> List[dict]:
    return db.query(
        """
        SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_amount),0) AS amount
        FROM skpdi_fact_with_money
        WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено'
        GROUP BY date_done
        ORDER BY date_done
        """,
        (month_key,),
    )


def get_daily_rows(date_value: str) -> List[dict]:
    return db.query(
        """
        SELECT description, MIN(unit) AS unit, COALESCE(SUM(total_volume),0) AS volume, COALESCE(SUM(total_amount),0) AS amount
        FROM skpdi_fact_with_money
        WHERE to_char(date_done,'YYYY-MM-DD')=%s AND status='Рассмотрено'
        GROUP BY description
        ORDER BY description
        """,
        (date_value,),
    )


def get_daily_total(date_value: str) -> Optional[dict]:
    return db.query_one(
        """
        SELECT COALESCE(SUM(total_amount),0) AS total
        FROM skpdi_fact_with_money
        WHERE to_char(date_done,'YYYY-MM-DD')=%s AND status='Рассмотрено'
        """,
        (date_value,),
    )
