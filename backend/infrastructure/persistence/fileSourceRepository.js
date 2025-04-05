import fs from 'fs/promises';
import path from 'path';
import { SourceRepositoryPort } from '../../application/ports/sourceRepositoryPort.js';
import { Source } from '../../domain/source.js'; // Import Source domain object
import { v4 as uuidv4 } from 'uuid'; // For generating IDs if needed

export class FileSourceRepository extends SourceRepositoryPort {
    constructor(filePath, defaultSources = []) {
        super();
        this.filePath = filePath;
        this.defaultSources = defaultSources; // Default sources to add if file is empty/new
        // Use Maps for efficient in-memory operations
        this.sourcesById = new Map();
        this.sourcesByUrl = new Map();
        this._isInitialized = false;
        this._writeScheduled = false;
        this._writeTimeout = null;
    }

    /**
     * Loads sources from the JSON file. Adds defaults if file doesn't exist or is empty.
     */
    async initialize() {
        if (this._isInitialized) return;
        console.log(`Initializing FileSourceRepository from ${this.filePath}...`);
        let sourcesArray = [];
        let loadedFromFile = false;
        try {
            await fs.access(this.filePath);
            const data = await fs.readFile(this.filePath, 'utf-8');
            // Handle empty file case
            if (data.trim() === '') {
                 console.log(`Source file ${this.filePath} is empty.`);
                 sourcesArray = [];
            } else {
                 sourcesArray = JSON.parse(data);
            }
            loadedFromFile = true;
            console.log(`Loaded ${sourcesArray.length} sources from ${this.filePath}.`);

        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`Source file ${this.filePath} not found. Will use defaults.`);
                sourcesArray = []; // Start empty, defaults will be added below
            } else if (error instanceof SyntaxError) {
                 console.error(`Error parsing JSON from ${this.filePath}. Check file content. Starting empty.`, error);
                 sourcesArray = []; // Start empty on parse error
            } else {
                console.error(`Error reading or parsing source file ${this.filePath}:`, error);
                sourcesArray = []; // Start empty on other errors
            }
        }

        // If file was empty or didn't exist, add default sources
        if (sourcesArray.length === 0 && this.defaultSources.length > 0) {
             console.log(`Adding ${this.defaultSources.length} default sources.`);
             // Ensure default sources have IDs
             sourcesArray = this.defaultSources.map(s => ({ ...s, id: s.id || uuidv4() }));
             // Schedule a save to persist the defaults immediately
             // Note: Need to populate maps before scheduling save
        }

        // Populate in-memory maps
        this.sourcesById.clear();
        this.sourcesByUrl.clear();
        sourcesArray.forEach(sourceData => {
            try {
                 // Re-instantiate Source objects
                const source = new Source(
                    sourceData.id || uuidv4(), // Ensure ID exists
                    sourceData.name,
                    sourceData.url
                );
                this.sourcesById.set(source.id, source);
                if (source.url) this.sourcesByUrl.set(source.url, source);
            } catch(instantiationError){
                 console.warn(`Skipping invalid source data during load: ${JSON.stringify(sourceData)} - Error: ${instantiationError.message}`);
            }
        });

        this._isInitialized = true;
        console.log(`Repository initialized with ${this.sourcesById.size} sources.`);

        // If we loaded defaults because the file was missing/empty, save them now
        if (!loadedFromFile && this.sourcesById.size > 0) {
             console.log("Persisting default sources...");
             await this._scheduleSaveData(); // Save the newly added defaults
        }
    }

    /**
     * Saves the current state of in-memory sources to the JSON file.
     * (Similar debouncing/atomic write logic as FileArticleRepository)
     */
    async _scheduleSaveData() {
        if (!this._isInitialized) { console.warn("Source repo not initialized. Skipping save."); return; }
        if (this._writeTimeout) clearTimeout(this._writeTimeout);
        this._writeTimeout = setTimeout(async () => {
            if (this._writeScheduled) { this._scheduleSaveData(); return; }
            this._writeScheduled = true;
            console.log(`Debounced save: Writing ${this.sourcesById.size} sources to ${this.filePath}...`);
            try {
                const sourcesArray = Array.from(this.sourcesById.values());
                const data = JSON.stringify(sourcesArray, null, 2);
                const tempFilePath = this.filePath + '.tmp';
                await fs.writeFile(tempFilePath, data, 'utf-8');
                await fs.rename(tempFilePath, this.filePath);
                console.log(`Successfully saved sources data to ${this.filePath}.`);
            } catch (error) {
                console.error(`Error saving sources data to ${this.filePath}:`, error);
            } finally {
                 this._writeScheduled = false;
                 this._writeTimeout = null;
            }
        }, 500); // Debounce time
    }

    async save(source) {
        if (!this._isInitialized) await this.initialize();
        // Ensure source has an ID (Source constructor should handle this now)
        if (!source.id) {
             source.id = uuidv4(); // Assign ID if somehow missing
             console.warn(`Source object missing ID during save, assigned new ID: ${source.id}`);
        }
        console.log(`Saving source to file repo: ${source.id} - ${source.name}`);
        this.sourcesById.set(source.id, source);
        if (source.url) this.sourcesByUrl.set(source.url, source);
        await this._scheduleSaveData();
        return source;
    }

    async findAll() {
        if (!this._isInitialized) await this.initialize();
        console.log("Retrieving all sources from file repo (in-memory)...");
        return Array.from(this.sourcesById.values());
    }

    async findById(id) {
        if (!this._isInitialized) await this.initialize();
        return this.sourcesById.get(id) || null;
    }

    async findByUrl(url) {
        if (!this._isInitialized) await this.initialize();
        return this.sourcesByUrl.get(url) || null;
    }
     async delete(id) { 
        if (!this._isInitialized) await this.initialize();
        const source = this.sourcesById.get(id);
        if (source) {
            this.sourcesById.delete(id);
            if (source.url) this.sourcesByUrl.delete(source.url);
            await this._scheduleSaveData();
            return source;
        }
        return null; // Not found
      }
}