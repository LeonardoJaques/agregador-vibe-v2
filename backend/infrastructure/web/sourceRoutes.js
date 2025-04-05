import express from 'express';

export default function sourceRoutes(sourceService) {
  const router = express.Router();

  // Route to get all sources
  router.get('/', async (req, res, next) => {
    try {
      console.log("GET /api/sources received");
      const sources = await sourceService.getAllSources();
      res.json(sources);
    } catch (error) {
      console.error("Error in GET /api/sources:", error);
      next(error); // Pass to global error handler
    }
  });

  // Route to add a new source
  router.post('/', async (req, res, next) => {
    try {
      const { name, url } = req.body;
      console.log("POST /api/sources received with body:", req.body);
      if (!name || !url) {
        // Use a specific error object for client errors
        const err = new Error('Missing required fields: name, url');
        err.status = 400; // Bad Request
        throw err;
      }
      // Service handles checking for duplicates and saving
      const newSource = await sourceService.addSource(name, url);
      // Determine status code based on whether it was newly created or existing
      // For simplicity, always return 200 OK with the source data here
      // A more strict approach would return 201 Created only if new.
      res.status(200).json(newSource);
    } catch (error) {
      console.error("Error in POST /api/sources:", error);
      // Let the global error handler manage status codes based on error properties
      next(error);
    }
  });

  // Optional: Add routes for GET /:id, PUT /:id, DELETE /:id later

  return router;
}