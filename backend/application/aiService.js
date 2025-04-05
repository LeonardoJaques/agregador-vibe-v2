import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const CATEGORIES = ["Tecnologia", "Política", "Economia", "Esportes", "Entretenimento", "Mundo", "Brasil", "Saúde", "Ciência", "Outros"];
const DEFAULT_RELEVANCE = 5; // Default score if AI fails or returns invalid

export class AIService {
    constructor(apiKey) {
        if (!apiKey) {
            console.warn("AIService initialized without API key. AI features will be skipped.");
            this.genAI = null;
            this.model = null;
            return;
        }
        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
            console.log("AIService initialized with Google AI model.");
        } catch (initError) {
             console.error("Error initializing GoogleGenerativeAI:", initError);
             this.genAI = null;
             this.model = null;
             throw initError; // Allow server.js to catch this
        }
    }

    /**
     * Generates a classification category.
     */
    async getClassificationForArticle({ title, contentSnippet }) {
        if (!this.model) return null;
        if (!title) return null;

        const textToClassify = contentSnippet ? `${title}. ${contentSnippet}` : title;
        const truncatedText = textToClassify.substring(0, 1000);
        const prompt = `Classifique a seguinte notícia em UMA das seguintes categorias: ${CATEGORIES.join(", ")}. Retorne APENAS o nome da categoria. Notícia: "${truncatedText}"\n\nCategoria:`;
        console.log(`[AIService] Requesting classification for: "${title.substring(0, 50)}..."`);
        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const classification = response.text()?.trim();
            if (classification && CATEGORIES.includes(classification)) {
                console.log(`[AIService] Classification successful: "${classification}"`);
                return classification;
            } else {
                 console.warn(`[AIService] Unexpected classification: "${classification}". Defaulting to "Outros".`);
                 return "Outros";
            }
        } catch (error) {
            console.error(`[AIService] Error calling Google AI API for classification: ${error.message}`);
            return null;
        }
    }

    /**
     * Generates a relevance score (1-10) for a given article.
     * @param {object} articleData - Object containing article title and snippet.
     * @param {string} articleData.title - The article title.
     * @param {string} [articleData.contentSnippet] - The article snippet (optional).
     * @returns {Promise<number|null>} The relevance score (1-10) or null if failed/disabled.
     */
    async getRelevanceScoreForArticle({ title, contentSnippet }) {
        if (!this.model) {
            console.log("[AIService] AI model not available, skipping relevance scoring.");
            return null;
        }
        if (!title) {
            console.warn("[AIService] Article title is missing, skipping relevance scoring.");
            return null;
        }

        const textToScore = contentSnippet ? `${title}. ${contentSnippet}` : title;
        const truncatedText = textToScore.substring(0, 1000); // Limit input length

        // Prompt for relevance scoring
        const prompt = `Avalie a relevância geral ou o impacto desta notícia em uma escala de 1 a 10, onde 1 é pouco relevante e 10 é muito relevante/impactante. Considere fatores como abrangência, importância e atualidade. Retorne APENAS o número da pontuação (1 a 10). Notícia: "${truncatedText}"\n\nPontuação de Relevância (1-10):`;

        console.log(`[AIService] Requesting relevance score for: "${title.substring(0, 50)}..."`);

        try {
            const generationConfig = {
                // temperature: 0.2, // Lower temperature for more factual/constrained output
                maxOutputTokens: 5, // Limit response length to a number
            };
            // Safety settings can be reused or adjusted if needed

            const result = await this.model.generateContent(
                 prompt,
                 // generationConfig // Uncomment if needed
            );
            const response = result.response;
            const scoreText = response.text()?.trim();
            const score = parseInt(scoreText, 10);

            // Validate the score
            if (!isNaN(score) && score >= 1 && score <= 10) {
                console.log(`[AIService] Relevance score successful: ${score} for "${title.substring(0, 50)}..."`);
                return score;
            } else {
                 console.warn(`[AIService] AI returned invalid score: "${scoreText}". Defaulting to ${DEFAULT_RELEVANCE}.`);
                 return DEFAULT_RELEVANCE; // Return default if parsing fails or out of range
            }

        } catch (error) {
            console.error(`[AIService] Error calling Google AI API for relevance score: ${error.message}`);
            return null; // Return null on API error
        }
    }
}