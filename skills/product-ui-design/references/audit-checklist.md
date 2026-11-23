# Audit Checklist（审查清单）

> 本地化自 [web-design-guidelines](https://github.com/vercel-labs/web-interface-guidelines)（Vercel Labs），冻结于 2026-08-17。
> 默认离线使用。若用户显式要最新 Vercel 规范，可 opt-in 用 WebFetch 刷新：
> `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
> 输出统一采用精简 `file:line` 格式。

## 语义与结构

- [ ] 使用语义化元素（`<header>` `<nav>` `<main>` `<section>` `<article>` `<footer>`），不用纯 `div` 堆叠
- [ ] 有且仅有一个 `main`；页面标题 `<title>` 与 `h1` 存在且与内容一致
- [ ] 标题层级 `h1→h2→h3` 不跳级
- [ ] 列表用 `<ul>`/`<ol>`/`<dl>`，不用 `div`+CSS 伪造
- [ ] 链接/按钮可区分（下划线或图标+文案），不只靠颜色

## 焦点与键盘

- [ ] 可交互元素可 Tab 到达，焦点可见（focus ring 明显）
- [ ] 焦点顺序 = 视觉顺序（DOM 顺序合理）
- [ ] 对话框/弹层打开时焦点移入、关闭后还原；支持 `Esc` 关闭
- [ ] 无焦点陷阱（Tab 不会卡在弹层/组件内出不来）
- [ ] 自定义控件（下拉、日期选择、tab）支持方向键、`Enter`、`Space`
- [ ] 有跳转链接（skip link）直达 `main`

## 颜色与对比度

- [ ] 正文/背景对比 ≥ 4.5:1（WCAG AA）；大文本/UI ≥ 3:1
- [ ] 不单靠颜色传达信息（错误/成功/状态另有图标或文字）
- [ ] 深色/浅色模式都校验对比

## 表单

- [ ] 每个输入有 `<label>`（显式关联 `for`/`id`），占位符不能替代标签
- [ ] 必填项标记可见，`aria-required` 或 `required`
- [ ] 校验错误紧邻字段显示，关联 `aria-describedby`
- [ ] 错误信息具体且可操作（"请输入 6 位验证码"而非"格式错误"）
- [ ] 提交成功/失败有明确反馈（toast/inline）
- [ ] 选中/焦点状态在自定义控件上有视觉反馈

## 状态与反馈

- [ ] loading 态有 `aria-busy`/骨架屏；错误态有重试入口
- [ ] 空态是行动引导（非空白/死路）
- [ ] toast/notification 不阻塞，且可被读屏者感知（`role="status"`/`role="alert"`）
- [ ] 异步操作完成有结果反馈

## 动效与媒体

- [ ] 尊重 `prefers-reduced-motion`（关掉装饰性动画）
- [ ] 图片有 `alt`（装饰性图片 `alt=""`），`aria-hidden`
- [ ] 视频/音频有字幕/替代文本，不自动播放或可关闭
- [ ] 动画不引发眩晕（无大面积快速闪烁）

## 响应式与触屏

- [ ] 移动端无横向滚动（主体内容 320px 可用）
- [ ] 触控目标 ≥ 44×44px
- [ ] 视口 `meta viewport` 存在且不禁止缩放
- [ ] 内容随字号放大（200%）不溢出

## 语言与国际化

- [ ] `lang` 属性设置正确
- [ ] 文案直白、主动语态、无内部术语（用户侧命名）
