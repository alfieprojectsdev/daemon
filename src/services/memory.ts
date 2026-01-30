import { Voy } from "voy-search"
import { db, type SemanticMemory } from "./db"
import { embeddings } from "./embeddings"

class MemoryService {
    private voy: Voy | null = null
    private isInitialized = false

    async init() {
        if (this.isInitialized) return

        // Load existing memories from Dexie into Voy index?
        // Voy is in-memory, so we need to rebuild existing index or load a serialized one.
        // For now, let's just load all memories from Dexie on init.
        // Optimization: Store serialized index in IndexedDB later.

        const memories = await db.semanticMemory.toArray()

        // Voy expects : { id: string, title?: string, url?: string, embeddings: number[] }[]
        const resources = memories.map(m => ({
            id: String(m.id),
            title: m.content,
            url: m.context,
            embeddings: Array.from(m.embedding)
        }))

        this.voy = new Voy(resources)
        this.isInitialized = true
    }

    async addMemory(content: string, context: string, tags: string[] = []) {
        if (!this.isInitialized) await this.init()

        const embedding = await embeddings.embed(content)

        // 1. Save to Dexie (Persistent)
        const id = await db.semanticMemory.add({
            content,
            embedding,
            tags,
            context,
            createdAt: new Date()
        })

        // 2. Add to Voy (In-Memory)
        this.voy?.add({
            id: String(id),
            title: content,
            url: context,
            embeddings: Array.from(embedding)
        })

        return id
    }

    async search(query: string, limit = 5) {
        if (!this.isInitialized) await this.init()

        const queryEmbedding = await embeddings.embed(query)

        // Voy search
        // ensure queue embedding is array of numbers
        const results = this.voy?.search(Array.from(queryEmbedding), limit)

        if (!results) return []

        // Retrieve full objects from Dexie based on IDs returned by Voy
        // results is { id: string, score: number, ... }
        const ids = results.results.map(r => Number(r.id))
        const memories = await db.semanticMemory.bulkGet(ids)

        return memories.filter(Boolean) as SemanticMemory[]
    }
}

export const memoryService = new MemoryService()
