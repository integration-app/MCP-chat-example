"use client"

import { useState, useRef } from "react"
import useSWRMutation from "swr/mutation"
import { getAuthHeaders } from "../auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HiUser, HiSparkles } from "react-icons/hi2"
import { useIntegrations } from "@integration-app/react"
import Link from "next/link"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

async function sendMessage(
  url: string,
  { arg }: { arg: { message: string; headers: HeadersInit } }
) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...arg.headers,
    },
    body: JSON.stringify({ message: arg.message }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Failed to send message")
  }
  const data = await res.json()
  return data.response as string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const {
    trigger,
    isMutating,
    error,
  } = useSWRMutation("/api/chat", sendMessage)
  const { integrations } = useIntegrations()
  const hasConnected = integrations && integrations.some(i => i.connection)

  if (!hasConnected) {
    return (
      <div className="flex flex-col items-center min-h-[70vh] px-2 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center tracking-tight">AI Chat Agent</h1>
        <div className="w-full max-w-2xl animate-fade-in flex flex-col rounded-2xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 items-center justify-center min-h-[300px]">
          <div className="text-gray-500 text-center py-12">
            Go to the <Link href="/integrations" className="font-bold text-blue-600 dark:text-blue-400">Integrations page</Link> and sign into an app to use the chat agent.
          </div>
        </div>
      </div>
    )
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setInput("")
    try {
      const response = await trigger({
        message: trimmed,
        headers: getAuthHeaders(),
      })
      setMessages((prev) => [...prev, { role: "assistant", content: response }])
    } catch (err: unknown) {
      let errorMsg = "Error processing message";
      if (typeof err === "object" && err && "message" in err && typeof (err as { message?: unknown }).message === "string") {
        errorMsg = (err as { message: string }).message;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMsg },
      ])
    } finally {
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col items-center min-h-[70vh] px-2 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center tracking-tight">AI Chat Agent</h1>
      <div className="w-full max-w-2xl animate-fade-in flex flex-col rounded-2xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col gap-3 h-[480px] max-h-[60vh] overflow-y-auto border-b border-gray-200 dark:border-gray-800 rounded-t-2xl px-6 py-5 bg-white dark:bg-gray-900">
          {messages.length === 0 && (
            <div className="text-gray-400 text-center">Start the conversation…</div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center shadow">
                  <HiSparkles className="text-blue-500 text-xl dark:text-blue-300" />
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-line text-base shadow-md transition-all duration-200 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none dark:bg-blue-400 dark:text-gray-900"
                    : "bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-300 dark:border-gray-700"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-300 flex items-center justify-center shadow">
                  <HiUser className="text-white dark:text-blue-900 text-lg" />
                </div>
              )}
            </div>
          ))}
          {/* Show modern animated dots when waiting for AI response */}
          {isMutating && messages.length > 0 && (
            <div className="flex items-end gap-2 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center shadow">
                <HiSparkles className="text-blue-500 text-xl dark:text-blue-300" />
              </div>
              <div className="px-4 py-2 rounded-2xl max-w-[80%] bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-300 dark:border-gray-700 shadow-md">
                <span className="inline-flex gap-1">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-end bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 rounded-b-2xl px-6 py-4 mt-auto shadow-inner">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 text-base bg-white dark:bg-gray-900 rounded-xl border-none focus:ring-2 focus:ring-blue-400"
            disabled={isMutating}
          />
          <Button
            onClick={handleSend}
            disabled={isMutating || !input.trim()}
            className="rounded-full px-6 py-2 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 shadow-lg"
          >
            {isMutating ? "Sending..." : "Send"}
          </Button>
        </div>
        {error && (
          <div className="text-red-500 mt-2 text-sm text-center animate-fade-in">{error.message}</div>
        )}
      </div>
    </div>
  )
} 