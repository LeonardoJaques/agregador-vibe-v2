import React from 'react';
import ArticleItem from './ArticleItem';

// Accept onDeleteArticle prop
function ArticleList({ articles, onDeleteArticle }) {
  if (!articles || articles.length === 0) {
    return <p className="text-center text-gray-500 py-6">Nenhuma notícia para exibir nesta página.</p>;
  }
  return (
    <div className="space-y-4"> {/* Reduced spacing slightly */}
      {articles.map((article) => (
        // Pass onDeleteArticle down to each item
        <ArticleItem
            key={article.id}
            article={article}
            onDelete={onDeleteArticle} // Pass the handler
        />
      ))}
    </div>
  );
}
export default ArticleList;