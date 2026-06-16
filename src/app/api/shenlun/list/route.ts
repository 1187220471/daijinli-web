import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request)
    if (!auth.success) {
      return auth.response
    }

    const url = new URL(request.url)
    const year = url.searchParams.get('year')
    const category = url.searchParams.get('category')
    const type = url.searchParams.get('type')
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')))

    const where: any = {}
    if (year) where.examYear = parseInt(year)
    if (category) where.examCategory = category
    if (type) where.questionType = type

    const [total, questions] = await Promise.all([
      prisma.shenlunQuestion.count({ where }),
      prisma.shenlunQuestion.findMany({
        where,
        select: {
          id: true,
          examTitle: true,
          examYear: true,
          examDate: true,
          examCategory: true,
          questionNumber: true,
          questionText: true,
          questionType: true,
          score: true,
          wordLimit: true,
          materialRange: true,
          _count: {
            select: { answers: true },
          },
        },
        orderBy: [{ examDate: 'desc' }, { questionNumber: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    // 获取所有年份、类别、题型（用于筛选器）
    const [years, categories, types] = await Promise.all([
      prisma.shenlunQuestion.findMany({
        select: { examYear: true },
        distinct: ['examYear'],
        orderBy: { examYear: 'desc' },
      }),
      prisma.shenlunQuestion.findMany({
        select: { examCategory: true },
        distinct: ['examCategory'],
        orderBy: { examCategory: 'asc' },
      }),
      prisma.shenlunQuestion.findMany({
        select: { questionType: true },
        distinct: ['questionType'],
        orderBy: { questionType: 'asc' },
      }),
    ])

    // 获取用户收藏状态
    const questionIds = questions.map((q) => q.id)
    const bookmarks = await prisma.shenlunBookmark.findMany({
      where: { userId: auth.userId, questionId: { in: questionIds } },
      select: { questionId: true, proficiency: true },
    })
    const bookmarkMap = new Map(bookmarks.map((b) => [b.questionId, b.proficiency]))

    const enrichedQuestions = questions.map((q) => ({
      ...q,
      answerCount: q._count.answers,
      isBookmarked: bookmarkMap.has(q.id),
      proficiency: bookmarkMap.get(q.id) || null,
    }))

    return NextResponse.json({
      questions: enrichedQuestions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      filters: {
        years: years.map((y) => y.examYear),
        categories: categories.map((c) => c.examCategory),
        types: types.map((t) => t.questionType),
      },
    })
  } catch (error) {
    console.error('Shenlun list error:', error)
    return NextResponse.json({ error: '获取申论真题列表失败' }, { status: 500 })
  }
}
