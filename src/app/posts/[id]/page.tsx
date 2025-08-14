import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css"; // 選擇你喜歡的程式碼高亮主題

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

async function getPost(id: string): Promise<Post | null> {
  try {
    // 決定 base URL
    let baseUrl = "http://localhost:3003"; // 本地開發使用正確的端口
    
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === "production") {
      baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}`;
    }

    console.log('🔗 Fetching post from:', `${baseUrl}/api/posts/${id}`);

    const response = await fetch(
      `${baseUrl}/api/posts/${id}`,
      {
        next: { revalidate: 3600 }, // 快取 1 小時而不是 no-store
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch post");
    }

    const post = await response.json();
    console.log('✅ Post loaded:', post.title);
    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 返回按鈕 */}
      <Link
        href="/"
        className="text-blue-600 hover:underline mb-8 inline-block"
      >
        ← 返回文章列表
      </Link>

      {/* 文章標題和資訊 */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">{post.title}</h1>

        {/* 文章資訊 */}
        <div className="flex items-center gap-4 text-gray-600 mb-6">
          <time dateTime={post.updatedAt}>
            更新於{" "}
            {new Date(post.updatedAt).toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <time dateTime={post.createdAt}>
            建立於{" "}
            {new Date(post.createdAt).toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        {/* 標籤 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 文章內容 */}
      <article className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-strong:text-gray-800 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // 自定義連結樣式
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            ),
            // 自定義程式碼區塊樣式
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <code className={className} {...props}>
                  {children}
                </code>
              ) : (
                <code
                  className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </article>

      {/* HackMD 連結 */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <a
            href={`https://hackmd.io/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            在 HackMD 中查看原文 →
          </a>
        </p>
      </div>
    </div>
  );
}
