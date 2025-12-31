import asyncio
import hashlib
from calendar import monthrange
from collections import OrderedDict
from datetime import datetime
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

# Configuration for description ID cache
_DESCRIPTION_CACHE_MAX_SIZE = 10_000


# ============================================================================
# === Async-safe TTL Caches ===
# ============================================================================


class _AsyncTTLCache:
    """Async-safe simple TTL cache for a single value."""
    
    def __init__(self, ttl_seconds: int):
        self.ttl_seconds = ttl_seconds
        self._value = _SENTINEL
        self._expires_at = 0.0
        self._lock = asyncio.Lock()
    
    async def get_or_set(self, factory):
        now = monotonic()
        async with self._lock:
            if self._value is not _SENTINEL and now < self._expires_at:
                return self._value
        # Call factory outside lock
        value = await factory()
        async with self._lock:
            self._value = value
            self._expires_at = monotonic() + self.ttl_seconds
            return self._value
    
    async def invalidate(self):
        async with self._lock:
            self._value = _SENTINEL
            self._expires_at = 0.0


class _AsyncKeyedTTLCache:
    """Async-safe TTL cache with keyed entries for caching by parameters."""
    
    def __init__(self, ttl_seconds: int, max_entries: int = 100):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache: Dict[Tuple, Tuple[Any, float]] = {}
        self._lock = asyncio.Lock()
    
    async def get_or_set(self, key: Tuple, factory):
        now = monotonic()
        async with self._lock:
            if key in self._cache:
                value, expires_at = self._cache[key]
                if now < expires_at:
                    return value
            self._evict_expired(now)
        # Call factory outside lock to avoid blocking
        value = await factory()
        async with self._lock:
            self._cache[key] = (value, monotonic() + self.ttl_seconds)
            return value
    
    def _evict_expired(self, now: float):
        """Remove expired entries and limit cache size."""
        expired_keys = [k for k, (_, exp) in self._cache.items() if now >= exp]
        for k in expired_keys:
            del self._cache[k]
        if len(self._cache) >= self.max_entries:
            sorted_keys = sorted(self._cache.keys(), key=lambda k: self._cache[k][1])
            for k in sorted_keys[: len(self._cache) - self.max_entries + 1]:
                del self._cache[k]
    
    async def invalidate(self, key: Optional[Tuple] = None):
        async with self._lock:
            if key is None:
                self._cache.clear()
            elif key in self._cache:
                del self._cache[key]


# Async caches
_MONTHS_CACHE = _AsyncTTLCache(ttl_seconds=300)
_LAST_LOADED_CACHE = _AsyncTTLCache(ttl_seconds=60)
_COMBINED_DASHBOARD_CACHE = _AsyncKeyedTTLCache(ttl_seconds=120, max_entries=24)
_DAILY_REVENUE_CACHE = _AsyncKeyedTTLCache(ttl_seconds=120, max_entries=24)
_SMETA_DETAILS_CACHE = _AsyncKeyedTTLCache(ttl_seconds=120, max_entries=50)
_SMETA_DETAILS_TYPES_CACHE = _AsyncKeyedTTLCache(ttl_seconds=120, max_entries=50)


# ============================================================================
# === Description ID Cache (thread-safe for sync access) ===
# ============================================================================


class _LRUDescriptionCache:
    """Thread-safe LRU cache for description <-> ID mapping with bounded size."""
    
    __slots__ = ('_max_size', '_desc_to_id', '_id_to_desc', '_lock')
    
    def __init__(self, max_size: int = _DESCRIPTION_CACHE_MAX_SIZE):
        import threading
        self._max_size = max_size
        self._desc_to_id: OrderedDict[str, str] = OrderedDict()
        self._id_to_desc: Dict[str, str] = {}
        self._lock = threading.RLock()
    
    def register(self, description: str) -> str:
        """Register description and return its ID. Thread-safe with LRU eviction."""
        if not description:
            return ""
        
        with self._lock:
            if description in self._desc_to_id:
                self._desc_to_id.move_to_end(description)
                return self._desc_to_id[description]
            
            desc_id = hashlib.sha256(description.encode('utf-8')).hexdigest()[:12]
            
            while len(self._desc_to_id) >= self._max_size:
                oldest_desc, oldest_id = self._desc_to_id.popitem(last=False)
                self._id_to_desc.pop(oldest_id, None)
            
            self._desc_to_id[description] = desc_id
            self._id_to_desc[desc_id] = description
            
            return desc_id
    
    def register_batch(self, descriptions: Sequence[str]) -> Dict[str, str]:
        """Register multiple descriptions at once. More efficient than individual calls."""
        if not descriptions:
            return {}
        
        result: Dict[str, str] = {}
        with self._lock:
            for description in descriptions:
                if not description:
                    result[description] = ""
                    continue
                
                if description in self._desc_to_id:
                    self._desc_to_id.move_to_end(description)
                    result[description] = self._desc_to_id[description]
                    continue
                
                desc_id = hashlib.sha256(description.encode('utf-8')).hexdigest()[:12]
                
                while len(self._desc_to_id) >= self._max_size:
                    oldest_desc, oldest_id = self._desc_to_id.popitem(last=False)
                    self._id_to_desc.pop(oldest_id, None)
                
                self._desc_to_id[description] = desc_id
                self._id_to_desc[desc_id] = description
                result[description] = desc_id
        
        return result
    
    def resolve(self, desc_id: str) -> Optional[str]:
        """Resolve ID back to description. Thread-safe."""
        if not desc_id:
            return None
        with self._lock:
            description = self._id_to_desc.get(desc_id)
            if description and description in self._desc_to_id:
                self._desc_to_id.move_to_end(description)
            return description
    
    def __len__(self) -> int:
        with self._lock:
            return len(self._desc_to_id)


_description_cache = _LRUDescriptionCache()


def register_descriptions_batch(descriptions: Sequence[str]) -> Dict[str, str]:
    """Register multiple descriptions at once."""
    return _description_cache.register_batch(descriptions)


def resolve_description_id(desc_id: str) -> Optional[str]:
    """Resolve a description ID back to the original description string."""
    return _description_cache.resolve(desc_id)


# ============================================================================
# === Utility functions ===
# ============================================================================


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


def compute_avg_daily_revenue(month_key: str, fact_total: int):
    ym = datetime.strptime(month_key + "-01", "%Y-%m-%d")
    days_in_month = monthrange(ym.year, ym.month)[1]
    today = datetime.utcnow().date()
    if today.year == ym.year and today.month == ym.month:
        denom = max(1, today.day - 1)
    else:
        denom = days_in_month
    return int(fact_total / denom) if denom else 0


# ============================================================================
# === Async service functions ===
# ============================================================================


async def fetch_available_months(limit: Optional[int] = None) -> List[str]:
    """Fetch available months from all sources concurrently."""
    async def _load_months():
        months_set = set()
        
        # Run all three queries concurrently
        results = await asyncio.gather(
            dashboard_repo.get_months_from_plan_vs_fact_monthly(),
            dashboard_repo.get_months_from_plan_fact_backend(),
            dashboard_repo.get_months_from_fact_with_money(),
            return_exceptions=True
        )
        
        for rows in results:
            if isinstance(rows, Exception):
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
    
    months = await _MONTHS_CACHE.get_or_set(_load_months)
    if limit is not None:
        return months[:limit]
    return months


async def compute_plan_fact(month: str, plan_fact_row: Optional[dict] = None):
    """Compute plan/fact data for a month."""
    month_key = normalize_month(month)
    row = plan_fact_row or await dashboard_repo.get_plan_fact_month(month_key)

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
        sum_from_bundle = row.get("sum_fact_vnereglament")
        if sum_from_bundle is not None:
            fact_vnereglament = sum_from_bundle
        else:
            r = await dashboard_repo.sum_fact_vnereglament(month_key)
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


async def compute_contract_amount(month_key: Optional[str] = None, contract_row: Optional[dict] = None):
    """Compute contract amount."""
    row = contract_row or await dashboard_repo.get_contract_amount_sum(month_key)
    if not row:
        return 0
    return row.get("sum") or row.get("contract_amount") or 0


async def build_monthly_summary(month_key: str, bundle: Optional[dict] = None):
    """Build monthly summary."""
    plan_fact = await compute_plan_fact(month_key, plan_fact_row=bundle)
    summa_contract = await compute_contract_amount(month_key, bundle)
    
    if bundle:
        total_fact_all_months = bundle.get("fact_total_all_months") or 0
    else:
        total_fact_all_months = 0
    
    if not total_fact_all_months and not bundle:
        total_fact_row = await dashboard_repo.get_total_fact_amount()
        total_fact_all_months = total_fact_row["sum"] if total_fact_row else 0
    
    contract_planfact_pct = float(total_fact_all_months / summa_contract) if summa_contract else None
    avg_daily_revenue = compute_avg_daily_revenue(month_key, plan_fact["fact_total"])

    return {
        "month": month_key,
        "contract": {
            "summa_contract": summa_contract,
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


async def build_monthly_by_smeta(month: str, plan_fact: Optional[dict] = None):
    """Build monthly data by smeta."""
    plan_fact = plan_fact or await compute_plan_fact(month)
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


async def _build_combined_dashboard_uncached(month_key: Optional[str]):
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
    available_months = await fetch_available_months(limit=24)

    if month_key:
        bundle = await dashboard_repo.get_month_summary_bundle(month_key)
        plan_fact = await compute_plan_fact(month_key, plan_fact_row=bundle)
        contract_amount = await compute_contract_amount(month_key, bundle)
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

        bundle_items = bundle.get("items") if bundle else None
        if bundle_items is not None:
            items = bundle_items if isinstance(bundle_items, list) else []
        else:
            items = await dashboard_repo.get_monthly_items(month_key)
        
        try:
            cards = (await build_monthly_by_smeta(month_key, plan_fact))["cards"]
        except Exception:
            cards = []

    last_updated_row = await _LAST_LOADED_CACHE.get_or_set(dashboard_repo.get_last_loaded_row)
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


async def build_combined_dashboard(month: Optional[str]):
    """Build combined dashboard with TTL caching."""
    month_key = normalize_month(month) if month else None
    cache_key = (month_key,)
    return await _COMBINED_DASHBOARD_CACHE.get_or_set(
        cache_key,
        lambda: _build_combined_dashboard_uncached(month_key)
    )


async def _build_monthly_smeta_details_uncached(month_key: str, smeta_key: str):
    """Internal uncached implementation of monthly smeta details builder."""
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    include_plan = smeta_key != "vnereglement"
    plan_smeta_id = smeta_ids[0] if include_plan else None

    combined_rows = await dashboard_repo.get_plan_fact_rows_by_smeta(month_key, plan_smeta_id, smeta_ids)

    valid_rows = [
        r for r in combined_rows
        if (r.get("plan") or 0) > 1 or (r.get("fact") or 0) > 1
    ]
    
    descriptions = [r.get("description", "") for r in valid_rows]
    desc_id_map = register_descriptions_batch(descriptions)

    rows = []
    for r in valid_rows:
        description = r.get("description", "")
        plan_value = r.get("plan") or 0
        fact_value = r.get("fact") or 0
        rows.append({
            "description": description,
            "description_id": desc_id_map.get(description, ""),
            "plan": plan_value,
            "fact": fact_value,
            "delta": fact_value - plan_value,
        })

    return {"month": month_key, "smeta_key": smeta_key, "rows": rows}


async def build_monthly_smeta_details(month: str, smeta_key: str):
    """Build monthly smeta details with TTL caching."""
    month_key = normalize_month(month)
    cache_key = (month_key, smeta_key)
    return await _SMETA_DETAILS_CACHE.get_or_set(
        cache_key,
        lambda: _build_monthly_smeta_details_uncached(month_key, smeta_key)
    )


async def build_monthly_smeta_description_daily_by_id(month: str, smeta_key: str, description_id: str):
    """Build smeta description daily data using description_id."""
    description = resolve_description_id(description_id)
    if not description:
        raise HTTPException(status_code=404, detail="description_id not found - please load smeta details first")
    return await build_monthly_smeta_description_daily(month, smeta_key, description)


async def build_monthly_smeta_description_daily(month: str, smeta_key: str, description: str):
    """Build smeta description daily data."""
    month_key = normalize_month(month)
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    rows = await dashboard_repo.get_description_daily_rows(month_key, description, smeta_ids)
    return {"month": month_key, "smeta_key": smeta_key, "description": description, "rows": rows}


async def _build_monthly_daily_revenue_uncached(month_key: str):
    """Internal uncached implementation of monthly daily revenue builder."""
    rows = await dashboard_repo.get_monthly_daily_revenue_rows(month_key)
    return {"month": month_key, "rows": rows}


async def build_monthly_daily_revenue(month: str):
    """Build monthly daily revenue with TTL caching."""
    month_key = normalize_month(month)
    cache_key = (month_key,)
    return await _DAILY_REVENUE_CACHE.get_or_set(
        cache_key,
        lambda: _build_monthly_daily_revenue_uncached(month_key)
    )


async def fetch_monthly_dates(month: str):
    """Return list of available dates (YYYY-MM-DD) for the given month."""
    month_key = normalize_month(month)
    return await dashboard_repo.get_monthly_dates(month_key)


async def build_daily(date_value: str):
    """Build daily data."""
    try:
        datetime.strptime(date_value, "%Y-%m-%d")
    except Exception:
        raise HTTPException(status_code=400, detail="invalid date format")

    rows = await dashboard_repo.get_daily_rows(date_value)
    filtered_rows = [r for r in rows if r.get("amount", 0) > 5]
    total_amount = sum(r.get("amount", 0) for r in filtered_rows)
    return {"date": date_value, "rows": filtered_rows, "total": {"amount": total_amount}}


async def build_last_loaded():
    """Build last loaded response."""
    row = await _LAST_LOADED_CACHE.get_or_set(dashboard_repo.get_last_loaded_row)
    if not row:
        return {"loaded_at": None}
    loaded = row.get("loaded_at")
    if loaded is None:
        return {"loaded_at": None}
    try:
        return {"loaded_at": loaded.isoformat()}
    except Exception:
        return {"loaded_at": str(loaded)}


async def build_fact_by_type_of_work(month: str):
    """Build aggregated fact amounts by type_of_work for modal display."""
    month_key = normalize_month(month)
    rows = await dashboard_repo.get_fact_by_type_of_work(month_key)
    total = sum(r.get("amount", 0) for r in rows)
    return {
        "month": month_key,
        "rows": rows,
        "total": total
    }


async def _build_smeta_details_with_types_uncached(month_key: str, smeta_key: str):
    """Internal uncached implementation of smeta details with types builder."""
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    raw_rows = await dashboard_repo.get_smeta_details_with_type_of_work(month_key, smeta_ids)
    
    is_vnereg = smeta_key == "vnereglement"
    descriptions = [r.get("description", "") for r in raw_rows]
    desc_id_map = register_descriptions_batch(descriptions)
    
    rows = []
    for r in raw_rows:
        plan = 0 if is_vnereg else r.get("plan", 0)
        fact = r.get("fact", 0)
        description = r.get("description", "")
        rows.append({
            "type_of_work": r.get("type_of_work"),
            "description": description,
            "description_id": desc_id_map.get(description, ""),
            "plan": plan,
            "fact": fact,
            "delta": fact - plan
        })
    
    return {
        "month": month_key,
        "smeta_key": smeta_key,
        "rows": rows
    }


async def build_smeta_details_with_types(month: str, smeta_key: str):
    """Build smeta details with type_of_work grouping with TTL caching."""
    month_key = normalize_month(month)
    cache_key = (month_key, smeta_key)
    return await _SMETA_DETAILS_TYPES_CACHE.get_or_set(
        cache_key,
        lambda: _build_smeta_details_with_types_uncached(month_key, smeta_key)
    )
