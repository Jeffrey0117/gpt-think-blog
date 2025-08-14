import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
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

    const note = await response.json();

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
