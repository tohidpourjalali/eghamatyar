"""Configurable cancellation policies and snapshot-safe refund calculation.

Defaults are provisional until the business supplies its final cancellation table.
A copy of the selected policy is embedded into each booking snapshot so future
configuration changes cannot alter refunds for existing reservations.
"""
from copy import deepcopy
from datetime import date
from typing import Any, Optional

# Percent applies to the booking subtotal excluding cleaning. If the selected
# rule makes cleaning refundable, cleaning is added to the refund; refunds are
# always capped at the amount actually collected.
CANCELLATION_POLICIES: dict[str, dict[str, Any]] = {
    "flexible": {
        "label": "انعطاف‌پذیر",
        "rules": [
            {"days_before": 1, "refund_percent": 100, "cleaning_fee_refund": True},
            {"days_before": 0, "refund_percent": 50, "cleaning_fee_refund": False},
        ],
    },
    "moderate": {
        "label": "متوسط",
        "rules": [
            {"days_before": 5, "refund_percent": 100, "cleaning_fee_refund": True},
            {"days_before": 2, "refund_percent": 50, "cleaning_fee_refund": False},
            {"days_before": 0, "refund_percent": 0, "cleaning_fee_refund": False},
        ],
    },
    "strict": {
        "label": "سخت‌گیرانه",
        "rules": [
            {"days_before": 7, "refund_percent": 100, "cleaning_fee_refund": True},
            {"days_before": 3, "refund_percent": 50, "cleaning_fee_refund": False},
            {"days_before": 0, "refund_percent": 0, "cleaning_fee_refund": False},
        ],
    },
    "non_refundable": {
        "label": "غیرقابل استرداد",
        "rules": [{"days_before": 0, "refund_percent": 0, "cleaning_fee_refund": False}],
    },
}


def get_policy_snapshot(policy: str) -> dict[str, Any]:
    """Return a detached, JSON-serializable policy definition for booking storage."""
    return deepcopy(CANCELLATION_POLICIES.get(policy, CANCELLATION_POLICIES["moderate"]))


def calculate_refund(
    policy: str,
    check_in: date,
    cancel_date: date,
    total_amount: int,
    cleaning_fee: int,
    paid_amount: Optional[int] = None,
    policy_snapshot: Optional[dict[str, Any]] = None,
) -> tuple[int, int, int]:
    """Return (refund_toman, refund_percent, days_before_check_in).

    `policy_snapshot`, when supplied, always takes precedence over the current
    config. Refund is capped to money collected; this protects partial-prepay
    bookings from receiving more than they paid.
    """
    days_before = (check_in - cancel_date).days
    selected = policy_snapshot or get_policy_snapshot(policy)
    rules = sorted(selected.get("rules", []), key=lambda rule: rule.get("days_before", 0), reverse=True)
    if not rules:
        rules = get_policy_snapshot("moderate")["rules"]
    rule = next((r for r in rules if days_before >= int(r.get("days_before", 0))), rules[-1])
    percent = max(0, min(100, int(rule.get("refund_percent", 0))))

    subtotal = max(0, int(total_amount) - int(cleaning_fee))
    refund = int(subtotal * percent / 100)
    if rule.get("cleaning_fee_refund", False):
        refund += max(0, int(cleaning_fee))
    if paid_amount is not None:
        refund = min(refund, max(0, int(paid_amount)))
    return refund, percent, days_before
