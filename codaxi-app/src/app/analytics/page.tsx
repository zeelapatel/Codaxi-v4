'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  GitBranch, 
  FileText, 
  Clock,
  Zap,
  Sparkles
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'

function AnalyticsContent() {
  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Deep insights into your documentation and repository performance
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </Badge>
        </div>

        {/* Coming Soon Message */}
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics Dashboard Coming Soon</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We're building powerful analytics to help you understand your documentation performance, 
                track repository health, and optimize your development workflow.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Performance Metrics
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Team Insights
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  Repository Analytics
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Documentation Health
              </CardTitle>
              <CardDescription>Overall documentation quality score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Score out of 100</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Freshness Score
              </CardTitle>
              <CardDescription>How up-to-date your docs are</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Days since last update</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Coverage Rate
              </CardTitle>
              <CardDescription>Code documentation coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Percentage covered</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                AI Insights
              </CardTitle>
              <CardDescription>AI-powered recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Suggestions available</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Activity
              </CardTitle>
              <CardDescription>Team collaboration metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Active contributors</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Repository Status
              </CardTitle>
              <CardDescription>Overall repository health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Repositories monitored</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}
