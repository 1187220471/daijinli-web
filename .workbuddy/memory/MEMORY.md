# MEMORY.md - 项目长期记忆索引

_按主题组织的项目关键信息，替代过期的每日日志。_

---

## 项目速览

- **路径**：`/Users/yier/Documents/daijinli网页版/daijinli-web/`
- **仓库**：`1187220471/daijinli-web` | **域名**：`mianshidati.xyz`
- **技术栈**：Next.js 14 + React 18 + TypeScript + Tailwind + Prisma + Neon PostgreSQL + DeepSeek API + 阿里云语音识别
- **部署**：Vercel 自动部署（GitHub push 触发）

## 当前迭代上下文

**目标**：小程序迁移（Taro + 微信登录）
**状态**：Phase 1 骨架完成，首页UI完成，开发者工具导入成功
**待办**：
1. 配置 Vercel 环境变量（WECHAT_APPID/SECRET）
2. 配置微信小程序服务器域名
3. 测试微信登录
4. 开发面试训练子页面（AI练习/真题/套题/自定义/记录）

## 踩坑记录（跨会话）

| 问题 | 根因 | 解决方案 |
|------|------|---------|
| 开发前未列步骤 | 用户明确要求先规划再执行 | 已写入 SOUL.md：Plan before coding |
| 小程序 TabBar 图标缺失 | app.config.ts 配置了 iconPath 但无图片文件 | 移除 iconPath，只用文字标签 |
| 根目录废弃文件 | 早期测试残留的 package.json + node_modules | 已清理 |

## 关键决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 小程序框架 | Taro（React） | 与现有 Web React 技术栈匹配 |
| 用户体系 | 微信 openid → 自动创建用户 | 简化注册流程 |
| 语音方案 | 阿里云小程序 SDK 实时流式 | 与 Web 端体验一致 |
| 面试子页面设计 | 饱和渐变色卡片 | 教育产品需要能量感 |

## 环境变量清单

```
DATABASE_URL
JWT_SECRET
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
ALIYUN_ACCESS_KEY_ID
ALIYUN_ACCESS_KEY_SECRET
ALIYUN_APP_KEY
WECHAT_APPID      ← 新增（小程序）
WECHAT_SECRET     ← 新增（小程序）
```

## 项目结构

```
daijinli-web/          ← Web 端（Next.js）
daijinli-miniapp/      ← 小程序（Taro）
```

两个项目完全独立，无代码交叉。

## 代码审查清单

1. Prisma Client 单例检查 — 统一使用 `src/lib/db.ts`
2. API路由 `force-dynamic` 检查 — 涉及时日计算的必须添加
3. JSON.parse 保护 — 所有解析添加 try-catch
4. JWT Secret 检查 — **不能放在模块顶层 throw，会导致 SSR 页面崩溃**
5. 前端错误处理 — 避免 `catch { /* ignore */ }`
6. 依赖清理 — **删除前先 grep 确认代码中无引用**
7. 构建后手动测试核心功能

## 更新日志

- v1.3：评分体系重构（6维度能力导向）、首页重构、小程序迁移启动
- 详见：`戴锦鲤-更新日志v1.3.md`
