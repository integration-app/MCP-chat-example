import { AuthTest } from "@/components/auth-test"
import { Metadata } from "next"
import Link from "next/link"
import { HiOutlineLink } from "react-icons/hi"

export const metadata: Metadata = {
  title: "Overview",
}

export default function HomePage() {
  return (
    <div className="flex justify-center items-center min-h-[60vh] px-2">
      <div className="card w-full max-w-2xl animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-6">AI Chat Agent</h1>
        <p className="mb-4 text-gray-500 dark:text-gray-400 text-center">
          This application contains an AI Chat Agent that can use tools exposed by the Integration App MCP Server.
        </p>
        <ul className="list-none space-y-3 text-gray-500 dark:text-gray-400 mb-6">
          <li className="flex items-center gap-2">
            <HiOutlineLink className="text-blue-400 text-lg" />
            Visit the <Link href="/integrations" className="font-bold text-blue-600 dark:text-blue-400">Integrations</Link> page to connect your CRM accounts.
          </li>
          <li className="flex items-center gap-2">
            <HiOutlineLink className="text-blue-400 text-lg" />
            Visit the <Link href="/chat" className="font-bold text-blue-600 dark:text-blue-400">Chat</Link> page to speak with the agent and ask it to call tools.
          </li>
          <li className="flex items-center gap-2">
            <HiOutlineLink className="text-blue-400 text-lg" />
            Visit the <Link href="/tools" className="font-bold text-blue-600 dark:text-blue-400">Tools</Link> page to see tools that are available from the MCP Server.
          </li>
        </ul>
        <div className="mt-8">
          <AuthTest />
        </div>
      </div>
    </div>
  )
}

// Add fade-in animation
// In globals.css, add:
// @keyframes fade-in { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } }
// .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1); }
