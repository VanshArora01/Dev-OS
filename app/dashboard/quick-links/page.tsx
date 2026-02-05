import { ExternalLink, Github, Linkedin, Database, Cloud, Globe } from 'lucide-react'

const quickLinks = [
  {
    name: 'GitHub',
    url: 'https://github.com',
    icon: Github,
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: Linkedin,
  },
  {
    name: 'MongoDB Atlas',
    url: 'https://cloud.mongodb.com',
    icon: Database,
  },
  {
    name: 'AWS Console',
    url: 'https://console.aws.amazon.com',
    icon: Cloud,
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com',
    icon: Globe,
  },
  {
    name: 'Render',
    url: 'https://render.com',
    icon: Globe,
  },
]

export default function QuickLinksPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Quick Links</h1>
        <p className="text-sm text-muted-foreground">Fast access to your tools</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-lg border border-border/40 bg-card/30 p-4 transition-colors hover:border-border hover:bg-card/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <link.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{link.name}</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        ))}
      </div>
    </div>
  )
}
