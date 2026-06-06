# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20260606-001] best_practice

**Logged**: 2026-06-06T23:56:00+08:00
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
真题数据入库时必须统一 examCategory 和 examTitle 的格式，否则同一套题会在前端分开展示。

### Details
本次会话中发现 2025-03-09 A类 的题目在前端显示为两套（题号1,2 和 题号3,4分开）。经排查，根因是：
1. `examCategory` 字段有空格差异：`"A 类"` vs `"A类"`（影响76条记录）
2. `examTitle` 日期格式不一致：`"7月09日"` vs `"7月9日"`（影响2条记录）
3. `examTitle` 类别部分有空格：`"（A 类）"` vs `"（A类）"`

前端按 `examTitle` 分组展示，格式不一致导致同一套题被分成多组。

### Suggested Action
1. 入库脚本中统一格式：`examCategory` 使用无空格格式（A类/B类/C类）
2. `examTitle` 中的日期使用无前置0格式（7月9日而非7月09日）
3. `examTitle` 中的类别使用无空格格式（（A类）而非（A 类））
4. 入库前运行 `scripts/check-titles.ts` 检查一致性

### Metadata
- Source: user_feedback
- Related Files: scripts/check-titles.ts, scripts/fix-data-consistency.ts, scripts/fix-title-spaces.ts
- Tags: data-consistency, zhenti, examTitle, examCategory
- See Also: LRN-20260606-002

---

## [LRN-20260606-002] best_practice

**Logged**: 2026-06-06T23:56:00+08:00
**Priority**: high
**Status**: resolved
**Area**: backend

### Summary
图片题（漫画/图表）的答案生成必须基于图片内容，纯文本模型无法识别图片会导致答案质量差。

### Details
用户反馈7道图片题的答案质量不满意，因为原答案由纯文本模型（DeepSeek）生成，无法识别图片内容。例如：
- 2026-03-15 政务微改造题：图片是楼层改造对比表，但原答案未提及具体楼层调整
- 2025-03-09 漫画题《如此达标》：图片是讽刺漫画，但原答案未分析漫画细节

修复方案：用户直接在对话中发送图片，我基于图片内容重新生成3答+评分+综合答案，再更新到数据库。

### Suggested Action
1. 对于含图片的题目，必须在生成答案时传入图片内容
2. 如果API不支持图片输入，需要手动基于图片生成答案后入库
3. 建立图片题清单，确保每道图片题的答案都利用了图片信息

### Metadata
- Source: user_feedback
- Related Files: 真题图片题参考答案.md, prisma/seed-zhenti-images.ts
- Tags: image-question, zhenti, answer-quality, multimodal
- See Also: LRN-20260606-001

---

## [LRN-20260606-003] correction

**Logged**: 2026-06-06T23:56:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: backend

### Summary
temperature=0.5 时生成的答案字数明显偏少（350-650字），需要强制约束字数。

### Details
在生成图片题答案时，发现 temperature=0.5 的版本字数明显偏少：
- 第一题：650字（要求800-1200字）
- 第二题：450字
- 第三题：350字

原因：低temperature使模型倾向于"安全"输出，减少发挥。没有在prompt中明确要求字数。

### Suggested Action
在生成答案的prompt中加入强制约束："请写800-1200字，不少于5个要点"

### Metadata
- Source: error
- Related Files: 真题图片题参考答案.md
- Tags: temperature, word-count, prompt-engineering

---
