#!/usr/bin/env python3
"""技能死链巡检（V2）：三层扫描 —— reparse 断链 / SKILL.md 存在性 / 内联引用目标解析。
用法：python check-links.py [--dir <skills根目录>]
默认扫 ~/.agents/skills；仓库模式传 <repo>/skills。
退出码：0=健康，1=有失效项。建议纳入 H4（Skill 增删时）或月度例行。"""
import os, re, io, sys, argparse

HOME = os.path.expanduser('~')
DEFAULT_BASE = os.path.join(HOME, '.agents', 'skills')
ZONES = [os.path.join(HOME, z) for z in ('.zcode/skills', '.claude', '.agents', '.codex')]
NON_SKILL_DIRS = {'@user_ab5ae6ee', '_shared', 'shared-references'}
SKIP_REF = {'-?[a-z0-9]'}  # 已知误报：正则示例
WHITELIST = {('missing-ref', 'release-checklist -> scripts/cmdb-mcp/node.exe')}  # 用户本机路径占位符


def scan(base=DEFAULT_BASE):
    issues = []
    skills_root = base  # 跨 Skill 引用解析根 = skills 目录本身
    # L1 断链（symlink；junction 由 dir /a 巡检，见 README）
    for zone in ZONES:
        if not os.path.isdir(zone):
            continue
        for root, dirs, files in os.walk(zone):
            dirs[:] = [x for x in dirs if x not in ('.git', 'node_modules', '__pycache__')]
            for name in files + dirs:
                p = os.path.join(root, name)
                if os.path.islink(p) and not os.path.exists(p):
                    issues.append(('broken-symlink', p))
    # L2/L3 每个 skill
    for d in sorted(os.listdir(base)):
        if d.startswith('.'):
            continue
        skill = os.path.join(base, d)
        sm = next((os.path.join(skill, c) for c in ('SKILL.md', 'skill.md')
                   if os.path.isfile(os.path.join(skill, c))), None)
        if not sm:
            if d not in NON_SKILL_DIRS:
                issues.append(('no-skillmd', d))
            continue
        s = io.open(sm, encoding='utf-8', errors='replace').read()
        refs = set()
        # markdown 链接取 URL（含 ../.. 相对路径）
        for m in re.finditer(r'\]\((?!http|#|mailto)([^)]+)\)', s):
            rel = m.group(1).split('#')[0].strip()
            if rel:
                refs.add(rel)
        # 内联路径引用；先把 [text](url) 折叠为 url 防链接文本误报；lookbehind 排除 app/、../../ 内层
        s_nolink = re.sub(r'\[([^\]]*)\]\(([^)]+)\)', r' () ', s)  # 折叠完整 [text](url)，防文本误报
        for m in re.finditer(r'(?<![\w./-])(?:references|scripts|assets)/[\w\-./]+\.\w+', s_nolink):
            refs.add(m.group(0))
        for rel in refs:
            if rel in SKIP_REF or rel.startswith('#'):
                continue
            tgt = os.path.normpath(os.path.join(skill, rel))
            if os.path.exists(tgt):
                continue
            # 跨 Skill 引用：<other-skill>/(references|scripts|assets)/... → skills_root 下解析
            m2 = re.match(r'([\w@.][\w@.-]*)/((?:references|scripts|assets)/.+)', rel)
            if m2 and os.path.isdir(os.path.join(skills_root, m2.group(1))):
                if os.path.exists(os.path.join(skills_root, m2.group(1), m2.group(2))):
                    continue
            issues.append(('missing-ref', f'{d} -> {rel}'))
    return [i for i in issues if i not in WHITELIST]


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--dir', default=DEFAULT_BASE, help='skills 根目录（仓库模式传 <repo>/skills）')
    a = ap.parse_args()
    found = scan(a.dir)
    for kind, x in found:
        print(f'[{kind}] {x}')
    print(f'--- {len(found)} issue(s)')
    sys.exit(1 if found else 0)
