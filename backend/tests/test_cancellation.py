import unittest
from datetime import date, timedelta

from app.core.cancellation import (
    CANCELLATION_POLICIES,
    calculate_refund,
    get_policy_snapshot,
)


class CancellationPolicyTests(unittest.TestCase):
    def test_policy_snapshot_is_detached_from_live_configuration(self):
        snapshot = get_policy_snapshot("moderate")
        CANCELLATION_POLICIES["moderate"]["rules"][0]["refund_percent"] = 1
        try:
            amount, percent, _ = calculate_refund(
                "moderate", date(2027, 1, 10), date(2027, 1, 1),
                total_amount=1_000_000, cleaning_fee=100_000,
                paid_amount=300_000, policy_snapshot=snapshot,
            )
            self.assertEqual(percent, 100)
            self.assertEqual(amount, 300_000)  # never refund above cash collected
        finally:
            CANCELLATION_POLICIES["moderate"]["rules"][0]["refund_percent"] = 100

    def test_moderate_policy_tiers(self):
        check_in = date(2027, 1, 10)
        cases = [(5, 100), (2, 50), (1, 0)]
        for days_before, expected_percent in cases:
            with self.subTest(days_before=days_before):
                _, percent, days = calculate_refund(
                    "moderate", check_in, check_in - timedelta(days=days_before),
                    total_amount=1_000_000, cleaning_fee=100_000, paid_amount=1_000_000,
                )
                self.assertEqual(percent, expected_percent)
                self.assertEqual(days, days_before)

    def test_refund_includes_cleaning_only_when_rule_says_so(self):
        check_in = date(2027, 1, 10)
        fully_refunded, _, _ = calculate_refund(
            "moderate", check_in, check_in - timedelta(days=5),
            total_amount=1_000_000, cleaning_fee=100_000, paid_amount=1_000_000,
        )
        partial, _, _ = calculate_refund(
            "moderate", check_in, check_in - timedelta(days=2),
            total_amount=1_000_000, cleaning_fee=100_000, paid_amount=1_000_000,
        )
        self.assertEqual(fully_refunded, 1_000_000)
        self.assertEqual(partial, 450_000)


if __name__ == "__main__":
    unittest.main()
