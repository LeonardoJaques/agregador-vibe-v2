import { v4 as uuidv4 } from 'uuid'; // Importa a função para gerar IDs únicos

export class Source {
    /**
     * Construtor para a classe Source.
     * @param {string|null} id - O ID único da fonte (será gerado se for null).
     * @param {string} name - O nome da fonte (ex: "Blog de Tecnologia X").
     * @param {string} url - A URL do feed RSS/Atom.
     */
    constructor(id, name, url) {
        // Validação básica dos campos obrigatórios
        if (!name || !url) {
            throw new Error("Source requires name and url."); // Fonte requer nome e url.
        }

        // Garante que a fonte tenha um ID, gerando um se não for fornecido
        this.id = id || uuidv4();
        this.name = name;
        this.url = url; // URL do feed RSS/Atom

        // Validação básica do formato da URL
        try {
            new URL(this.url);
        } catch (_) {
            // Lança um erro se a URL não for válida
            throw new Error(`Invalid URL format for source: ${this.url}`);
        }
    }
}
