#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""共享文档新鲜度检查。

规则见 docs/architecture/decisions/ADR-0003-doc-freshness.md：
  runbooks/     30 天
  domains/      90 天
  architecture/ 不设阈值
  repos/        不设阈值（路径有效性另查）

用法：
  python scripts/check-freshness.py            # 打印过期清单，有过期返回 1
  python scripts/check-freshness.py --all      # 打印全部文档的 verified 状态
"""
import argparse
import datetime
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")

THRESHOLDS = {"runbooks": 30, "domains": 90, "architecture": None, "repos": None}
VERIFIED_RE = re.compile(r"verified:\s*(\d{4}-\d{2}-\d{2})")
WINDING_ONLY_RE = re.compile(r"\(wording only\)")


def doc_verified(path):
    """返回 (date, is_wording_only)。取不到日期返回 (None, False)。"""
    try:
        with open(path, encoding="utf-8") as f:
            head = f.read(800)
    except (OSError, UnicodeDecodeError):
        return None, False
    m = VERIFIED_RE.search(head)
    if not m:
        return None, False
    try:
        d = datetime.date.fromisoformat(m.group(1))
    except ValueError:
        return None, False
    return d, bool(WINDING_ONLY_RE.search(head[:m.end() + 40]))


def classify(rel):
    parts = rel.replace("\\", "/").split("/")
    return parts[0] if parts and parts[0] in THRESHOLDS else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="打印全部，而不是只打过期的")
    args = ap.parse_args()

    today = datetime.date.today()
    stale, ok, missing, skipped = [], [], [], []

    for dirpath, _, files in os.walk(DOCS):
        for name in files:
            if not name.lower().endswith((".md", ".sql")):
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, ROOT)
            sub = os.path.relpath(path, DOCS).replace("\\", "/")
            group = classify(sub)
            threshold = THRESHOLDS.get(group) if group else None
            if group and threshold is None:
                skipped.append(rel)
                continue
            if threshold is None:
                continue
            date, wording_only = doc_verified(path)
            if date is None:
                missing.append(rel)
                continue
            age = (today - date).days
            item = (rel, date.isoformat(), age, threshold, wording_only)
            # 只改措辞的变更按半阈值放宽
            effective = threshold * 2 if wording_only else threshold
            (stale if age > effective else ok).append(item)

    if args.all:
        for rel, date, age, th, wo in sorted(ok):
            print("OK    %-56s verified=%s age=%sd/%sd%s"
                  % (rel, date, age, th, " (wording only)" if wo else ""))
    for rel, date, age, th, wo in sorted(stale):
        print("STALE %-56s verified=%s age=%sd > %sd%s"
              % (rel, date, age, th, " (wording only)" if wo else ""))
    for rel in sorted(missing):
        print("NOVER %-56s 缺少 verified: 锚点" % rel)

    print()
    print("合计: ok=%d stale=%d missing=%d 不设阈值=%d"
          % (len(ok), len(stale), len(missing), len(skipped)))
    return 1 if (stale or missing) else 0


if __name__ == "__main__":
    sys.exit(main())
