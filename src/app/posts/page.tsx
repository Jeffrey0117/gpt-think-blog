import Link from "next/link";
import InfiniteScrollPosts from "@/components/InfiniteScrollPosts";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface PostsResponse {
  posts: Post[];
  pagination: PaginationInfo;
}

async function getInitialPosts(): Promise<PostsResponse> {
  // 在 build time，直接返回空數據，讓頁面能正常生成
  if (typeof window === "undefined" && !process.env.VERCEL_URL) {
    return {
      posts: [],
      pagination: {
        page: 1,
        limit: 5,
        total: 0,
        hasMore: false,
      },
    };
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3001";

    const response = await fetch(`${baseUrl}/api/posts?page=1&limit=5`, {
      next: { revalidate: 300 }, // 5 分鐘重新驗證，而不是 no-store
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    return {
      posts: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        hasMore: false,
      },
    };
  }
}

export default async function PostsPage() {
  const { posts, pagination } = await getInitialPosts();

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
          <h1 className="text-4xl font-bold text-gray-800 mb-4">所有文章</h1>
          <p className="text-lg text-gray-600">
            共 {pagination.total} 篇文章 • 支援無限滾動載入
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {pagination.total === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                還沒有文章
              </h2>
              <p className="text-gray-500">請稍後再來查看</p>
            </div>
          ) : (
            <InfiniteScrollPosts
              initialPosts={posts}
              initialPagination={pagination}
            />
          )}
        </div>
      </div>
    </div>
  );
}
