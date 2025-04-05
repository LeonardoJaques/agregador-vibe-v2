import React from 'react';

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) { return null; }

  const handlePrevious = () => { if (currentPage > 1) onPageChange(currentPage - 1); };
  const handleNext = () => { if (currentPage < totalPages) onPageChange(currentPage + 1); };

  // Simple Page Number Generation (adjust maxPagesToShow as needed)
  const pageNumbers = [];
  const maxPagesToShow = 7; // Example: Show up to 7 page links
  let startPage, endPage;

  if (totalPages <= maxPagesToShow) {
    startPage = 1; endPage = totalPages;
  } else {
    let maxPagesBeforeCurrent = Math.floor((maxPagesToShow - 3) / 2); // -3 for first, last, ellipsis
    let maxPagesAfterCurrent = Math.ceil((maxPagesToShow - 3) / 2);
    if (currentPage <= maxPagesBeforeCurrent + 1) { // Near the start
        startPage = 2; endPage = maxPagesToShow - 1;
    } else if (currentPage >= totalPages - maxPagesAfterCurrent) { // Near the end
        startPage = totalPages - maxPagesToShow + 2; endPage = totalPages - 1;
    } else { // In the middle
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  pageNumbers.push(1); // Always show first page
  if (startPage > 2) pageNumbers.push('...'); // Ellipsis before
  for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) pageNumbers.push(i); // Add middle pages
  }
  if (endPage < totalPages - 1) pageNumbers.push('...'); // Ellipsis after
  if (totalPages > 1) pageNumbers.push(totalPages); // Always show last page

  return (
    <nav aria-label="Paginação de notícias" className="flex items-center justify-center mt-8 mb-4 space-x-1 sm:space-x-2">
      <button onClick={handlePrevious} disabled={currentPage === 1} className={`px-3 py-1 text-sm font-medium rounded-md border ${ currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' } transition-colors`}>
        Anterior
      </button>
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-2 py-1 text-sm text-gray-500">...</span>
          ) : (
            <button onClick={() => onPageChange(page)} disabled={currentPage === page} className={`px-3 py-1 text-sm font-medium rounded-md border ${ currentPage === page ? 'bg-blue-500 text-white border-blue-500 cursor-default' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' } transition-colors`} aria-current={currentPage === page ? 'page' : undefined}>
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      <button onClick={handleNext} disabled={currentPage === totalPages} className={`px-3 py-1 text-sm font-medium rounded-md border ${ currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' } transition-colors`}>
        Próxima
      </button>
    </nav>
  );
}
export default PaginationControls;