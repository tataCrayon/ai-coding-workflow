#!/bin/bash
# sync-skills.sh — 同步 ai-coding-workflow skills 到 Claude Code 全局 + flp-saas-wealth 项目级
# 用法: bash sync-skills.sh [source_dir] [global_dir] [project_dir]
# 默认值:
#   source_dir = ai-coding-workflow 仓库的 skills 目录
#   global_dir = ~/.claude/skills/ (Claude Code 全局 Skill 工具可调用)
#   project_dir = flp-saas-wealth/.agent/skills/ (项目级 Read 加载参考文档)

SOURCE="${1:-D:/Users/zigang.wang/IdeaProjects/ai-coding-workflow/skills}"
GLOBAL="${2:-$HOME/.claude/skills}"
PROJECT="${3:-D:/Users/zigang.wang/IdeaProjects/rwa-projects/flp-saas-wealth/.agent/skills}"

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

    # === References ===
    if [ -d "$dir/references" ]; then
        mkdir -p "$GLOBAL/$skill_name/references" "$PROJECT/$skill_name/references"
        cp -r "$dir/references/"* "$GLOBAL/$skill_name/references/"
        cp -r "$dir/references/"* "$PROJECT/$skill_name/references/"
    fi

    echo "Synced: $skill_name"
done

echo ""
echo "=== Done. Verify with: ==="
echo "  diff <global>/skill.md <project>/SKILL.md  (should be identical)"
