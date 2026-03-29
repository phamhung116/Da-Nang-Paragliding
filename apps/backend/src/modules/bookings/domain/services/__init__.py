from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from modules.bookings.domain.value_objects import ONLINE_PAYMENT_METHODS
from shared.utils import quantize_money


@dataclass(slots=True)
class PricingResult:
    original_total: Decimal
    final_total: Decimal


class PricingPolicy:
    def __init__(self, discount_percent: int) -> None:
        self.discount_percent = discount_percent

    def calculate(self, *, unit_price: Decimal, adults: int, children: int, payment_method: str) -> PricingResult:
        quantity = adults + children
        original_total = quantize_money(unit_price * quantity)
        final_total = original_total
        if payment_method in ONLINE_PAYMENT_METHODS:
            discount_factor = Decimal(100 - self.discount_percent) / Decimal(100)
            final_total = quantize_money(original_total * discount_factor)
        return PricingResult(original_total=original_total, final_total=final_total)
