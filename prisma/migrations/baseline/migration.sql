-- CreateTable
CREATE TABLE "CronExecutionLog" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '其他',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'month',
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedBy" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "referenceAnswer" TEXT,
    "userAnswer" TEXT,
    "evaluation" TEXT,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "improvedAnswer" TEXT,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "dailyFreeCount" INTEGER NOT NULL DEFAULT 5,
    "freeCountResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessExpire" TIMESTAMP(3),
    "accessLevel" TEXT NOT NULL DEFAULT 'none',
    "recentTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openid" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_news" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "topNews" TEXT NOT NULL,
    "allNews" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shenlun_bookmark" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'weak',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shenlun_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shenlun_material" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "materialNum" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "materialOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shenlun_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shenlun_question" (
    "id" SERIAL NOT NULL,
    "examTitle" TEXT NOT NULL,
    "examYear" INTEGER NOT NULL,
    "examDate" TEXT NOT NULL,
    "examCategory" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT '未分类',
    "score" INTEGER,
    "wordLimit" TEXT,
    "materialRange" TEXT,
    "referenceAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shenlun_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shenlun_teacher_answer" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "teacherName" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "answerOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shenlun_teacher_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zhenti_bookmark" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "proficiency" TEXT NOT NULL DEFAULT 'weak',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zhenti_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zhenti_question" (
    "id" SERIAL NOT NULL,
    "examTitle" TEXT NOT NULL,
    "examYear" INTEGER NOT NULL,
    "examDate" TEXT NOT NULL,
    "examCategory" TEXT,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT '未分类',
    "answer1" TEXT NOT NULL,
    "answer2" TEXT NOT NULL,
    "answer3" TEXT NOT NULL,
    "score1" INTEGER NOT NULL,
    "score2" INTEGER NOT NULL,
    "score3" INTEGER NOT NULL,
    "comparison" TEXT NOT NULL,
    "finalAnswer" TEXT NOT NULL,
    "finalWordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT,

    CONSTRAINT "zhenti_question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CronExecutionLog_jobName_createdAt_idx" ON "CronExecutionLog"("jobName" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationCode_code_key" ON "InvitationCode"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_openid_key" ON "User"("openid" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_news_date_key" ON "daily_news"("date" ASC);

-- CreateIndex
CREATE INDEX "shenlun_bookmark_userId_idx" ON "shenlun_bookmark"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "shenlun_bookmark_userId_questionId_key" ON "shenlun_bookmark"("userId" ASC, "questionId" ASC);

-- CreateIndex
CREATE INDEX "shenlun_material_questionId_idx" ON "shenlun_material"("questionId" ASC);

-- CreateIndex
CREATE INDEX "shenlun_question_examDate_examCategory_idx" ON "shenlun_question"("examDate" ASC, "examCategory" ASC);

-- CreateIndex
CREATE INDEX "shenlun_question_examDate_idx" ON "shenlun_question"("examDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "shenlun_question_examYear_examCategory_questionNumber_key" ON "shenlun_question"("examYear" ASC, "examCategory" ASC, "questionNumber" ASC);

-- CreateIndex
CREATE INDEX "shenlun_question_examYear_idx" ON "shenlun_question"("examYear" ASC);

-- CreateIndex
CREATE INDEX "shenlun_teacher_answer_questionId_idx" ON "shenlun_teacher_answer"("questionId" ASC);

-- CreateIndex
CREATE INDEX "zhenti_bookmark_userId_idx" ON "zhenti_bookmark"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "zhenti_bookmark_userId_questionId_key" ON "zhenti_bookmark"("userId" ASC, "questionId" ASC);

-- CreateIndex
CREATE INDEX "zhenti_question_examDate_examCategory_idx" ON "zhenti_question"("examDate" ASC, "examCategory" ASC);

-- CreateIndex
CREATE INDEX "zhenti_question_examDate_idx" ON "zhenti_question"("examDate" ASC);

-- CreateIndex
CREATE INDEX "zhenti_question_examYear_idx" ON "zhenti_question"("examYear" ASC);

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shenlun_bookmark" ADD CONSTRAINT "shenlun_bookmark_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "shenlun_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shenlun_material" ADD CONSTRAINT "shenlun_material_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "shenlun_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shenlun_teacher_answer" ADD CONSTRAINT "shenlun_teacher_answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "shenlun_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zhenti_bookmark" ADD CONSTRAINT "zhenti_bookmark_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "zhenti_question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

