---
name: ai-app-icon-prompting
description: "AI 生图做 App 图标的完整方法论：寓意→范式→构图公式→术语词表→48px 验收迭代。触发：生成 App 图标、优化 App 图标、图标太丑、有塑料感。"
when_to_use: 生成或优化 App 图标提示词；图标生成结果翻车（实体照片、彩虹多色、塑料感）；讨论图标寓意、风格、验收时。
---

# AI App Icon Prompting（AI 生成 App 图标方法论）

从归期簿图标四轮实战提炼的通用方法论。目标：让 AI 生图模型稳定产出「像图标」且「寓意准确」的 App 图标。

## 第〇步：先定寓意，再动手（最常被跳过）

图标 = 一个视觉隐喻，必须编码产品的**核心动作**，而不是品类联想。反例：时间管理 App 画「书+书签」→ 被读成阅读 App。正例：归期簿画「簿纸上被笔圈起的一个日子」——「圈日子」是标记重要日期的 universal 手势。

方法：写下产品让用户做的那个**动作**（圈日子/勾掉待办/剪掉冗余…），把它变成 glyph；禁止用「行业常见物品」代替（书=阅读、心=健康、钟=时间，全是歧义区）。

## 三种范式（按品类选，勿混）

| 走向 | 公式 | 适用 | 参考 |
|---|---|---|---|
| A 色底白 glyph | 满铺纯色/柔渐变底 + 单色几何 glyph 占 60% | 效率/工具/阅读 | Things 3、微信读书、Apple Books |
| B 白底手绘绘本 | 暖纸白底 + 墨线手绘 glyph，抖动线条+纸纹 | 可爱/高级/编辑感 | Headspace、Mailchimp |
| C 质感静物 | 实体物品摄影 | **不是图标**——易翻车；产物可改用作商店宣传图 | — |

构图铁律：glyph 占画布 55–65%，四周留白，全图 ≤3 色，一次只出一个颜色（「各出一版对比」会被模型画进同一张图变彩虹）。

## 提示词六段模板

主体概念（隐喻）→ 风格（范式锚 + 参考对象点名）→ 构图（占比/居中/安全区）→ 配色（写死色值或「一次一色」）→ 约束（负面清单）→ 规格（1024×1024、无预裁圆角、无透明）。

## 词汇速查

**照片陷阱（禁用）**：product photo、realistic、studio light、lighting、scene、environment、mockup、3D render、texture（静物语境）、standing on a table。
**图标锚（开头就写）**：`flat vector app icon, minimalist glyph design`、`solid color background`、`centered simple shape`；MJ 加 `--no photo realistic 3d`。
**塑料感对策（手绘/高级感）**：`slightly wobbly organic lines`（有机抖动线）、`varying stroke width, fine-liner pen sketch`（变化笔宽）、`ellipse slightly overshoots where it closes`（笔势过冲）、`minimal palette, two colors only`、`subtle paper grain, gentle crayon texture`、`storybook illustration, premium editorial feel (Headspace/Mailchimp style)`、`no neon saturation`。
**塑料感黑名单**：smooth vector gradient、glossy、bevel、perfectly symmetrical、default UI green。
**手绘感平衡滑杆**：太狂野加 `composed and tidy hand-drawn, professional illustrator's clean sketch`；太乖加 `looser hand gesture`。

## 验收与迭代

1. 每次 4~6 张，主体/风格词不动只微调，保持系列可比。
2. **缩到 48px 和 180px 各看一眼**——细节消失、线条糊成噪点的元素直接删（少即是多）。
3. 想保留构图只换风格：在同一对话里说「参考上一张的构图，改成…」，比重跑收敛快得多。
4. 换色用矩阵：同 glyph 逐轮换底色，摆一排选。

## 平台硬规则

- 提交**方形原图**：不预做圆角（iOS 系统自动裁 squircle）、**禁止透明像素**（会显示黑块）。
- Android 自适应图标：前景主体留在中央 66% 安全区。
- 商店底色对比：亮色模式商店背景是白的——白底方案必须配**有色的 glyph**才成立；纯白浅图形会隐形。

## 深化

- 上架后点击率优化/分类竞品对照：用 `app-icon-optimization` Skill（ASO）。
- 完整实战案例（四轮迭代留痕）：know-u-time 仓库 `know-u-time/docs/brand-naming.md`。
