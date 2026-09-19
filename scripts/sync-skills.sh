#!/bin/bash
# sync-skills.sh — 同步本仓 skills 到全局权威目录 + 当前项目级目录
# 用法: bash sync-skills.sh [source_dir] [global_dir] [project_dir]
# 默认值:
#   source_dir = ai-coding-workflow 仓库的 skills 目录
#   global_dir = ~/.agents/skills/ (V3.0 权威真相源；~/.claude/skills 与 ~/.zcode/skills 为其链接壳)
#   ⚠️ V3.0 起不要直接往链接壳拷贝——写入会穿透到真相源且绕过归档纪律（33 对漂移的历史根因）
#   project_dir = ./.agent/skills/ (当前项目级技能目录)

SOURCE="${1:-$(cd "$(dirname "$0")/.." && pwd)/skills}"  # 默认=本仓 skills（脚本随仓走）
GLOBAL="${2:-$HOME/.agents/skills}"
PROJECT="${3:-.agent/skills}"  # 默认=当前项目级技能目录（按需传参覆盖）

echo "=== Skill Sync Script ==="
echo "Source: $SOURCE"
echo "Global: $GLOBAL"
echo "Project: $PROJECT"
echo ""

for dir in "$SOURCE"/*/; do
    skill_name=$(basename "$dir")

    # Skip shared-references (not a callable skill)
    if [ "$skill_name" = "shared-references" ]; then
        mkdir -p "$GLOBAL/shared-references" "$PROJECT/shared-references"
        cp -r "$dir"*.md "$GLOBAL/shared-references/" 2>/dev/null
        cp -r "$dir"*.md "$PROJECT/shared-references/" 2>/dev/null
        echo "Synced shared-references (reference content)"
        continue
    fi

    # === Global deployment (skill.md lowercase) ===
    mkdir -p "$GLOBAL/$skill_name"
    cp "$dir/SKILL.md" "$GLOBAL/$skill_name/skill.md"

    # === Project deployment (SKILL.md uppercase) ===
    mkdir -p "$PROJECT/$skill_name"
    cp "$dir/SKILL.md" "$PROJECT/$skill_name/SKILL.md"

    # === References / Scripts / Assets ===
    for sub in references scripts assets; do
        if [ -d "$dir/$sub" ]; then
            mkdir -p "$GLOBAL/$skill_name/$sub" "$PROJECT/$skill_name/$sub"
            cp -r "$dir/$sub/"* "$GLOBAL/$skill_name/$sub/" 2>/dev/null
            cp -r "$dir/$sub/"* "$PROJECT/$skill_name/$sub/" 2>/dev/null
        fi
    done

    echo "Synced: $skill_name"
done

echo ""
echo "=== Done. Verify with: ==="
echo "  diff <global>/skill.md <project>/SKILL.md  (should be identical)"
