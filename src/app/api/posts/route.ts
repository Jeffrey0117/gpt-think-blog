import { NextRequest, NextResponse } from "next/server";
import noteIds from "@/data/noteIds.json";
import fs from "fs";
import path from "path";

// 定義文章類型
interface Post {
  id: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  excerpt: string;
  content: string;
}

// 定義快取資料類型
interface CacheData {
  posts: Post[];
  lastUpdated: number;
}

// 記憶體快取
let memoryCache: { posts: Post[]; lastUpdated: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時

// 嘗試讀取靜態資料
function tryReadStaticData(): CacheData | null {
  try {
    const staticDataPath = path.join(
      process.cwd(),
      "src",
      "data",
      "posts.json"
    );
    if (fs.existsSync(staticDataPath)) {
      const data = fs.readFileSync(staticDataPath, "utf-8");
      const parsed = JSON.parse(data);
      console.log(
        "📁 找到靜態資料檔案，包含",
        parsed.posts?.length || 0,
        "篇文章"
      );
      return parsed;
    }
  } catch (error) {
    console.log("⚠️ 讀取靜態資料時出錯:", error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // 首先嘗試使用靜態資料
    const staticData = tryReadStaticData();
    if (staticData && staticData.posts.length > 0) {
      console.log("🚀 使用靜態資料");
      const totalPosts = staticData.posts.length;
      const paginatedPosts = staticData.posts.slice(skip, skip + limit);
      const hasMore = skip + limit < totalPosts;

      return NextResponse.json({
        posts: paginatedPosts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          hasMore,
        },
      });
    }

    // 如果沒有靜態資料，使用原本的 API 邏輯
    console.log("📡 使用 API 模式（建議設定 GitHub Actions 來生成靜態資料）");

    const apiKey = process.env.HACKMD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // 檢查記憶體快取
    const now = Date.now();
    if (memoryCache && now - memoryCache.lastUpdated < CACHE_DURATION) {
      console.log("📂 Using cached data");
      const totalPosts = memoryCache.posts.length;
      const paginatedPosts = memoryCache.posts.slice(skip, skip + limit);
      const hasMore = skip + limit < totalPosts;

      return NextResponse.json({
        posts: paginatedPosts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          hasMore,
        },
      });
    }

    console.log(`📡 Fetching fresh data for page ${page}`);

    // 批次處理 API 請求
    const batchSize = 5;
    const allPosts: Post[] = [];
    const errors: string[] = [];

    for (let i = 0; i < noteIds.noteIds.length; i += batchSize) {
      const batch = noteIds.noteIds.slice(i, i + batchSize);

      const totalBatches = Math.ceil(noteIds.noteIds.length / batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      console.log(
        `📦 Processing batch ${currentBatch}/${totalBatches} (${batch.length} notes)`
      );

      // 同時處理批次中的所有請求
      const batchPromises = batch.map(async (noteId: string) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(
            `https://api.hackmd.io/v1/notes/${noteId}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          // 過濾掉標題為空的文章
          if (!data.title || data.title.trim() === "") {
            return null;
          }

          // 提取內容的前 200 個字符作為摘要
          const contentPreview = data.content
            ? data.content.replace(/[#*`\[\]()]/g, "").substring(0, 200) + "..."
            : "";

          return {
            id: noteId,
            title: data.title,
            tags: data.tags || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            excerpt: contentPreview,
            content: data.content || "",
          } as Post;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`❌ Error fetching note ${noteId}:`, errorMessage);
          errors.push(`${noteId}: ${errorMessage}`);
          return null;
        }
      });

      // 等待當前批次完成
      const batchResults = await Promise.all(batchPromises);

      // 只添加成功的結果
      const validPosts = batchResults.filter(
        (post): post is Post => post !== null
      );
      allPosts.push(...validPosts);

      // 在批次之間添加延遲以避免 rate limiting
      if (i + batchSize < noteIds.noteIds.length) {
        console.log("⏳ Waiting 1 second before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 按更新時間排序（最新的在前）
    allPosts.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // 更新記憶體快取
    memoryCache = {
      posts: allPosts,
      lastUpdated: now,
    };

    const successfulPosts = allPosts;
    console.log(
      `✅ Successfully fetched ${successfulPosts.length}/${noteIds.noteIds.length} posts`
    );

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors occurred:`, errors.slice(0, 5));
    }

    // 計算分頁
    const totalPosts = successfulPosts.length;
    const paginatedPosts = successfulPosts.slice(skip, skip + limit);
    const hasMore = skip + limit < totalPosts;

    return NextResponse.json(
      {
        posts: paginatedPosts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          hasMore,
        },
        debug: {
          totalFetched: successfulPosts.length,
          errors: errors.length,
          cacheUsed: false,
        },
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch posts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
