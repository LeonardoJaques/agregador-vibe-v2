const MAX_ARTICLES_TO_RETURN = 10;

export class ArticleService {
  constructor(articleRepository) {
    // Log para verificar se o repositório foi injetado corretamente
    console.log("[ArticleService] Constructor - articleRepository received:", !!articleRepository);
    this.articleRepository = articleRepository;
  }

  async addArticle(title, url, source) { /* ... unchanged ... */ }

  async getAllArticles() {
    console.log(`[ArticleService] getAllArticles - Iniciando (limit ${MAX_ARTICLES_TO_RETURN})...`);
    // Log para verificar o repositório novamente no momento da chamada
    console.log("[ArticleService] getAllArticles - Checking this.articleRepository:", !!this.articleRepository);

    let allArticles = undefined; // Iniciar como undefined para testar a lógica

    try {
        // Verificar se o método findAll existe antes de chamar
        if (!this.articleRepository || typeof this.articleRepository.findAll !== 'function') {
            console.error("[ArticleService] getAllArticles - Erro: articleRepository ou método findAll não está disponível!");
            return []; // Retorna vazio se o repositório for inválido
        }
        console.log("[ArticleService] getAllArticles - Chamando articleRepository.findAll()...");
        allArticles = await this.articleRepository.findAll();
        // **** Log Imediatamente Após o Await ****
        console.log("[ArticleService] getAllArticles - Resultado bruto de findAll():", allArticles);
        // **** Fim do Log ****
    } catch (repoError) {
         console.error("[ArticleService] getAllArticles - Erro ao chamar findAll() do repositório:", repoError);
         return []; // Retorna vazio em caso de erro no repositório
    }

    // Verificação de Array (mantida da v7)
    if (!Array.isArray(allArticles)) {
        console.error("[ArticleService] getAllArticles - Resultado de findAll() NÃO é um array. Retornando []. Valor recebido:", allArticles);
        return [];
    }
    console.log(`[ArticleService] getAllArticles - findAll() retornou um array com ${allArticles.length} itens.`);

    // Ordenação (onde o erro ocorria)
    try {
        console.log("[ArticleService] getAllArticles - Tentando ordenar os artigos...");
        // A linha abaixo era a linha 44 aproximada onde o erro ocorria
        allArticles.sort((a, b) => {
            const dateA = a?.addedAt ? new Date(a.addedAt).getTime() : 0;
            const dateB = b?.addedAt ? new Date(b.addedAt).getTime() : 0;
            // Verificar se as datas são válidas (não NaN)
            if (isNaN(dateA) || isNaN(dateB)) {
                console.warn(`[ArticleService] getAllArticles - Data inválida encontrada durante a ordenação:`, { a_addedAt: a?.addedAt, b_addedAt: b?.addedAt });
                // Tratar NaN para evitar comportamento imprevisível na ordenação
                return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
            }
            return dateB - dateA;
        });
        console.log("[ArticleService] getAllArticles - Artigos ordenados com sucesso.");
    } catch (sortError) {
         // Capturar erro específico da ordenação, se ocorrer
         console.error("[ArticleService] getAllArticles - Erro durante a ordenação:", sortError);
         // Poderia retornar a lista não ordenada ou vazia
         return allArticles.slice(0, MAX_ARTICLES_TO_RETURN); // Tenta retornar os 10 primeiros mesmo sem ordenar
    }


    // Aplicar o limite
    const limitedArticles = allArticles.slice(0, MAX_ARTICLES_TO_RETURN);

    console.log(`[ArticleService] getAllArticles - Retornando ${limitedArticles.length} artigos.`);
    return limitedArticles;
  }
}