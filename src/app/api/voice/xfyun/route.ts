import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

/**
 * 讯飞语音识别API代理
 * 使用录音文件转写API（支持webm格式）
 * 文档：https://www.xfyun.cn/doc/asr/lfasr/API.html
 */

// MD5哈希函数
async function md5(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: Request) {
  try {
    // 认证
    const auth = requireAuth(request)
    if (!auth.success) {
      return auth.response
    }

    const { audio } = await request.json()

    if (!audio) {
      return NextResponse.json(
        { error: '音频数据不能为空' },
        { status: 400 }
      )
    }

    // 讯飞配置
    const appId = '57c0ec9c'
    const apiKey = 'b7ed51fb8d8a0bbb7277278f6e120bfb'
    const apiSecret = 'NjQxZjgzNzdlNWZkNjM3NWQ3ZTA0MzI1'

    // 生成签名（录音文件转写API使用MD5签名）
    // signa = md5(apiKey + ts)
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signa = await md5(apiKey + timestamp)

    console.log('讯飞请求参数:', {
      app_id: appId,
      ts: timestamp,
      signa: signa.substring(0, 10) + '...',
      file_len: audio.length,
    })

    // 1. 上传文件获取task_id
    const uploadResponse = await fetch('https://raasr.xfyun.cn/v2/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        signa: signa,
        ts: timestamp,
        file_len: audio.length,
        file_name: 'voice.webm',
        data: audio,
        slice_id: 'aaaaaaaaaa',
      }),
    })

    const uploadResult = await uploadResponse.json()
    console.log('讯飞上传结果:', uploadResult)

    if (uploadResult.code !== 0) {
      return NextResponse.json(
        { error: uploadResult.desc || uploadResult.message || `上传音频失败(code:${uploadResult.code})` },
        { status: 500 }
      )
    }

    const orderId = uploadResult.content?.orderId
    if (!orderId) {
      return NextResponse.json(
        { error: '未获取到识别任务ID' },
        { status: 500 }
      )
    }

    // 2. 轮询获取结果
    let text = ''
    let attempts = 0
    const maxAttempts = 15 // 最多轮询15次，每次2秒，共30秒

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++

      // 查询结果需要新的签名
      const queryTimestamp = Math.floor(Date.now() / 1000).toString()
      const querySigna = await md5(apiKey + queryTimestamp)

      const queryResponse = await fetch('https://raasr.xfyun.cn/v2/api/getResult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          signa: querySigna,
          ts: queryTimestamp,
          orderId: orderId,
        }),
      })

      const queryResult = await queryResponse.json()
      console.log(`讯飞查询结果(${attempts}):`, queryResult)

      if (queryResult.code !== 0) {
        continue // 继续轮询
      }

      // 解析结果
      if (queryResult.content?.orderResult) {
        try {
          const orderResult = JSON.parse(queryResult.content.orderResult)
          if (orderResult.lattice && orderResult.lattice.length > 0) {
            text = ''
            for (const lattice of orderResult.lattice) {
              if (lattice.json_1best) {
                const best = JSON.parse(lattice.json_1best)
                if (best.st?.rt) {
                  for (const rt of best.st.rt) {
                    if (rt.ws) {
                      for (const ws of rt.ws) {
                        if (ws.cw) {
                          for (const cw of ws.cw) {
                            text += cw.w || ''
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('解析结果失败:', e)
        }
      }

      // 检查任务状态
      if (queryResult.content?.orderStatus === 3) {
        // 任务完成
        break
      }
    }

    return NextResponse.json({
      text: text || '识别结果为空',
    })

  } catch (error) {
    console.error('Voice recognition error:', error)
    return NextResponse.json(
      { error: '语音识别服务异常' },
      { status: 500 }
    )
  }
}
