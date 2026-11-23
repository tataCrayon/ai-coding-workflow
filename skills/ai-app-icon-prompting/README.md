# ai-app-icon-prompting

用 AI 生图模型（即梦/豆包/Midjourney/DALL·E 等）稳定生成「像图标」且「寓意准确」的 App 图标提示词方法论。来自 App「归期簿」图标四轮实战的全部教训。

## 它解决什么问题

AI 生图做图标最容易翻车的三种情况，本 Skill 都给了对应解法：

| 翻车现象 | 根因 | Skill 里的解法 |
|---|---|---|
| 生成的是「桌上的实体产品照片」 | 提示词混入 studio light / realistic 等摄影词 | 照片陷阱黑名单 + 图标锚白名单 |
| 图标寓意错（时间管理 App 被画成阅读 App） | 用了行业联想物（书/心/钟）而非产品核心动作 | 第〇步「寓意先行」：glyph 编码用户动作 |
| 效果塑料感、廉价 | 完美曲线 + 默认渐变 + 高光 | 手绘绘本范式 + 抖动线/变化笔宽/纸纹词汇表 |

另有：三范式选择（色底白 glyph / 白底手绘绘本 / 质感静物）、六段提示词模板、构图铁律、48px 缩尺验收法、平台硬规则（无预裁圆角/禁透明/Android 安全区）。

## 安装

**方式一：复制目录**（Claude Code / ZCode / 其他支持 SKILL.md 约定的 Agent）

```bash
# ZCode / 通用（agents 约定）
git clone https://github.com/tataCrayon/ai-app-icon-prompting.git ~/.agents/skills/ai-app-icon-prompting

# Claude Code
git clone https://github.com/tataCrayon/ai-app-icon-prompting.git ~/.claude/skills/ai-app-icon-prompting
```

**方式二：skills CLI**

```bash
npx skills add tataCrayon/ai-app-icon-prompting
```

## 使用

装好后对 Agent 正常说话即可触发，例如：

- 「帮我给 XX App 生成图标提示词」
- 「生成的图标太塑料了，怎么改」

也可直接读 `SKILL.md` 当提示词工程手册用。

## 配套

- 上架后图标的点击率（TTR）优化，搭配 [eronred/aso-skills@app-icon-optimization](https://skills.sh/eronred/aso-skills/app-icon-optimization) 使用。
- 完整实战案例：App「归期簿」（四轮迭代留痕：寓意修正 → 彩虹多色翻车 → 实体照片翻车 → 手绘绘本风定稿）。

## License

MIT
