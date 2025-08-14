"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

interface InfiniteScrollPostsProps {
  initialPosts: Post[];
  initialPagination: PaginationInfo;
}

export default function InfiniteScrollPosts({
  initialPosts,
  initialPagination,
}: InfiniteScrollPostsProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [pagination, setPagination] =
    useState<PaginationInfo>(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入更多文章
  const loadMorePosts = useCallback(async () => {
    if (loading || !pagination.hasMore) {
      console.log(
        `🛑 Stopped loading - loading: ${loading}, hasMore: ${pagination.hasMore}`
      );
      return;
    }

    console.log(
      `🔄 Loading more posts - Page ${pagination.page + 1}, Currently have ${
        posts.length
      } posts, Total: ${pagination.total}`
    );

    setLoading(true);
    setError(null);

    try {
      const nextPage = pagination.page + 1;
      const response = await fetch(`/api/posts?page=${nextPage}&limit=5`);

      if (!response.ok) {
        throw new Error("Failed to load more posts");
      }

      const data = await response.json();

      console.log(
        `📊 API Response - Posts: ${data.posts.length}, Page: ${data.pagination.page}, HasMore: ${data.pagination.hasMore}, Total: ${data.pagination.total}`
      );

      // 過濾掉已經存在的文章，防止重複
      const newPosts = data.posts.filter(
        (newPost: Post) =>
          !posts.some((existingPost) => existingPost.id === newPost.id)
      );

      console.log(
        `✅ Loaded ${newPosts.length} new posts (filtered from ${data.posts.length}), hasMore: ${data.pagination.hasMore}`
      );

      // 如果沒有新文章或者 API 說沒有更多，就停止
      if (newPosts.length === 0 || !data.pagination.hasMore) {
        console.log(`🏁 Reached end - No new posts or hasMore is false`);
        setPagination((prev) => ({ ...prev, hasMore: false }));
        return;
      }

      setPosts((prev) => [...prev, ...newPosts]);
      setPagination(data.pagination);
    } catch (err) {
      setError("載入文章時發生錯誤，請稍後再試");
      console.error("Error loading more posts:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, pagination, posts]); // 添加 posts 依賴

  // 監聽滾動事件
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !pagination.hasMore) {
        // console.log(`🔇 Scroll ignored - loading: ${loading}, hasMore: ${pagination.hasMore}`);
        return;
      }

      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // 當滾動到距離底部 200px 時開始載入
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        console.log(`📜 Scroll triggered load more`);
        loadMorePosts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMorePosts, loading, pagination.hasMore]);

  return (
    <div className="space-y-6">
      {/* 文章列表 */}
      {posts.map((post, index) => {
        // 計算全域索引，考慮已載入的頁面
        const globalIndex = index + 1;
        return (
          <article
            key={`post-${post.id}-${index}`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 group"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                      #{globalIndex}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                    <Link href={`/posts/${post.id}`}>{post.title}</Link>
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <time dateTime={post.createdAt}>
                        建立:{" "}
                        {new Date(post.createdAt).toLocaleDateString("zh-TW")}
                      </time>
                      <time dateTime={post.updatedAt}>
                        更新:{" "}
                        {new Date(post.updatedAt).toLocaleDateString("zh-TW")}
                      </time>
                    </div>
                    <Link
                      href={`/posts/${post.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      閱讀文章 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      {/* 載入更多按鈕或載入中狀態 */}
      {pagination.hasMore && (
        <div className="text-center py-8">
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">載入中...</span>
            </div>
          ) : (
            <button
              onClick={loadMorePosts}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              載入更多文章
            </button>
          )}
        </div>
      )}

      {/* 錯誤狀態 */}
      {error && (
        <div className="text-center py-4">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadMorePosts}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            重新嘗試
          </button>
        </div>
      )}

      {/* 已載入所有文章 */}
      {!pagination.hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-gray-600">已載入所有 {pagination.total} 篇文章</p>
        </div>
      )}
    </div>
  );
}
