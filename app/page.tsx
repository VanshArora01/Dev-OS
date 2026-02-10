import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Terminal, Layers, GitBranch, Zap, Code, Activity, BarChart3, Workflow, Gauge } from 'lucide-react'
import { Particles } from '@/components/particles'
import { ClickSpark } from '@/components/click-spark'
import { ScrollStack, ScrollStackItem } from '@/components/scroll-stack'
import { MagicBento, MagicBentoItem } from '@/components/magic-bento'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
              <Terminal className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-black">DevOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" className="glow-effect" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Animated Particles Background */}
        <div className="absolute inset-0 -z-10">
          <Particles
            particleColors={['#9333ea', '#a855f7', '#c084fc']}
            particleCount={50}
            particleSpread={12}
            speed={0.12}
            particleBaseSize={140}
            moveParticlesOnHover
            alphaParticles={false}
            disableRotation={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>

        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            {/* Main Headline with ClickSpark */}
            <ClickSpark sparkColor="#9333ea" sparkSize={6} sparkRadius={25} sparkCount={8} duration={600}>
              <h1 className="mb-8 text-center text-6xl font-black leading-tight tracking-tighter md:text-7xl lg:text-8xl xl:text-9xl">
                <span className="gradient-text block">The operating</span>
                <span className="block text-foreground">system for</span>
                <span className="block text-foreground">developers</span>
              </h1>
            </ClickSpark>

            <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-muted-foreground md:text-xl">
              One unified workspace to manage projects, test APIs, and stay in flow. Built for the way you actually work.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="glow-effect-strong px-8 font-semibold shadow-2xl" asChild>
                <Link href="/sign-up">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border/50 px-8 font-semibold hover:bg-primary/5 bg-transparent" asChild>
                <Link href="/sign-in">See Dashboard</Link>
              </Button>
            </div>

            {/* Premium Dashboard Preview */}
            <div className="mt-20">
              <div className="floating-panel overflow-hidden rounded-2xl border border-border/40 shadow-2xl">
                {/* Browser Header */}
                <div className="border-b border-border/30 bg-background/40 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/50" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                      <div className="h-3 w-3 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-xs text-muted-foreground/80">DevOS Dashboard</span>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8">
                  {/* Stats Grid */}
                  <div className="mb-8 grid gap-4 md:grid-cols-4">
                    {[
                      { label: 'Active Projects', value: '12', detail: '↑ 3 this week' },
                      { label: 'Productivity', value: '98%', detail: 'Consistently high' },
                      { label: 'API Calls', value: '847', detail: '42 tests passed' },
                      { label: 'Uptime', value: '99.9%', detail: 'All systems running' },
                    ].map((stat, i) => (
                      <div key={i} className="group border-grid rounded-lg border border-border/30 bg-background/30 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-background/50">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{stat.label}</div>
                        <div className="mb-1 text-3xl font-black text-primary">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.detail}</div>
                      </div>
                    ))}
                  </div>

                  {/* Performance Chart */}
                  <div className="border-grid rounded-lg border border-border/30 bg-background/30 p-6 backdrop-blur-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Working Consistency</div>
                        <div className="text-xs text-muted-foreground">This week's activity</div>
                      </div>
                      <Gauge className="h-5 w-5 text-primary/50" />
                    </div>
                    <div className="flex h-24 items-end justify-between gap-1">
                      {[65, 72, 58, 85, 78, 92, 88].map((height, i) => (
                        <div key={i} className="group flex flex-1 flex-col justify-end gap-2">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-primary to-primary/60 transition-all duration-300 group-hover:from-primary/80 group-hover:to-primary/40"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-center text-xs text-muted-foreground/60">
                            {'MTWRFSS'[i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - Grid Layout */}
      <section className="border-t border-border/30 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-20 space-y-4 text-center">
            <h2 className="text-5xl font-black md:text-6xl lg:text-7xl">
              <span className="gradient-text">Built for execution.</span>
            </h2>
            <p className="text-lg text-muted-foreground">Not for meetings. Not for admin. For building.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Execution Continuity',
                description: 'Resume exactly where you left off. Your context is preserved across sessions so you stay in flow.',
                icon: <Workflow className="h-8 w-8 text-primary" />,
              },
              {
                title: 'Context Switching',
                description: 'Jump between personal, freelance, and company work without mental overhead or tool switching.',
                icon: <GitBranch className="h-8 w-8 text-primary" />,
              },
              {
                title: 'One Workspace',
                description: 'Projects, APIs, tools, and planning all integrated. Stop losing time switching between apps.',
                icon: <Terminal className="h-8 w-8 text-primary" />,
              },
            ].map((item, i) => (
              <div key={i} className="floating-panel group rounded-xl border border-border/30 p-8">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-all group-hover:bg-primary/15">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border/30 py-24">
        <div className="container mx-auto px-6">
          <h2 className="mb-16 text-5xl font-black md:text-6xl">
            Everything you need.
          </h2>

          <MagicBento
            textAutoHide={false}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect={true}
            spotlightRadius={300}
            particleCount={15}
            glowColor="147, 51, 234"
          >
            <MagicBentoItem
              title="Project Management"
              description="Track personal, freelance, and company projects with crystal-clear separation."
              icon={<Layers className="h-7 w-7 text-primary" />}
            >
              <div className="h-full bg-gradient-to-br from-primary/5 to-transparent" />
            </MagicBentoItem>

            <MagicBentoItem
              title="API Testing"
              description="Full-featured request builder with headers, body, and response visualization."
              icon={<Zap className="h-7 w-7 text-primary" />}
            >
              <div className="h-full bg-gradient-to-br from-primary/5 to-transparent" />
            </MagicBentoItem>

            <MagicBentoItem
              title="Developer Tools"
              description="JSON formatter, Base64 encoder/decoder, UUID generator, and more utilities."
              icon={<Code className="h-7 w-7 text-primary" />}
            >
              <div className="h-full bg-gradient-to-br from-primary/5 to-transparent" />
            </MagicBentoItem>

            <MagicBentoItem
              title="Quick Links"
              description="Fast access to GitHub, AWS, Vercel, MongoDB, and all your favorite platforms."
              icon={<GitBranch className="h-7 w-7 text-primary" />}
            >
              <div className="h-full bg-gradient-to-br from-primary/5 to-transparent" />
            </MagicBentoItem>

            <MagicBentoItem
              title="Activity Tracking"
              description="Monitor working consistency and build better development habits with visual charts."
              icon={<BarChart3 className="h-7 w-7 text-primary" />}
            >
              <div className="h-full bg-gradient-to-br from-primary/5 to-transparent" />
            </MagicBentoItem>

            <MagicBentoItem
              title="Session Management"
              description="Yesterday's summary and today's plan. Structure your work for maximum focus."
              icon={<Activity className="h-7 w-7 text-primary" />}
            >
              <div className="h-full bg-gradient-to-br from-primary/5 to-transparent" />
            </MagicBentoItem>
          </MagicBento>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="border-t border-border/30 py-24">
        <div className="container mx-auto px-6">
          <h2 className="mb-16 text-5xl font-black md:text-6xl">For all your work.</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Personal Projects',
                subtitle: 'Your side hustles',
                description: 'Build in peace with clear separation from paid work.',
              },
              {
                title: 'Freelance Clients',
                subtitle: 'Client context',
                description: 'Keep client work separate and organized without cross-contamination.',
              },
              {
                title: 'Company Work',
                subtitle: 'Production focus',
                description: 'Professional environment for company projects and systems.',
              },
            ].map((item, i) => (
              <div key={i} className="floating-panel group rounded-xl border border-border/30 p-8">
                <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary/70">
                  {item.subtitle}
                </div>
                <h3 className="mb-3 text-2xl font-black">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Premium */}
      <section className="border-t border-border/30 py-24">
        <div className="container mx-auto px-6">
          <div className="floating-panel glow-effect-strong rounded-2xl border border-border/30 p-12 text-center md:p-24">
            <h2 className="mb-6 text-5xl font-black md:text-6xl lg:text-7xl">
              <span className="gradient-text">Start building today.</span>
            </h2>
            <p className="mb-12 text-lg text-muted-foreground md:text-xl">
              Join developers who ship faster. No credit card required. Free forever plan available.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="glow-effect-strong px-8 font-semibold shadow-2xl" asChild>
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border/50 px-8 font-semibold hover:bg-primary/5 bg-transparent" asChild>
                <Link href="/sign-in">View Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:gap-24">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-black">DevOS</span>
              </div>
              <p className="text-sm text-muted-foreground">The operating system for developers.</p>
            </div>

            <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
              <div>
                <div className="mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Product</div>
                <div className="space-y-2 text-sm">
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Features
                  </Link>
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Pricing
                  </Link>
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Documentation
                  </Link>
                </div>
              </div>
              <div>
                <div className="mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Company</div>
                <div className="space-y-2 text-sm">
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </div>
              </div>
              <div>
                <div className="mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Legal</div>
                <div className="space-y-2 text-sm">
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Privacy
                  </Link>
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Terms
                  </Link>
                  <Link href="/" className="block text-muted-foreground hover:text-foreground">
                    Security
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-border/30 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-muted-foreground">© 2026 DevOS. Built for developers, by developers.</p>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" className="glow-effect" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
