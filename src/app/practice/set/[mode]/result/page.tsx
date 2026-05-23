'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface QuestionItem {
  index: number
  type: string
  typeName: string
  question: string
  topic: string
}

interface SetData {
  mode: string
  name: string
  time: string
  questions: QuestionItem[]
}

export default function SetResultPage() {
  const router = useRouter()
  const params = useParams()
  const mode = params.mode as string

  const [setData, setSetData] = useState<SetData | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [refAnswers, setRefAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 读取套题数据
    const stored = localStorage.getItem('setTrainingData')
    const storedUserAnswers = localStorage.getItem(`setUserAnswers_${mode}`)
    const storedRefAnswers = localStorage.getItem(`setRefAnswers_${mode}`)

    if (stored && storedUserAnswers && storedRefAnswers) {
      try {
        const data = JSON.parse(stored)
        if (data.mode === mode) {
          setSetData(data)
          setUserAnswers(JSON.parse(storedUserAnswers))
          setRefAnswers(JSON.parse(storedRefAnswers))
        } else {
          setError('套题模式不匹配')
        }
      } catch {
        setError('数据解析失败')
      }
    } else {
      setError('未找到作答数据')
    }
    setLoading(false)
  }, [mode, router])

  const handleDownload = async () => {
    if (!setData) return

    const date = new Date().toLocaleDateString('zh-CN')
    const children: Paragraph[] = []

    // 标题
    children.push(
      new Paragraph({
        text: setData.name,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    )
    children.push(
      new Paragraph({
        text: `生成日期：${date} · 建议作答时间：${setData.time}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    )

    // 每道题
    setData.questions.forEach((q) => {
      // 题号和题型
      children.push(
        new Paragraph({
          text: `第${q.index}题 【${q.typeName}】`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      )

      // 题目内容（按行分割）
      const questionLines = q.question.split('\n').filter(line => line.trim())
      questionLines.forEach(line => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
            spacing: { after: 120 },
            indent: { firstLine: 480 },
          })
        )
      })

      // 用户答案
      if (userAnswers[q.index]) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '【你的答案】',
                bold: true,
                color: '2563EB',
              }),
            ],
            spacing: { before: 300, after: 200 },
          })
        )
        const userLines = userAnswers[q.index].split('\n').filter(line => line.trim())
        userLines.forEach(line => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 24 })],
              spacing: { after: 120 },
              indent: { firstLine: 480 },
            })
          )
        })
      }

      // 参考答案
      if (refAnswers[q.index]) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '【参考答案】',
                bold: true,
                color: '2D7D46',
              }),
            ],
            spacing: { before: 300, after: 200 },
          })
        )
        const refLines = refAnswers[q.index].split('\n').filter(line => line.trim())
        refLines.forEach(line => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, size: 24 })],
              spacing: { after: 120 },
              indent: { firstLine: 480 },
            })
          )
        })
      }

      // 分隔
      children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
    })

    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      }],
    })

    // 生成并下载
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${setData.name}_${date}.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleNewSet = () => {
    // 清除localStorage中的套题数据
    localStorage.removeItem(`setUserAnswers_${mode}`)
    localStorage.removeItem(`setRefAnswers_${mode}`)
    router.push('/practice')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/practice')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            返回练习页
          </button>
        </div>
      </div>
    )
  }

  if (!setData) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/practice')}
            className="flex items-center gap-2 text-slate-800"
          >
            <span className="text-2xl">🐻</span>
            <span className="font-bold">江苏公务员面试答题训练</span>
          </button>
          <div className="text-sm text-slate-500">
            套题结果
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 套题信息 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{setData.name}</h1>
              <p className="text-sm text-slate-500 mt-1">
                共 {setData.questions.length} 道题 · 建议作答时间 {setData.time}
              </p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
              已完成
            </span>
          </div>
        </div>

        {/* 题目+答案对照 */}
        <div className="space-y-6 mb-8">
          {setData.questions.map((q) => (
            <div key={q.index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  第{q.index}题
                </span>
                <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  {q.typeName}
                </span>
              </div>

              {/* 题目 */}
              <div className="text-slate-800 leading-relaxed whitespace-pre-wrap mb-4">
                {q.question}
              </div>

              {/* 用户答案 */}
              {userAnswers[q.index] && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">📝</span>
                    <span className="font-medium text-blue-800 text-sm">你的答案</span>
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {userAnswers[q.index]}
                  </div>
                </div>
              )}

              {/* 参考答案 */}
              {refAnswers[q.index] && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">✅</span>
                    <span className="font-medium text-green-800 text-sm">参考答案</span>
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {refAnswers[q.index]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            📥 下载Word文档
          </button>
          <button
            onClick={handleNewSet}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-8 py-3 rounded-xl transition-colors"
          >
            再来一套
          </button>
          <button
            onClick={() => router.push('/practice')}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-8 py-3 rounded-xl transition-colors"
          >
            返回练习页
          </button>
        </div>
      </div>
    </div>
  )
}
