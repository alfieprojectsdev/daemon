import cssText from "data-text:~/style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    all_frames: true
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

interface DetectedField {
    id: string
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    rect: DOMRect
}

const DOMScanner = () => {
    const [fields, setFields] = useState<DetectedField[]>([])

    useEffect(() => {
        const scan = () => {
            const inputs = Array.from(document.querySelectorAll("input, textarea, select")) as (
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement
            )[]

            const visibleInputs = inputs.filter((el) => {
                const rect = el.getBoundingClientRect()
                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    el.type !== "hidden" &&
                    el.type !== "submit" &&
                    el.type !== "button"
                )
            })

            const newFields = visibleInputs.map((el, index) => ({
                id: el.id || `daemon-field-${index}`,
                element: el,
                rect: el.getBoundingClientRect()
            }))

            setFields(newFields)
        }

        scan()

        const observer = new MutationObserver((mutations) => {
            // Debounce or just rescan
            scan()
        })

        observer.observe(document.body, { childList: true, subtree: true })

        // Also listen for resize/scroll to update positions
        window.addEventListener("resize", scan)
        window.addEventListener("scroll", scan, { capture: true, passive: true })

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", scan)
            window.removeEventListener("scroll", scan)
        }
    }, [])

    return (
        <>
            {fields.map((field) => (
                <DaemonTrigger key={field.id} field={field} />
            ))}
        </>
    )
}

const DaemonTrigger = ({ field }: { field: DetectedField }) => {
    const [hover, setHover] = useState(false)

    // Position the trigger on the right side of the input
    const buttonStyle: React.CSSProperties = {
        position: "absolute",
        top: field.rect.top + window.scrollY + 2,
        left: field.rect.right + window.scrollX - 24, // Inside the input, right aligned
        width: "20px",
        height: "20px",
        zIndex: 9999,
        cursor: "pointer",
        backgroundColor: hover ? "#4f46e5" : "#e0e7ff",
        borderRadius: "50%",
        border: "1px solid #4f46e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        pointerEvents: "auto"
    }

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Open Side Panel logic here later
        // For now we rely on the user opening it or sending a message
        console.log("Daemon triggering for field", field.id)

        // Send message to extension to open sidepanel or set context
        chrome.runtime.sendMessage({
            type: "FIELD_SELECTED",
            fieldId: field.id,
            label: field.element.getAttribute("aria-label") || field.element.name || ""
        })
    }

    return (
        <div
            style={buttonStyle}
            onClick={handleClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            title="Ask Daemon"
        >
            D
        </div>
    )
}

export default DOMScanner
