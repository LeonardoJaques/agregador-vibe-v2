import React, { useState } from 'react';

function AddArticleForm({ onArticleSubmit }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(''); // Error specific to the form validation

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission which reloads the page
    setFormError(''); // Clear previous form error

    // Basic validation
    if (!title.trim() || !url.trim() || !source.trim()) {
      setFormError('Todos os campos (Título, URL, Fonte) são obrigatórios.');
      return;
    }

    // Basic URL validation (optional, can be more robust)
    try {
        new URL(url); // Check if the URL is valid
    } catch (_) {
        setFormError('Por favor, insira uma URL válida.');
        return;
    }


    setIsSubmitting(true);

    try {
      // Call the handler passed from App.jsx
      await onArticleSubmit({ title, url, source });
      // Clear the form on successful submission
      setTitle('');
      setUrl('');
      setSource('');
    } catch (error) {
      // Error is handled in App.jsx (displaying the addingError message)
      // No need to setFormError here unless it's a specific validation issue from backend
      console.log("Submission failed, form not cleared.");
    } finally {
      setIsSubmitting(false); // Re-enable the button
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Adicionar Nova Notícia</h2>
      {formError && <ErrorMessage message={formError} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título da Notícia
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: React Lança Nova Versão"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            disabled={isSubmitting} // Disable input while submitting
            required // HTML5 validation
          />
        </div>

        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL (Link)
          </label>
          <input
            type="url" // Use type="url" for basic browser validation
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://exemplo.com/noticia"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Source Input */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Fonte
          </label>
          <input
            type="text"
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ex: Blog Oficial, Site de Notícias X"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition duration-150 ease-in-out`}
            disabled={isSubmitting} // Disable button while submitting
          >
            {isSubmitting ? 'Adicionando...' : 'Adicionar Notícia'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddArticleForm;