import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Github, Linkedin, Database, Cloud, Globe } from 'lucide-react'

const quickLinks = [
  {
    name: 'GitHub',
    description: 'Access your repositories',
    url: 'https://github.com',
    icon: Github,
  },
  {
    name: 'LinkedIn',
    description: 'Professional network',
    url: 'https://linkedin.com',
    icon: Linkedin,
  },
  {
    name: 'MongoDB Atlas',
    description: 'Database management',
    url: 'https://cloud.mongodb.com',
    icon: Database,
  },
  {
    name: 'AWS Console',
    description: 'Cloud services',
    url: 'https://console.aws.amazon.com',
    icon: Cloud,
  },
  {
    name: 'Vercel',
    description: 'Deploy and host',
    url: 'https://vercel.com',
    icon: Globe,
  },
  {
    name: 'Render',
    description: 'Backend hosting',
    url: 'https://render.com',
    icon: Globe,
  },
]

export default function QuickLinksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quick Links</h1>
        <p className="text-muted-foreground">Fast access to your most-used developer tools</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Card key={link.name} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <link.icon className="h-6 w-6" />
              </div>
              <CardTitle>{link.name}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
