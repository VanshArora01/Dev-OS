import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Terminal, Layers, GitBranch, Zap, Code, Activity } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/20 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight">DevOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Login</Link>
            </Button>
            <Button size="sm" className="glow-effect" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
        </div>
        
        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            {/* Badge */}
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-4 py-1.5 backdrop-blur-sm">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm text-muted-foreground">Built for execution and continuity</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-center text-6xl font-bold leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
              <span className="gradient-text">Professional workflows</span>
              <br />
              <span className="text-foreground/90">for focused development</span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-10 max-w-2xl text-center text-lg text-muted-foreground md:text-xl">
              A unified workspace designed for developers to manage projects, tools, and APIs in one place. Built for execution continuity.
            </p>

            {/* CTA Buttons */}
            <div className="mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="glow-effect-strong shadow-lg" asChild>
                <Link href="/sign-up">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border/40 bg-card/40 backdrop-blur" asChild>
                <Link href="/sign-in">Login</Link>
              </Button>
            </div>

            {/* Floating Dashboard Preview */}
            <div className="relative">
              {/* Main Panel */}
              <div className="floating-panel overflow-hidden rounded-2xl border border-border/40 p-8">
                {/* Browser Chrome */}
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  <div className="ml-4 text-xs text-muted-foreground">Dashboard</div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Stats Row */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border/30 bg-background/50 p-5 backdrop-blur-sm">
                      <div className="mb-2 text-xs text-muted-foreground">Active Projects</div>
                      <div className="text-3xl font-bold">12</div>
                      <div className="mt-2 text-xs text-muted-foreground/70">6 Personal · 4 Freelance · 2 Company</div>
                    </div>
                    <div className="rounded-xl border border-border/30 bg-background/50 p-5 backdrop-blur-sm">
                      <div className="mb-2 text-xs text-muted-foreground">This Week</div>
                      <div className="text-3xl font-bold">28h</div>
                      <div className="mt-2 text-xs text-muted-foreground/70">Consistent daily progress</div>
                    </div>
                    <div className="rounded-xl border border-border/30 bg-background/50 p-5 backdrop-blur-sm">
                      <div className="mb-2 text-xs text-muted-foreground">API Calls</div>
                      <div className="text-3xl font-bold">47</div>
                      <div className="mt-2 text-xs text-muted-foreground/70">Tested this week</div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="rounded-xl border border-border/30 bg-background/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 text-sm font-medium">Working Consistency</div>
                    <div className="flex h-32 items-end justify-between gap-2">
                      {[45, 70, 55, 85, 75, 90, 80].map((height, i) => (
                        <div key={i} className="flex flex-1 flex-col justify-end">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-primary/80 to-primary transition-all hover:from-primary hover:to-primary/90"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Side Panels */}
              <div className="absolute -right-4 top-20 hidden w-64 lg:block">
                <div className="floating-panel space-y-3 rounded-xl border border-border/40 p-4">
                  <div className="text-xs font-medium text-muted-foreground">Projects at Risk</div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-border/20 bg-background/40 p-3">
                      <div className="text-xs font-medium">Personal Site</div>
                      <div className="mt-1 text-xs text-muted-foreground/70">No updates in 5 days</div>
                    </div>
                    <div className="rounded-lg border border-border/20 bg-background/40 p-3">
                      <div className="text-xs font-medium">Client Dashboard</div>
                      <div className="mt-1 text-xs text-muted-foreground/70">Deadline approaching</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Built for the way developers work
            </h2>
            <p className="text-lg text-muted-foreground">
              Track projects, test APIs, and manage your workflow in one unified workspace
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="floating-panel group rounded-xl border border-border/40 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Track all your projects</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Organize personal, freelance, and company projects with clear context separation
              </p>
            </div>

            <div className="floating-panel group rounded-xl border border-border/40 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Use built-in tools</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Test APIs and use developer utilities with one click, no context switching required
              </p>
            </div>

            <div className="floating-panel group rounded-xl border border-border/40 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <GitBranch className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Switch context easily</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Resume where you left off across sessions with automatic session tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Code className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">For Your Projects</h3>
              <p className="text-sm text-muted-foreground">For side hustles and creative experiments</p>
            </div>
            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Layers className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">For Freelance Clients</h3>
              <p className="text-sm text-muted-foreground">For client work that needs separation</p>
            </div>
            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <GitBranch className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">For Company Work</h3>
              <p className="text-sm text-muted-foreground">For production environments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="floating-panel glow-effect mx-auto max-w-3xl rounded-2xl border border-border/40 p-12 text-center md:p-16">
            <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Start using DevOS today
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join developers building better with DevOS. No credit card required.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="glow-effect-strong shadow-lg" asChild>
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border/40 bg-card/40 backdrop-blur" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="font-semibold">DevOS</span>
              </div>
              <div className="text-sm text-muted-foreground">
                The unified operating system for developers
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
