#!/usr/bin/env python3
"""Scan a portable workflow seed repo and a target environment; emit a migration
inventory + conflict matrix.

Read-only: never creates, moves, or modifies any file.

Usage:
    python scan_migration.py --repo <workflow-repo>                # probe all tools
    python scan_migration.py --repo <workflow-repo> --tools zcode claude
    python scan_migration.py --repo <workflow-repo> --mode authority   # vs ~/.agents

Output: JSON to stdout.
{
  "repo": {"path": ..., "version": "V3.0", "skills": [{name, skill_md,
            frontmatter_ok, has_references, has_scripts}], "rules": [...],
           "entry_files": [...]},
  "authority": {"exists": true, "skills": [...]},      # when --mode authority
  "tools": [ {tool, installed, skills: [...]}, ... ],
  "conflicts": [ {skill, target, status: new|identical|differs,
                  diff_lines} ]
}
"""
import argparse
import difflib
import io
import json
import os
import re
import sys

HOME = os.path.expanduser("~")


def list_dir(path):
    try:
        return sorted(os.listdir(path))
    except OSError:
        return []


def read_text(path):
    try:
        return io.open(path, encoding="utf-8", errors="replace").read()
    except OSError:
        return ""


def frontmatter_ok(skill_md_path):
    """A SKILL.md is loadable only if it has YAML frontmatter with name+description."""
    text = read_text(skill_md_path)
    if not text.startswith("---"):
        return False
    m = re.match(r"^---\r?\n(.*?)\r?\n---", text, re.S)
    if not m:
        return False
    fm = m.group(1)
    return bool(re.search(r"^\s*name\s*:", fm, re.M)) and \
        bool(re.search(r"^\s*description\s*:", fm, re.M))


def skill_dirs(base):
    """Subdirectories containing a SKILL.md or skill.md (case variants)."""
    out = {}
    for name in list_dir(base):
        d = os.path.join(base, name)
        if not os.path.isdir(d):
            continue
        for marker in ("SKILL.md", "skill.md"):
            if os.path.isfile(os.path.join(d, marker)):
                out[name] = os.path.join(d, marker)
                break
    return out


def normalize(text):
    return text.replace("\r\n", "\n").strip()


def compare_skill(seed_dir, target_dir):
    """Return (status, diff_lines). identical = every seed file matches target
    byte-for-byte after line-ending normalization."""
    if not os.path.isdir(target_dir):
        return "new", None
    total = 0
    seed_files = {}
    for root, dirs, files in os.walk(seed_dir):
        dirs[:] = [x for x in dirs if x != "__pycache__"]
        for f in files:
            if f.endswith(".pyc"):
                continue
            p = os.path.join(root, f)
            seed_files[os.path.relpath(p, seed_dir).replace("\\", "/")] = p
    for rel, sp in sorted(seed_files.items()):
        tp = os.path.join(target_dir, rel)
        if not os.path.exists(tp):
            total += 9999  # missing file in target counts as a big diff
            continue
        a = normalize(read_text(sp)).splitlines()
        b = normalize(read_text(tp)).splitlines()
        n = sum(1 for l in difflib.unified_diff(a, b, lineterm="")
                if l.startswith(("+", "-")) and not l.startswith(("+++", "---")))
        total += n
    return ("identical", 0) if total == 0 else ("differs", total)


# ------------------------------------------------------------- repo probe

def probe_repo(path):
    path = os.path.abspath(os.path.expanduser(path))
    r = {"path": path}
    ver_file = os.path.join(path, "ARCHITECTURE_VERSION")
    r["version"] = read_text(ver_file).strip() or None
    skills_root = os.path.join(path, "skills")
    skills = []
    for name, md in sorted(skill_dirs(skills_root).items()):
        skills.append({
            "name": name,
            "skill_md": md,
            "frontmatter_ok": frontmatter_ok(md),
            "has_references": os.path.isdir(os.path.join(skills_root, name, "references")),
            "has_scripts": os.path.isdir(os.path.join(skills_root, name, "scripts")),
        })
    r["skills"] = skills
    r["rules"] = [f for f in list_dir(os.path.join(path, "rules")) if f.endswith(".md")]
    r["entry_files"] = [f for f in ("AGENTS.md", "BOOTSTRAP.md", "docs")
                        if os.path.exists(os.path.join(path, f))]
    r["scripts"] = [f for f in list_dir(os.path.join(path, "scripts")) if f.endswith(".py")]
    missing = [k for k in ("skills", "rules") if not os.path.isdir(os.path.join(path, k))]
    if missing:
        r["warning"] = f"seed repo missing dirs: {missing}"
    return r


# ------------------------------------------------------------- env probes

TOOL_SKILL_DIRS = {
    "claude": [os.path.join(HOME, ".claude", "skills")],
    "zcode": [os.path.join(HOME, ".zcode", "skills")],
    "codex": [os.path.join(HOME, ".codex", "skills")],
    "cursor": [os.path.join(HOME, ".cursor", "skills")],
    "opencode": [os.path.join(HOME, ".config", "opencode", "skill"),
                 os.path.join(HOME, ".config", "opencode", "skills")],
    "workbuddy": [os.path.join(HOME, ".workbuddy", "skills")],
}
TOOL_INSTALLED = {
    "claude": os.path.join(HOME, ".claude"),
    "zcode": os.path.join(HOME, ".zcode"),
    "codex": os.path.join(HOME, ".codex"),
    "cursor": os.path.join(HOME, ".cursor"),
    "opencode": os.path.join(HOME, ".config", "opencode"),
    "workbuddy": os.path.join(HOME, ".workbuddy"),
}
ALIASES = {"claude-code": "claude", "cc": "claude", "claudecode": "claude",
           "wb": "workbuddy", "oc": "opencode", "qoder": "claude"}


def probe_tool(name):
    found = {}
    for base in TOOL_SKILL_DIRS[name]:
        for skill, _md in skill_dirs(base).items():
            found.setdefault(skill, base)
    return {"tool": name, "installed": os.path.isdir(TOOL_INSTALLED[name]),
            "skills": sorted(found), "skill_sources": found}


def probe_authority():
    base = os.path.join(HOME, ".agents", "skills")
    return {"exists": os.path.isdir(base), "path": base,
            "skills": sorted(skill_dirs(base))}


# ------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Inventory workflow-seed → environment migration (read-only)")
    ap.add_argument("--repo", required=True, help="path to the workflow seed repository")
    ap.add_argument("--tools", nargs="*", default=None,
                    help="target tools to probe (claude zcode codex cursor opencode workbuddy)")
    ap.add_argument("--mode", choices=["copy", "authority"], default="copy",
                    help="authority: conflict-check against ~/.agents/skills truth source")
    ap.add_argument("--target", default=None,
                    help="explicit target skills dir to compare against (overrides --mode)")
    args = ap.parse_args()

    if not os.path.isdir(args.repo):
        print(json.dumps({"error": f"repo path not found: {args.repo}"}), file=sys.stderr)
        sys.exit(2)

    out = {"repo": probe_repo(args.repo)}

    # target skill dir for conflict matrix
    target_dir = None
    target_label = None
    if args.target:
        target_dir = os.path.abspath(os.path.expanduser(args.target))
        target_label = "custom:" + target_dir
    elif args.mode == "authority":
        out["authority"] = probe_authority()
        target_dir = out["authority"]["path"] if out["authority"]["exists"] else None
        target_label = "authority:~/.agents/skills"
    else:
        names = [ALIASES.get(t.lower(), t.lower()) for t in (args.tools or [])]
        unknown = [t for t in names if t not in TOOL_INSTALLED]
        if unknown:
            print(json.dumps({"error": f"unknown tool(s): {unknown}",
                              "known": sorted(TOOL_INSTALLED)}), file=sys.stderr)
            sys.exit(2)
        out["tools"] = [probe_tool(t) for t in (names or sorted(TOOL_INSTALLED))]
        # pick first installed tool that holds skills as conflict base
        for entry in out["tools"]:
            if entry["installed"] and entry.get("skill_sources"):
                target_dir = next(iter(entry["skill_sources"].values()))
                target_label = entry["tool"]
                break

    if target_dir:
        conflicts = []
        for s in out["repo"]["skills"]:
            if s["name"] == "shared-references":
                continue
            status, diff = compare_skill(os.path.join(args.repo, "skills", s["name"]),
                                         os.path.join(target_dir, s["name"]))
            conflicts.append({"skill": s["name"], "target": target_label,
                              "status": status, "diff_lines": diff})
        out["conflicts"] = conflicts
        out["conflict_base"] = target_dir
    else:
        out["conflict_base"] = None
        out["note"] = "no target skill directory found; everything is a fresh install"

    bad_fm = [s["name"] for s in out["repo"]["skills"] if not s["frontmatter_ok"]]
    if bad_fm:
        out["repo"]["frontmatter_problems"] = bad_fm

    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
