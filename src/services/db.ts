import Dexie, { type Table } from "dexie"

export interface StaticProfile {
    id?: number
    firstName: string
    lastName: string
    email: string
    phone: string
    urls: {
        linkedin?: string
        github?: string
        portfolio?: string
        [key: string]: string | undefined
    }
    education: Array<{
        institution: string
        degree: string
        year: string
    }>
    experience: Array<{
        company: string
        role: string
        duration: string
        description: string
    }>
}

export interface SemanticMemory {
    id?: number
    content: string
    embedding: Float32Array // Using Float32Array for compatibility with Voy/Transformers
    tags: string[]
    context: string // Source URL or origin
    createdAt: Date
}

export class DaemonDB extends Dexie {
    staticProfile!: Table<StaticProfile>
    semanticMemory!: Table<SemanticMemory>

    constructor() {
        super("DaemonDB")
        this.version(1).stores({
            staticProfile: "++id, email",
            semanticMemory: "++id, *tags, context" // tags are multi-valued index
        })
    }
}

export const db = new DaemonDB()
