import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening with your work</p>
      </div>

      {/* Primary Focus Area */}
      <div className="space-y-8">
        <div>
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Project
          </div>
          <Link
            href="/dashboard/projects/1"
            className="floating-panel group block rounded-xl border border-border/30 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">DevOS Platform</h2>
                <p className="text-sm text-muted-foreground">Last updated 2 hours ago</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Building the ultimate developer workspace for daily execution
            </div>
          </Link>
        </div>

        {/* Asymmetric Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Primary */}
          <div className="space-y-8 lg:col-span-2">
            <div>
              <div className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Working Consistency
              </div>
              <div className="floating-panel rounded-xl border border-border/30 p-6">
                <div className="flex h-32 items-end justify-between gap-3">
                  {[
                    { day: 'Mon', value: 65 },
                    { day: 'Tue', value: 80 },
                    { day: 'Wed', value: 55 },
                    { day: 'Thu', value: 90 },
                    { day: 'Fri', value: 75 },
                    { day: 'Sat', value: 40 },
                    { day: 'Sun', value: 50 },
                  ].map((item) => (
                    <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                      <div className="relative w-full">
                        <div
                          className="w-full rounded-sm bg-gradient-to-t from-primary/70 to-primary transition-all hover:from-primary/90 hover:to-primary"
                          style={{ height: `${item.value}px` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Project Distribution
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="floating-panel space-y-1 rounded-xl border border-border/30 p-4">
                  <div className="text-2xl font-semibold tabular-nums">8</div>
                  <div className="text-xs text-muted-foreground">Personal</div>
                </div>
                <div className="floating-panel space-y-1 rounded-xl border border-border/30 p-4">
                  <div className="text-2xl font-semibold tabular-nums">5</div>
                  <div className="text-xs text-muted-foreground">Freelance</div>
                </div>
                <div className="floating-panel space-y-1 rounded-xl border border-border/30 p-4">
                  <div className="text-2xl font-semibold tabular-nums">3</div>
                  <div className="text-xs text-muted-foreground">Company</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Secondary */}
          <div className="space-y-6">
            <div>
              <div className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Needs Attention
              </div>
              <div className="space-y-3">
                <div className="floating-panel rounded-xl border border-border/30 p-4">
                  <div className="text-sm font-medium">Client Dashboard</div>
                  <div className="mt-1 text-xs text-muted-foreground">No updates in 5 days</div>
                </div>
                <div className="floating-panel rounded-xl border border-border/30 p-4">
                  <div className="text-sm font-medium">Mobile App Refactor</div>
                  <div className="mt-1 text-xs text-muted-foreground">Deadline approaching</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
