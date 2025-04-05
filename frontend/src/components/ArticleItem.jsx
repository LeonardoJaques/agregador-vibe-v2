import React from 'react';

// Simple Bookmark Icon SVG
const BookmarkIcon = ({ saved }) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${saved ? 'text-yellow-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);


function ArticleItem({ article, onDelete, onSaveToggle, isSaved }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
  };
  // Updated check for tags (assuming backend sends array)
  const hasTags = article.aiTags && Array.isArray(article.aiTags) && article.aiTags.length > 0;
  // Check for classification
  const hasClassification = typeof article.aiClassification === 'string' && article.aiClassification.trim() !== '';
   // Check for relevance score
  const hasRelevanceScore = typeof article.aiRelevanceScore === 'number';


  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent triggering the article click
    if (onDelete) {
      onDelete(article.id);
    }
  };
  const handleSaveClick = (e) => { 
    e.stopPropagation();
    if (onSaveToggle) {
      onSaveToggle(article.id);
    }
  };

  return (
    <article className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 flex flex-col relative">
        {/* Action Buttons Container */}
        <div className="absolute top-2 right-2 flex space-x-1 z-10"> {/* Add z-index */}
             {/* Save/Unsave Button */}
             <button onClick={handleSaveClick} title={isSaved ? "Remover dos salvos" : "Salvar notícia"} className={`p-1 text-gray-400 hover:text-yellow-500 ${isSaved ? 'text-yellow-500' : ''} hover:bg-yellow-100 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-300`}>
                <BookmarkIcon saved={isSaved} />
            </button>
            {/* Delete Button */}
            <button onClick={handleDeleteClick} title="Remover esta notícia (visualmente)" className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Main Content */}
        <div className="pr-16 space-y-3"> {/* Increase padding for buttons */}
            {/* Title */}
            <h2 className="text-base font-semibold text-gray-800 leading-tight">
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded" title={`Abrir notícia: ${article.title}`}>
                {article.title || 'Artigo sem Título'}
                </a>
            </h2>

             {/* AI Classification & Relevance Score (Display if available) */}
             <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                 {hasClassification && (
                     <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                         {/* Optional: Icon per category? */}
                         {article.aiClassification}
                     </span>
                 )}
                 {hasRelevanceScore && (
                     <span className="inline-flex items-center" title={`Relevância estimada pela IA: ${article.aiRelevanceScore}/10`}>
                         <span className="font-medium mr-1">Relevância (IA):</span>
                         <span className={`font-bold ${article.aiRelevanceScore >= 7 ? 'text-green-600' : article.aiRelevanceScore >= 4 ? 'text-yellow-600' : 'text-red-600'}`}>
                             {article.aiRelevanceScore}/10
                         </span>
                         {/* Optional: Visual bar/stars */}
                     </span>
                 )}
                  {/* Placeholder if neither is available */}
                 {!hasClassification && !hasRelevanceScore && (
                      <span className="text-gray-400 italic">[Classificação/Relevância IA Pendente]</span>
                 )}
             </div>


            {/* AI Summary */}
            {article.aiSummary && (
                <div className="border-l-4 border-blue-100 pl-3 text-sm text-gray-700">
                    {article.aiSummary}
                </div>
            )}

            {/* Content Snippet (if no AI summary) */}
            {!article.aiSummary && article.contentSnippet && (
                <p className="text-sm text-gray-600 line-clamp-2">
                {article.contentSnippet.replace(/<[^>]*>?/gm, '')}
                </p>
            )}

            {/* AI Tags */}
            {hasTags && (
                <div className="pt-1">
                    <div className="flex flex-wrap gap-1">
                        {article.aiTags.map((tag, index) => (
                            <span key={index} className="text-xs text-green-800 bg-green-100 px-2 py-0.5 rounded font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1">
                <span className="inline-block whitespace-nowrap font-medium text-gray-600">{article.source || 'Desconhecida'}</span>
                <span className="inline-block whitespace-nowrap">{formatDate(article.addedAt)}</span>
            </div>
        </div>
    </article>
  );
}
export default ArticleItem;