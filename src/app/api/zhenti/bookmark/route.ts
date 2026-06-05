import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// 添加/更新收藏
export async function POST(request: Request) {
  try {
    const auth = requireAuth(request)
    if (!auth.success) {
      return auth.response
    }

    const { questionId, proficiency, notes } = await request.json()
    if (!questionId) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const bookmark = await prisma.zhentiBookmark.upsert({
      where: { userId_questionId: { userId: auth.userId, questionId } },
      create: {
        userId: auth.userId,
        questionId,
        proficiency: proficiency || 'weak',
        notes: notes || null,
      },
      update: {
        proficiency: proficiency || 'weak',
        notes: notes || null,
      },
    })

    return NextResponse.json({ bookmark })
  } catch (error) {
    console.error('Bookmark error:', error)
    return NextResponse.json({ error: '收藏操作失败' }, { status: 500 })
  }
}

// 取消收藏
export async function DELETE(request: Request) {
  try {
    const auth = requireAuth(request)
    if (!auth.success) {
      return auth.response
    }

    const url = new URL(request.url)
    const questionId = parseInt(url.searchParams.get('questionId') || '')
    if (isNaN(questionId)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    await prisma.zhentiBookmark.delete({
      where: { userId_questionId: { userId: auth.userId, questionId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bookmark delete error:', error)
    return NextResponse.json({ error: '取消收藏失败' }, { status: 500 })
  }
}
