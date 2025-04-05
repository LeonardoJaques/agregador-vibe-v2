import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ArticleList from './components/ArticleList';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import AddArticleForm from './components/AddArticleForm'; // Keep if manual add is desired
import PaginationControls from './components/PaginationControls';

const ARTICLES_API_URL = 'http://localhost:3001/api/articles';
const ARTICLES_PER_PAGE = 10;

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [addingArticleError, setAddingArticleError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- Fetch Articles ---
  const fetchArticles = useCallback(async (isRefresh = false) => {
    // ... (fetch logic remains the same as v6) ...
    if (!isRefresh) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await axios.get(ARTICLES_API_URL);
      const fetchedArticles = response.data;
      setArticles(fetchedArticles);
      setTotalPages(Math.ceil(fetchedArticles.length / ARTICLES_PER_PAGE));
       // Reset page only if needed after refresh
      const maxPage = Math.ceil(fetchedArticles.length / ARTICLES_PER_PAGE);
      if (!isRefresh || currentPage > maxPage) {
           setCurrentPage(1);
      } else if (maxPage === 0) {
           setCurrentPage(1); // Handle case where all articles might be deleted
      }
    } catch (err) { /* ... error handling ... */ }
    finally { setLoading(false); setIsRefreshing(false); }
  }, [currentPage]); // Add currentPage back as dependency for pagination logic

  useEffect(() => {
    fetchArticles(false);
  }, []); // Initial fetch

  // --- Add Article Logic ---
  const handleAddArticle = async (articleData) => {
    // ... (add logic remains the same) ...
     setAddingArticleError(null);
    try {
      await axios.post(ARTICLES_API_URL, articleData);
      await fetchArticles(true); // Refresh list after adding
    } catch (err) { /* ... error handling ... */ }
  };

  // --- Refresh Handler ---
  const handleRefresh = () => {
      console.log("Refreshing articles...");
      fetchArticles(true);
  };

  // --- Delete Article Handler (Frontend Only) ---
  const handleDeleteArticle = (idToDelete) => {
    console.log(`Attempting to visually delete article: ${idToDelete}`);
    // Filter out the article from the current state
    setArticles(prevArticles => {
        const updatedArticles = prevArticles.filter(article => article.id !== idToDelete);
        // Recalculate total pages after deletion
        const newTotalPages = Math.ceil(updatedArticles.length / ARTICLES_PER_PAGE);
        setTotalPages(newTotalPages);
        // Adjust current page if it becomes invalid
        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        } else if (newTotalPages === 0) {
            setCurrentPage(1);
        }
        return updatedArticles;
    });
    // NOTE: This only removes it from the view. It will reappear on refresh
    //       unless a backend DELETE endpoint is implemented and called here.
  };


  // --- Pagination Logic ---
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const currentArticles = articles.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header remains simple for now */}
      <Header />

       {/* Main layout using Flexbox (simulating sidebar + main content) */}
       <div className="flex-grow container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6 max-w-7xl"> {/* Wider container */}

            {/* Placeholder for Left Sidebar (Navigation) */}
            {/* <nav className="w-full md:w-1/5 lg:w-1/6 p-4 bg-white rounded-lg shadow-sm border border-gray-200 h-fit mb-6 md:mb-0">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Seções</h2>
                <ul>
                    <li className="mb-2"><a href="#" className="text-blue-600 hover:underline">Notícias principais</a></li>
                    <li className="mb-2"><a href="#" className="text-gray-600 hover:underline">Mundo</a></li>
                    <li className="mb-2"><a href="#" className="text-gray-600 hover:underline">Brasil</a></li>
                     Add more categories
                </ul>
            </nav> */}

            {/* Main Content Area */}
            <main className="w-full"> {/* Takes remaining space */}

                {/* Add Article Form Section (Optional) */}
                <section aria-labelledby="add-article-heading" className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 id="add-article-heading" className="text-lg font-semibold text-gray-700 mb-4">Adicionar Notícia Manualmente</h2>
                    {addingArticleError && <ErrorMessage message={addingArticleError} />}
                    <AddArticleForm onArticleSubmit={handleAddArticle} />
                </section>

                {/* Article List Section */}
                <section aria-labelledby="article-list-heading" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <h2 id="article-list-heading" className="text-xl font-semibold text-gray-800">
                        Notícias Recentes
                        </h2>
                        {/* Refresh Button */}
                        <button onClick={handleRefresh} disabled={isRefreshing} className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}>
                            {isRefreshing ? ( /* ... spinner ... */ 'Atualizando...') : ( 'Atualizar' )}
                        </button>
                    </div>

                    {/* Display Area */}
                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <ErrorMessage message={error} />
                    ) : articles.length > 0 ? (
                        <>
                            {/* Pass the delete handler down */}
                            <ArticleList
                                articles={currentArticles}
                                onDeleteArticle={handleDeleteArticle}
                            />
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    ) : (
                        <p className="text-center text-gray-500 py-6">Nenhuma notícia encontrada.</p>
                    )}
                </section>
            </main>

            {/* Placeholder for Right Sidebar */}
            {/* <aside className="w-full md:w-1/4 lg:w-1/5 p-4 bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                 <h2 className="text-lg font-semibold text-gray-700 mb-4">Destaques</h2>
                 Placeholder content
            </aside> */}
       </div>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm mt-8 border-t border-gray-100 bg-white w-full">
        News Aggregator &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
export default App;
