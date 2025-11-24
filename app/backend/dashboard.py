from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
import os
from datetime import date, datetime
from app.backend import db

router = APIRouter()


def smeta_key_to_codes(smeta_key: str):
    if smeta_key == "leto":
        return ["лето"]
    if smeta_key == "zima":
        return ["зима"]
    if smeta_key == "vnereglement":
        return ["внерегл_ч_1", "внерегл_ч_2"]
    return []


def validate_month(month: str):
    try:
        datetime.strptime(month + "-01", "%Y-%m-%d")
    except Exception:
        raise HTTPException(status_code=400, detail="invalid month format")


@router.get("/monthly/summary")
def monthly_summary(month: str = Query(..., description="YYYY-MM")):
    validate_month(month)

    # plan sums
    plan_leto_row = db.query_one(
        "SELECT COALESCE(SUM(planned_amount),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s",
        (month, 'лето'),
    )
    plan_zima_row = db.query_one(
        "SELECT COALESCE(SUM(planned_amount),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s",
        (month, 'зима'),
    )
    plan_leto = int(plan_leto_row['sum'] or 0)
    plan_zima = int(plan_zima_row['sum'] or 0)
    # Внерегламент рассчитывается как 43% от суммы лето+зима (округляем до целых)
    plan_vnereglament = int(round((plan_leto + plan_zima) * 0.43))
    plan_total = plan_leto + plan_zima + plan_vnereglament

    # fact sums
    fact_leto_row = db.query_one(
        "SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s",
        (month, 'лето'),
    )
    fact_zima_row = db.query_one(
        "SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s",
        (month, 'зима'),
    )
    fact_vn_row = db.query_one(
        "SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2')",
        (month, ),
    )
    fact_leto = int(fact_leto_row['sum'] or 0)
    fact_zima = int(fact_zima_row['sum'] or 0)
    fact_vnereglament = int(fact_vn_row['sum'] or 0)
    fact_total = fact_leto + fact_zima + fact_vnereglament

    # contract amount
    contract_row = db.query_one("SELECT COALESCE(SUM(contract_amount),0) AS sum FROM podolsk_mad_2025_contract_amount")
    summa_contract = int(contract_row['sum'] or 0)
    contract_planfact_pct = float(fact_total / summa_contract) if summa_contract else None

    # avg daily revenue: if requested month is current month, divide by days passed minus 1, else by full days in month
    ym = datetime.strptime(month + "-01", "%Y-%m-%d")
    from calendar import monthrange
    days_in_month = monthrange(ym.year, ym.month)[1]
    today = datetime.utcnow().date()
    if today.year == ym.year and today.month == ym.month:
        denom = max(1, today.day - 1)
    else:
        denom = days_in_month
    avg_daily_revenue = int(fact_total / denom) if denom else 0

    return {
        "month": month,
        "contract": {
            "summa_contract": summa_contract,
            "fact_total": fact_total,
            "contract_planfact_pct": contract_planfact_pct,
        },
        "kpi": {
            "plan_total": plan_total,
            "fact_total": fact_total,
            "delta": fact_total - plan_total,
            "avg_daily_revenue": avg_daily_revenue,
        },
    }


@router.get("")
def combined_dashboard(month: Optional[str] = Query(None, description="YYYY-MM or YYYY-MM-DD (optional)")):
    """Комбинированный endpoint, возвращающий сводку и элементы за месяц.

    Этот маршрут используется фронтендом как fallback, когда старые конкретные пути недоступны.
    Принимает `month` в виде `YYYY-MM` или `YYYY-MM-DD` (если не указан, вернёт общее состояние, где возможно).
    """
    month_key = None
    if month:
        # поддерживаем оба формата: YYYY-MM и YYYY-MM-DD
        try:
            if len(month) >= 7:
                month_key = month[:7]
                # валидация простая: пробуем собрать дату
                datetime.strptime(month_key + "-01", "%Y-%m-%d")
        except Exception:
            raise HTTPException(status_code=400, detail="invalid month format")

    # summary: повторяем логику из monthly_summary, если month указан
    summary = {
        "planned_amount": None,
        "fact_amount": None,
        "completion_pct": None,
        "delta_amount": None,
        "contract_amount": None,
        "contract_executed": None,
        "contract_completion_pct": None,
        "average_daily_revenue": None,
        "daily_revenue": None,
    }

    items = []

    if month_key:
        # план
        pl_leto_row = db.query_one(
            "SELECT COALESCE(SUM(planned_amount),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s",
            (month_key, 'лето'),
        )
        pl_zima_row = db.query_one(
            "SELECT COALESCE(SUM(planned_amount),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s",
            (month_key, 'зима'),
        )
        pl_leto = float(pl_leto_row['sum'] or 0)
        pl_zima = float(pl_zima_row['sum'] or 0)
        pl_vn = round((pl_leto + pl_zima) * 0.43)
        plan_total = int(pl_leto + pl_zima + pl_vn)

        # факт
        f_leto = float(db.query_one("SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s", (month_key, 'лето'))['sum'] or 0)
        f_zima = float(db.query_one("SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s", (month_key, 'зима'))['sum'] or 0)
        f_vn = float(db.query_one("SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2')", (month_key, ))['sum'] or 0)
        fact_total = int(f_leto + f_zima + f_vn)

        # contract
        contract_row = db.query_one("SELECT COALESCE(SUM(contract_amount),0) AS sum FROM podolsk_mad_2025_contract_amount")
        contract_amount = int(contract_row['sum'] or 0)

        contract_completion_pct = (float(fact_total) / contract_amount) if contract_amount else None

        # avg daily revenue
        ym = datetime.strptime(month_key + "-01", "%Y-%m-%d")
        from calendar import monthrange
        days_in_month = monthrange(ym.year, ym.month)[1]
        today = datetime.utcnow().date()
        if today.year == ym.year and today.month == ym.month:
            denom = max(1, today.day - 1)
        else:
            denom = days_in_month
        avg_daily_revenue = int(fact_total / denom) if denom else 0

        summary.update({
            "planned_amount": float(plan_total),
            "fact_amount": float(fact_total),
            "completion_pct": None,
            "delta_amount": float(fact_total - plan_total),
            "contract_amount": contract_amount,
            "contract_executed": None,
            "contract_completion_pct": contract_completion_pct,
            "average_daily_revenue": avg_daily_revenue,
        })

        # items: вернуть строки из представления skpdi_plan_vs_fact_monthly
        items = db.query("SELECT to_char(month_start,'YYYY-MM-DD') AS month_start, smeta AS smeta, work_name, planned_amount, fact_amount FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s ORDER BY planned_amount DESC", (month_key,))

    # last_updated: можно попытаться вернуть из агрегирующей таблицы
    last_updated_row = db.query_one("SELECT MAX(loaded_at) AS loaded_at FROM skpdi_fact_agg")
    last_updated = None
    if last_updated_row:
        loaded = last_updated_row.get('loaded_at')
        try:
            last_updated = loaded.isoformat()
        except Exception:
            last_updated = str(loaded)

    return {"month": month or None, "last_updated": last_updated, "summary": summary, "items": items, "has_data": bool(items)}


@router.get("/monthly/daily-revenue")
def monthly_daily_revenue(month: str = Query(..., description="YYYY-MM")):
    validate_month(month)
    rows = db.query(
        "SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' GROUP BY date_done ORDER BY date_done",
        (month, ),
    )
    # convert amounts to int
    for r in rows:
        r['amount'] = int(r['amount'] or 0)
    return {"month": month, "rows": rows}


@router.get("/monthly/by-smeta")
def monthly_by_smeta(month: str = Query(..., description="YYYY-MM")):
    validate_month(month)
    # compute plan and fact per smeta
    plan_leto = db.query_one("SELECT COALESCE(SUM(planned_amount),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s", (month, 'лето'))
    plan_zima = db.query_one("SELECT COALESCE(SUM(planned_amount),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s", (month, 'зима'))
    p_leto = int(plan_leto['sum'] or 0)
    p_zima = int(plan_zima['sum'] or 0)
    p_vn = int((p_leto + p_zima) * 0.43)

    fact_leto = int(db.query_one("SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s", (month, 'лето'))['sum'] or 0)
    fact_zima = int(db.query_one("SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s", (month, 'зима'))['sum'] or 0)
    fact_vn = int(db.query_one("SELECT COALESCE(SUM(fact_amount_done),0) AS sum FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2')", (month, ))['sum'] or 0)

    cards = [
        {"smeta_key": "leto", "label": "Лето", "plan": p_leto, "fact": fact_leto, "delta": fact_leto - p_leto},
        {"smeta_key": "zima", "label": "Зима", "plan": p_zima, "fact": fact_zima, "delta": fact_zima - p_zima},
        {"smeta_key": "vnereglement", "label": "Внерегламент", "plan": p_vn, "fact": fact_vn, "delta": fact_vn - p_vn},
    ]
    return {"month": month, "cards": cards}


@router.get("/monthly/smeta-details")
def monthly_smeta_details(month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...)):
    validate_month(month)
    codes = smeta_key_to_codes(smeta_key)
    if not codes:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    # Plan: for vnereglement plan is 0, otherwise sum planned_amount by description
    if smeta_key == 'vnereglement':
        plan_rows = []
    else:
        plan_rows = db.query(
            "SELECT description, COALESCE(SUM(planned_amount),0) AS plan FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s GROUP BY description",
            (month, codes[0]),
        )

    # Fact rows
    if smeta_key == 'vnereglement':
        fact_rows = db.query(
            "SELECT description, COALESCE(SUM(fact_amount_done),0) AS fact FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2') GROUP BY description",
            (month, ),
        )
    else:
        fact_rows = db.query(
            "SELECT description, COALESCE(SUM(fact_amount_done),0) AS fact FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s GROUP BY description",
            (month, codes[0]),
        )

    # merge by description
    rows_map = {}
    for r in plan_rows:
        desc = r['description']
        rows_map[desc] = {'description': desc, 'plan': int(r['plan'] or 0), 'fact': 0}
    for r in fact_rows:
        desc = r['description']
        if desc not in rows_map:
            rows_map[desc] = {'description': desc, 'plan': 0, 'fact': int(r['fact'] or 0)}
        else:
            rows_map[desc]['fact'] = int(r['fact'] or 0)

    # filter where plan or fact > 1
    rows = []
    for v in rows_map.values():
        if (v['plan'] or 0) > 1 or (v['fact'] or 0) > 1:
            v['delta'] = v['fact'] - v['plan']
            rows.append(v)

    # If vnereglement and no plan_rows, still present fact_rows
    return {"month": month, "smeta_key": smeta_key, "rows": rows}


@router.get("/monthly/smeta-description-daily")
def monthly_smeta_description_daily(month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...), description: str = Query(...)):
    validate_month(month)
    codes = smeta_key_to_codes(smeta_key)
    if not codes:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    # Aggregate by date_done where status = 'Рассмотрено' and description matches
    if smeta_key == 'vnereglement':
        code_clause = "smeta_code IN ('внерегл_ч_1','внерегл_ч_2')"
    else:
        code_clause = "smeta_code = %s"

    if smeta_key == 'vnereglement':
        params = (month, description)
        sql = f"SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_volume),0) AS volume, MIN(unit) AS unit, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' AND description=%s AND {code_clause} GROUP BY date_done ORDER BY date_done"
    else:
        params = (month, description, codes[0])
        sql = f"SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_volume),0) AS volume, MIN(unit) AS unit, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' AND description=%s AND {code_clause} GROUP BY date_done ORDER BY date_done"

    rows = db.query(sql, params)
    for r in rows:
        r['volume'] = int(r['volume'] or 0)
        r['amount'] = int(r['amount'] or 0)
    return {"month": month, "smeta_key": smeta_key, "description": description, "rows": rows}


@router.get("/last-loaded")
def last_loaded():
    """Return the most recent loaded_at timestamp from the aggregation table.

    Frontend expects JSON: {"loaded_at": "2025-11-24T12:34:56"} or {"loaded_at": null}
    """
    row = db.query_one("SELECT MAX(loaded_at) AS loaded_at FROM skpdi_fact_agg")
    if not row:
        return {"loaded_at": None}
    loaded = row.get('loaded_at')
    if loaded is None:
        return {"loaded_at": None}
    # psycopg2 may return a datetime/date; convert to ISO string
    try:
        return {"loaded_at": loaded.isoformat()}
    except Exception:
        return {"loaded_at": str(loaded)}

@router.get("/daily")
def daily(date: str = Query(..., description="YYYY-MM-DD")):
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except Exception:
        raise HTTPException(status_code=400, detail="invalid date format")

    rows = db.query(
        "SELECT description, MIN(unit) AS unit, COALESCE(SUM(total_volume),0) AS volume, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM-DD')=%s AND status='Рассмотрено' GROUP BY description ORDER BY description",
        (date, ),
    )
    total_row = db.query_one("SELECT COALESCE(SUM(total_amount),0) AS total FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM-DD')=%s AND status='Рассмотрено'", (date, ))
    for r in rows:
        r['volume'] = int(r['volume'] or 0)
        r['amount'] = int(r['amount'] or 0)
    total_amount = int(total_row['total'] or 0) if total_row else 0
    return {"date": date, "rows": rows, "total": {"amount": total_amount}}
