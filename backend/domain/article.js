export class Article {
  constructor(id, title, url, source, addedAt = new Date(), fetchedAt = new Date(), contentSnippet = null, guid = null) {
    // ** Removed '!id ||' from the check **
    // ID can be null/undefined during initial creation from feed,
    // it will be assigned before saving if the article is new.
    if (!title || !url || !source) {
      // Still require title, url, and source for a valid article concept
      throw new Error("Article requires title, url, and source.");
    }
    this.id = id; // Internal unique ID (UUID) - can be initially null
    this.title = title;
    this.url = url; // Original article URL (link from feed)
    this.source = source; // Name of the news source (e.g., 'G1', 'Tecnoblog')
    this.addedAt = addedAt instanceof Date ? addedAt : new Date(addedAt); // When it was added to *our* system
    this.fetchedAt = fetchedAt instanceof Date ? fetchedAt : new Date(fetchedAt); // When it was fetched from the source
    this.contentSnippet = contentSnippet; // Optional snippet from feed
    this.guid = guid; // Optional unique identifier from feed (often the URL itself)
  }
}