import { NextRequest, NextResponse } from "next/server";
import noteIds from "@/data/noteIds.json";

// 定義文章類型
interface Post {
  id: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  excerpt: string;
}

// HackMD API 回應類型
interface HackMDNote {
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  content: string;
}

// Memory cache for posts
let postsCache: Post[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 分鐘快取

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const apiKey = process.env.HACKMD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // 檢查快取
    const now = Date.now();
    if (postsCache && now - cacheTimestamp < CACHE_DURATION) {
      console.log("📦 Using cached posts data");
      const totalPosts = postsCache.length;
      const paginatedPosts = postsCache.slice(skip, skip + limit);
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

    console.log("🔄 Fetching fresh posts data from HackMD...");

    // 更積極的批次處理和並發限制
    const batchSize = 3; // 降低到 3 個同時請求
    const allResults = [];

    for (let i = 0; i < noteIds.noteIds.length; i += batchSize) {
      const batch = noteIds.noteIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(noteIds.noteIds.length / batchSize);

      console.log(
        `⏳ Processing batch ${batchNum}/${totalBatches} (${batch.length} requests)`
      );

      const batchResults = await Promise.allSettled(
        batch.map(async (noteId) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超時

            const response = await fetch(
              `https://api.hackmd.io/v1/notes/${noteId}`,
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                signal: controller.signal,
                next: { revalidate: 600 }, // 10分鐘 revalidate
              }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
              console.error(
                `❌ Failed to fetch note ${noteId}: ${response.status}`
              );
              return null;
            }

            const note = await response.json() as HackMDNote;

            // 只返回必要的資訊給前端
            return {
              id: noteId,
              title: note.title || "Untitled",
              tags: note.tags || [],
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
              // 從內容中提取前幾行當作摘要
              excerpt: note.content
                ? note.content.substring(0, 200) + "..."
                : "No content available",
            } as Post;
          } catch (error) {
            console.error(`❌ Error fetching note ${noteId}:`, error);
            return null;
          }
        })
      );

      allResults.push(...batchResults);

      // 在批次之間增加延遲，避免 API 限制
      if (i + batchSize < noteIds.noteIds.length) {
        console.log("⏸️  Waiting 1s before next batch...");
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 過濾成功的請求
    const successfulPosts = allResults
      .filter(
        (result: PromiseSettledResult<Post | null>) => result.status === "fulfilled" && result.value !== null
      )
      .map((result) => (result as PromiseFulfilledResult<Post | null>).value)
      .filter((post: Post | null): post is Post => post !== null)
      .sort(
        (a: Post, b: Post) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    console.log(
      `✅ Successfully fetched ${successfulPosts.length}/${noteIds.noteIds.length} posts`
    );

    // 更新快取
    postsCache = successfulPosts;
    cacheTimestamp = now;

    // 如果要分頁，從快取中取得指定範圍的資料
    const totalPosts = successfulPosts.length;
    const paginatedPosts = successfulPosts.slice(skip, skip + limit);
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
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
