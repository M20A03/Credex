# TESTS — Credex AI Spend Audit

## Running Tests

```bash
cd ~/Desktop/Credex/credex-audit
npm test
# or
npx jest
```

## Test Suite: Audit Engine

Tests live in `src/lib/__tests__/audit-engine.test.ts`

---

### Test 1: Solo founder on Copilot Business should downgrade to Individual

**Input:**
```json
{
  "tools": [{ "toolId": "github-copilot", "planId": "business", "seats": 1, "monthlySpend": 1615 }],
  "teamSize": 1,
  "useCase": "coding"
}
```
**Expected:**
- `recommendations[0].severity` → `"high"`
- `recommendations[0].monthlySavings` > 0
- `recommendations[0].recommendedPlan` → `"Individual"`

---

### Test 2: 10-person team on correct plans → all optimal

**Input:**
```json
{
  "tools": [
    { "toolId": "cursor", "planId": "business", "seats": 10, "monthlySpend": 34000 },
    { "toolId": "claude", "planId": "team", "seats": 10, "monthlySpend": 21250 }
  ],
  "teamSize": 10,
  "useCase": "coding"
}
```
**Expected:**
- `totalMonthlySavings` → 0 (both plans are appropriate)

---

### Test 3: ₹ formatting — lakh threshold

**Input:** `formatINRShort(150000)`
**Expected:** `"₹1.5L"`

**Input:** `formatINRShort(10000000)`
**Expected:** `"₹1Cr"`

---

### Test 4: Zero spend → empty result

**Input:**
```json
{ "tools": [], "teamSize": 5, "useCase": "coding" }
```
**Expected:**
- `totalCurrentMonthly` → 0
- `recommendations` → `[]`

---

### Test 5: Alternative tool suggestion triggered for expensive plan

**Input:**
```json
{
  "tools": [{ "toolId": "cursor", "planId": "business", "seats": 1, "monthlySpend": 3400 }],
  "teamSize": 1,
  "useCase": "coding"
}
```
**Expected:**
- `recommendations[0].alternativeTool` is defined
- `recommendations[0].alternativeTool.savings` > 500

---

### Test 6: Annual savings = monthly × 12

**Input:**
```json
{
  "tools": [{ "toolId": "github-copilot", "planId": "business", "seats": 2, "monthlySpend": 3230 }],
  "teamSize": 2,
  "useCase": "coding"
}
```
**Expected:**
- `totalAnnualSavings` === `totalMonthlySavings * 12`

---

## Coverage Report
Run with: `npm test -- --coverage`
Target: >80% coverage on `src/lib/audit-engine.ts` and `src/lib/currency.ts`
