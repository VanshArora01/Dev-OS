'use client'

import React from "react"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  FolderKanban,
  Link as LinkIcon,
  Zap,
  Wrench,
  Settings,
  Terminal
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Quick Links', href: '/dashboard/quick-links', icon: LinkIcon },
  { name: 'API Tester', href: '/dashboard/api-tester', icon: Zap },
  { name: 'Quick Tools', href: '/dashboard/quick-tools', icon: Wrench },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden w-56 flex-col border-r border-border/20 bg-card/40 backdrop-blur-xl md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border/20 px-5">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">DevOS</span>
        </div>
        <ScrollArea className="flex-1 px-3 py-6">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-border/20 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7"
                }
              }}
            />
            <div className="flex-1 text-sm">
              <div className="font-medium">Account</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
