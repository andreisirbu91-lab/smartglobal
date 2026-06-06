/**
 * Proves the pricing engine against hand-computed values.
 * Run: npx tsx scripts/test-engine.ts
 */
import {
  addItem,
  applyPromo,
  emptyOrder,
  quote,
  setEventType,
  setGraduates,
  setGuests,
  validate,
  setContact,
  canConfirm,
} from "../src/lib/engine";

let failures = 0;
function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}  ${ok ? "" : `→ got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
  if (!ok) failures++;
}

// Scenario: 3 graduates, 2 guests, with a bundle + group discount + promo.
let s = emptyOrder("en");
s = setEventType(s, "grad_university");
s = setGraduates(s, 3);
s = setGuests(s, 2);
s = addItem(s, "ticket_standard"); //  35 * 3 = 105
s = addItem(s, "gown_rental"); //      45 * 3 = 135
s = addItem(s, "afterparty_standard"); // 40 * 3 = 120
s = addItem(s, "catering_buffet"); //  38 * 2 = 76  (per guest)
s = addItem(s, "bundle_memories"); //  330 flat
s = applyPromo(s, "grad2026"); //      case-insensitive

const q = quote(s);

expect("subtotal", q.subtotal, 766);
expect("discount count", q.discounts.length, 2);
expect("group discount amount", q.discounts.find((d) => d.code === "GROUP")?.amount, 76.6);
expect("promo discount amount", q.discounts.find((d) => d.code === "GRAD2026")?.amount, 114.9);
expect("grand total", q.total, 574.5);
expect("bundle savings", q.lines.find((l) => l.itemId === "bundle_memories")?.savings, 50);

// per_graduate quantity reflects graduates
expect("ticket quantity = graduates", q.lines.find((l) => l.itemId === "ticket_standard")?.quantity, 3);
// per_guest quantity reflects guests
expect("buffet quantity = guests", q.lines.find((l) => l.itemId === "catering_buffet")?.quantity, 2);

// Validation: missing contact blocks confirmation.
expect("cannot confirm without contact", canConfirm(s), false);
s = setContact(s, { name: "Andrei", email: "andrei@example.com" });
expect("can confirm after contact", canConfirm(s), true);
expect("no validation issues", validate(s).length, 0);

console.log(failures === 0 ? "\nALL PASSED ✅" : `\n${failures} FAILED ❌`);
process.exit(failures === 0 ? 0 : 1);
