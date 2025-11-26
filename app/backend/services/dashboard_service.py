from calendar import monthrange
from datetime import datetime
from threading import RLock
from time import monotonic
from typing import List, Optional, Sequence

from fastapi import HTTPException

from app.backend.repositories import dashboard_repo


SMETA_LABELS = {
    "leto": "Лето",
    "zima": "Зима",
    "vnereglement": "Внерегламент",
}

_SENTINEL = object()


class _TTLCache:
    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._value = _SENTINEL
        self._expires_at = 0.0
        self._lock = RLock()

    def get_or_set(self, factory):
        now = monotonic()
        with self._lock:
            if self._value is not _SENTINEL and now < self._expires_at:
                return self._value
            self._value = factory()
            self._expires_at = now + self.ttl_seconds
            return self._value

    def invalidate(self):
        with self._lock:
            self._value = _SENTINEL
            self._expires_at = 0.0


_MONTHS_CACHE = _TTLCache(ttl_seconds=300)
_LAST_LOADED_CACHE = _TTLCache(ttl_seconds=60)


def smeta_key_to_codes(smeta_key: str) -> Sequence[str]:
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
    def _load_months():
        months_set = set()
        sources = [
            dashboard_repo.get_months_from_plan_vs_fact_monthly,
            dashboard_repo.get_months_from_plan_fact_backend,
            dashboard_repo.get_months_from_fact_with_money,
        ]

        for source in sources:
            try:
                rows = source()
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

        return sorted(months_set, reverse=True)

    months = _MONTHS_CACHE.get_or_set(_load_months)
    if limit is not None:
        return months[:limit]
    return months


def validate_month(month: str):
    normalize_month(month)


def compute_plan_fact(month: str, plan_fact_row: Optional[dict] = None):
    month_key = normalize_month(month)
    row = plan_fact_row or dashboard_repo.get_plan_fact_month(month_key)

    if not row:
        row = {
            "month_key": month_key,
            "plan_leto": 0,
            "plan_zima": 0,
            "plan_vnereglament": None,
            "plan_total": None,
            "fact_leto": 0,
            "fact_zima": 0,
            "fact_vnereglament": None,
            "fact_total": 0,
        }

    plan_leto = row.get("plan_leto") or 0
    plan_zima = row.get("plan_zima") or 0

    try:
        plan_vnereglament = int(round((plan_leto + plan_zima) * 0.43))
    except Exception:
        plan_vnereglament = 0

    plan_total = int(plan_leto + plan_zima + plan_vnereglament)

    fact_leto = row.get("fact_leto") or 0
    fact_zima = row.get("fact_zima") or 0
    fact_vnereglament = row.get("fact_vnereglament")
    if fact_vnereglament is None:
        r = dashboard_repo.sum_fact_vnereglament(month_key)
        fact_vnereglament = r.get("s") if r else 0
    else:
        fact_vnereglament = fact_vnereglament or 0

    fact_total = row.get("fact_total") or (fact_leto + fact_zima + fact_vnereglament)

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


def compute_contract_amount(contract_row: Optional[dict] = None):
    row = contract_row or dashboard_repo.get_contract_amount_sum()
    if not row:
        return 0
    return row.get("sum") or row.get("contract_amount") or 0


def compute_avg_daily_revenue(month_key: str, fact_total: int):
    ym = datetime.strptime(month_key + "-01", "%Y-%m-%d")
    days_in_month = monthrange(ym.year, ym.month)[1]
    today = datetime.utcnow().date()
    if today.year == ym.year and today.month == ym.month:
        denom = max(1, today.day - 1)
    else:
        denom = days_in_month
    return int(fact_total / denom) if denom else 0


def build_monthly_summary(month_key: str, bundle: Optional[dict] = None):
    plan_fact = compute_plan_fact(month_key, plan_fact_row=bundle)
    summa_contract = compute_contract_amount(bundle)
    # For the contract card, use total executed amount across all available months
    # (do not filter by the selected month). This provides a cumulative 'Выполнено' value.
    if bundle:
        total_fact_all_months = bundle.get("fact_total_all_months") or 0
    else:
        total_fact_all_months = 0
    if not total_fact_all_months and not bundle:
        total_fact_row = dashboard_repo.get_total_fact_amount()
        total_fact_all_months = total_fact_row["sum"] if total_fact_row else 0
    contract_planfact_pct = float(total_fact_all_months / summa_contract) if summa_contract else None
    avg_daily_revenue = compute_avg_daily_revenue(month_key, plan_fact["fact_total"])

    return {
        "month": month_key,
        "contract": {
            "summa_contract": summa_contract,
            # show cumulative fact_total across all months for the contract card
            "fact_total": total_fact_all_months,
            "contract_planfact_pct": contract_planfact_pct,
        },
        "kpi": {
            "plan_total": plan_fact["plan_total"],
            "fact_total": plan_fact["fact_total"],
            "delta": plan_fact["fact_total"] - plan_fact["plan_total"],
            "avg_daily_revenue": avg_daily_revenue,
        },
    }


def build_monthly_by_smeta(month: str, plan_fact: Optional[dict] = None):
    plan_fact = plan_fact or compute_plan_fact(month)
    cards = []
    plan_keys = {
        "leto": ("plan_leto", "fact_leto"),
        "zima": ("plan_zima", "fact_zima"),
        "vnereglement": ("plan_vnereglament", "fact_vnereglament"),
    }
    for smeta_key, (plan_key, fact_key) in plan_keys.items():
        cards.append(
            {
                "smeta_key": smeta_key,
                "label": SMETA_LABELS[smeta_key],
                "plan": plan_fact[plan_key],
                "fact": plan_fact[fact_key],
                "delta": plan_fact[fact_key] - plan_fact[plan_key],
            }
        )
    return {"month": plan_fact["month_key"], "cards": cards}


def build_combined_dashboard(month: Optional[str]):
    month_key = normalize_month(month) if month else None
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
    items: List[dict] = []
    cards: List[dict] = []
    available_months = fetch_available_months(limit=24)

    if month_key:
        bundle = dashboard_repo.get_month_summary_bundle(month_key)
        plan_fact = compute_plan_fact(month_key, plan_fact_row=bundle)
        contract_amount = compute_contract_amount(bundle)
        contract_completion_pct = (float(plan_fact["fact_total"]) / contract_amount) if contract_amount else None
        avg_daily_revenue = compute_avg_daily_revenue(month_key, plan_fact["fact_total"])

        summary.update(
            {
                "planned_amount": float(plan_fact["plan_total"]),
                "fact_amount": float(plan_fact["fact_total"]),
                "completion_pct": None,
                "delta_amount": float(plan_fact["fact_total"] - plan_fact["plan_total"]),
                "contract_amount": contract_amount,
                "contract_executed": None,
                "contract_completion_pct": contract_completion_pct,
                "average_daily_revenue": avg_daily_revenue,
            }
        )

        items = dashboard_repo.get_monthly_items(month_key)
        # build cards for the three smeta categories (leto, zima, vnereglement)
        try:
            cards = build_monthly_by_smeta(month_key, plan_fact)["cards"]
        except Exception:
            cards = []

    last_updated_row = _LAST_LOADED_CACHE.get_or_set(dashboard_repo.get_last_loaded_row)
    last_updated = None
    if last_updated_row:
        loaded = last_updated_row.get("loaded_at")
        try:
            last_updated = loaded.isoformat()
        except Exception:
            last_updated = str(loaded)

    return {
        "month": month or None,
        "last_updated": last_updated,
        "summary": summary,
        "items": items,
        "cards": cards if month_key else [],
        "has_data": bool(items),
        "available_months": available_months,
    }


def build_monthly_smeta_details(month: str, smeta_key: str):
    month_key = normalize_month(month)
    codes = smeta_key_to_codes(smeta_key)
    if not codes:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    plan_rows = [] if smeta_key == "vnereglement" else dashboard_repo.get_plan_rows_by_smeta(month_key, codes[0])
    fact_rows = dashboard_repo.get_fact_rows_by_smeta(month_key, codes)

    rows_map = {}
    for r in plan_rows:
        desc = r["description"]
        rows_map[desc] = {"description": desc, "plan": r.get("plan") or 0, "fact": 0}
    for r in fact_rows:
        desc = r["description"]
        if desc not in rows_map:
            rows_map[desc] = {"description": desc, "plan": 0, "fact": r.get("fact") or 0}
        else:
            rows_map[desc]["fact"] = r.get("fact") or 0

    rows = []
    for v in rows_map.values():
        if (v["plan"] or 0) > 1 or (v["fact"] or 0) > 1:
            v["delta"] = v["fact"] - v["plan"]
            rows.append(v)

    return {"month": month_key, "smeta_key": smeta_key, "rows": rows}


def build_monthly_smeta_description_daily(month: str, smeta_key: str, description: str):
    month_key = normalize_month(month)
    codes = smeta_key_to_codes(smeta_key)
    if not codes:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    rows = dashboard_repo.get_description_daily_rows(month_key, description, codes)

    return {"month": month_key, "smeta_key": smeta_key, "description": description, "rows": rows}


def build_monthly_daily_revenue(month: str):
    month_key = normalize_month(month)
    rows = dashboard_repo.get_monthly_daily_revenue_rows(month_key)
    return {"month": month_key, "rows": rows}


def build_daily(date_value: str):
    try:
        datetime.strptime(date_value, "%Y-%m-%d")
    except Exception:
        raise HTTPException(status_code=400, detail="invalid date format")

    rows = dashboard_repo.get_daily_rows(date_value)

    # Business rule: include only rows where amount > 5
    filtered_rows = [r for r in rows if r.get("amount", 0) > 5]

    # Recompute total as sum of amounts of filtered rows
    total_amount = sum(r.get("amount", 0) for r in filtered_rows)
    return {"date": date_value, "rows": filtered_rows, "total": {"amount": total_amount}}


def build_last_loaded():
    row = _LAST_LOADED_CACHE.get_or_set(dashboard_repo.get_last_loaded_row)
    if not row:
        return {"loaded_at": None}
    loaded = row.get("loaded_at")
    if loaded is None:
        return {"loaded_at": None}
    try:
        return {"loaded_at": loaded.isoformat()}
    except Exception:
        return {"loaded_at": str(loaded)}
