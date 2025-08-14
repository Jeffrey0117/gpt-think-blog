import Link from "next/link";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

async function getPosts(): Promise<Post[]> {
  try {
    const response = await fetch(
      `${
        process.env.VERCEL_URL
          ? "https://" + process.env.VERCEL_URL
          : "http://localhost:3000"
      }/api/posts`,
      {
        cache: "no-store", // 總是取得最新資料
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          GPT Think Blog
        </h1>
        <p className="text-gray-600">從 HackMD 取得的思考筆記</p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">暫無文章</h2>
          <p className="text-gray-600">請稍後再試，或檢查 API 設定</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">
                <Link
                  href={`/posts/${post.id}`}
                  className="hover:text-blue-600"
                >
                  {post.title}
                </Link>
              </h2>

              {post.excerpt && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex gap-2">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <time dateTime={post.updatedAt}>
                  {new Date(post.updatedAt).toLocaleDateString("zh-TW")}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
