from typing import List, Optional, Sequence

from app.backend import db


async def get_months_from_plan_vs_fact_monthly() -> List[dict]:
    return await db.query_async(
        "SELECT DISTINCT to_char(month_start_date, 'YYYY-MM') AS month FROM mv_work_plan_vs_actual_monthly_value ORDER BY month DESC"
    )


async def get_months_from_plan_fact_backend() -> List[dict]:
    return await db.query_async(
        "SELECT DISTINCT year_month_key AS month FROM mv_work_plan_actual_monthly_summary ORDER BY month DESC"
    )


async def get_months_from_fact_with_money() -> List[dict]:
    return await db.query_async(
        "SELECT DISTINCT to_char(work_date, 'YYYY-MM') AS month FROM mv_work_actual_daily_value WHERE work_status_id = 3 ORDER BY month DESC"
    )


async def get_plan_fact_month(month_key: str) -> Optional[dict]:
    return await db.query_one_async(
        """
        SELECT year_month_key AS month_key,
               COALESCE(planned_value_summer, 0)::int AS plan_leto,
               COALESCE(planned_value_winter, 0)::int AS plan_zima,
               COALESCE(planned_value_vnereglament, 0)::int AS plan_vnereglament,
               COALESCE(planned_value_total, 0)::int AS plan_total,
               COALESCE(actual_value_summer, 0)::int AS fact_leto,
               COALESCE(actual_value_winter, 0)::int AS fact_zima,
               COALESCE(actual_value_vnereglament, 0)::int AS fact_vnereglament,
               COALESCE(actual_value_total, 0)::int AS fact_total
        FROM mv_work_plan_actual_monthly_summary
        WHERE year_month_key = %s
        """,
        (month_key,),
    )


async def get_month_summary_bundle(month_key: str) -> Optional[dict]:
    """Return monthly plan/fact along with contract, total fact aggregates, and items.
    
    Also includes sum_fact_vnereglament calculated from mv_work_plan_vs_actual_monthly_value
    for cases when fact_vnereglament is NULL in the backend table.
    
    Returns items as JSON array to avoid separate get_monthly_items query.
    """
    return await db.query_one_async(
        """
        WITH plan_fact AS (
            SELECT year_month_key AS month_key,
                   COALESCE(planned_value_summer, 0)::int AS plan_leto,
                   COALESCE(planned_value_winter, 0)::int AS plan_zima,
                   COALESCE(planned_value_vnereglament, 0)::int AS plan_vnereglament,
                   COALESCE(planned_value_total, 0)::int AS plan_total,
                   COALESCE(actual_value_summer, 0)::int AS fact_leto,
                   COALESCE(actual_value_winter, 0)::int AS fact_zima,
                   actual_value_vnereglament AS fact_vnereglament,
                   COALESCE(actual_value_total, 0)::int AS fact_total
            FROM mv_work_plan_actual_monthly_summary
            WHERE year_month_key = %s
        ),
        contract AS (
            SELECT CASE
                WHEN DATE %s < DATE '2026-01-01' THEN COALESCE(
                    (SELECT SUM(contract_amount) FROM contract_amount_2025), 0
                )::int
                ELSE COALESCE(
                    (SELECT SUM(contract_amount) FROM contract_amount_2026_h1), 0
                )::int
            END AS contract_amount
        ),
        total_fact AS (
            SELECT CASE
                WHEN DATE %s < DATE '2026-01-01' THEN COALESCE(
                    (SELECT SUM(actual_value_total) FROM mv_work_plan_actual_monthly_summary WHERE year_month_key < '2026-01'), 0
                )::int
                ELSE COALESCE(
                    (SELECT SUM(actual_value_total) FROM mv_work_plan_actual_monthly_summary WHERE year_month_key >= '2026-01' AND year_month_key <= %s), 0
                )::int
            END AS fact_total_all_months
        ),
        vnereglament_fact AS (
            SELECT COALESCE(SUM(actual_value), 0)::int AS sum_fact_vnereglament
            FROM mv_work_plan_vs_actual_monthly_value
            WHERE month_start_date >= DATE %s
              AND month_start_date < DATE %s + INTERVAL '1 month'
              AND estimate_id IN (3, 4)
        ),
        monthly_items AS (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'month_start', to_char(month_start_date, 'YYYY-MM-DD'),
                    'smeta', estimate_name,
                    'work_name', work_name,
                    'planned_amount', planned_value,
                    'fact_amount', actual_value
                ) ORDER BY planned_value DESC
            ), '[]'::json) AS items
            FROM mv_work_plan_vs_actual_monthly_value
            WHERE month_start_date >= DATE %s
              AND month_start_date < DATE %s + INTERVAL '1 month'
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
        (month_key, month_key + '-01', month_key + '-01', month_key, month_key + '-01', month_key + '-01', month_key + '-01', month_key + '-01'),
    )


async def sum_fact_vnereglament(month_key: str) -> Optional[dict]:
    return await db.query_one_async(
        """
        SELECT COALESCE(SUM(actual_value),0)::int AS s
        FROM mv_work_plan_vs_actual_monthly_value
        WHERE month_start_date >= DATE %s
          AND month_start_date < DATE %s + INTERVAL '1 month'
          AND estimate_id IN (3,4)
        """,
        (month_key + '-01', month_key + '-01'),
    )


async def get_contract_amount_sum(month_key: Optional[str] = None) -> Optional[dict]:
    """Return total contract amount choosing table by month.

    If month_key is provided and is earlier than 2026-01, use 2025 table; otherwise use 2026 1st half table.
    """
    if month_key:
        return await db.query_one_async(
            """
            SELECT CASE
                WHEN DATE %s < DATE '2026-01-01' THEN COALESCE(
                    (SELECT SUM(contract_amount) FROM contract_amount_2025), 0
                )::int
                ELSE COALESCE(
                    (SELECT SUM(contract_amount) FROM contract_amount_2026_h1), 0
                )::int
            END AS sum
            """,
            (month_key + '-01',),
        )
    return await db.query_one_async(
        "SELECT COALESCE(SUM(contract_amount),0)::int AS sum FROM contract_amount_2025"
    )


async def get_total_fact_amount(month_key: Optional[str] = None) -> Optional[dict]:
    """Return total fact amount aggregated by period.

    Uses the plan_fact backend table which contains monthly fact_total values.
    If month_key is before 2026-01, sums all months up to 2025-12.
    If month_key is 2026-01 or later, sums months from 2026-01 to the given month.
    """
    if month_key:
        return await db.query_one_async(
            """
            SELECT CASE
                WHEN DATE %s < DATE '2026-01-01' THEN COALESCE(
                    (SELECT SUM(actual_value_total) FROM mv_work_plan_actual_monthly_summary WHERE year_month_key < '2026-01'), 0
                )::int
                ELSE COALESCE(
                    (SELECT SUM(actual_value_total) FROM mv_work_plan_actual_monthly_summary WHERE year_month_key >= '2026-01' AND year_month_key <= %s), 0
                )::int
            END AS sum
            """,
            (month_key + '-01', month_key),
        )
    return await db.query_one_async("SELECT COALESCE(SUM(actual_value_total),0)::int AS sum FROM mv_work_plan_actual_monthly_summary")


async def get_monthly_items(month_key: str) -> List[dict]:
    return await db.query_async(
        """
        SELECT to_char(month_start_date, 'YYYY-MM-DD') AS month_start, estimate_name AS smeta, work_name, planned_value AS planned_amount, actual_value AS fact_amount
        FROM mv_work_plan_vs_actual_monthly_value
        WHERE month_start_date >= DATE %s
          AND month_start_date < DATE %s + INTERVAL '1 month'
        ORDER BY planned_value DESC
        """,
        (month_key + '-01', month_key + '-01'),
    )


async def get_last_loaded_row() -> Optional[dict]:
    return await db.query_one_async(
        """
        SELECT last_loaded_at AS loaded_at
        FROM etl_load_state
        LIMIT 1
        """
    )


async def get_plan_fact_rows_by_smeta(month_key: str, plan_smeta_id: Optional[int], smeta_ids: Sequence[int]) -> List[dict]:
    """Return plan and fact rows for the given smeta IDs in a single query.

    The query performs a single pass over ``mv_work_plan_vs_actual_monthly_value`` and uses
    ``FULL JOIN`` to combine plan and fact aggregates by description.
    """
    month_start = month_key + '-01'
    smeta_ids_for_monthly = list(smeta_ids)
    if plan_smeta_id and plan_smeta_id not in smeta_ids_for_monthly:
        smeta_ids_for_monthly.append(plan_smeta_id)

    return await db.query_async(
        """
        WITH monthly AS (
            SELECT work_name AS description, estimate_id, planned_value, actual_value
            FROM mv_work_plan_vs_actual_monthly_value
            WHERE month_start_date >= DATE %s
              AND month_start_date < DATE %s + INTERVAL '1 month'
              AND estimate_id = ANY(%s)
        ),
        plan_rows AS (
            SELECT description, COALESCE(SUM(planned_value), 0)::int AS plan
            FROM monthly
            WHERE %s IS NOT NULL AND estimate_id = %s
            GROUP BY description
        ),
        fact_rows AS (
            SELECT description, COALESCE(SUM(actual_value), 0)::int AS fact
            FROM monthly
            WHERE estimate_id = ANY(%s)
            GROUP BY description
        )
        SELECT
            COALESCE(p.description, f.description) AS description,
            COALESCE(p.plan, 0) AS plan,
            COALESCE(f.fact, 0) AS fact
        FROM plan_rows p
        FULL JOIN fact_rows f
            ON p.description = f.description
        """,
        (
            month_start,
            month_start,
            smeta_ids_for_monthly,
            plan_smeta_id,
            plan_smeta_id,
            list(smeta_ids),
        ),
    )


async def get_description_daily_rows(month_key: str, description: str, smeta_ids: Sequence[int]) -> List[dict]:
    return await db.query_async(
        """
        SELECT to_char(work_date, 'YYYY-MM-DD') AS date, COALESCE(SUM(quantity_done),0)::int AS volume,
               MIN(unit_name) AS unit, COALESCE(SUM(actual_value),0)::int AS amount
        FROM mv_work_actual_daily_value
        WHERE work_date >= DATE %s
          AND work_date < DATE %s + INTERVAL '1 month'
          AND work_status_id=3
          AND work_name=%s
          AND estimate_id = ANY(%s)
        GROUP BY work_date
        ORDER BY work_date
        """,
        (month_key + '-01', month_key + '-01', description, list(smeta_ids)),
    )


async def get_monthly_daily_revenue_rows(month_key: str) -> List[dict]:
    return await db.query_async(
        """
        SELECT to_char(work_date, 'YYYY-MM-DD') AS date, COALESCE(SUM(actual_value),0)::int AS amount
        FROM mv_work_actual_daily_value
        WHERE work_date >= DATE %s
          AND work_date < DATE %s + INTERVAL '1 month'
          AND work_status_id=3
        GROUP BY work_date
        ORDER BY work_date
        """,
        (month_key + '-01', month_key + '-01'),
    )


async def get_daily_rows(date_value: str) -> List[dict]:
    return await db.query_async(
        """
        SELECT work_name AS description, MIN(unit_name) AS unit, COALESCE(SUM(quantity_done),0)::int AS volume, COALESCE(SUM(actual_value),0)::int AS amount
        FROM mv_work_actual_daily_value
        WHERE work_date = DATE %s
          AND work_status_id=3
        GROUP BY work_name
        ORDER BY work_name
        """,
        (date_value,),
    )


async def get_daily_total(date_value: str) -> Optional[dict]:
    return await db.query_one_async(
        """
        SELECT COALESCE(SUM(actual_value),0)::int AS total
        FROM mv_work_actual_daily_value
        WHERE work_date = DATE %s
          AND work_status_id=3
        """,
        (date_value,),
    )


async def get_monthly_dates(month_key: str) -> List[str]:
    """Return list of distinct YYYY-MM-DD dates in the given month from fact_with_money (work_status_id=3)."""
    rows = await db.query_async(
        """
        SELECT DISTINCT to_char(work_date, 'YYYY-MM-DD') AS date
        FROM mv_work_actual_daily_value
        WHERE work_date >= DATE %s
          AND work_date < DATE %s + INTERVAL '1 month'
          AND work_status_id=3
        ORDER BY date
        """,
        (month_key + '-01', month_key + '-01'),
    )
    return [r.get('date') for r in rows] if rows else []


async def get_fact_by_type_of_work(month_key: str) -> List[dict]:
    """Return aggregated fact amounts by type_of_work for the given month.

    Joins mv_work_actual_daily_value, which already contains work_type_name resolved from dimensions.
    """
    return await db.query_async(
        """
        SELECT
            COALESCE(f.work_type_name, 'Не указано') AS type_of_work,
            COALESCE(SUM(f.actual_value), 0)::int AS amount
        FROM mv_work_actual_daily_value f
        WHERE f.work_date >= DATE %s
          AND f.work_date < DATE %s + INTERVAL '1 month'
          AND f.work_status_id = 3
        GROUP BY f.work_type_name
        ORDER BY amount DESC
        """,
        (month_key + '-01', month_key + '-01'),
    )


async def get_smeta_details_with_type_of_work(month_key: str, smeta_ids: Sequence[int]) -> List[dict]:
    """Return smeta details grouped by type_of_work for the given month and smeta codes.

    Returns rows with: type_of_work, description, plan, fact.
    Uses work_type_name from the materialized views instead of joining per-request.
    """
    month_start = month_key + '-01'
    return await db.query_async(
        """
        WITH plan_with_type AS (
            SELECT
                p.estimate_name,
                p.estimate_id,
                p.work_name AS description,
                p.work_type_name AS type_of_work,
                COALESCE(SUM(p.planned_value), 0)::int AS plan
            FROM mv_work_plan_vs_actual_monthly_value p
            WHERE p.month_start_date >= DATE %s
              AND p.month_start_date < DATE %s + INTERVAL '1 month'
              AND p.estimate_id = ANY(%s)
            GROUP BY p.estimate_name, p.estimate_id, p.work_name, p.work_type_name
        ),
        fact_with_type AS (
            SELECT
                f.estimate_name,
                f.estimate_id,
                f.work_name AS description,
                f.work_type_name AS type_of_work,
                COALESCE(SUM(f.actual_value), 0)::int AS fact
            FROM mv_work_actual_daily_value f
            WHERE f.work_date >= DATE %s
              AND f.work_date < DATE %s + INTERVAL '1 month'
              AND f.work_status_id = 3
              AND f.estimate_id = ANY(%s)
            GROUP BY f.estimate_name, f.estimate_id, f.work_name, f.work_type_name
        ),
        combined AS (
            SELECT
                COALESCE(p.type_of_work, f.type_of_work) AS type_of_work,
                COALESCE(p.description, f.description) AS description,
                COALESCE(p.plan, 0) AS plan,
                COALESCE(f.fact, 0) AS fact
            FROM plan_with_type p
            FULL OUTER JOIN fact_with_type f
                ON p.estimate_id = f.estimate_id
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
        (month_start, month_start, list(smeta_ids), month_start, month_start, list(smeta_ids)),
    )
