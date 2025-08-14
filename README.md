# GPT Think Blog

一個用來記錄跟 GPT 互動時的人生反思、點子、領悟。

## 部署到 Vercel

### 第一次部署

1. 推到 GitHub: `git push`
2. 去 [Vercel](https://vercel.com) 登入
3. 選擇 "Import Project" 然後選你的 GitHub repo
4. 設定環境變數：
   - Key: `HACKMD_API_KEY`
   - Value: `你的HackMD API金鑰`
5. Deploy 就完成了

### 更新部署

直接推 code 就會自動重新部署：

```bash
git add .
git commit -m "更新內容"
git push
```

## 新增文章

### 方法一：在 HackMD 寫新文章

1. 去 HackMD 寫文章
2. 複製文章 ID（網址最後那串）
3. 把 ID 加到 `src/data/noteIds.json`
4. Push 上去

### 方法二：直接更新現有文章

在 HackMD 編輯文章，過 10 分鐘快取就會更新

## 開發環境

```bash
# 安裝
npm install

# 設定 .env.local
HACKMD_API_KEY=你的金鑰

# 跑起來
npm run dev
```

## 技術說明

- Next.js 15 + TypeScript + Tailwind
- 從 HackMD API 抓文章
- 有快取 10 分鐘
- 無限滾動每次載入 5 篇
- 支援 Markdown 和程式碼高亮

**GPT Think Blog** - 就是個記錄想法的地方
