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

interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

function PostCard({
  post,
  featured = false,
}: {
  post: Post;
  featured?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 ${
        featured ? "col-span-2 row-span-2" : ""
      }`}
    >
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="inline-block bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              #{tag}
            </Link>
          ))}
          {post.tags.length > 3 && (
            <span className="text-gray-400 text-xs">
              +{post.tags.length - 3}
            </span>
          )}
        </div>

        <Link href={`/posts/${post.id}`} className="group">
          <h2
            className={`font-bold mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 ${
              featured ? "text-2xl" : "text-lg"
            }`}
          >
            {post.title}
          </h2>
        </Link>

        <p
          className={`text-gray-600 mb-4 line-clamp-3 ${
            featured ? "text-base" : "text-sm"
          }`}
        >
          {post.excerpt}
        </p>

        <div className="flex items-center text-gray-500 text-xs">
          <time dateTime={post.updatedAt}>
            {new Date(post.updatedAt).toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 animate-pulse">
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

export default function InfinitePostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data: PostsResponse = await response.json();

      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(page + 1, true);
    }
  }, [fetchPosts, page, loadingMore, hasMore]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1000 >=
        document.documentElement.offsetHeight
      ) {
        loadMore();
      }
    };

    const throttledHandleScroll = throttle(handleScroll, 200);
    window.addEventListener("scroll", throttledHandleScroll);
    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [loadMore]);

  if (loading && posts.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">載入文章時發生錯誤: {error}</p>
        <button
          onClick={() => fetchPosts(1)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 特色文章和網格佈局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max">
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            featured={index === 0} // 第一篇作為特色文章
          />
        ))}
      </div>

      {/* 載入更多的載入指示器 */}
      {loadingMore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      )}

      {/* 載入更多按鈕（備用） */}
      {!loadingMore && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            載入更多文章
          </button>
        </div>
      )}

      {/* 沒有更多文章 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">已載入所有文章</p>
        </div>
      )}
    </div>
  );
}

// 節流函數
function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
) {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
