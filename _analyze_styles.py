# -*- coding: utf-8 -*-
from pathlib import Path
import re
from collections import Counter

base = Path(r"c:\Users\elizu\Documents\Claude\Projects\מצגות הלכה")
files = [
    p for p in base.rglob("*.html")
    if "BACKUP" not in p.name and "PRE-DIVIDERS" not in p.name
]

all_styles = Counter()
print("FILE COUNTS:")
for p in sorted(files):
    text = p.read_text(encoding="utf-8")
    styles = re.findall(r'style="([^"]*)"', text)
    print(f"  {p.relative_to(base)}: {len(styles)}")
    for s in styles:
        ns = re.sub(r"\s+", " ", s.strip())
        all_styles[ns] += 1

print("\nTOP 100 UNIQUE STYLES:")
for s, c in all_styles.most_common(100):
    print(f"  [{c:4d}] {s[:180]}")

print(f"\nTOTAL attrs: {sum(all_styles.values())}")
print(f"UNIQUE styles: {len(all_styles)}")

# Property frequency
props = Counter()
for s, c in all_styles.items():
    for part in s.split(";"):
        part = part.strip()
        if not part:
            continue
        prop = part.split(":", 1)[0].strip().lower()
        props[prop] += c
print("\nPROPERTY FREQUENCY:")
for p, c in props.most_common(40):
    print(f"  [{c:4d}] {p}")
