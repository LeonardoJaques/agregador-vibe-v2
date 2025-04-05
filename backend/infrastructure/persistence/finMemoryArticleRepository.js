// Infrastructure Layer - Driven Adapters (Persistence Implementation)
import { ArticleRepositoryPort } from '../../application/ports/articleRepositoryPort.js';

// Concrete implementation of the ArticleRepositoryPort using in-memory storage
export class InMemoryArticleRepository extends ArticleRepositoryPort {
  constructor() {
    super();
    this.articles = new Map(); // Use a Map for easy ID-based lookup
    // Add some initial data for testing
    this._addInitialData();
  }

  _addInitialData() {
      const initialArticles = [
          { id: '1', title: 'React 19 Announced', url: 'https://react.dev/blog', source: 'React Blog', addedAt: new Date(Date.now() - 86400000) }, // 1 day ago
          { id: '2', title: 'Vite 5 Released', url: 'https://vitejs.dev/blog', source: 'Vite Blog', addedAt: new Date(Date.now() - 172800000) }, // 2 days ago
          { id: '3', title: 'Node.js Performance Tips', url: 'https://nodejs.org/en/docs/guides', source: 'Node.js Docs', addedAt: new Date() }
      ];
      initialArticles.forEach(article => this.articles.set(article.id, article));
      console.log("Initialized In-Memory Repository with sample data.");
  }

  async save(article) {
    console.log(`Saving article in memory: ${article.id}`);
    this.articles.set(article.id, { ...article }); // Store a copy
    return article;
  }

  async findAll() {
    console.log("Retrieving all articles from memory...");
    // Return articles sorted by date, newest first
    const allArticles = Array.from(this.articles.values());
    allArticles.sort((a, b) => b.addedAt - a.addedAt);
    return allArticles;
  }

  async findById(id) {
    console.log(`Finding article by ID in memory: ${id}`);
    return this.articles.get(id) || null; // Return null if not found
  }

  // --- NOTE ---
  // To use a real database (e.g., PostgreSQL, MongoDB, SQLite) or file storage:
  // 1. Create a new adapter class (e.g., PostgresArticleRepository) that extends ArticleRepositoryPort.
  // 2. Implement the save, findAll, findById methods using your chosen database client/library.
  // 3. In server.js, instantiate your new adapter instead of InMemoryArticleRepository.
  //    Example: const articleRepository = new PostgresArticleRepository(dbConnection);
  // The rest of the application (Service, API Routes) remains unchanged because they depend on the Port, not the implementation.
}