// Application Layer - Ports (Interfaces for Driven Adapters)
// Defines what the application needs from the persistence layer.
export class ArticleRepositoryPort {
    async save(article) {
      throw new Error("Method 'save()' must be implemented.");
    }
    async findAll() {
      throw new Error("Method 'findAll()' must be implemented.");
    }
    async findById(id) {
       throw new Error("Method 'findById()' must be implemented.");
    }
  }