import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { memoryService } from "./services/memory"

import "./style.css"

// Placeholder key - in production this should be in .env
const GEMINI_KEY = process.env.PLASMO_PUBLIC_GEMINI_KEY || ""

const genAI = new ChatGoogleGenerativeAI({
    apiKey: GEMINI_KEY,
    modelName: "gemini-1.5-flash",
})

interface Message {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    timestamp: Date
}

export default function SidePanel() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm Daemon. Click on any field input to get started, or ask me to recall something from your vault.",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [contextField, setContextField] = useState<{ id: string, label: string } | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Listen for field selection from content script
        const listener = (message: any) => {
            if (message.type === "FIELD_SELECTED") {
                setContextField({ id: message.fieldId, label: message.label })
                handleFieldSelection(message.label)
            }
        }
        chrome.runtime.onMessage.addListener(listener)
        return () => chrome.runtime.onMessage.removeListener(listener)
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleFieldSelection = async (label: string) => {
        // 1. Search Memory
        const memories = await memoryService.search(label)
        const context = memories.map(m => `- ${m.content}`).join("\n")

        // 2. Propose answer
        if (memories.length > 0) {
            addMessage("assistant", `I found some info for '${label}':\n${context}\n\nShall I fill this in?`)
        } else {
            addMessage("assistant", `I don't have information for '${label}' yet. What should I know about this?`)
        }
    }

    const addMessage = (role: "user" | "assistant", content: string) => {
        setMessages(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            role,
            content,
            timestamp: new Date()
        }])
    }

    const handleSend = async () => {
        if (!input.trim()) return
        const userText = input
        setInput("")
        addMessage("user", userText)
        setIsProcessing(true)

        try {
            // Simple RAG pipeline
            const memories = await memoryService.search(userText)
            const context = memories.map(m => m.content).join("\n")

            const response = await genAI.invoke([
                ["system", `You are Daemon, a helpful job application assistant. Use the following context to answer the user's question or draft a response for a form field. Context:\n${context}`],
                ["human", userText]
            ])

            addMessage("assistant", response.content as string)

            // Save new interaction to memory if it looks like a fact
            // logic to identify facts vs chat would go here
            // For now, simple save:
            await memoryService.addMemory(userText, "user-chat", ["chat"])

        } catch (error) {
            addMessage("assistant", `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900 p-4">
            <header className="mb-4 border-b pb-2 flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-600">Daemon</h1>
                <div className="text-xs text-gray-500">
                    {contextField ? `Field: ${contextField.label}` : "Idle"}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4" ref={scrollRef}>
                <AnimatePresence>
                    {messages.map(m => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`p-3 rounded-lg max-w-[85%] ${m.role === "user"
                                    ? "bg-indigo-600 text-white self-end ml-auto"
                                    : "bg-white border shadow-sm self-start"
                                }`}
                        >
                            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isProcessing && (
                    <div className="text-xs text-gray-400 italic">Daemon is thinking...</div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    disabled={isProcessing}
                />
                <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    onClick={handleSend}
                    disabled={isProcessing}
                >
                    Send
                </button>
            </div>
        </div>
    )
}
