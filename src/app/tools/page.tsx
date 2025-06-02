"use client"

import React from "react"
import useSWR from "swr"
import { useState } from "react"
import { getAuthHeaders } from "../auth-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { HiOutlineChevronDown, HiOutlineChevronRight } from "react-icons/hi"
import { useIntegrations } from "@integration-app/react"
import Link from "next/link"

async function fetchTools(url: string) {
  const res = await fetch(url, { headers: getAuthHeaders() })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Failed to fetch tools")
  }
  const data = await res.json()
  return data.tools as Record<string, { name: string; description: string }[]>
}

function shouldShowDescription(connection: string, tool: { name: string; description: string }) {
  if (!tool.description) return false
  const desc = tool.description.trim()
  const conn = connection.trim().toLowerCase()
  if (desc.toLowerCase().startsWith(conn + ':')) {
    const afterColon = desc.slice(conn.length + 1).trim()
    if (afterColon.toLowerCase() === tool.name.toLowerCase()) return false
  }
  if (desc.toLowerCase() === tool.name.toLowerCase()) return false
  return true
}

export default function ToolsPage() {
  const { data, error, isLoading } = useSWR("/api/tools", fetchTools)
  const hasTools = data && Object.keys(data).length > 0 && Object.values(data).some(arr => arr.length > 0)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const { integrations } = useIntegrations()

  // Map connection name to logoUri or fallback
  const getLogo = (connection: string) => {
    const found = integrations.find(
      (i) => i.name.toLowerCase() === connection.toLowerCase() || i.key.toLowerCase() === connection.toLowerCase()
    )
    if (found?.logoUri) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={found.logoUri} alt={found.name} className="w-6 h-6 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 mr-2" />
      )
    }
    // Fallback: first letter
    return (
      <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-base font-bold text-gray-500 dark:text-gray-300 mr-2">
        {connection[0]}
      </div>
    )
  }

  const handleToggle = (connection: string) => {
    setOpen((prev) => ({ ...prev, [connection]: !prev[connection] }))
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Available MCP Tools</h1>
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      )}
      {((!isLoading && !hasTools) || error) && (
        <div className="text-gray-500 text-center py-12">
          Go to the <Link href="/integrations" className="font-bold text-blue-600 dark:text-blue-400">Integrations page</Link> and sign into an app to see tools.
        </div>
      )}
      {hasTools && (
        <div className="border rounded-lg bg-white dark:bg-gray-900 shadow divide-y divide-gray-200 dark:divide-gray-800">
          {Object.entries(data!).map(([connection, tools]) => (
            <div key={connection}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-base font-semibold text-blue-700 dark:text-blue-300 focus:outline-none group bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => handleToggle(connection)}
                aria-expanded={!!open[connection]}
              >
                <span className="flex items-center gap-2">
                  {getLogo(connection)}
                  <span className="align-middle">{connection}</span>
                </span>
                <span className="ml-2 transition-transform duration-200">
                  {open[connection] ? <HiOutlineChevronDown className="w-5 h-5" /> : <HiOutlineChevronRight className="w-5 h-5" />}
                </span>
              </button>
              <div
                className={`transition-all duration-300 ${open[connection] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
              >
                <ul className="space-y-0">
                  {tools.map((tool, idx) => (
                    <li
                      key={idx}
                      className="flex flex-col px-8 py-2 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/10 border-0 border-l-4 border-transparent hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-150"
                    >
                      <span className="font-medium text-gray-900 dark:text-white text-base">{tool.name}</span>
                      {shouldShowDescription(connection, tool) && (
                        <span className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">{tool.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 