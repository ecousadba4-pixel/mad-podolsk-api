"""
Common utilities, constants, and helpers for dashboard services.

Contains shared functionality used across multiple service modules.
"""

import hashlib
from calendar import monthrange
from collections import OrderedDict
from datetime import datetime
from typing import Dict, Optional, Sequence

from fastapi import HTTPException


# =============================================================================
# Constants
# =============================================================================

SMETA_LABELS = {
    "leto": "Лето",
    "zima": "Зима",
    "vnereglement": "Внерегламент",
}

# Configuration for description ID cache
_DESCRIPTION_CACHE_MAX_SIZE = 10_000


# =============================================================================
# Smeta utilities
# =============================================================================

def smeta_key_to_ids(smeta_key: str) -> Sequence[int]:
    """Convert smeta key to corresponding database IDs."""
    if smeta_key == "leto":
        return [1]
    if smeta_key == "zima":
        return [2]
    if smeta_key == "vnereglement":
        return [3, 4]
    return []


# =============================================================================
# Date/Month utilities
# =============================================================================

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


def validate_date(date_value: str) -> str:
    """Validate date format (YYYY-MM-DD) and return it."""
    try:
        datetime.strptime(date_value, "%Y-%m-%d")
        return date_value
    except Exception:
        raise HTTPException(status_code=400, detail="invalid date format")


def compute_avg_daily_revenue(month_key: str, fact_total: int) -> int:
    """Compute average daily revenue for a month."""
    ym = datetime.strptime(month_key + "-01", "%Y-%m-%d")
    days_in_month = monthrange(ym.year, ym.month)[1]
    today = datetime.utcnow().date()
    if today.year == ym.year and today.month == ym.month:
        denom = max(1, today.day - 1)
    else:
        denom = days_in_month
    return int(fact_total / denom) if denom else 0


# =============================================================================
# Description ID Cache (thread-safe for sync access)
# =============================================================================

class LRUDescriptionCache:
    """Thread-safe LRU cache for description <-> ID mapping with bounded size.
    
    Used to generate short, URL-safe IDs for work descriptions that can be
    used in API endpoints instead of full description strings.
    """
    
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


# Global description cache instance
_description_cache = LRUDescriptionCache()


def register_descriptions_batch(descriptions: Sequence[str]) -> Dict[str, str]:
    """Register multiple descriptions at once and return mapping."""
    return _description_cache.register_batch(descriptions)


def resolve_description_id(desc_id: str) -> Optional[str]:
    """Resolve a description ID back to the original description string."""
    return _description_cache.resolve(desc_id)
