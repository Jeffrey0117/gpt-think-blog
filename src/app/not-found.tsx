import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - 文章不存在</h1>
      <p className="text-gray-600 mb-6">抱歉，您要找的文章不存在或已被刪除。</p>
      <Link
        href="/"
        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        返回首頁
      </Link>
    </div>
  );
}
