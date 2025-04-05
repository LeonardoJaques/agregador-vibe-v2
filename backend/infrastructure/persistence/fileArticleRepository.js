import fs from 'fs/promises';
import { ArticleRepositoryPort } from '../../application/ports/articleRepositoryPort.js';
import { Article } from '../../domain/article.js';

export class FileArticleRepository extends ArticleRepositoryPort {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.articlesById = new Map();
        this.articlesByUrl = new Map();
        this.articlesByGuid = new Map();
        this._isInitialized = false;
        this._writeScheduled = false;
        this._writeTimeout = null;
         console.log("[FileArticleRepository] Instantiated.");
    }

    async initialize() {
        // (Initialize logic with logs remains the same as previous version)
        console.log("[FileArticleRepository] initialize() - Iniciando...");
        if (this._isInitialized) {
             console.log("[FileArticleRepository] initialize() - Já inicializado.");
             return;
        }
        console.log(`[FileArticleRepository] initialize() - Lendo de ${this.filePath}...`);
        try {
            await fs.access(this.filePath);
            const data = await fs.readFile(this.filePath, 'utf-8');
            const articlesArray = JSON.parse(data);
            this.articlesById.clear(); this.articlesByUrl.clear(); this.articlesByGuid.clear();

            articlesArray.forEach(articleData => {
                try { // Adicionar try/catch para instanciar cada artigo
                    const article = new Article(
                        articleData.id, articleData.title, articleData.url, articleData.source,
                        articleData.addedAt, articleData.fetchedAt, articleData.contentSnippet,
                        articleData.guid, articleData.aiClassification
                    );
                    this.articlesById.set(article.id, article);
                    if (article.url) this.articlesByUrl.set(article.url, article);
                    if (article.guid) this.articlesByGuid.set(article.guid, article);
                } catch (articleError) {
                     console.warn(`[FileArticleRepository] initialize() - Erro ao instanciar artigo do JSON: ${articleError.message}`, articleData);
                }
            });
            console.log(`[FileArticleRepository] initialize() - Carregados ${this.articlesById.size} artigos de ${this.filePath}.`);

        } catch (error) {
             if (error.code === 'ENOENT') {
                 console.log(`[FileArticleRepository] initialize() - Arquivo ${this.filePath} não encontrado. Iniciando vazio.`);
             } else if (error instanceof SyntaxError) {
                 console.error(`[FileArticleRepository] initialize() - Erro de parse JSON em ${this.filePath}. Iniciando vazio.`, error);
             } else {
                 console.error(`[FileArticleRepository] initialize() - Erro ao ler/parsear ${this.filePath}:`, error);
             }
             this.articlesById.clear(); this.articlesByUrl.clear(); this.articlesByGuid.clear();
        }
        this._isInitialized = true;
        console.log("[FileArticleRepository] initialize() - Finalizado.");
    }

    /**
     * Schedules the data saving operation with debouncing.
     */
    async _scheduleSaveData() {
        console.log("[FileArticleRepository] _scheduleSaveData() - Chamado."); // Log: Schedule foi chamado
        if (!this._isInitialized) {
             console.warn("[FileArticleRepository] _scheduleSaveData() - Repositório não inicializado. Save ignorado.");
             return;
        }

        // Clear existing timeout to debounce
        if (this._writeTimeout) {
            console.log("[FileArticleRepository] _scheduleSaveData() - Debouncing: Limpando timeout anterior.");
            clearTimeout(this._writeTimeout);
        }

        console.log("[FileArticleRepository] _scheduleSaveData() - Agendando escrita para daqui a 500ms.");
        this._writeTimeout = setTimeout(async () => {
            console.log("[FileArticleRepository] _scheduleSaveData() - Timeout executado."); // Log: Timeout iniciou
            if (this._writeScheduled) {
                console.log("[FileArticleRepository] _scheduleSaveData() - Escrita já em progresso, reagendando...");
                // Reschedule if another write was already in progress when timeout fired
                // This might happen in extreme rapid fire cases, though unlikely with 500ms debounce
                this._writeTimeout = null; // Clear current handle before rescheduling
                this._scheduleSaveData();
                return;
            }

            this._writeScheduled = true; // Mark as writing
            const articlesToSave = this.articlesById.size; // Get size before potential modifications
            console.log(`[FileArticleRepository] _scheduleSaveData() - Iniciando escrita de ${articlesToSave} artigos para ${this.filePath}...`);
            try {
                const articlesArray = Array.from(this.articlesById.values());
                const data = JSON.stringify(articlesArray, null, 2);

                const tempFilePath = this.filePath + '.tmp';
                console.log(`[FileArticleRepository] _scheduleSaveData() - Escrevendo para arquivo temporário: ${tempFilePath}`);
                await fs.writeFile(tempFilePath, data, 'utf-8');
                console.log(`[FileArticleRepository] _scheduleSaveData() - Renomeando ${tempFilePath} para ${this.filePath}`);
                await fs.rename(tempFilePath, this.filePath);

                console.log(`[FileArticleRepository] _scheduleSaveData() - DADOS SALVOS COM SUCESSO em ${this.filePath}.`);
            } catch (error) {
                // **** Log Detalhado do Erro de Escrita ****
                console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
                console.error(`[FileArticleRepository] _scheduleSaveData() - ERRO AO SALVAR ARQUIVO ${this.filePath}:`, error);
                console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
                // Possíveis causas: Permissões de escrita na pasta 'data/', disco cheio, etc.
            } finally {
                 console.log("[FileArticleRepository] _scheduleSaveData() - Finalizando operação de escrita (finally).");
                 this._writeScheduled = false; // Mark write as complete
                 this._writeTimeout = null; // Clear timeout handle
            }
        }, 500); // Debounce time in milliseconds
    }

    /**
     * Saves a single article.
     */
    async save(article) {
        console.log(`[FileArticleRepository] save() - Tentando salvar artigo ID: ${article?.id}`);
        // ** Adicionado verificação de inicialização **
        if (!this._isInitialized) {
             console.warn("[FileArticleRepository] save() - Repositório não inicializado, chamando initialize() primeiro...");
             await this.initialize();
        }
        if (!article || !article.id) {
            console.error("[FileArticleRepository] save() - Tentativa de salvar artigo inválido ou sem ID.", article);
            throw new Error("Article must be valid and have an ID to be saved.");
        }

        // Update maps
        this.articlesById.set(article.id, article);
        if (article.url) this.articlesByUrl.set(article.url, article);
        if (article.guid) this.articlesByGuid.set(article.guid, article);
        console.log(`[FileArticleRepository] save() - Artigo ID: ${article.id} atualizado no Map. Agendando escrita.`);

        await this._scheduleSaveData(); // Schedule save
        return article;
    }

    /**
     * Saves multiple articles.
     */
    async saveMany(articles) {
        console.log(`[FileArticleRepository] saveMany() - Tentando salvar ${articles?.length ?? 0} artigos.`);
         // ** Adicionado verificação de inicialização **
        if (!this._isInitialized) {
            console.warn("[FileArticleRepository] saveMany() - Repositório não inicializado, chamando initialize() primeiro...");
            await this.initialize();
        }
        if (!Array.isArray(articles)) {
             console.error("[FileArticleRepository] saveMany() - Input não é um array.", articles);
             return []; // Retorna vazio se input for inválido
        }

        let savedCount = 0;
        articles.forEach(article => {
             if (!article || !article.id) {
                 console.warn("[FileArticleRepository] saveMany() - Pulando artigo inválido ou sem ID no lote:", article?.title);
                 return; // Pula item inválido
             };
             this.articlesById.set(article.id, article);
             if (article.url) this.articlesByUrl.set(article.url, article);
             if (article.guid) this.articlesByGuid.set(article.guid, article);
             savedCount++;
        });
        console.log(`[FileArticleRepository] saveMany() - ${savedCount}/${articles.length} artigos válidos atualizados no Map.`);
        if (savedCount > 0) {
            console.log("[FileArticleRepository] saveMany() - Agendando escrita para o lote.");
            await this._scheduleSaveData(); // Schedule save if any articles were valid
        }
        return articles.filter(a => a && a.id); // Return only valid articles processed
    }


    async findAll() {
        // (findAll logic with logs remains the same as previous version)
        console.log("[FileArticleRepository] findAll() - Iniciando...");
        if (!this._isInitialized) {
            console.log("[FileArticleRepository] findAll() - Repositório não inicializado, chamando initialize()...");
            await this.initialize();
        }
        console.log(`[FileArticleRepository] findAll() - Recuperando artigos do Map (tamanho: ${this.articlesById.size})...`);
        const articlesArray = Array.from(this.articlesById.values());
        // **** Log Antes de Retornar ****
        console.log(`[FileArticleRepository] findAll() - Retornando array com ${articlesArray.length} artigos.`);
        // **** Fim do Log ****
        return articlesArray;
    }

    async findById(id) {
         if (!this._isInitialized) await this.initialize();
         return this.articlesById.get(id) || null;
     }
    async findByUrl(url) {
         if (!this._isInitialized) await this.initialize();
         return this.articlesByUrl.get(url) || null;
     }
    async findByGuid(guid) {
         if (!this._isInitialized) await this.initialize();
         return this.articlesByGuid.get(guid) || null;
     }

     async deleteById(id) {
         if (!this._isInitialized) await this.initialize();
         const article = this.articlesById.get(id);
         if (article) {
             this.articlesById.delete(id);
             this.articlesByUrl.delete(article.url);
             this.articlesByGuid.delete(article.guid);
             await this._scheduleSaveData();
         }
         return article;
     }
    async deleteByUrl(url) {
         if (!this._isInitialized) await this.initialize();
         const article = this.articlesByUrl.get(url);
         if (article) {
             this.articlesById.delete(article.id);
             this.articlesByUrl.delete(url);
             this.articlesByGuid.delete(article.guid);
             await this._scheduleSaveData();
         }
         return article;
     }
    async deleteByGuid(guid) {
         if (!this._isInitialized) await this.initialize();
         const article = this.articlesByGuid.get(guid);
         if (article) {
             this.articlesById.delete(article.id);
             this.articlesByUrl.delete(article.url);
             this.articlesByGuid.delete(guid);
             await this._scheduleSaveData();
         }
         return article;
     }
    async deleteAll() {
        if (!this._isInitialized) await this.initialize();
        this.articlesById.clear();
        this.articlesByUrl.clear();
        this.articlesByGuid.clear();
        await this._scheduleSaveData();
    }
}
