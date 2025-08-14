import Link from "next/link";
import InfinitePostList from "@/components/InfinitePostList";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// 獲取初始資料用於 SEO 和 sidebar
async function getInitialData(): Promise<{
  posts: Post[];
  totalCount: number;
}> {
  try {
    const response = await fetch(
      `${
        process.env.VERCEL_URL
          ? "https://" + process.env.VERCEL_URL
          : "http://localhost:3001"
      }/api/posts?page=1&limit=15`, // 獲取前15篇，足夠填滿首頁和側邊欄
      {
        next: { revalidate: 300 }, // 5 分鐘快取
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const data: PostsResponse = await response.json();
    return { posts: data.posts, totalCount: data.pagination.total };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: [], totalCount: 0 };
  }
}

// 取得所有標籤並計算數量
function getAllTags(posts: Post[]) {
  const tagCount: { [key: string]: number } = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCount)
    .sort(([, a], [, b]) => b - a) // 依據數量排序
    .slice(0, 10); // 只取前 10 個熱門標籤
}

function PostCard({
  post,
  featured = false,
}: {
  post: Post;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <article className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 group hover:shadow-xl transition-shadow duration-300">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center min-h-[200px]">
            <div className="text-white text-center p-6">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-sm opacity-90">精選文章</div>
            </div>
          </div>
          <div className="md:w-2/3 p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
              <Link href={`/posts/${post.id}`}>{post.title}</Link>
            </h2>

            <p className="text-gray-600 mb-4 line-clamp-3 text-lg leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <time className="text-sm text-gray-400">
                {new Date(post.createdAt).toLocaleDateString("zh-TW")}
              </time>
              <Link
                href={`/posts/${post.id}`}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                閱讀文章 →
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <time className="text-xs text-gray-400">
            {new Date(post.createdAt).toLocaleDateString("zh-TW")}
          </time>
          <Link
            href={`/posts/${post.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            閱讀 →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function Home() {
  const { posts, totalCount } = await getInitialData();
  const topTags = getAllTags(posts);
  const featuredPost = posts[0]; // 最新的文章作為精選
  const recentPosts = posts.slice(1, 7); // 接下來 6 篇
  const morePosts = posts.slice(7, 15); // 再 8 篇用於側邊欄

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            GPT Think Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            探索 AI 思維與技術的深度分享，記錄學習與成長的每一步
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-lg shadow-md p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                準備中...
              </h2>
              <p className="text-gray-500">正在載入最新的文章內容</p>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* 主要內容區 */}
            <div className="lg:col-span-3">
              {/* 精選文章 */}
              {featuredPost && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm mr-3">
                      精選
                    </span>
                    最新文章
                  </h2>
                  <PostCard post={featuredPost} featured={true} />
                </section>
              )}

              {/* 最近文章 */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  最近文章
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {recentPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>

              {/* 查看更多 */}
              <div className="text-center">
                <Link
                  href="/posts"
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  查看所有文章 ({totalCount})
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

            {/* 側邊欄 */}
            <div className="lg:col-span-1">
              {/* 熱門標籤 */}
              <section className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  熱門標籤
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topTags.map(([tag, count]) => (
                    <Link
                      key={tag}
                      href={`/tags/${tag}`}
                      className="inline-flex items-center bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-1 rounded-full text-sm transition-colors"
                    >
                      #{tag}
                      <span className="ml-1 bg-gray-200 hover:bg-blue-200 text-xs px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* 更多文章 */}
              <section className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  更多文章
                </h3>
                <div className="space-y-4">
                  {morePosts.map((post) => (
                    <article key={post.id} className="group">
                      <h4 className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                        <Link href={`/posts/${post.id}`}>{post.title}</Link>
                      </h4>
                      <time className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString("zh-TW")}
                      </time>
                    </article>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href="/posts"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    查看全部文章 →
                  </Link>
                </div>
              </section>

              {/* 文章統計 */}
              <section className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  部落格統計
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">總文章數</span>
                    <span className="font-semibold text-blue-600">
                      {totalCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">標籤數</span>
                    <span className="font-semibold text-green-600">
                      {topTags.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">最後更新</span>
                    <span className="text-sm text-gray-500">
                      {posts[0] &&
                        new Date(posts[0].updatedAt).toLocaleDateString(
                          "zh-TW"
                        )}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
