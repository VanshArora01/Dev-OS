import { Calendar } from "@/components/ui/calendar"
import { CardContent } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LogOut } from 'lucide-react' // Import LogOut
import { FolderKanban } from 'lucide-react' // Import FolderKanban

// Mock project data
const project = {
  id: '1',
  name: 'DevOS Platform',
  type: 'personal',
  description: 'Building the ultimate developer workspace',
  createdAt: '2024-01-15',
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <Badge className={getTypeColor(project.type)} variant="secondary">
              {project.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Yesterday Section */}
        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Yesterday
          </div>
          <div className="rounded-lg border border-border/40 bg-card/30 p-6">
            <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
              <p>• Implemented authentication flow</p>
              <p>• Set up database schema</p>
              <p>• Designed landing page</p>
            </div>
          </div>
        </div>

        {/* Today Section */}
        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Today's Plan
          </div>
          <div className="rounded-lg border border-border/40 bg-card/30 p-6">
            <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
              <p>• Complete dashboard UI</p>
              <p>• Add project CRUD operations</p>
              <p>• Test API endpoints</p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* End Session */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm">
            End Session
          </Button>
        </div>
      </div>
    </div>
  )
}
