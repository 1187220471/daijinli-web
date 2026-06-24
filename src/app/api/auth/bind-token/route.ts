import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

function generateToken(): string {
  return crypto.randomBytes(16).toString('hex').toUpperCase()
}

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (!auth.success) {
      return auth.response
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        openid: true,
        accessLevel: true,
        accessExpire: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 清理该用户未使用的过期 token
    await prisma.bindToken.deleteMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { lt: new Date() },
      },
    })

    // 生成新 token，5 分钟有效
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.bindToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('生成绑定 token 失败:', error)
    return NextResponse.json(
      { error: '生成绑定 token 失败，请稍后重试' },
      { status: 500 }
    )
  }
}
