import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== 查询2024-03-10 C类题目 ===\n')

  const questions = await prisma.zhentiQuestion.findMany({
    where: {
      examDate: '2024-03-10',
      examCategory: 'C类',
    },
    orderBy: { questionNumber: 'asc' },
  })

  console.log(`找到 ${questions.length} 道题:`)
  questions.forEach(q => {
    console.log(`  ID ${q.id}: 题号${q.questionNumber} - ${q.questionText.substring(0, 60)}...`)
  })

  // 检查是否有第4题
  const q4 = questions.find(q => q.questionNumber === 4)
  if (!q4) {
    console.log('\n⚠️ 缺少第4题，需要补录')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
