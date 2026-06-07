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

## [LRN-20260607-001] correction

**Logged**: 2026-06-07T11:30:00+08:00
**Priority**: critical
**Status**: resolved
**Area**: backend

### Summary
在模块顶层对 process.env 变量做运行时检查并 throw，会导致 Next.js SSR 页面在构建时崩溃。

### Details
本次代码审查中，我将 `src/lib/auth.ts` 中的 JWT_SECRET 检查改为：
```typescript
const JWT_SECRET = process.env.JWT_SECRET || ''
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 环境变量未设置...')
}
```

这个 `throw` 放在模块顶层，而 `getAuthHeaders()` 函数与这些代码在同一个文件里。Next.js 构建时，会将这些代码打包到所有导入 `getAuthHeaders` 的页面的**服务端渲染代码**中。当 Vercel 构建环境没有设置 `JWT_SECRET` 时，模块加载瞬间就会 `throw`，导致：
- 服务端渲染直接崩溃
- 页面返回 500
- 前端显示空白

受影响页面：zhenti、practice、custom-question、history、profile 等所有调用 `getAuthHeaders` 的页面。

### Suggested Action
1. **永远不要**在模块顶层对 `process.env` 做运行时检查并 `throw`
2. 环境变量检查应该放在**函数执行时**而非模块加载时
3. 对于 JWT 等认证相关代码，使用默认值 + 函数内检查的模式：
   ```typescript
   const JWT_SECRET = process.env.JWT_SECRET || ''
   export function signToken(payload) {
     if (!JWT_SECRET) throw new Error('...')
     return jwt.sign(payload, JWT_SECRET)
   }
   ```

### Metadata
- Source: error
- Related Files: src/lib/auth.ts
- Tags: nextjs, ssr, process.env, jwt, module-top-level
- Pattern-Key: harden.env-check-placement
- Recurrence-Count: 1
- First-Seen: 2026-06-07
- Last-Seen: 2026-06-07

---

## [LRN-20260607-002] correction

**Logged**: 2026-06-07T11:30:00+08:00
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
删除未使用依赖前，必须先 grep 确认代码中无任何引用，否则会导致运行时功能故障。

### Details
代码审查时，我删除了以下依赖：
- `alibabacloud-nls`
- `ws`
- `dotenv`
- `@neondatabase/serverless`
- `pg`
- `uuid`
- `@types/uuid`
- `@types/ws`

但遗漏了 `@alicloud/pop-core`，它在 `src/app/api/voice/aliyun-token/route.ts` 中被用于调用阿里云 POP API 获取语音识别 Token。删除后，语音识别功能完全失效，用户看到"获取语音识别Token失败"的错误。

### Suggested Action
1. 删除依赖前，执行 `grep -r "package-name" src/` 确认无引用
2. 对于间接依赖（如通过 @alicloud/pop-core 调用阿里云 API），需要检查所有 API 路由文件
3. 删除后必须测试相关功能（如语音识别、文件上传等）

### Metadata
- Source: error
- Related Files: package.json, src/app/api/voice/aliyun-token/route.ts
- Tags: dependency-management, aliyun, voice-recognition, cleanup
- Pattern-Key: harden.dependency-removal-check
- Recurrence-Count: 1
- First-Seen: 2026-06-07
- Last-Seen: 2026-06-07

---

## [LRN-20260607-003] correction

**Logged**: 2026-06-07T11:30:00+08:00
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
修改错误处理时，将 `finally` 块改为只在 `catch` 中执行清理操作，会导致成功路径下的状态不重置。

### Details
代码审查时，我将 `src/app/zhenti/page.tsx` 中的：
```typescript
} catch {
  // ignore
} finally {
  setLoading(false)
}
```

改为：
```typescript
} catch (err) {
  console.error('获取真题列表失败:', err)
  setLoading(false)
}
```

这个改动导致 `setLoading(false)` 只在**失败时**执行，成功时 `loading` 状态永远为 `true`，页面一直显示"加载中..."

### Suggested Action
1. 修改错误处理时，必须确保成功和失败路径的状态一致性
2. 如果需要在两种路径都执行清理，保留 `finally` 块：
   ```typescript
   } catch (err) {
     console.error('...', err)
   } finally {
     setLoading(false)
   }
   ```
3. 或者分别在 `try` 和 `catch` 的末尾都调用清理函数

### Metadata
- Source: error
- Related Files: src/app/zhenti/page.tsx
- Tags: react, state-management, error-handling, loading-state
- Pattern-Key: harden.state-cleanup-consistency
- Recurrence-Count: 1
- First-Seen: 2026-06-07
- Last-Seen: 2026-06-07

---

## [LRN-20260607-004] insight

**Logged**: 2026-06-07T11:30:00+08:00
**Priority**: high
**Status**: resolved
**Area**: infra

### Summary
"全面代码审查"这类大规模改动必须配合完整的端到端功能测试，仅通过构建验证是不够的。

### Details
本次代码审查修改了 19 个文件，虽然：
- ✅ TypeScript 类型检查通过
- ✅ Next.js 构建成功
- ✅ 本地无编译错误

但仍然引入了 3 个严重 Bug：
1. JWT_SECRET 顶层 throw 导致页面空白
2. 误删 @alicloud/pop-core 导致语音识别失效
3. loading 状态处理错误导致真题复盘无法加载

这些问题在构建阶段完全无法发现，只有在实际运行页面时才能暴露。

### Suggested Action
1. 大规模代码审查后，必须手动测试核心功能路径：
   - 首页导航 → 各模块页面加载
   - 真题复盘 → 列表加载 → 详情页
   - 练习 → 语音输入 → 提交批改
   - 自定义题目 → 生成答案
2. 建立核心功能测试清单，每次大改动后逐项检查
3. 考虑引入 E2E 测试（如 Playwright）覆盖关键用户流程

### Metadata
- Source: insight
- Related Files: N/A
- Tags: testing, code-review, qa, e2e
- Pattern-Key: best_practice.post-review-testing
- Recurrence-Count: 1
- First-Seen: 2026-06-07
- Last-Seen: 2026-06-07

---
