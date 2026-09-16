'use client'

import { CardContent } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ArrowRight } from 'lucide-react'
import { FolderKanban } from 'lucide-react' // Import FolderKanban

// Mock data
const mockProjects = [
  {
    id: '1',
    name: 'DevOS Platform',
    type: 'personal',
    description: 'Building the ultimate developer workspace',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Client E-commerce',
    type: 'freelance',
    description: 'Full-stack e-commerce solution for retail client',
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'Company Dashboard',
    type: 'company',
    description: 'Internal analytics dashboard',
    createdAt: '2024-01-10',
  },
  {
    id: '4',
    name: 'Personal Portfolio',
    type: 'personal',
    description: 'Next.js portfolio with blog',
    createdAt: '2024-01-05',
  },
  {
    id: '5',
    name: 'Mobile App Backend',
    type: 'freelance',
    description: 'REST API for iOS app',
    createdAt: '2024-01-25',
  },
]

export default function ProjectsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'personal' | 'freelance' | 'company'>('all')

  const filteredProjects =
    filter === 'all' ? mockProjects : mockProjects.filter((p) => p.type === filter)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'personal':
        return 'bg-blue-100 text-blue-700'
      case 'freelance':
        return 'bg-green-100 text-green-700'
      case 'company':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your work across contexts</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Add a new project to your workspace</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" placeholder="My Awesome Project" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Project Type</Label>
                <Select>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Brief description of your project" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsOpen(false)}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-6">
        <TabsList className="bg-transparent border-b border-border/40 rounded-none h-auto p-0 w-full justify-start gap-6">
          <TabsTrigger 
            value="all"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            All Projects
          </TabsTrigger>
          <TabsTrigger 
            value="personal"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            Personal
          </TabsTrigger>
          <TabsTrigger 
            value="freelance"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            Freelance
          </TabsTrigger>
          <TabsTrigger 
            value="company"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            Company
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0">
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <div className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/30 p-4 transition-colors hover:border-border hover:bg-card/50">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`${getTypeColor(project.type)} text-xs`}
                      >
                        {project.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
