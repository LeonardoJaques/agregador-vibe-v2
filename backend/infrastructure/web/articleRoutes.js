import express from 'express';

export default function articleRoutes(articleService) {
  const router = express.Router();

  // Route to get all articles (sorted by date added)
  router.get('/', async (req, res, next) => {
    try {
      console.log("GET /api/articles received");
      // Service now handles sorting
      const articles = await articleService.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error in GET /api/articles:", error);
      next(error);
    }
  });

  // Route to add a new article MANUALLY via the form
  router.post('/', async (req, res, next) => {
    try {
      const { title, url, source } = req.body;
      console.log("POST /api/articles (manual add) received with body:", req.body);
      if (!title || !url || !source) {
        return res.status(400).json({ error: 'Missing required fields: title, url, source' });
      }
      // Service now handles checking for duplicates before adding
      const newArticle = await articleService.addArticle(title, url, source);
      // If it already existed, service might return the existing one or throw.
      // Assuming it returns the article (new or existing):
      res.status(200).json(newArticle); // 200 OK, might not be 201 Created if it existed
    } catch (error) {
      console.error("Error in POST /api/articles:", error);
       if (error.message.includes("already exists")) {
           return res.status(409).json({ error: error.message }); // 409 Conflict
       }
       if (error.message.includes("Missing required")) {
           return res.status(400).json({ error: error.message });
       }
      next(error);
    }
  });

   // Route to get a specific article by ID (Remains useful)
   router.get('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      console.log(`GET /api/articles/${id} received`);
      const article = await articleService.getArticleById(id);
      if (article) {
        res.json(article);
      } else {
        res.status(404).json({ error: `Article with id ${id} not found` });
      }
    } catch (error) {
      console.error(`Error in GET /api/articles/${id}:`, error);
      next(error);
    }
  });

  return router;
}