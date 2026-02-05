import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, FolderKanban, LogOut } from 'lucide-react'
import Link from 'next/link'

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={getTypeColor(project.type)} variant="secondary">
              {project.type}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          End Session
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>Workspace for {project.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Created
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(project.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Separator />
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <FolderKanban className="h-4 w-4" />
                Project Type
              </div>
              <p className="text-sm capitalize text-muted-foreground">{project.type}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yesterday's Work</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                • Implemented authentication flow
                <br />
                • Set up database schema
                <br />• Designed landing page
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                • Complete dashboard UI
                <br />
                • Add project CRUD operations
                <br />• Test API endpoints
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
