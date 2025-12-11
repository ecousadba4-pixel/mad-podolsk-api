from typing import List, Optional, Sequence

from app.backend import db


def get_months_from_plan_vs_fact_monthly() -> List[dict]:
    return db.query(
        "SELECT DISTINCT to_char(month_start, 'YYYY-MM') AS month FROM mv_plan_vs_fact_monthly_ids ORDER BY month DESC"
    )


def get_months_from_plan_fact_backend() -> List[dict]:
    return db.query(
        "SELECT DISTINCT month_key AS month FROM mv_plan_fact_monthly_backend_ids ORDER BY month DESC"
    )


def get_months_from_fact_with_money() -> List[dict]:
    return db.query(
        "SELECT DISTINCT to_char(date_done, 'YYYY-MM') AS month FROM mv_fact_daily_amounts WHERE status = 'Рассмотрено' ORDER BY month DESC"
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
        FROM mv_plan_fact_monthly_backend_ids
        WHERE month_key = %s
        """,
        (month_key,),
    )


def get_month_summary_bundle(month_key: str) -> Optional[dict]:
    """Return monthly plan/fact along with contract, total fact aggregates, and items.
    
    Also includes sum_fact_vnereglament calculated from mv_plan_vs_fact_monthly_ids
    for cases when fact_vnereglament is NULL in the backend table.
    
    Returns items as JSON array to avoid separate get_monthly_items query.
    """
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
                   fact_vnereglament,
                   COALESCE(fact_total, 0)::int AS fact_total
            FROM mv_plan_fact_monthly_backend_ids
            WHERE month_key = %s
        ),
        contract AS (
            SELECT COALESCE(SUM(contract_amount), 0)::int AS contract_amount
            FROM podolsk_mad_2025_contract_amount
        ),
        total_fact AS (
            SELECT COALESCE(SUM(fact_total), 0)::int AS fact_total_all_months
            FROM mv_plan_fact_monthly_backend_ids
        ),
        vnereglament_fact AS (
            SELECT COALESCE(SUM(fact_amount_done), 0)::int AS sum_fact_vnereglament
            FROM mv_plan_vs_fact_monthly_ids
            WHERE month_start >= DATE %s
              AND month_start < DATE %s + INTERVAL '1 month'
              AND smeta_code IN ('Внерегламент ч.1', 'Внерегламент ч.2')
        ),
        monthly_items AS (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'month_start', to_char(month_start, 'YYYY-MM-DD'),
                    'smeta', smeta_code,
                    'work_name', description,
                    'planned_amount', planned_amount,
                    'fact_amount', fact_amount_done
                ) ORDER BY planned_amount DESC
            ), '[]'::json) AS items
            FROM mv_plan_vs_fact_monthly_ids
            WHERE month_start >= DATE %s
              AND month_start < DATE %s + INTERVAL '1 month'
        )
        SELECT pf.month_key, pf.plan_leto, pf.plan_zima, pf.plan_vnereglament, pf.plan_total,
               pf.fact_leto, pf.fact_zima, pf.fact_vnereglament, pf.fact_total,
               c.contract_amount, tf.fact_total_all_months, vf.sum_fact_vnereglament,
               mi.items
        FROM contract c
        CROSS JOIN total_fact tf
        CROSS JOIN vnereglament_fact vf
        CROSS JOIN monthly_items mi
        LEFT JOIN plan_fact pf ON TRUE
        """,
        (month_key, month_key + '-01', month_key + '-01', month_key + '-01', month_key + '-01'),
    )


def sum_fact_vnereglament(month_key: str) -> Optional[dict]:
    return db.query_one(
        """
        SELECT COALESCE(SUM(fact_amount_done),0)::int AS s
        FROM mv_plan_vs_fact_monthly_ids
        WHERE month_start >= DATE %s
          AND month_start < DATE %s + INTERVAL '1 month'
          AND smeta_code IN ('Внерегламент ч.1','Внерегламент ч.2')
        """,
        (month_key + '-01', month_key + '-01'),
    )


def get_contract_amount_sum() -> Optional[dict]:
    return db.query_one(
        "SELECT COALESCE(SUM(contract_amount),0)::int AS sum FROM podolsk_mad_2025_contract_amount"
    )


def get_total_fact_amount() -> Optional[dict]:
    """Return total fact amount aggregated across all months.

    Uses the plan_fact backend table which contains monthly fact_total values.
    """
    return db.query_one("SELECT COALESCE(SUM(fact_total),0)::int AS sum FROM mv_plan_fact_monthly_backend_ids")


def get_monthly_items(month_key: str) -> List[dict]:
    return db.query(
        """
        SELECT to_char(month_start, 'YYYY-MM-DD') AS month_start, smeta_code AS smeta, description AS work_name, planned_amount, fact_amount_done AS fact_amount
        FROM mv_plan_vs_fact_monthly_ids
        WHERE month_start >= DATE %s
          AND month_start < DATE %s + INTERVAL '1 month'
        ORDER BY planned_amount DESC
        """,
        (month_key + '-01', month_key + '-01'),
    )


def get_last_loaded_row() -> Optional[dict]:
    return db.query_one(
        """
        SELECT MAX(last_refresh) AS loaded_at
        FROM pg_catalog.pg_matviews
        WHERE matviewname = ANY(%s)
        """,
        ([
            "mv_fact_daily_amounts",
            "mv_plan_vs_fact_monthly_ids",
            "mv_plan_fact_monthly_backend_ids",
        ],),
    )


def get_plan_rows_by_smeta(month_key: str, smeta_code: str) -> List[dict]:
    return db.query(
        """
        SELECT description, COALESCE(SUM(planned_amount),0)::int AS plan
        FROM mv_plan_vs_fact_monthly_ids
        WHERE month_start >= DATE %s
          AND month_start < DATE %s + INTERVAL '1 month'
          AND smeta_code=%s
        GROUP BY description
        """,
        (month_key + '-01', month_key + '-01', smeta_code),
    )


def get_fact_rows_by_smeta(month_key: str, smeta_codes: Sequence[str]) -> List[dict]:
    return db.query(
        """
        SELECT description, COALESCE(SUM(fact_amount_done),0)::int AS fact
        FROM mv_plan_vs_fact_monthly_ids
        WHERE month_start >= DATE %s
          AND month_start < DATE %s + INTERVAL '1 month'
          AND smeta_code = ANY(%s)
        GROUP BY description
        """,
        (month_key + '-01', month_key + '-01', list(smeta_codes)),
    )


def get_description_daily_rows(month_key: str, description: str, smeta_codes: Sequence[str]) -> List[dict]:
    return db.query(
        """
        SELECT to_char(date_done, 'YYYY-MM-DD') AS date, COALESCE(SUM(total_volume),0)::int AS volume,
               MIN(unit) AS unit, COALESCE(SUM(total_amount),0)::int AS amount
        FROM mv_fact_daily_amounts
        WHERE date_done >= DATE %s
          AND date_done < DATE %s + INTERVAL '1 month'
          AND status='Рассмотрено'
          AND description=%s
          AND smeta_code = ANY(%s)
        GROUP BY date_done
        ORDER BY date_done
        """,
        (month_key + '-01', month_key + '-01', description, list(smeta_codes)),
    )


def get_monthly_daily_revenue_rows(month_key: str) -> List[dict]:
    return db.query(
        """
        SELECT to_char(date_done, 'YYYY-MM-DD') AS date, COALESCE(SUM(total_amount),0)::int AS amount
        FROM mv_fact_daily_amounts
        WHERE date_done >= DATE %s
          AND date_done < DATE %s + INTERVAL '1 month'
          AND status='Рассмотрено'
        GROUP BY date_done
        ORDER BY date_done
        """,
        (month_key + '-01', month_key + '-01'),
    )


def get_daily_rows(date_value: str) -> List[dict]:
    return db.query(
        """
        SELECT description, MIN(unit) AS unit, COALESCE(SUM(total_volume),0)::int AS volume, COALESCE(SUM(total_amount),0)::int AS amount
        FROM mv_fact_daily_amounts
        WHERE date_done = DATE %s
          AND status='Рассмотрено'
        GROUP BY description
        ORDER BY description
        """,
        (date_value,),
    )


def get_daily_total(date_value: str) -> Optional[dict]:
    return db.query_one(
        """
        SELECT COALESCE(SUM(total_amount),0)::int AS total
        FROM mv_fact_daily_amounts
        WHERE date_done = DATE %s
          AND status='Рассмотрено'
        """,
        (date_value,),
    )


def get_monthly_dates(month_key: str) -> List[str]:
    """Return list of distinct YYYY-MM-DD dates in the given month from fact_with_money (status='Рассмотрено')."""
    rows = db.query(
        """
        SELECT DISTINCT to_char(date_done, 'YYYY-MM-DD') AS date
        FROM mv_fact_daily_amounts
        WHERE date_done >= DATE %s
          AND date_done < DATE %s + INTERVAL '1 month'
          AND status='Рассмотрено'
        ORDER BY date
        """,
        (month_key + '-01', month_key + '-01'),
    )
    return [r.get('date') for r in rows] if rows else []


def get_fact_by_type_of_work(month_key: str) -> List[dict]:
    """Return aggregated fact amounts by type_of_work for the given month.

    Joins mv_fact_daily_amounts, which already contains type_of_work resolved from dimensions.
    """
    return db.query(
        """
        SELECT
            COALESCE(f.type_of_work, 'Не указано') AS type_of_work,
            COALESCE(SUM(f.total_amount), 0)::int AS amount
        FROM mv_fact_daily_amounts f
        WHERE f.date_done >= DATE %s
          AND f.date_done < DATE %s + INTERVAL '1 month'
          AND f.status = 'Рассмотрено'
        GROUP BY f.type_of_work
        ORDER BY amount DESC
        """,
        (month_key + '-01', month_key + '-01'),
    )


def get_smeta_details_with_type_of_work(month_key: str, smeta_codes: Sequence[str]) -> List[dict]:
    """Return smeta details grouped by type_of_work for the given month and smeta codes.

    Returns rows with: type_of_work, description, plan, fact.
    Uses type_of_work from the materialized views instead of joining per-request.
    """
    month_start = month_key + '-01'
    return db.query(
        """
        WITH plan_with_type AS (
            SELECT
                p.smeta_code,
                p.description,
                p.type_of_work,
                COALESCE(SUM(p.planned_amount), 0)::int AS plan
            FROM mv_plan_vs_fact_monthly_ids p
            WHERE p.month_start >= DATE %s
              AND p.month_start < DATE %s + INTERVAL '1 month'
              AND p.smeta_code = ANY(%s)
            GROUP BY p.smeta_code, p.description, p.type_of_work
        ),
        fact_with_type AS (
            SELECT
                f.smeta_code,
                f.description,
                f.type_of_work,
                COALESCE(SUM(f.total_amount), 0)::int AS fact
            FROM mv_fact_daily_amounts f
            WHERE f.date_done >= DATE %s
              AND f.date_done < DATE %s + INTERVAL '1 month'
              AND f.status = 'Рассмотрено'
              AND f.smeta_code = ANY(%s)
            GROUP BY f.smeta_code, f.description, f.type_of_work
        ),
        combined AS (
            SELECT
                COALESCE(p.type_of_work, f.type_of_work) AS type_of_work,
                COALESCE(p.description, f.description) AS description,
                COALESCE(p.plan, 0) AS plan,
                COALESCE(f.fact, 0) AS fact
            FROM plan_with_type p
            FULL OUTER JOIN fact_with_type f 
                ON p.smeta_code = f.smeta_code 
                AND p.description = f.description
        )
        SELECT 
            type_of_work,
            description,
            plan,
            fact
        FROM combined
        WHERE plan > 1 OR fact > 1
        ORDER BY type_of_work NULLS LAST, fact DESC
        """,
        (month_start, month_start, list(smeta_codes), month_start, month_start, list(smeta_codes)),
    )
