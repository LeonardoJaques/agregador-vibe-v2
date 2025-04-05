import Parser from 'rss-parser';
import { v4 as uuidv4_fetcher } from 'uuid'; // Renomeado
import { Article as DomainArticle_Fetcher } from '../domain/article.js'; // Renomeado

const MAX_ARTICLES_TO_PROCESS_AI_FETCHER = 10; // Renomeado

export class NewsFetcherService {
    constructor(articleRepository, sourceService, aiService) {
        this.articleRepository = articleRepository;
        this.sourceService = sourceService;
        this.aiService = aiService;
        this.parser = new Parser();
    }

    async fetchFromSource(feedUrl, sourceName) {
        console.log(`[NewsFetcherService] Fetching news from ${sourceName} (${feedUrl})...`);
        try {
            const feed = await this.parser.parseURL(feedUrl);
            console.log(`[NewsFetcherService] Parsed feed: ${feed.title} (${feed.items.length} items)`);
            const potentialArticlesData = feed.items.map(item => {
                const title = item.title?.trim(); const url = item.link?.trim(); const guid = item.guid || url;
                const fetchedAt = item.isoDate ? new Date(item.isoDate) : new Date();
                const contentSnippet = item.contentSnippet || item.content || null;
                if (!title || !url) { console.warn(`[NewsFetcherService] Skipping item from ${sourceName}...`); return null; }
                return { title, url, sourceName, fetchedAt, contentSnippet, guid };
            }).filter(articleData => articleData !== null);
            return potentialArticlesData;
        } catch (error) { console.error(`[NewsFetcherService] Error fetching/parsing ${sourceName}:`, error.message); return []; }
    }

    async fetchAllSources() {
        const sources = await this.sourceService.getAllSources();
        if (!sources || sources.length === 0) { console.warn("[NewsFetcherService] No sources..."); return; }
        console.log(`[NewsFetcherService] Starting fetch for ${sources.length} sources...`);
        let allPotentialArticlesData = [];
        for (const source of sources) {
             const sourceArticlesData = await this.fetchFromSource(source.url, source.name);
             allPotentialArticlesData.push(...sourceArticlesData);
        }
        console.log(`[NewsFetcherService] Total potential articles: ${allPotentialArticlesData.length}`);
        allPotentialArticlesData.sort((a, b) => (b?.fetchedAt?.getTime() ?? 0) - (a?.fetchedAt?.getTime() ?? 0));
        console.log("[NewsFetcherService] Sorted potential articles.");
        const articlesToProcess = allPotentialArticlesData.slice(0, MAX_ARTICLES_TO_PROCESS_AI_FETCHER);
        console.log(`[NewsFetcherService] Limited to ${articlesToProcess.length} for processing.`);
        let newArticlesAddedCount = 0;
        const articlesToAdd = [];
        for (const articleData of articlesToProcess) {
            let existing = null;
            if (articleData.guid) { existing = await this.articleRepository.findByGuid(articleData.guid); }
            if (!existing && articleData.url) { existing = await this.articleRepository.findByUrl(articleData.url); }
            if (!existing) {
                let classification = null; let relevanceScore = null;
                if (this.aiService) {
                    try {
                        console.log(`[NewsFetcherService] Requesting AI processing for: "${articleData.title.substring(0,30)}..."`);
                        [classification, relevanceScore] = await Promise.all([
                            this.aiService.getClassificationForArticle({ title: articleData.title, contentSnippet: articleData.contentSnippet }),
                            this.aiService.getRelevanceScoreForArticle({ title: articleData.title, contentSnippet: articleData.contentSnippet })
                        ]);
                        console.log(`[NewsFetcherService] AI results - Class: ${classification}, Score: ${relevanceScore}`);
                    } catch (aiError) { console.error(`[NewsFetcherService] AI Service failed for "${articleData.title.substring(0,30)}...":`, aiError); }
                } else { console.log(`[NewsFetcherService] Skipping AI for "${articleData.title.substring(0,30)}..."`); }
                const newArticle = new DomainArticle_Fetcher(
                    uuidv4_fetcher(), articleData.title, articleData.url, articleData.sourceName, new Date(),
                    articleData.fetchedAt, articleData.contentSnippet, articleData.guid, classification, relevanceScore
                );
                articlesToAdd.push(newArticle); newArticlesAddedCount++;
            }
        }
        if (articlesToAdd.length > 0) {
            console.log(`[NewsFetcherService] Saving ${articlesToAdd.length} new articles...`);
            try { await this.articleRepository.saveMany(articlesToAdd); console.log(`[NewsFetcherService] Saved ${articlesToAdd.length} new articles.`); }
            catch(saveError) { console.error("[NewsFetcherService] Error saving batch:", saveError); }
        } else { console.log(`[NewsFetcherService] No new articles found in top ${MAX_ARTICLES_TO_PROCESS_AI_FETCHER}.`); }
        console.log(`[NewsFetcherService] Fetch cycle completed. New articles added: ${newArticlesAddedCount}`);
    }
}