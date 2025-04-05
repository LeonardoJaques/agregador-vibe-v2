// 1. Imports Primeiro
import dotenv from 'dotenv';
import express from 'express'; // Importar apenas uma vez
import cors from 'cors';
import fs from 'fs/promises'; // Usar fs.promises diretamente
import path from 'path';
import { fileURLToPath } from 'url';
// import { fileURLToPath } from 'url'; // Para obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (one level up)
dotenv.config({ path: path.join(__dirname, '../.env') });

// Importar Rotas
import articleRoutes from './infrastructure/web/articleRoutes.js';
import sourceRoutes from './infrastructure/web/sourceRoutes.js';

// Importar Repositórios
import { FileArticleRepository } from './infrastructure/persistence/fileArticleRepository.js';
import { FileSourceRepository } from './infrastructure/persistence/fileSourceRepository.js';

// Importar Serviços
import { ArticleService } from './application/articleService.js';
import { NewsFetcherService } from './application/newsFetcherService.js';
import { SourceService } from './application/sourceService.js';
import { AIService } from './application/aiService.js';

// Importar Configuração
import config from './config.js';

// 2. Constantes e Configurações Globais
const PORT = process.env.PORT || 3001;
// Definir __dirname (necessário para path.join em ES modules se precisar de caminhos relativos ao arquivo atual)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// Definir DATA_DIR APÓS importar config e path
const DATA_DIR = path.resolve(path.dirname(config.dataFile)); // Usar path.resolve para caminho absoluto

// 3. Inicialização do App Express
const app = express();

// 4. Middleware (Aplicar uma vez)
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Habilitar parsing de JSON no body
// Servir arquivos estáticos (ex: imagens) da pasta 'public' dentro de 'data/' - se necessário
// Certifique-se que DATA_DIR está definido corretamente antes desta linha
// const publicPath = path.join(DATA_DIR, 'public');
// console.log(`Serving static files from: ${publicPath}`); // Log para debug
// app.use(express.static(publicPath));

// 5. Injeção de Dependências
const googleAiApiKey = process.env.GOOGLE_AI_API_KEY;
let aiService = null;
try {
    aiService = new AIService(googleAiApiKey);
    if (!googleAiApiKey) {
        console.warn("!!! GOOGLE_AI_API_KEY not found in .env file. AI classification will be disabled. !!!");
    }
} catch (error) {
    console.error("!!! CRITICAL ERROR: Failed to instantiate AIService !!!", error);
    aiService = null; // Garante que seja null em caso de erro
}

const articleRepository = new FileArticleRepository(config.dataFile);
const sourceRepository = new FileSourceRepository(config.sourcesFile, config.defaultSources);
const articleService = new ArticleService(articleRepository);
const sourceService = new SourceService(sourceRepository);
const newsFetcherService = new NewsFetcherService(articleRepository, sourceService, aiService);

// 6. Rotas da API
app.use('/api/articles', articleRoutes(articleService));
app.use('/api/sources', sourceRoutes(sourceService));

// 7. Tratamento Global de Erros (Manter no final)
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack || err);
    res.status(err.status || 500).send({ error: err.message || 'Something went wrong!' });
});

// 8. Função de Inicialização e Start do Servidor
async function ensureDataDirectoryExists() {
    try {
        // fs.promises.mkdir com recursive: true já lida com diretório existente
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`Data directory ensured at: ${DATA_DIR}`);
    } catch (error) {
        console.error(`Error ensuring data directory exists at ${DATA_DIR}:`, error);
        // Considerar lançar o erro para impedir o start se for crítico
        throw error;
    }
}

async function startServer() {
    try {
        // 1. Garantir que o diretório de dados existe
        await ensureDataDirectoryExists();

        // 2. **ESSENCIAL: Inicializar repositórios (carregar dados)**
        console.log("Initializing repositories...");
        await sourceRepository.initialize();
        await articleRepository.initialize();
        console.log("Repositories initialized.");

        // 3. **ESSENCIAL: Buscar notícias iniciais**
        console.log("Performing initial news fetch...");
        await newsFetcherService.fetchAllSources();
        console.log("Initial news fetch complete.");

        // 4. Iniciar o servidor Express para escutar requisições
        app.listen(PORT, async () => {
            const currentSources = await sourceService.getAllSources(); // Get current sources for logging
            console.log("-----------------------------------------------------");
            console.log(`Backend server running at http://localhost:${PORT}`);
            console.log(`Articles persisted in: ${config.dataFile}`);
            console.log(`Sources managed in: ${config.sourcesFile}`);
            console.log(`Fetching news from: ${currentSources.map(s => s.name).join(', ') || 'No sources configured'}`);
            console.log("-----------------------------------------------------");
        });

    } catch (error) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!! FAILED TO START SERVER !!!", error);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        process.exit(1); // Sair se a inicialização falhar
    }
}

// Iniciar o servidor
startServer();
