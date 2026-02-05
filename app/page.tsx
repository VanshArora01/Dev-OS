import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Code, Zap, Terminal, Layers, GitBranch, Activity, Layout, Shield, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            <span className="text-xl font-semibold">DevOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="container relative mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-muted/50 px-4 py-1.5 text-sm">
              <Activity className="h-3.5 w-3.5" />
              <span className="text-muted-foreground">Built for execution and continuity</span>
            </div>
            <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
              The unified OS for developers
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
              Manage personal projects, freelance clients, and company work in one powerful workspace. Stop context switching. Start shipping.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="group">
                <Link href="/sign-up">
                  Get Started Free 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/40 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">98%</div>
              <div className="text-sm text-muted-foreground">faster time to deploy</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">3x</div>
              <div className="text-sm text-muted-foreground">more projects shipped</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">24/7</div>
              <div className="text-sm text-muted-foreground">continuous workflow</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">100%</div>
              <div className="text-sm text-muted-foreground">focus on execution</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border/40 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Everything you need to ship faster
            </h2>
            <p className="text-pretty text-lg text-muted-foreground">
              A complete workspace designed for the modern developer workflow
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border-border/40 bg-card/50 backdrop-blur transition-all hover:border-border hover:bg-card/80">
              <CardHeader>
                <Layers className="mb-4 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Unified Workspace</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  One dashboard for all development work. Personal projects, freelance clients, and company work in perfect harmony.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/50 backdrop-blur transition-all hover:border-border hover:bg-card/80">
              <CardHeader>
                <GitBranch className="mb-4 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Project Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Seamlessly switch between contexts. Track progress across all your projects without losing momentum.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/50 backdrop-blur transition-all hover:border-border hover:bg-card/80">
              <CardHeader>
                <Zap className="mb-4 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Developer Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Built-in API tester, JSON formatter, and essential utilities. Everything at your fingertips.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/50 backdrop-blur transition-all hover:border-border hover:bg-card/80">
              <CardHeader>
                <Code className="mb-4 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Fast access to GitHub, AWS, Vercel, and your most-used developer platforms.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/50 backdrop-blur transition-all hover:border-border hover:bg-card/80">
              <CardHeader>
                <Activity className="mb-4 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Activity Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Monitor your working consistency and productivity. Build better habits over time.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="group border-border/40 bg-card/50 backdrop-blur transition-all hover:border-border hover:bg-card/80">
              <CardHeader>
                <Terminal className="mb-4 h-10 w-10 text-primary" />
                <CardTitle className="text-xl">Daily Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Structure your work with daily planning and end-of-day reviews for maximum productivity.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="border-b border-border/40 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Built for developers who ship
            </h2>
            <p className="text-pretty text-lg text-muted-foreground">
              Clean, focused interface that gets out of your way
            </p>
          </div>
          <div className="mx-auto max-w-6xl">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border/40 bg-background/50 p-6">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">Active Projects</div>
                    <div className="text-3xl font-bold">12</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      6 Personal · 4 Freelance · 2 Company
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/50 p-6">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">This Week</div>
                    <div className="text-3xl font-bold">28h</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Consistent daily progress
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/50 p-6">
                    <div className="mb-2 text-sm font-medium text-muted-foreground">Tools Used</div>
                    <div className="text-3xl font-bold">47</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      API calls tested this week
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/50 p-6">
                  <div className="mb-4 text-sm font-medium">Working Consistency</div>
                  <div className="flex h-40 items-end justify-between gap-2">
                    {[40, 65, 55, 80, 70, 90, 85].map((height, i) => (
                      <div key={i} className="flex flex-1 flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-primary transition-all hover:opacity-80"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-b border-border/40 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
              One workspace, infinite possibilities
            </h2>
            <p className="text-pretty text-lg text-muted-foreground">
              Whether you're building side projects or managing client work
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <Card className="border-border/40 bg-card/50 text-center backdrop-blur">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Personal Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Keep side projects organized and track personal development goals with dedicated workspaces
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/50 text-center backdrop-blur">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Freelance Work</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Manage multiple clients with clear separation and context switching between projects
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/50 text-center backdrop-blur">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                  <GitBranch className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Company Work</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Stay on top of professional responsibilities and team projects with full organization
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/40 bg-card/50 p-12 text-center backdrop-blur md:p-16">
            <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Start shipping faster today
            </h2>
            <p className="mb-8 text-pretty text-lg text-muted-foreground">
              Join developers who are already building better with DevOS. No credit card required.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="group">
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <div className="mb-2 flex items-center gap-2 md:justify-start justify-center">
                <Terminal className="h-5 w-5" />
                <span className="text-lg font-semibold">DevOS</span>
              </div>
              <div className="text-sm text-muted-foreground">
                The unified operating system for developers
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Built for execution. Built for continuity.
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
