import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getQuotaInfo } from '@/lib/quota'

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request)
    if (!auth.success) {
      return auth.response
    }

    const info = await getQuotaInfo(auth.userId)

    if (!info) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(info)
  } catch (error) {
    console.error('Quota error:', error)
    return NextResponse.json(
      { error: '获取额度信息失败' },
      { status: 500 }
    )
  }
}
