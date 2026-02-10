# TorchSpec 文档网站设计构思

<response>
<text>
## 方案 A：Terminal Noir — 终端美学文档

**Design Movement**: Brutalist Terminal Aesthetic — 受终端界面和 hacker 文化启发的文档设计

**Core Principles**:
1. 以等宽字体和终端配色为核心视觉语言
2. 信息密度优先，减少装饰性元素
3. 暗色背景搭配高对比度荧光色文字
4. 极简导航，一切操作键盘可达

**Color Philosophy**: 纯黑底色 (#0a0a0a) 搭配绿色 (#00ff41) 作为主色调，模拟经典终端。辅以琥珀色 (#ffb000) 用于警告和高亮，冷蓝色 (#00d4ff) 用于链接和交互元素。这种配色传递"这是给工程师的工具"的信号。

**Layout Paradigm**: 三栏式终端布局——左侧是类似文件树的导航，中间是主内容区（模拟终端输出），右侧是当前页面的目录锚点。整体感觉像在阅读一个精心排版的 man page。

**Signature Elements**:
- 代码块使用真实的终端样式，带有 `$` 提示符和行号
- 章节标题前带有 `>` 或 `#` 前缀，模拟命令行输入
- 搜索框设计成命令行输入的样式

**Interaction Philosophy**: 所有交互都应该感觉像在操作终端——搜索是"输入命令"，导航是"切换目录"，展开/折叠是"展开输出"。

**Animation**: 极少动画。搜索结果以打字机效果逐行出现。页面切换使用简单的淡入。代码块复制成功后显示一个短暂的 `✓ copied` 反馈。

**Typography System**: 主字体使用 JetBrains Mono 或 Fira Code（等宽），标题使用 Space Grotesk（几何无衬线）。正文 14px，行高 1.8，确保代码和文字的阅读舒适度。
</text>
<probability>0.06</probability>
</response>

<response>
<text>
## 方案 B：Engineering Blueprint — 工程蓝图风格

**Design Movement**: Swiss Design meets Technical Documentation — 瑞士设计的精确性与工程图纸的功能性结合

**Core Principles**:
1. 严格的网格系统和对齐规则
2. 信息层级通过字重和间距（而非颜色）来区分
3. 大量留白，让内容呼吸
4. 图表和代码是一等公民，不是附属品

**Color Philosophy**: 以近白色 (#fafaf9) 为底，深石墨色 (#1c1917) 为主文字色。仅使用一个强调色——深橙色 (#ea580c)——用于链接、当前导航项和重要标注。这种克制的用色让代码块和图表成为页面上最醒目的元素。

**Layout Paradigm**: 左侧固定导航栏（240px 宽），采用缩进式章节结构。主内容区最大宽度 720px，居左而非居中，留出右侧空间给目录（Table of Contents）。这种不对称布局避免了"又一个居中文档站"的感觉。

**Signature Elements**:
- 配置表格使用细线边框和交替行背景，像工程规格表
- 架构图使用 SVG 绘制，线条简洁，带有标注线
- 页面顶部有一条细细的橙色进度条，指示阅读位置

**Interaction Philosophy**: 精确且可预测。点击导航项平滑滚动到对应章节。搜索结果即时过滤，高亮匹配文字。代码块一键复制。没有多余的动效干扰阅读。

**Animation**: 导航项切换时左侧出现一个 2px 的橙色指示条，200ms ease-out。搜索面板从顶部滑入。页面内容在首次加载时有一个极轻的 fade-in（150ms）。

**Typography System**: 标题使用 DM Sans（Medium/Bold），正文使用 Source Serif 4（衬线体，增加学术感和可读性），代码使用 IBM Plex Mono。标题 28/24/20px 三级递减，正文 16px，行高 1.75。
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## 方案 C：Torch Glow — 火焰渐变科技风

**Design Movement**: Neo-Glassmorphism with Warm Gradients — 新拟态玻璃质感搭配暖色渐变

**Core Principles**:
1. 深色背景上的暖色光晕效果，呼应 "Torch"（火炬）的品牌意象
2. 玻璃质感的卡片和面板，营造层次感
3. 渐变色作为视觉引导线索
4. 代码块和技术内容使用高对比度处理

**Color Philosophy**: 深蓝黑底色 (#0f172a) 作为画布，橙红到琥珀色的渐变 (#f97316 → #f59e0b) 作为品牌色，呼应 PyTorch 的橙色和 "Torch" 的火焰意象。辅以冷蓝色 (#38bdf8) 用于链接和次要交互。玻璃面板使用 rgba(255,255,255,0.05) 的半透明白。

**Layout Paradigm**: 左侧半透明玻璃质感的侧边栏，主内容区使用卡片式布局——每个章节是一个带有微妙边框光晕的卡片。搜索栏悬浮在顶部，带有模糊背景效果。

**Signature Elements**:
- Hero 区域有一个抽象的火焰/光晕动画背景
- 代码块带有左侧的渐变色边框条
- 导航当前项有一个微妙的橙色光晕效果

**Interaction Philosophy**: 流畅且有质感。悬停时元素微微发光，点击时有轻微的按压反馈。搜索面板打开时背景模糊。整体感觉像在操作一个高端的开发者工具。

**Animation**: 侧边栏导航项悬停时有 glow 扩散效果。页面切换使用 fade + 轻微上移。代码块在进入视口时有一个从左到右的渐变边框绘制动画。搜索面板使用 spring 动画弹出。

**Typography System**: 标题使用 Space Grotesk（几何感强，现代），正文使用 Inter（可读性优先），代码使用 JetBrains Mono。标题使用渐变色处理。正文 15px，行高 1.8，字间距略宽 (0.01em)。
</text>
<probability>0.04</probability>
</response>

---

## 最终选择：方案 B — Engineering Blueprint

选择理由：
1. 文档网站的核心是**可读性和信息获取效率**，方案 B 的克制用色和严格排版最符合这个目标。
2. 不对称布局（左导航 + 左对齐内容 + 右侧目录）是经过验证的文档阅读模式，用户不需要学习新的交互方式。
3. 衬线体正文 + 等宽代码的组合在长文档阅读中有明显的舒适度优势。
4. 单一强调色（深橙色）足以建立视觉层级，同时不会分散对技术内容的注意力。
5. 这种风格不容易过时，也不会因为"太花哨"而让工程师用户反感。
