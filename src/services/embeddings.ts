import { pipeline, type Pipeline } from "@xenova/transformers"

// Singleton pattern to prevent reloading the model
class EmbeddingsService {
    private static instance: EmbeddingsService
    private pipe: Pipeline | null = null
    private modelName = "Xenova/all-MiniLM-L6-v2"

    private constructor() { }

    public static getInstance(): EmbeddingsService {
        if (!EmbeddingsService.instance) {
            EmbeddingsService.instance = new EmbeddingsService()
        }
        return EmbeddingsService.instance
    }

    private async getPipeline(): Promise<Pipeline> {
        if (!this.pipe) {
            this.pipe = await pipeline("feature-extraction", this.modelName)
        }
        return this.pipe
    }

    public async embed(text: string): Promise<Float32Array> {
        const pipe = await this.getPipeline()
        const output = await pipe(text, { pooling: "mean", normalize: true })
        return output.data as Float32Array
    }
}

export const embeddings = EmbeddingsService.getInstance()
