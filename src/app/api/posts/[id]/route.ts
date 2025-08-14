import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// HackMD API 回應類型
interface HackMDNote {
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishType: string;
}

// 靜態資料中的文章類型
interface StaticPost {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  excerpt: string;
}

// 嘗試從靜態資料讀取文章
function tryReadStaticPost(id: string): StaticPost | null {
  try {
    const staticDataPath = path.join(process.cwd(), "src", "data", "posts.json");
    if (fs.existsSync(staticDataPath)) {
      const data = fs.readFileSync(staticDataPath, "utf-8");
      const parsed = JSON.parse(data);
      const post = parsed.posts?.find((p: StaticPost) => p.id === id);
      if (post) {
        console.log('📁 找到靜態文章:', post.title);
        return post;
      }
    }
  } catch (error) {
    console.log('⚠️ 讀取靜態文章時出錯:', error);
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 首先嘗試使用靜態資料
    const staticPost = tryReadStaticPost(id);
    if (staticPost) {
      console.log('🚀 使用靜態文章資料');
      return NextResponse.json({
        id: staticPost.id,
        title: staticPost.title,
        content: staticPost.content,
        tags: staticPost.tags,
        createdAt: staticPost.createdAt,
        updatedAt: staticPost.updatedAt,
      });
    }

    // 如果沒有靜態資料，使用 API 模式
    console.log('📡 靜態資料中找不到文章，使用 API 模式');
    
    const apiKey = process.env.HACKMD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // 取得完整文章內容
    const response = await fetch(`https://api.hackmd.io/v1/notes/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      throw new Error("Failed to fetch note");
    }

    const note = (await response.json()) as HackMDNote;

    return NextResponse.json({
      id,
      title: note.title || "Untitled",
      content: note.content || "No content available",
      tags: note.tags || [],
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      publishType: note.publishType || "none",
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
