import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (!auth.success) {
      return auth.response
    }

    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: '缺少绑定 token' }, { status: 400 })
    }

    // 获取当前小程序登录用户的 openid
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, openid: true },
    })

    if (!currentUser || !currentUser.openid) {
      return NextResponse.json(
        { error: '当前账号未绑定微信 openid，请先登录小程序' },
        { status: 400 }
      )
    }

    const openid = currentUser.openid

    const bindToken = await prisma.bindToken.findUnique({
      where: { token: token.trim().toUpperCase() },
    })

    if (!bindToken) {
      return NextResponse.json({ error: '绑定 token 不存在' }, { status: 400 })
    }

    if (bindToken.used) {
      return NextResponse.json({ error: '绑定 token 已被使用' }, { status: 400 })
    }

    if (bindToken.expiresAt < new Date()) {
      return NextResponse.json({ error: '绑定 token 已过期' }, { status: 400 })
    }

    // 查找 token 对应的 Web 用户
    const targetUser = await prisma.user.findUnique({
      where: { id: bindToken.userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: '目标用户不存在' }, { status: 404 })
    }

    // 如果目标用户已经有一个不同的 openid，需要清空
    // 如果当前 openid 已经绑定到另一个用户，也需要清空那个用户
    const existingUser = await prisma.user.findFirst({
      where: { openid, NOT: { id: targetUser.id } },
    })

    await prisma.$transaction(async (tx) => {
      // 如果当前 openid 已绑定到其他用户，清空那个用户的 openid
      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: { openid: null },
        })
      }

      // 将 openid 绑定到目标用户
      await tx.user.update({
        where: { id: targetUser.id },
        data: { openid },
      })

      // 标记 token 已使用
      await tx.bindToken.update({
        where: { id: bindToken.id },
        data: { used: true },
      })
    })

    return NextResponse.json({
      message: '微信绑定成功，请重新登录小程序以同步权限',
      userId: targetUser.id,
    })
  } catch (error) {
    console.error('绑定微信失败:', error)
    return NextResponse.json(
      { error: '绑定微信失败，请稍后重试' },
      { status: 500 }
    )
  }
}
