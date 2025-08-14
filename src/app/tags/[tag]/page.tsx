import Link from "next/link";
import { notFound } from "next/navigation";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

async function getPosts(): Promise<Post[]> {
  // 在 build time，直接返回空數據
  if (typeof window === "undefined" && !process.env.VERCEL_URL) {
    return [];
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3001";

    const response = await fetch(`${baseUrl}/api/posts`, {
      next: { revalidate: 300 }, // 5 分鐘重新驗證
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data = await response.json();
    // 如果 API 回傳分頁格式，提取 posts；否則直接使用
    return Array.isArray(data) ? data : data.posts || [];
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const allPosts = await getPosts();

  // 過濾包含該標籤的文章
  const posts = allPosts.filter((post) =>
    post.tags.some(
      (t) => t.toLowerCase() === decodeURIComponent(tag).toLowerCase()
    )
  );

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            回到首頁
          </Link>

          <div className="mb-6">
            <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-lg">
              #{decodeURIComponent(tag)}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">標籤文章</h1>
          <p className="text-lg text-gray-600">
            找到 {posts.length} 篇關於 「{decodeURIComponent(tag)}」 的文章
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tagName) => (
                      <span
                        key={tagName}
                        className={`px-3 py-1 text-sm rounded-full ${
                          tagName.toLowerCase() ===
                          decodeURIComponent(tag).toLowerCase()
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                        }`}
                      >
                        {tagName.toLowerCase() ===
                        decodeURIComponent(tag).toLowerCase() ? (
                          `#${tagName}`
                        ) : (
                          <Link href={`/tags/${tagName}`}>#{tagName}</Link>
                        )}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                    <Link href={`/posts/${post.id}`}>{post.title}</Link>
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <time className="text-sm text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("zh-TW")}
                    </time>
                    <Link
                      href={`/posts/${post.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      閱讀文章 →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/posts"
              className="inline-flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              查看所有文章
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
