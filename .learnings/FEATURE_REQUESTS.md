# Feature Requests

Capabilities requested by the user.

---

## [FEAT-20260606-001] zhenti-answer-practice

**Logged**: 2026-06-06T23:56:00+08:00
**Priority**: high
**Status**: pending
**Area**: frontend

### Requested Capability
真题详情页接入语音答题功能，让用户可以练习真题。

### User Context
目前真题详情页只能查看答案，不能进行答题练习。用户希望像自定义题目一样，能够在真题页面进行语音答题并获得AI批改。

### Complexity Estimate
medium

### Suggested Implementation
1. 复用现有的 `AnswerRecorder` 组件
2. 题目数据源改为 `ZhentiQuestion`
3. 作答记录可能需要新建 `ZhentiAnswerRecord` 表，或复用现有 `AnswerRecord` 表
4. 需要设计用户作答记录与真题题目的关联关系

### Metadata
- Frequency: first_time
- Related Features: custom-question, voice-input

---

## [FEAT-20260606-002] zhenti-question-type-auto-classify

**Logged**: 2026-06-06T23:56:00+08:00
**Priority**: medium
**Status**: pending
**Area**: backend

### Requested Capability
真题题型自动分类，目前所有题目都显示"未分类"。

### User Context
筛选功能中有题型筛选项，但所有题目的 `questionType` 都是默认值"未分类"，导致筛选功能无效。

### Complexity Estimate
medium

### Suggested Implementation
1. 基于题目内容用AI或关键词自动打标
2. 常见题型：社会现象类、组织管理类、应急应变类、人际关系类、综合分析类、漫画题等
3. 可以写脚本批量处理现有205道题

### Metadata
- Frequency: first_time
- Related Features: zhenti-filter

---

## [FEAT-20260606-003] zhenti-bookmark-proficiency-update

**Logged**: 2026-06-06T23:56:00+08:00
**Priority**: medium
**Status**: pending
**Area**: backend

### Requested Capability
完善 Bookmark API，支持更新 proficiency 和 notes。

### User Context
前端UI已做了掌握度切换（生疏/一般/熟练），但API只支持POST/DELETE，不支持更新proficiency的PUT接口。

### Complexity Estimate
simple

### Suggested Implementation
1. 在 `/api/zhenti/bookmark/route.ts` 中添加 PUT 方法
2. 支持更新 `proficiency` 和 `notes` 字段
3. 前端调用 PUT 接口切换掌握度

### Metadata
- Frequency: first_time
- Related Features: zhenti-bookmark

---
