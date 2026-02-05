import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Code, Zap, Shield, Layout, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl">
              DevOS
            </h1>
            <p className="mb-8 text-pretty text-xl text-muted-foreground md:text-2xl">
              The unified operating system for developers
            </p>
            <p className="mb-10 text-balance text-base text-muted-foreground md:text-lg">
              Manage personal projects, freelance clients, and company work in one powerful workspace. Built for execution and continuity.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-b py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold">
              Everything you need in one place
            </h2>
            <p className="text-pretty text-muted-foreground">
              DevOS brings together all your developer workflows into a single, cohesive platform.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Layout className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Unified Workspace</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  One dashboard for all your development activities, from personal projects to enterprise work.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Code className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize personal, freelance, and company projects with seamless context switching.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Built-in Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  API testing, JSON formatting, and essential developer utilities right at your fingertips.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Daily Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Designed for developers who value execution, continuity, and getting things done.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="border-b py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold">
              A workspace that works for you
            </h2>
            <p className="text-pretty text-muted-foreground">
              Clean, focused, and powerful. DevOS keeps you in the flow.
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Active Projects</CardTitle>
                  <div className="text-4xl font-bold">12</div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    6 Personal · 4 Freelance · 2 Company
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>This Week</CardTitle>
                  <div className="text-4xl font-bold">28h</div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Consistent daily progress
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Tools</CardTitle>
                  <div className="text-4xl font-bold">
                    <Zap className="h-10 w-10" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    API tester, JSON formatter, and more
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Working Consistency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 items-end justify-between gap-2">
                  {[40, 65, 55, 80, 70, 90, 85].map((height, i) => (
                    <div key={i} className="flex flex-1 flex-col justify-end">
                      <div
                        className="w-full rounded-t bg-primary"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Last 7 days of activity
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-b py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold">
              Built for every developer workflow
            </h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto">
                <Code className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Personal Projects</h3>
              <p className="text-sm text-muted-foreground">
                Keep your side projects organized and track your personal development goals.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto">
                <Layout className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Freelance Clients</h3>
              <p className="text-sm text-muted-foreground">
                Manage multiple client projects with clear separation and dedicated workspaces.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Company Work</h3>
              <p className="text-sm text-muted-foreground">
                Stay on top of your professional responsibilities and team projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold">
              Start using DevOS today
            </h2>
            <p className="mb-8 text-pretty text-muted-foreground">
              Join developers who are already building better with DevOS.
            </p>
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <div className="mb-2 text-lg font-bold">DevOS</div>
              <div className="text-sm text-muted-foreground">
                The unified operating system for developers
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Login</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
