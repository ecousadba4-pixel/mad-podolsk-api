"""Repository for prices data access."""

from typing import Optional, List

from app.backend import db


async def get_prices(
    search: Optional[str] = None,
    estimate_id: Optional[int] = None,
    work_type_id: Optional[int] = None,
) -> List[dict]:
    """
    Get prices with optional filters.
    Joins fact_price_2026_upto_may with dimension tables.
    """
    conditions = []
    params = []
    
    if search and len(search.strip()) >= 3:
        # Split search into individual words for multi-word search
        words = search.strip().split()
        for word in words:
            word = word.strip()
            if word:
                conditions.append("wi.work_name ILIKE %s")
                params.append(f"%{word}%")
    
    if estimate_id is not None:
        conditions.append("fp.estimate_id = %s")
        params.append(estimate_id)
    
    if work_type_id is not None:
        conditions.append("wi.work_type_id = %s")
        params.append(work_type_id)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    return await db.query_async(
        f"""
        SELECT 
            fp.price_id,
            e.estimate_name,
            es.estimate_section_name,
            wt.work_type_name,
            wi.work_name,
            u.unit_name,
            fp.unit_price
        FROM initial_data.fact_price_2026_upto_may fp
        LEFT JOIN dim_work_item wi ON fp.work_item_id = wi.work_item_id
        LEFT JOIN dim_estimate e ON fp.estimate_id = e.estimate_id
        LEFT JOIN dim_estimate_section es ON fp.estimate_section_id = es.estimate_section_id
        LEFT JOIN dim_work_type wt ON wi.work_type_id = wt.work_type_id
        LEFT JOIN dim_unit u ON wi.unit_id = u.unit_id
        WHERE {where_clause}
        ORDER BY e.estimate_name, es.estimate_section_name, wi.work_name
        """,
        tuple(params),
    )


async def get_estimates() -> List[dict]:
    """Get list of available estimates for filtering."""
    return await db.query_async(
        """
        SELECT DISTINCT e.estimate_id, e.estimate_name
        FROM initial_data.fact_price_2026_upto_may fp
        JOIN dim_estimate e ON fp.estimate_id = e.estimate_id
        WHERE e.estimate_name IS NOT NULL
        ORDER BY e.estimate_name
        """,
    )


async def get_work_types() -> List[dict]:
    """Get list of available work types for filtering."""
    return await db.query_async(
        """
        SELECT DISTINCT wt.work_type_id, wt.work_type_name
        FROM initial_data.fact_price_2026_upto_may fp
        JOIN dim_work_item wi ON fp.work_item_id = wi.work_item_id
        JOIN dim_work_type wt ON wi.work_type_id = wt.work_type_id
        WHERE wt.work_type_name IS NOT NULL
        ORDER BY wt.work_type_name
        """,
    )
