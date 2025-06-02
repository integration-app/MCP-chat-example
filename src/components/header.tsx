"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function Header() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 shadow-lg sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 flex items-center">
              <div className="transition-transform duration-200 hover:scale-105 hover:shadow-blue-200 hover:shadow-lg rounded-full bg-white/70 dark:bg-gray-900/70 shadow-md backdrop-blur-md">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={44}
                  height={44}
                  className="dark:invert rounded-full"
                />
              </div>
            </div>
            <div className="hidden sm:flex sm:space-x-2 lg:space-x-6">
              {[
                { href: "/", label: "Overview" },
                { href: "/integrations", label: "Integrations" },
                { href: "/chat", label: "Chat" },
                { href: "/tools", label: "Tools" },
              ].map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
                      ${isActive
                        ? 'bg-blue-600 text-white dark:bg-white dark:text-blue-700 shadow-md'
                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300'}
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {/* Hide Users page from menu, but keep code for future use */}
              <span style={{ display: 'none' }}>
                <Link
                  href="/users"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium"
                >
                  Users
                </Link>
              </span>
            </div>
          </div>
          <div className="flex items-center">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle dark mode"
                className="hover:bg-blue-50 dark:hover:bg-blue-900/40"
              >
                {theme === "dark" ? (
                  <Sun className="h-6 w-6" />
                ) : (
                  <Moon className="h-6 w-6" />
                )}
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
