import hashlib
from calendar import monthrange
from datetime import datetime
from threading import RLock
from time import monotonic
from typing import Any, Dict, List, Optional, Sequence, Tuple

from fastapi import HTTPException

from app.backend.repositories import dashboard_repo


SMETA_LABELS = {
    "leto": "Лето",
    "zima": "Зима",
    "vnereglement": "Внерегламент",
}

_SENTINEL = object()


class _TTLCache:
    """Simple TTL cache for a single value."""

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


class _KeyedTTLCache:
    """TTL cache with keyed entries for caching by parameters (e.g., month, smeta_key)."""

    def __init__(self, ttl_seconds: int, max_entries: int = 100):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[Tuple, Tuple[Any, float]] = {}  # key -> (value, expires_at)
        self._lock = RLock()

    def get_or_set(self, key: Tuple, factory):
        now = monotonic()
        with self._lock:
            if key in self._cache:
                value, expires_at = self._cache[key]
                if now < expires_at:
                    return value
            # Evict expired entries and limit cache size
            self._evict_expired(now)
            value = factory()
            self._cache[key] = (value, now + self.ttl_seconds)
            return value

    def _evict_expired(self, now: float):
        """Remove expired entries and limit cache size."""
        # Remove expired
        expired_keys = [k for k, (_, exp) in self._cache.items() if now >= exp]
        for k in expired_keys:
            del self._cache[k]
        # If still over limit, remove oldest entries
        if len(self._cache) >= self.max_entries:
            sorted_keys = sorted(self._cache.keys(), key=lambda k: self._cache[k][1])
            for k in sorted_keys[: len(self._cache) - self.max_entries + 1]:
                del self._cache[k]

    def invalidate(self, key: Optional[Tuple] = None):
        with self._lock:
            if key is None:
                self._cache.clear()
            elif key in self._cache:
                del self._cache[key]


_MONTHS_CACHE = _TTLCache(ttl_seconds=300)
_LAST_LOADED_CACHE = _TTLCache(ttl_seconds=60)

# Keyed caches for heavy responses (TTL=120s to balance freshness and performance)
_COMBINED_DASHBOARD_CACHE = _KeyedTTLCache(ttl_seconds=120, max_entries=24)
_DAILY_REVENUE_CACHE = _KeyedTTLCache(ttl_seconds=120, max_entries=24)
_SMETA_DETAILS_CACHE = _KeyedTTLCache(ttl_seconds=120, max_entries=50)
_SMETA_DETAILS_TYPES_CACHE = _KeyedTTLCache(ttl_seconds=120, max_entries=50)

# Cache for description -> id and id -> description mapping
# This is an in-memory cache that builds up during the application lifetime
_description_id_map: Dict[str, str] = {}  # description -> id
_id_description_map: Dict[str, str] = {}  # id -> description
_desc_map_lock = RLock()


def generate_description_id(description: str) -> str:
    """Generate a short, URL-safe ID from description using SHA256 hash.
    
    The ID is 12 characters long (base16), which gives us ~2.8 * 10^14 
    possible values - more than enough for our use case while keeping 
    URLs reasonably short.
    """
    if not description:
        return ""
    # Use SHA256 and take first 12 hex chars (48 bits = plenty of uniqueness)
    hash_bytes = hashlib.sha256(description.encode('utf-8')).hexdigest()[:12]
    return hash_bytes


def register_description(description: str) -> str:
    """Register a description and return its ID. Thread-safe."""
    if not description:
        return ""
    desc_id = generate_description_id(description)
    with _desc_map_lock:
        _description_id_map[description] = desc_id
        _id_description_map[desc_id] = description
    return desc_id


def resolve_description_id(desc_id: str) -> Optional[str]:
    """Resolve a description ID back to the original description string."""
    if not desc_id:
        return None
    with _desc_map_lock:
        return _id_description_map.get(desc_id)


def smeta_key_to_ids(smeta_key: str) -> Sequence[int]:
    if smeta_key == "leto":
        return [1]
    if smeta_key == "zima":
        return [2]
    if smeta_key == "vnereglement":
        return [3, 4]
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
        # Use pre-calculated sum from bundle if available, otherwise fallback to separate query
        sum_from_bundle = row.get("sum_fact_vnereglament")
        if sum_from_bundle is not None:
            fact_vnereglament = sum_from_bundle
        else:
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


def _build_combined_dashboard_uncached(month_key: Optional[str]):
    """Internal uncached implementation of combined dashboard builder."""
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

        # Use items from bundle (JSON array) instead of separate query
        bundle_items = bundle.get("items") if bundle else None
        if bundle_items is not None:
            # items already comes as a list from PostgreSQL json_agg
            items = bundle_items if isinstance(bundle_items, list) else []
        else:
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
        "month": month_key or None,
        "last_updated": last_updated,
        "summary": summary,
        "items": items,
        "cards": cards if month_key else [],
        "has_data": bool(items),
        "available_months": available_months,
    }


def build_combined_dashboard(month: Optional[str]):
    """Build combined dashboard with TTL caching by month."""
    month_key = normalize_month(month) if month else None
    cache_key = (month_key,)
    return _COMBINED_DASHBOARD_CACHE.get_or_set(
        cache_key,
        lambda: _build_combined_dashboard_uncached(month_key)
    )


def _build_monthly_smeta_details_uncached(month_key: str, smeta_key: str):
    """Internal uncached implementation of monthly smeta details builder."""
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    include_plan = smeta_key != "vnereglement"
    plan_smeta_id = smeta_ids[0] if include_plan else None

    combined_rows = dashboard_repo.get_plan_fact_rows_by_smeta(month_key, plan_smeta_id, smeta_ids)

    rows = []
    for r in combined_rows:
        plan_value = r.get("plan") or 0
        fact_value = r.get("fact") or 0
        if plan_value > 1 or fact_value > 1:
            row = {
                "description": r.get("description"),
                "plan": plan_value,
                "fact": fact_value,
                "delta": fact_value - plan_value,
            }
            # Register description and add description_id to the row
            row["description_id"] = register_description(row["description"])
            rows.append(row)

    return {"month": month_key, "smeta_key": smeta_key, "rows": rows}


def build_monthly_smeta_details(month: str, smeta_key: str):
    """Build monthly smeta details with TTL caching by month and smeta_key."""
    month_key = normalize_month(month)
    cache_key = (month_key, smeta_key)
    return _SMETA_DETAILS_CACHE.get_or_set(
        cache_key,
        lambda: _build_monthly_smeta_details_uncached(month_key, smeta_key)
    )


def build_monthly_smeta_description_daily_by_id(month: str, smeta_key: str, description_id: str):
    """Build smeta description daily data using description_id instead of full description string."""
    description = resolve_description_id(description_id)
    if not description:
        raise HTTPException(status_code=404, detail="description_id not found - please load smeta details first")
    return build_monthly_smeta_description_daily(month, smeta_key, description)


def build_monthly_smeta_description_daily(month: str, smeta_key: str, description: str):
    month_key = normalize_month(month)
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    rows = dashboard_repo.get_description_daily_rows(month_key, description, smeta_ids)

    return {"month": month_key, "smeta_key": smeta_key, "description": description, "rows": rows}


def _build_monthly_daily_revenue_uncached(month_key: str):
    """Internal uncached implementation of monthly daily revenue builder."""
    rows = dashboard_repo.get_monthly_daily_revenue_rows(month_key)
    return {"month": month_key, "rows": rows}


def build_monthly_daily_revenue(month: str):
    """Build monthly daily revenue with TTL caching by month."""
    month_key = normalize_month(month)
    cache_key = (month_key,)
    return _DAILY_REVENUE_CACHE.get_or_set(
        cache_key,
        lambda: _build_monthly_daily_revenue_uncached(month_key)
    )


def fetch_monthly_dates(month: str):
    """Return list of available dates (YYYY-MM-DD) for the given month."""
    month_key = normalize_month(month)
    return dashboard_repo.get_monthly_dates(month_key)


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


def build_fact_by_type_of_work(month: str):
    """Build aggregated fact amounts by type_of_work for modal display."""
    month_key = normalize_month(month)
    rows = dashboard_repo.get_fact_by_type_of_work(month_key)
    
    # Calculate total
    total = sum(r.get("amount", 0) for r in rows)
    
    return {
        "month": month_key,
        "rows": rows,
        "total": total
    }


def _build_smeta_details_with_types_uncached(month_key: str, smeta_key: str):
    """Internal uncached implementation of smeta details with types builder."""
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    raw_rows = dashboard_repo.get_smeta_details_with_type_of_work(month_key, smeta_ids)
    
    # For vnereglement, set plan to 0
    is_vnereg = smeta_key == "vnereglement"
    
    rows = []
    for r in raw_rows:
        plan = 0 if is_vnereg else r.get("plan", 0)
        fact = r.get("fact", 0)
        description = r.get("description", "")
        rows.append({
            "type_of_work": r.get("type_of_work"),
            "description": description,
            "description_id": register_description(description),  # Add description_id
            "plan": plan,
            "fact": fact,
            "delta": fact - plan
        })
    
    return {
        "month": month_key,
        "smeta_key": smeta_key,
        "rows": rows
    }


def build_smeta_details_with_types(month: str, smeta_key: str):
    """Build smeta details with type_of_work grouping with TTL caching."""
    month_key = normalize_month(month)
    cache_key = (month_key, smeta_key)
    return _SMETA_DETAILS_TYPES_CACHE.get_or_set(
        cache_key,
        lambda: _build_smeta_details_with_types_uncached(month_key, smeta_key)
    )
