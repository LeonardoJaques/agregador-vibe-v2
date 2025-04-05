// ** MODIFIED: Removed newsSources, added sourcesFile **
export default {
    // Path to the JSON file for storing articles
    dataFile: './data/articles.json',
    // Path to the JSON file for storing news sources (feeds)
    sourcesFile: './data/sources.json', // New config for sources file
    // Default sources to add if sources.json doesn't exist or is empty
    defaultSources: [
        { id: 'default-1', name: "G1 Tecnologia", url: "https://g1.globo.com/rss/g1/tecnologia/" },
        { id: 'default-2', name: "Tecnoblog", url: "https://tecnoblog.net/feed/" },
    ],
    // Optional: Cron schedule for automatic fetching
    fetchSchedule: null
};