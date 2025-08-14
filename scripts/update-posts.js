const fs = require('fs');
const path = require('path');

// 讀取 noteIds
const noteIds = JSON.parse(fs.readFileSync('src/data/noteIds.json', 'utf8'));
const apiKey = process.env.HACKMD_API_KEY;

if (!apiKey) {
  console.error('❌ HACKMD_API_KEY 環境變數未設定');
  process.exit(1);
}

async function fetchPosts() {
  console.log('🚀 開始抓取文章...');
  
  const batchSize = 3;
  const allResults = [];

  for (let i = 0; i < noteIds.noteIds.length; i += batchSize) {
    const batch = noteIds.noteIds.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(noteIds.noteIds.length / batchSize);

    console.log(`⏳ 處理批次 ${batchNum}/${totalBatches} (${batch.length} 個請求)`);

    const batchResults = await Promise.allSettled(
      batch.map(async (noteId) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(
            `https://api.hackmd.io/v1/notes/${noteId}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.error(`❌ 抓取失敗 ${noteId}: ${response.status}`);
            return null;
          }

          const note = await response.json();

          return {
            id: noteId,
            title: note.title || "Untitled",
            tags: note.tags || [],
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            excerpt: note.content
              ? note.content.substring(0, 200) + "..."
              : "No content available",
          };
        } catch (error) {
          console.error(`❌ 錯誤 ${noteId}:`, error.message);
          return null;
        }
      })
    );

    allResults.push(...batchResults);

    // 批次間延遲
    if (i + batchSize < noteIds.noteIds.length) {
      console.log('⏸️  等待 1 秒...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // 過濾成功的結果
  const successfulPosts = allResults
    .filter(result => result.status === "fulfilled" && result.value !== null)
    .map(result => result.value)
    .filter(post => post !== null)
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  console.log(`✅ 成功抓取 ${successfulPosts.length}/${noteIds.noteIds.length} 篇文章`);
  
  return successfulPosts;
}

async function main() {
  try {
    const posts = await fetchPosts();
    
    // 生成快取資料
    const cacheData = {
      posts,
      timestamp: Date.now(),
      total: posts.length,
      lastUpdated: new Date().toISOString()
    };
    
    // 確保目錄存在
    const dataDir = path.dirname('src/data/posts.json');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 寫入檔案
    fs.writeFileSync(
      'src/data/posts.json',
      JSON.stringify(cacheData, null, 2),
      'utf8'
    );
    
    console.log('💾 文章資料已儲存到 src/data/posts.json');
    console.log(`📊 總計: ${posts.length} 篇文章`);
    console.log(`🕐 更新時間: ${cacheData.lastUpdated}`);
    
  } catch (error) {
    console.error('💥 執行失敗:', error);
    process.exit(1);
  }
}

main();
