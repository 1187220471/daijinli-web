/**
 * 讯飞语音识别工具
 * 文档：https://www.xfyun.cn/doc/asr/voicedictation/API.html
 */

const XFYUN_CONFIG = {
  appId: '57c0ec9c',
  apiKey: 'b7ed51fb8d8a0bbb7277278f6e120bfb',
  apiSecret: 'NjQxZjgzNzdlNWZkNjM3NWQ3ZTA0MzI1',
  host: 'iat-api.xfyun.cn',
  uri: '/v2/iat',
}

/**
 * 生成RFC1123格式日期
 */
function getRfc1123Date(): string {
  const date = new Date()
  return date.toUTCString()
}

/**
 * 生成HMAC-SHA256签名
 */
async function hmacSha256(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  const signatureArray = Array.from(new Uint8Array(signature))
  return btoa(String.fromCharCode(...signatureArray))
}

/**
 * 生成讯飞鉴权URL
 */
export async function generateAuthUrl(): Promise<string> {
  const date = getRfc1123Date()
  const signatureOrigin = `host: ${XFYUN_CONFIG.host}\ndate: ${date}\nGET ${XFYUN_CONFIG.uri} HTTP/1.1`
  const signature = await hmacSha256(XFYUN_CONFIG.apiSecret, signatureOrigin)
  const authorizationOrigin = `api_key="${XFYUN_CONFIG.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = btoa(authorizationOrigin)

  return `wss://${XFYUN_CONFIG.host}${XFYUN_CONFIG.uri}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${XFYUN_CONFIG.host}`
}

/**
 * 使用REST API进行语音识别（短音频，<60秒）
 * 文档：https://www.xfyun.cn/doc/asr/lfasr/API.html
 */
export async function recognizeByRest(audioBase64: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()

  // 生成签名
  const signatureOrigin = XFYUN_CONFIG.apiKey + timestamp
  const signature = await hmacSha256(XFYUN_CONFIG.apiSecret, signatureOrigin)

  const response = await fetch('https://raasr.xfyun.cn/v2/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: XFYUN_CONFIG.appId,
      signa: signature,
      ts: timestamp,
      file_len: audioBase64.length,
      file_name: 'voice.webm',
      data: audioBase64,
      slice_id: 'aaaaaaaaaa',
    }),
  })

  const result = await response.json()
  if (result.code !== 0) {
    throw new Error(`讯飞识别失败: ${result.desc || result.message}`)
  }

  return result.data || ''
}

/**
 * 使用WebSocket进行实时语音识别（长音频，支持实时流式）
 */
export async function recognizeByWebSocket(
  audioData: ArrayBuffer,
  onResult?: (text: string, isFinal: boolean) => void
): Promise<string> {
  const authUrl = await generateAuthUrl()

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(authUrl)
    let finalResult = ''

    ws.onopen = () => {
      // 发送第一帧：请求参数
      const frame1 = {
        common: {
          app_id: XFYUN_CONFIG.appId,
        },
        business: {
          language: 'zh_cn',
          domain: 'iat',
          accent: 'mandarin',
          vad_eos: 3000, // 静音检测，3秒无声音认为结束
          dwa: 'wpgs', // 开启动态修正
        },
        data: {
          status: 0, // 第一帧
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: '',
        },
      }
      ws.send(JSON.stringify(frame1))

      // 发送音频数据
      const uint8Array = new Uint8Array(audioData)
      const chunkSize = 1280 // 每帧大小
      let offset = 0

      const sendChunk = () => {
        if (offset >= uint8Array.length) {
          // 发送结束帧
          const endFrame = {
            data: {
              status: 2, // 结束帧
              format: 'audio/L16;rate=16000',
              encoding: 'raw',
              audio: '',
            },
          }
          ws.send(JSON.stringify(endFrame))
          return
        }

        const chunk = uint8Array.slice(offset, offset + chunkSize)
        const chunkArray = Array.from(chunk)
        const base64 = btoa(String.fromCharCode(...chunkArray))
        const frame = {
          data: {
            status: 1, // 中间帧
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: base64,
          },
        }
        ws.send(JSON.stringify(frame))
        offset += chunkSize

        // 控制发送速度，模拟实时流
        setTimeout(sendChunk, 40)
      }

      // 等待第一帧响应后再发送音频
      setTimeout(sendChunk, 100)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.code !== 0) {
        reject(new Error(`讯飞识别错误: ${data.message}`))
        ws.close()
        return
      }

      // 解析识别结果
      if (data.data && data.data.result) {
        const wsResult = data.data.result
        let text = ''

        if (wsResult.ws) {
          for (const item of wsResult.ws) {
            for (const cw of item.cw) {
              text += cw.w
            }
          }
        }

        if (wsResult.pgs === 'apd') {
          // 动态修正，追加结果
          finalResult += text
        } else {
          // 普通结果
          finalResult = text
        }

        onResult?.(finalResult, data.data.status === 2)
      }

      // 结束
      if (data.data && data.data.status === 2) {
        ws.close()
        resolve(finalResult)
      }
    }

    ws.onerror = (error) => {
      reject(new Error('WebSocket连接错误'))
    }

    ws.onclose = () => {
      resolve(finalResult)
    }

    // 超时处理
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
      resolve(finalResult)
    }, 30000) // 30秒超时
  })
}
