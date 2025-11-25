from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import date, datetime
from calendar import monthrange
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


def normalize_month(month: str) -> str:
    """Validate and normalize incoming month value to YYYY-MM."""
    try:
        if len(month) >= 7:
            normalized = (month or "")[:7]
            datetime.strptime(normalized + "-01", "%Y-%m-%d")
            return normalized
    except Exception:
        pass
    raise HTTPException(status_code=400, detail="invalid month format")


def fetch_available_months(limit: Optional[int] = None) -> List[str]:
    """Получить список месяцев в формате YYYY-MM, доступных в данных.

    Приоритет источников:
    1) skpdi_plan_vs_fact_monthly (основное представление для месячных данных)
    2) skpdi_plan_fact_monthly_backend (агрегированная таблица)
    3) skpdi_fact_with_money (сырые факты по дням)
    """

    months_set = set()
    queries = [
        "SELECT DISTINCT to_char(month_start,'YYYY-MM') AS month FROM skpdi_plan_vs_fact_monthly ORDER BY month DESC",
        "SELECT DISTINCT month_key AS month FROM skpdi_plan_fact_monthly_backend ORDER BY month DESC",
        "SELECT DISTINCT to_char(date_done,'YYYY-MM') AS month FROM skpdi_fact_with_money ORDER BY month DESC",
    ]

    for sql in queries:
        try:
            rows = db.query(sql)
        except Exception:
            continue

        for r in rows:
            raw_month = r.get("month") or r.get("month_key") or r.get("month_start")
            if not raw_month:
                continue
            try:
                normalized = normalize_month(str(raw_month))
            except HTTPException:
                continue
            months_set.add(normalized)

    months = sorted(months_set, reverse=True)
    if limit is not None:
        months = months[:limit]
    return months


def validate_month(month: str):
    normalize_month(month)


def compute_plan_fact(month: str):
    """Вернуть план/факт по сметам и сводные суммы за месяц."""
    month_key = normalize_month(month)

    row = db.query_one(
        """
        SELECT month_key, plan_leto, plan_zima, plan_vnereglament, plan_total, fact_leto, fact_zima, fact_vnereglament, fact_total
        FROM skpdi_plan_fact_monthly_backend
        WHERE month_key = %s
        """,
        (month_key,),
    )

    # Если данных нет, вернём нули
    if not row:
        row = {
            "month_key": month_key,
            "plan_leto": 0,
            "plan_zima": 0,
            # plan_vnereglament и plan_total будем вычислять ниже по формуле,
            # чтобы не зависеть от ETL/агрегирующей таблицы.
            "plan_vnereglament": None,
            "plan_total": None,
            "fact_leto": 0,
            "fact_zima": 0,
            "fact_vnereglament": None,
            "fact_total": 0,
        }
    # Normalize base values
    plan_leto = int(row.get("plan_leto") or 0)
    plan_zima = int(row.get("plan_zima") or 0)

    # Compute plan_vnereglament according to business logic:
    # plan_vnereglament = round((plan_leto + plan_zima) * 0.43)
    try:
        plan_vnereglament = int(round((plan_leto + plan_zima) * 0.43))
    except Exception:
        plan_vnereglament = 0

    # plan_total = sum of components
    plan_total = int(plan_leto + plan_zima + plan_vnereglament)

    # For fact_vnereglament try to read from aggregated row; if missing, compute
    # by summing fact_amount_done from the monthly view for vner codes.
    fact_leto = int(row.get("fact_leto") or 0)
    fact_zima = int(row.get("fact_zima") or 0)
    fact_vnereglament = row.get("fact_vnereglament")
    if fact_vnereglament is None:
        # fallback: sum from skpdi_plan_vs_fact_monthly view
        q = "SELECT COALESCE(SUM(fact_amount_done),0) AS s FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2')"
        r = db.query_one(q, (month_key,))
        try:
            fact_vnereglament = int(r.get('s') or 0) if r else 0
        except Exception:
            fact_vnereglament = 0
    else:
        fact_vnereglament = int(fact_vnereglament or 0)

    fact_total = int(row.get("fact_total") or (fact_leto + fact_zima + fact_vnereglament))

    return {
        "month_key": row.get("month_key", month_key),
        "plan_leto": plan_leto,
        "plan_zima": plan_zima,
        "plan_vnereglament": plan_vnereglament,
        "plan_total": plan_total,
        "fact_leto": fact_leto,
        "fact_zima": fact_zima,
        "fact_vnereglament": fact_vnereglament,
        "fact_total": fact_total,
    }


def compute_contract_amount():
    contract_row = db.query_one("SELECT COALESCE(SUM(contract_amount),0) AS sum FROM podolsk_mad_2025_contract_amount")
    return int(contract_row['sum'] or 0)


def compute_avg_daily_revenue(month_key: str, fact_total: int):
    ym = datetime.strptime(month_key + "-01", "%Y-%m-%d")
    days_in_month = monthrange(ym.year, ym.month)[1]
    today = datetime.utcnow().date()
    if today.year == ym.year and today.month == ym.month:
        denom = max(1, today.day - 1)
    else:
        denom = days_in_month
    return int(fact_total / denom) if denom else 0


@router.get("/monthly/summary")
def monthly_summary(month: str = Query(..., description="YYYY-MM")):
    month_key = normalize_month(month)
    plan_fact = compute_plan_fact(month_key)

    summa_contract = compute_contract_amount()
    contract_planfact_pct = float(plan_fact["fact_total"] / summa_contract) if summa_contract else None

    avg_daily_revenue = compute_avg_daily_revenue(month_key, plan_fact["fact_total"])

    return {
        "month": month_key,
        "contract": {
            "summa_contract": summa_contract,
            "fact_total": plan_fact["fact_total"],
            "contract_planfact_pct": contract_planfact_pct,
        },
        "kpi": {
            "plan_total": plan_fact["plan_total"],
            "fact_total": plan_fact["fact_total"],
            "delta": plan_fact["fact_total"] - plan_fact["plan_total"],
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
        month_key = normalize_month(month)

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
    available_months = fetch_available_months(limit=24)

    if month_key:
        plan_fact = compute_plan_fact(month_key)
        contract_amount = compute_contract_amount()
        contract_completion_pct = (float(plan_fact["fact_total"]) / contract_amount) if contract_amount else None
        avg_daily_revenue = compute_avg_daily_revenue(month_key, plan_fact["fact_total"])

        summary.update({
            "planned_amount": float(plan_fact["plan_total"]),
            "fact_amount": float(plan_fact["fact_total"]),
            "completion_pct": None,
            "delta_amount": float(plan_fact["fact_total"] - plan_fact["plan_total"]),
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

    return {
        "month": month or None,
        "last_updated": last_updated,
        "summary": summary,
        "items": items,
        "has_data": bool(items),
        "available_months": available_months,
    }


@router.get("/months")
def available_months(limit: Optional[int] = Query(None, ge=1, le=120, description="Максимальное количество месяцев")):
    months = fetch_available_months(limit=limit)
    return months


@router.get("/monthly/daily-revenue")
def monthly_daily_revenue(month: str = Query(..., description="YYYY-MM")):
    month_key = normalize_month(month)
    rows = db.query(
        "SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' GROUP BY date_done ORDER BY date_done",
        (month_key,),
    )
    # convert amounts to int
    for r in rows:
        r['amount'] = int(r['amount'] or 0)
    return {"month": month_key, "rows": rows}


@router.get("/monthly/by-smeta")
def monthly_by_smeta(month: str = Query(..., description="YYYY-MM")):
    plan_fact = compute_plan_fact(month)

    cards = [
        {
            "smeta_key": "leto",
            "label": "Лето",
            "plan": plan_fact["plan_leto"],
            "fact": plan_fact["fact_leto"],
            "delta": plan_fact["fact_leto"] - plan_fact["plan_leto"],
        },
        {
            "smeta_key": "zima",
            "label": "Зима",
            "plan": plan_fact["plan_zima"],
            "fact": plan_fact["fact_zima"],
            "delta": plan_fact["fact_zima"] - plan_fact["plan_zima"],
        },
        {
            "smeta_key": "vnereglement",
            "label": "Внерегламент",
            "plan": plan_fact["plan_vnereglament"],
            "fact": plan_fact["fact_vnereglament"],
            "delta": plan_fact["fact_vnereglament"] - plan_fact["plan_vnereglament"],
        },
    ]
    return {"month": plan_fact["month_key"], "cards": cards}


@router.get("/monthly/smeta-details")
def monthly_smeta_details(month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...)):
    month_key = normalize_month(month)
    codes = smeta_key_to_codes(smeta_key)
    if not codes:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    # Plan: for vnereglement plan is 0, otherwise sum planned_amount by description
    if smeta_key == 'vnereglement':
        plan_rows = []
    else:
        plan_rows = db.query(
            "SELECT description, COALESCE(SUM(planned_amount),0) AS plan FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s GROUP BY description",
            (month_key, codes[0]),
        )

    # Fact rows
    if smeta_key == 'vnereglement':
        fact_rows = db.query(
            "SELECT description, COALESCE(SUM(fact_amount_done),0) AS fact FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code IN ('внерегл_ч_1','внерегл_ч_2') GROUP BY description",
            (month_key,),
        )
    else:
        fact_rows = db.query(
            "SELECT description, COALESCE(SUM(fact_amount_done),0) AS fact FROM skpdi_plan_vs_fact_monthly WHERE to_char(month_start,'YYYY-MM')=%s AND smeta_code=%s GROUP BY description",
            (month_key, codes[0]),
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
    return {"month": month_key, "smeta_key": smeta_key, "rows": rows}


@router.get("/monthly/smeta-description-daily")
def monthly_smeta_description_daily(month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...), description: str = Query(...)):
    month_key = normalize_month(month)
    codes = smeta_key_to_codes(smeta_key)
    if not codes:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    # Aggregate by date_done where status = 'Рассмотрено' and description matches
    if smeta_key == 'vnereglement':
        code_clause = "smeta_code IN ('внерегл_ч_1','внерегл_ч_2')"
    else:
        code_clause = "smeta_code = %s"

    if smeta_key == 'vnereglement':
        params = (month_key, description)
        sql = f"SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_volume),0) AS volume, MIN(unit) AS unit, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' AND description=%s AND {code_clause} GROUP BY date_done ORDER BY date_done"
    else:
        params = (month_key, description, codes[0])
        sql = f"SELECT to_char(date_done,'YYYY-MM-DD') AS date, COALESCE(SUM(total_volume),0) AS volume, MIN(unit) AS unit, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM')=%s AND status='Рассмотрено' AND description=%s AND {code_clause} GROUP BY date_done ORDER BY date_done"

    rows = db.query(sql, params)
    for r in rows:
        r['volume'] = int(r['volume'] or 0)
        r['amount'] = int(r['amount'] or 0)
    return {"month": month_key, "smeta_key": smeta_key, "description": description, "rows": rows}


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
def daily(date: Optional[str] = Query(None, alias="date", description="YYYY-MM-DD"), day: Optional[str] = Query(None, alias="day", description="YYYY-MM-DD")):
    date_value = date or day
    if not date_value:
        raise HTTPException(status_code=400, detail="date is required")

    try:
        datetime.strptime(date_value, "%Y-%m-%d")
    except Exception:
        raise HTTPException(status_code=400, detail="invalid date format")

    rows = db.query(
        "SELECT description, MIN(unit) AS unit, COALESCE(SUM(total_volume),0) AS volume, COALESCE(SUM(total_amount),0) AS amount FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM-DD')=%s AND status='Рассмотрено' GROUP BY description ORDER BY description",
        (date_value,),
    )
    total_row = db.query_one(
        "SELECT COALESCE(SUM(total_amount),0) AS total FROM skpdi_fact_with_money WHERE to_char(date_done,'YYYY-MM-DD')=%s AND status='Рассмотрено'",
        (date_value,),
    )
    for r in rows:
        r['volume'] = int(r['volume'] or 0)
        r['amount'] = int(r['amount'] or 0)
    total_amount = int(total_row['total'] or 0) if total_row else 0
    return {"date": date_value, "rows": rows, "total": {"amount": total_amount}}
