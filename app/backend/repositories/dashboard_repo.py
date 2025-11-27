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
        SELECT month_key,
               COALESCE(plan_leto, 0)::int AS plan_leto,
               COALESCE(plan_zima, 0)::int AS plan_zima,
               COALESCE(plan_vnereglament, 0)::int AS plan_vnereglament,
               COALESCE(plan_total, 0)::int AS plan_total,
               COALESCE(fact_leto, 0)::int AS fact_leto,
               COALESCE(fact_zima, 0)::int AS fact_zima,
               COALESCE(fact_vnereglament, 0)::int AS fact_vnereglament,
               COALESCE(fact_total, 0)::int AS fact_total
        FROM skpdi_plan_fact_monthly_backend
        WHERE month_key = %s
        """,
        (month_key,),
    )


def get_month_summary_bundle(month_key: str) -> Optional[dict]:
    """Return monthly plan/fact along with contract and total fact aggregates."""
    return db.query_one(
        """
        WITH plan_fact AS (
            SELECT month_key,
                   COALESCE(plan_leto, 0)::int AS plan_leto,
                   COALESCE(plan_zima, 0)::int AS plan_zima,
                   COALESCE(plan_vnereglament, 0)::int AS plan_vnereglament,
                   COALESCE(plan_total, 0)::int AS plan_total,
                   COALESCE(fact_leto, 0)::int AS fact_leto,
                   COALESCE(fact_zima, 0)::int AS fact_zima,
                   COALESCE(fact_vnereglament, 0)::int AS fact_vnereglament,
                   COALESCE(fact_total, 0)::int AS fact_total
            FROM skpdi_plan_fact_monthly_backend
            WHERE month_key = %s
        ),
        contract AS (
            SELECT COALESCE(SUM(contract_amount), 0)::int AS contract_amount
            FROM podolsk_mad_2025_contract_amount
        ),
        total_fact AS (
            SELECT COALESCE(SUM(fact_total), 0)::int AS fact_total_all_months
            FROM skpdi_plan_fact_monthly_backend
        )
        SELECT pf.month_key, pf.plan_leto, pf.plan_zima, pf.plan_vnereglament, pf.plan_total,
               pf.fact_leto, pf.fact_zima, pf.fact_vnereglament, pf.fact_total,
               c.contract_amount, tf.fact_total_all_months
        FROM contract c
        CROSS JOIN total_fact tf
        LEFT JOIN plan_fact pf ON TRUE
        """,
        (month_key,),
    )


def sum_fact_vnereglament(month_key: str) -> Optional[dict]:
    return db.query_one(
        """
        SELECT COALESCE(SUM(fact_amount_done),0)::int AS s
        FROM skpdi_plan_vs_fact_monthly
        WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2')
        """,
        (month_key,),
    )


def get_contract_amount_sum() -> Optional[dict]:
    return db.query_one(
        "SELECT COALESCE(SUM(contract_amount),0)::int AS sum FROM podolsk_mad_2025_contract_amount"
    )


def get_total_fact_amount() -> Optional[dict]:
    """Return total fact amount aggregated across all months.

    Uses the plan_fact backend table which contains monthly fact_total values.
    """
    return db.query_one("SELECT COALESCE(SUM(fact_total),0)::int AS sum FROM skpdi_plan_fact_monthly_backend")


def get_monthly_items(month_key: str) -> List[dict]:
    return db.query(
        """
        SELECT to_char(month_start,'YYYY-MM-DD') AS month_start, smeta_code AS smeta, work_name, planned_amount, fact_amount
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
        SELECT description, COALESCE(SUM(planned_amount),0)::int AS plan
        FROM skpdi_plan_vs_fact_monthly
        WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s
        GROUP BY description
        """,
        (month_key, smeta_code),
    )


def get_fact_rows_by_smeta(month_key: str, smeta_codes: Sequence[str]) -> List[dict]:
    return db.query(
        """
        SELECT description, COALESCE(SUM(fact_amount_done),0)::int AS fact
        FROM skpdi_plan_vs_fact_monthly
        WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code = ANY(%s)
        GROUP BY description
        """,
        (month_key, list(smeta_codes)),
    )


def get_description_daily_rows(month_key: str, description: str, smeta_codes: Sequence[str]) -> List[dict]:
    return db.query(
        """
        SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_volume),0)::int AS volume,
               MIN(unit) AS unit, COALESCE(SUM(total_amount),0)::int AS amount
        FROM skpdi_fact_with_money
        WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' AND description=%s AND smeta_code = ANY(%s)
        GROUP BY date_done
        ORDER BY date_done
        """,
        (month_key, description, list(smeta_codes)),
    )


def get_monthly_daily_revenue_rows(month_key: str) -> List[dict]:
    return db.query(
        """
        SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_amount),0)::int AS amount
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
        SELECT description, MIN(unit) AS unit, COALESCE(SUM(total_volume),0)::int AS volume, COALESCE(SUM(total_amount),0)::int AS amount
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
        SELECT COALESCE(SUM(total_amount),0)::int AS total
        FROM skpdi_fact_with_money
        WHERE to_char(date_done,'YYYY-MM-DD')=%s AND status='Рассмотрено'
        """,
        (date_value,),
    )
