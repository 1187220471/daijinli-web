import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

/**
 * 讯飞语音识别API代理
 * 接收音频base64，调用讯飞API，返回文字
 */
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

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signatureOrigin = apiKey + timestamp
    const encoder = new TextEncoder()

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signatureOrigin))
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const signature = btoa(String.fromCharCode(...signatureArray))

    // 调用讯飞API
    const response = await fetch('https://raasr.xfyun.cn/v2/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        signa: signature,
        ts: timestamp,
        file_len: audio.length,
        file_name: 'voice.webm',
        data: audio,
        slice_id: 'aaaaaaaaaa',
      }),
    })

    const result = await response.json()

    if (result.code !== 0) {
      console.error('讯飞识别失败:', result)
      return NextResponse.json(
        { error: result.desc || result.message || '识别失败' },
        { status: 500 }
      )
    }

    // 讯飞返回的是任务ID，需要轮询获取结果
    const orderId = result.content?.orderId
    if (!orderId) {
      return NextResponse.json(
        { error: '未获取到识别任务ID' },
        { status: 500 }
      )
    }

    // 轮询获取结果（最多轮询10次，每次2秒）
    let text = ''
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const queryResponse = await fetch('https://raasr.xfyun.cn/v2/api/getResult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: appId,
          signa: signature,
          ts: timestamp,
          orderId: orderId,
          result_id: orderId,
        }),
      })

      const queryResult = await queryResponse.json()

      if (queryResult.code === 0 && queryResult.content?.orderResult) {
        try {
          const orderResult = JSON.parse(queryResult.content.orderResult)
          if (orderResult.lattice && orderResult.lattice.length > 0) {
            const lattice = orderResult.lattice[0]
            const json_1best = JSON.parse(lattice.json_1best)
            if (json_1best.st && json_1best.st.rt) {
              for (const rt of json_1best.st.rt) {
                for (const ws of rt.ws) {
                  for (const cw of ws.cw) {
                    text += cw.w
                  }
                }
              }
            }
          }

          // 如果任务完成，直接返回
          if (queryResult.content.orderStatus === 3) {
            break
          }
        } catch {
          // 解析失败，继续轮询
        }
      }
    }

    return NextResponse.json({
      text: text || '识别结果为空',
      orderId,
    })

  } catch (error) {
    console.error('Voice recognition error:', error)
    return NextResponse.json(
      { error: '语音识别服务异常' },
      { status: 500 }
    )
  }
}
