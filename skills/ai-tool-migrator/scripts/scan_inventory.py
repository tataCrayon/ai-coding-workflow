#!/usr/bin/env python3
"""Scan installed AI coding tools and inventory their migratable assets.

Read-only: never creates, moves, or modifies any file.

Usage:
    python scan_inventory.py              # scan all known tools
    python scan_inventory.py claude codex # scan only these tools

Output: JSON to stdout. Each tool entry:
{
  "tool": "claude",
  "installed": true,
  "skills": ["name", ...],
  "mcp": {"count": 7, "servers": ["context7", ...], "file": "..."},
  "agents": ["code-reviewer", ...],
  "memory": {"global_files": 1, "projects": {...}, "file": "..."},
  "notes": ["credential file present: auth.json (not migratable)"]
}
"""
import argparse
import json
import os
import sys

HOME = os.path.expanduser("~")

# ---------------------------------------------------------------- helpers

def list_dir(path):
    try:
        return sorted(os.listdir(path))
    except OSError:
        return []


def subdirs_with_file(base, marker):
    """Names of subdirectories of `base` containing `marker` (file or dir)."""
    out = []
    for name in list_dir(base):
        full = os.path.join(base, name)
        if os.path.isdir(full) and os.path.exists(os.path.join(full, marker)):
            out.append(name)
    return out


def parse_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


# ---------------------------------------------------------------- probes

def probe_skills_dirs(candidates):
    """Return {skill_name: source_dir} from candidate skill directories."""
    found = {}
    for base in candidates:
        if not os.path.isdir(base):
            continue
        for name in subdirs_with_file(base, "SKILL.md"):
            found.setdefault(name, base)
    return found


def probe_claude():
    t = {"tool": "claude", "installed": os.path.isdir(os.path.join(HOME, ".claude"))}
    skills = probe_skills_dirs([os.path.join(HOME, ".claude", "skills"),
                                os.path.join(HOME, ".agents", "skills")])
    t["skills"] = sorted(skills)
    # MCP: global mcpServers in ~/.claude.json
    mcp_servers = []
    mcp_file = None
    cj = parse_json(os.path.join(HOME, ".claude.json"))
    if isinstance(cj, dict):
        mcp_servers = sorted((cj.get("mcpServers") or {}).keys())
        mcp_file = os.path.join(HOME, ".claude.json")
    t["mcp"] = {"count": len(mcp_servers), "servers": mcp_servers, "file": mcp_file}
    # Agents: ~/.claude/agents/*.md
    ag_dir = os.path.join(HOME, ".claude", "agents")
    t["agents"] = [n for n in list_dir(ag_dir) if n.endswith(".md")]
    # Memory
    mem = {"global_files": 0, "projects": {}, "file": None}
    cl_md = os.path.join(HOME, ".claude", "CLAUDE.md")
    if os.path.exists(cl_md):
        mem["global_files"] = 1
        mem["file"] = cl_md
    proj_base = os.path.join(HOME, ".claude", "projects")
    for proj in list_dir(proj_base):
        pdir = os.path.join(proj_base, proj, "memory")
        if os.path.isdir(pdir):
            mem["projects"][proj] = len([n for n in list_dir(pdir) if n.endswith(".md")])
    t["memory"] = mem
    t["notes"] = (["credential file present: ~/.claude/credentials or auth (not migratable)"]
                  if os.path.exists(os.path.join(HOME, ".claude", ".credentials.json")) else [])
    return t


def probe_codex():
    base = os.path.join(HOME, ".codex")
    t = {"tool": "codex", "installed": os.path.isdir(base)}
    t["skills"] = sorted(subdirs_with_file(os.path.join(base, "skills"), "SKILL.md"))
    # MCP: [mcp_servers.*] in config.toml
    servers, mcp_file = [], None
    toml_path = os.path.join(base, "config.toml")
    if os.path.exists(toml_path):
        mcp_file = toml_path
        try:
            with open(toml_path, encoding="utf-8") as f:
                for line in f:
                    s = line.strip()
                    if s.startswith("[mcp_servers.") and s.endswith("]"):
                        servers.append(s[len("[mcp_servers."):-1])
        except OSError:
            pass
    t["mcp"] = {"count": len(servers), "servers": sorted(set(servers)), "file": mcp_file}
    t["agents"] = []  # Codex has no native agents; prompts live in sessions
    mem = {"global_files": 0, "projects": {}, "file": None}
    ag_md = os.path.join(base, "AGENTS.md")
    if os.path.exists(ag_md):
        mem["global_files"] = 1
        mem["file"] = ag_md
    mdir = os.path.join(base, "memories")
    if os.path.isdir(mdir):
        mem["projects"]["~/.codex/memories (flat)"] = \
            len([n for n in list_dir(mdir) if n.endswith(".md")])
    t["memory"] = mem
    t["notes"] = (["credential file present: ~/.codex/auth.json (not migratable)"]
                  if os.path.exists(os.path.join(base, "auth.json")) else [])
    return t


def probe_zcode():
    base = os.path.join(HOME, ".zcode")
    t = {"tool": "zcode", "installed": os.path.isdir(base)}
    t["skills"] = sorted(subdirs_with_file(os.path.join(base, "skills"), "SKILL.md"))
    # MCP: mcpServers inside ~/.zcode/v2/config.json (verify on migration)
    servers, mcp_file = [], None
    for cand in [os.path.join(base, "v2", "config.json"),
                 os.path.join(HOME, ".claude.json")]:
        d = parse_json(cand)
        if isinstance(d, dict) and d.get("mcpServers"):
            servers = sorted(d["mcpServers"].keys())
            mcp_file = cand
            break
    t["mcp"] = {"count": len(servers), "servers": servers, "file": mcp_file}
    t["agents"] = []
    mem = {"global_files": 0, "projects": {}, "file": None}
    cl_md = os.path.join(HOME, ".claude", "CLAUDE.md")  # ZCode reads workspace CLAUDE.md/AGENTS.md
    ws_md = os.path.join(HOME, ".zcode", "CLAUDE.md")
    for p in (ws_md, cl_md):
        if os.path.exists(p):
            mem["global_files"] += 1
            mem["file"] = mem["file"] or p
    mbase = os.path.join(base, "cli", "memories", "projects")
    for proj in list_dir(mbase):
        pdir = os.path.join(mbase, proj, "memory")
        if os.path.isdir(pdir):
            mem["projects"][proj] = len([n for n in list_dir(pdir) if n.endswith(".md")])
    t["memory"] = mem
    t["notes"] = []
    return t


def probe_opencode():
    candidates = [os.path.join(HOME, ".config", "opencode"),
                  os.path.join(HOME, ".local", "share", "opencode")]
    base = next((c for c in candidates if os.path.isdir(c)), None)
    t = {"tool": "opencode", "installed": base is not None}
    t["skills"] = []
    t["mcp"] = {"count": 0, "servers": [], "file": None}
    t["agents"] = []
    mem = {"global_files": 0, "projects": {}, "file": None}
    if base:
        # config: opencode.json with {"mcp": {"name": {...}}}
        for cand in [os.path.join(base, "opencode.json"),
                     os.path.join(HOME, ".config", "opencode", "opencode.json")]:
            d = parse_json(cand)
            if isinstance(d, dict) and d.get("mcp"):
                t["mcp"] = {"count": len(d["mcp"]), "servers": sorted(d["mcp"]), "file": cand}
                break
        ag_dir = os.path.join(base, "agent")
        t["agents"] = [n for n in list_dir(ag_dir) if n.endswith(".md")]
        ag_md = os.path.join(base, "AGENTS.md")
        if os.path.exists(ag_md):
            mem["global_files"] = 1
            mem["file"] = ag_md
    t["memory"] = mem
    t["notes"] = ["OpenCode may not be initialized; verify before migrating into it"]
    return t


def probe_workbuddy():
    base = os.path.join(HOME, ".workbuddy")
    t = {"tool": "workbuddy", "installed": os.path.isdir(base)}
    t["skills"] = sorted(subdirs_with_file(os.path.join(base, "skills"), "SKILL.md"))
    # MCP: ~/.workbuddy/connectors/<id>/mcp.json with {"mcpServers": {...}}
    servers, mcp_file = {}, None
    conn = os.path.join(base, "connectors")
    for cid in list_dir(conn):
        mpath = os.path.join(conn, cid, "mcp.json")
        d = parse_json(mpath)
        if isinstance(d, dict) and d.get("mcpServers"):
            for k, v in d["mcpServers"].items():
                if isinstance(v, dict) and not v.get("disabled", False):
                    servers[k] = True
            mcp_file = mpath
    t["mcp"] = {"count": len(servers), "servers": sorted(servers), "file": mcp_file}
    t["agents"] = []
    mem = {"global_files": 0, "projects": {}, "file": None}
    for name in ("IDENTITY.md", "USER.md"):
        if os.path.exists(os.path.join(base, name)):
            mem["global_files"] += 1
            mem["file"] = mem["file"] or os.path.join(base, name)
    mdir = os.path.join(base, "memory")
    if os.path.isdir(mdir):
        mem["projects"]["~/.workbuddy/memory (flat)"] = \
            len([n for n in list_dir(mdir) if n.endswith(".md")])
    t["memory"] = mem
    t["notes"] = ["WorkBuddy skills may carry tool-specific files (_user_meta.json, cases/)"]
    return t


def probe_cursor():
    base = os.path.join(HOME, ".cursor")
    appdata = os.environ.get("APPDATA") or os.path.join(HOME, "AppData", "Roaming")
    t = {"tool": "cursor", "installed": os.path.isdir(base)}
    t["skills"] = sorted(subdirs_with_file(os.path.join(base, "skills"), "SKILL.md"))
    # MCP: ~/.cursor/mcp.json {"mcpServers": {...}}
    servers, mcp_file = [], None
    mpath = os.path.join(base, "mcp.json")
    d = parse_json(mpath)
    if isinstance(d, dict) and d.get("mcpServers"):
        servers = sorted(d["mcpServers"].keys())
        mcp_file = mpath
    t["mcp"] = {"count": len(servers), "servers": servers, "file": mcp_file}
    ag_dir = os.path.join(base, "agents")
    t["agents"] = list_dir(ag_dir)
    mem = {"global_files": 0, "projects": {}, "file": None}
    for cand in [os.path.join(appdata, "Cursor", "User", "rules", "AGENTS.md"),
                 os.path.join(HOME, ".cursor", "AGENTS.md")]:
        if os.path.exists(cand):
            mem["global_files"] += 1
            mem["file"] = mem["file"] or cand
    t["memory"] = mem
    t["notes"] = ["Cursor global rules may live in app settings; mcp.json only exists after first MCP setup"]
    return t


def probe_dsh(project=None):
    """Inventory files without evaluating Cordis YAML or executable JS tags."""
    configured = os.environ.get("DSH_HOME", "").strip()
    base = os.path.abspath(os.path.expanduser(configured or os.path.join(HOME, ".dsh")))
    agents_home = os.path.abspath(os.path.expanduser(
        os.environ.get("DSH_AGENTS_HOME", "").strip() or os.path.join(HOME, ".agents")))
    candidates = []
    if project:
        project = os.path.abspath(os.path.expanduser(project))
        candidates.extend([os.path.join(project, ".dsh", "skills"),
                           os.path.join(project, ".agents", "skills")])
    candidates.extend([os.path.join(base, "skills"), os.path.join(agents_home, "skills")])
    skills = probe_skills_dirs(candidates)
    sources = {}
    for directory in candidates:
        for name in subdirs_with_file(directory, "SKILL.md"):
            path = os.path.join(directory, name)
            if path not in sources.setdefault(name, []):
                sources[name].append(path)
    overlays = []
    for path in [os.path.join(base, "cordis.patch.yml")] + [
            os.path.join(base, "profiles", name, "cordis.patch.yml")
            for name in list_dir(os.path.join(base, "profiles"))]:
        if os.path.isfile(path):
            overlays.append(path)
    instructions = []
    if project:
        for name in ("AGENTS.md", "CLAUDE.md"):
            path = os.path.join(project, name)
            if os.path.isfile(path):
                instructions.append(path)
    return {
        "tool": "dsh", "installed": os.path.isdir(base),
        "installation_detection": "configuration-directory-only; verify dsh --version separately",
        "home": base, "skills": sorted(skills), "skill_sources": sources,
        "skills_scope": "filesystem candidates; custom dirs, validity and runtime discovery unverified",
        "mcp": {"count": None, "servers": [], "file": None,
                "files": overlays, "status": "manual-review-required",
                "reason": "Cordis YAML overlays and plugin composition are not evaluated"},
        "agents": [], "agents_status": "native preset conversion requires manual review",
        "memory": {"global_files": 0, "projects": {}, "file": None,
                   "status": "no equivalent memory store inferred",
                   "project_instruction_candidates": instructions},
        "notes": ["No credentials, sessions, or config values read",
                  "Shared .agents skills may already be available; do not duplicate blindly",
                  "Instruction precedence and nested workspace roots need runtime/version review"],
    }


PROBES = {"claude": probe_claude, "codex": probe_codex, "zcode": probe_zcode,
          "opencode": probe_opencode, "workbuddy": probe_workbuddy,
          "cursor": probe_cursor, "dsh": probe_dsh}

ALIASES = {"claude-code": "claude", "cc": "claude", "claudecode": "claude",
           "cursor-agent": "cursor", "wb": "workbuddy"}


def main():
    parser = argparse.ArgumentParser(description="Inventory migratable AI-tool assets (read-only)")
    parser.add_argument("tools", nargs="*", help="tool names to probe")
    parser.add_argument("--dsh-project", default=None,
                        help="project root for dsh project-level skills and instructions")
    args = parser.parse_args()
    names = [ALIASES.get(a.lower(), a.lower()) for a in args.tools]
    unknown = [a for a in names if a not in PROBES]
    if unknown:
        print(json.dumps({"error": f"unknown tool(s): {unknown}",
                          "known": sorted(PROBES)}), file=sys.stderr)
        sys.exit(2)
    tools = names or sorted(PROBES)
    results = []
    for tool in tools:
        if tool == "dsh":
            results.append(PROBES[tool](project=args.dsh_project))
        else:
            results.append(PROBES[tool]())
    print(json.dumps({"tools": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
