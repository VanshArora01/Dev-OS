import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Developer</h1>
        <p className="text-muted-foreground">Here's what's happening with your projects</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Active Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">DevOS Platform</div>
            <p className="text-xs text-muted-foreground">Updated 2 hours ago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Personal Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 active this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Freelance Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 due this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Company Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">1 in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Working Consistency</CardTitle>
            <CardDescription>Your activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end justify-between gap-4">
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
                      className="w-full rounded-t-md bg-primary transition-all hover:opacity-80"
                      style={{ height: `${item.value * 1.5}px` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Projects at Risk</CardTitle>
            <CardDescription>Needs attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Client Dashboard</div>
                  <div className="text-xs text-muted-foreground">No updates in 5 days</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Mobile App Refactor</div>
                  <div className="text-xs text-muted-foreground">Deadline approaching</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
