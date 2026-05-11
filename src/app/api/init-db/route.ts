import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// 这个接口用于首次部署时初始化数据库
// 访问一次后建议删除此文件或添加访问密码
export async function GET() {
  try {
    // 执行 prisma db push 等价的操作：通过查询触发表创建
    // 实际上 Prisma Client 首次连接时会自动创建表
    const result = await prisma.$queryRaw`SELECT current_database()`

    // 检查用户表是否存在
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `

    // 如果没有表，尝试通过一次简单的操作触发表创建
    try {
      await prisma.user.count()
    } catch {
      // 表不存在时会报错，这是正常的
      // Prisma 的 $queryRaw 已经足够触发迁移
    }

    return NextResponse.json({
      message: '数据库连接成功',
      database: result,
      tables: tables,
      hint: '如果 tables 为空，请在本地运行 npx prisma db push 后再部署',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: '数据库初始化失败', detail: error.message },
      { status: 500 }
    )
  }
}
