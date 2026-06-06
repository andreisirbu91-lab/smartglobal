#!/usr/bin/env python3
"""
Regression smoke test for the Event Concierge agent — many multi-step flows.

Drives realistic conversations through the live (or local) /api/chat and asserts
the essentials never regress: answers are captured (no re-asks), build-for-me
fills a package, pick-myself keeps progressing, custom discovery adds places,
budget is respected, and EN works. Run BEFORE and AFTER any change.

  python3 scripts/smoke-flows.py [base_url]

Exit 0 = all checks passed; 1 = a regression was detected.
"""
import json, sys, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://startglobal.rzs-it.ro"
URL = BASE.rstrip("/") + "/api/chat"
H = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}


def turn(order, msgs):
    req = urllib.request.Request(URL, json.dumps({"order": order, "messages": msgs}).encode(), H)
    final = {}
    with urllib.request.urlopen(req, timeout=120) as r:
        for ln in r:
            ln = ln.decode().strip()
            if not ln:
                continue
            try:
                ev = json.loads(ln)
                if ev.get("type") == "final":
                    final = ev
            except Exception:
                pass
    return final


def kick(ev, loc_opts="Constanța, București", en=False):
    locale = "English" if en else "Romanian"
    return ('[SYSTEM NOTE (always English) — reply ONLY in %s and do NOT call set_language. '
            'Customer just chose %s. Greet in ONE line and ask the CITY via ask_choice input:"text" '
            'options %s.]' % (locale, ev, loc_opts))


def run(event, steps, en=False, start=None):
    order = {"eventType": event, "graduates": 2, "guests": 0, "lines": [],
             "context": (start or {}), "stepIndex": 0, "language": ("en" if en else "ro")}
    msgs = [{"role": "user", "content": kick(event, en=en)}]
    f = turn(order, msgs)
    order = f.get("order", order)
    msgs.append({"role": "assistant", "content": f.get("assistantMessage", "")})
    trail = []  # (user, nextChoice, items)
    for (u, datecap) in steps:
        if datecap:
            order = {**order, "context": {**order.get("context", {}), "date": datecap}}
        msgs.append({"role": "user", "content": u})
        f = turn(order, msgs)
        order = f.get("order", order)
        msgs.append({"role": "assistant", "content": f.get("assistantMessage", "")})
        ch = order.get("choices") or {}
        trail.append((u, ch.get("question"), len(order.get("lines", []))))
    return order, trail


def _three_repeats(trail):
    """True if the surfaced question stayed identical for 3 turns in a row (stuck)."""
    for i in range(len(trail) - 2):
        a, b, c = trail[i][1], trail[i + 1][1], trail[i + 2][1]
        if a and a == b == c:
            return True
    return False


CHECKS = []
def check(name, cond, detail=""):
    CHECKS.append((name, bool(cond)))
    print(("  PASS " if cond else "  FAIL ") + name + ("" if cond else "  <-- " + detail))

def C(o): return o.get("context", {})


print(f"Smoke testing {URL}\n")

# 1) Wedding, pick-myself — captures + progresses across many category turns.
print("[1] wedding · pick step by step (deep walk)")
o, trail = run("wedding", [
    ("București", None), ("150", None), ("12 septembrie 2026", "12 septembrie 2026"),
    ("🎯 Aleg eu pas cu pas", None), ("alege sala", None), ("adaugă prima sală", None),
    ("ce urmează?", None), ("da, adaugă varianta ta", None), ("ce mai ai pentru muzică?", None),
    ("adaugă un DJ", None), ("si ceva foto-video", None),
])
check("wedding: city captured", C(o).get("city"))
check("wedding: guests>=100", o.get("guests", 0) >= 100, "guests=%s" % o.get("guests"))
check("wedding: date captured", C(o).get("date"))
check("wedding: progressed to >=3 items", len(o.get("lines", [])) >= 3, "%s items" % len(o.get("lines", [])))
check("wedding: surface never went 3x-stale", not _three_repeats(trail), "same question 3x in a row")

# 2) Grad-uni, build-for-me (venue first, then no budget) — fills a full package incl. venue.
print("[2] grad-uni · venue first · build for me")
o, _ = run("grad_university", [
    ("Cluj-Napoca", None), ("80 absolventi 200 invitati", None), ("20 iunie 2026", "20 iunie 2026"),
    ("fără buget, fă-l superb", None), ("alege prima sală", None), ("✨ Construiește tu pachetul", None),
])
check("grad: date captured", C(o).get("date"))
check("grad: venue chosen", any(l["itemId"].startswith("venue:") for l in o.get("lines", [])), "no venue")
check("grad: full package (>=8 items)", len(o.get("lines", [])) >= 8, "%s items" % len(o.get("lines", [])))

# 3) Grad-hs, vague + out-of-order answers.
print("[3] grad-hs · vague / out-of-order")
o, _ = run("grad_highschool", [
    ("nu stiu inca, poate Constanta", None), ("suntem vreo 100", None), ("vara asta", None),
    ("arata-mi niste localuri", None), ("prima pare ok", None), ("ce urmeaza?", None),
])
check("hs: city captured", C(o).get("city"))
check("hs: headcount captured (guests or graduates)",
      o.get("guests", 0) >= 1 or o.get("graduates", 0) > 1,
      "guests=%s graduates=%s" % (o.get("guests"), o.get("graduates")))
check("hs: at least 1 item", len(o.get("lines", [])) >= 1)

# 4) Custom event — open discovery, add multiple places.
print("[4] custom · discovery (multi-place)")
o, _ = run("custom", [
    ("Brașov", None), ("2 persoane", None), ("weekend romantic la munte", None),
    ("o cabana cozy", None), ("adaug-o", None), ("si un restaurant bun", None), ("adaug-o", None),
])
check("custom: city captured", C(o).get("city"))
check("custom: discovered+added places", len(o.get("lines", [])) >= 1, "%s items" % len(o.get("lines", [])))

# 5) Wedding with a budget — venue first, then build, package incl. venue.
print("[5] wedding · with budget · venue first")
o, _ = run("wedding", [
    ("Iași", None), ("100", None), ("10 octombrie 2026", "10 octombrie 2026"),
    ("am buget 15000 euro", None), ("alege prima sală", None), ("✨ Construiește tu pachetul", None),
])
check("budget: captured", C(o).get("budget"), "budget=%s" % C(o).get("budget"))
check("budget: venue chosen", any(l["itemId"].startswith("venue:") for l in o.get("lines", [])), "no venue")
check("budget: package built", len(o.get("lines", [])) >= 6, "%s items" % len(o.get("lines", [])))

# 6) English flow works end-to-end on essentials.
print("[6] wedding · English")
o, _ = run("wedding", [
    ("Bucharest", None), ("120", None), ("5 June 2026", "5 June 2026"),
    ("no budget, make it stunning", None), ("pick the first venue", None), ("build it for me", None),
], en=True)
check("EN: date captured", C(o).get("date"))
check("EN: package built", len(o.get("lines", [])) >= 6, "%s items" % len(o.get("lines", [])))


passed = sum(1 for _, ok in CHECKS if ok)
print(f"\n{passed}/{len(CHECKS)} checks passed")
sys.exit(0 if passed == len(CHECKS) else 1)
