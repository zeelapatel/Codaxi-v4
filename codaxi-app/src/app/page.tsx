'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  GitBranch, 
  Zap, 
  ArrowRight, 
  Code,
  FileText,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Image
                src={mounted ? ((resolvedTheme ?? theme) === 'dark' ? '/darklogo.png' : '/lightlogo.png') : '/lightlogo.png'}
                alt="Codaxi logo"
                width={32}
                height={32}
                priority
              />
            </div>
            <span className="text-xl font-bold">Codaxi</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌓'}
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Open Beta */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Open Beta — be among the first users
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Ship faster with
            <span className="text-primary"> AI-native documentation</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join our open beta. Codaxi scans your repo, generates living docs, and answers questions with citations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/auth/signup">
                Join Open Beta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8"
              onClick={() => {
                alert("Beta demo: coming soon! Sign up to get early access.")
              }}
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Beta announcement banner */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <div className="text-sm uppercase tracking-wider text-primary mb-1">We’re in Open Beta</div>
                <div className="text-base text-muted-foreground">No waitlist. Create an account and connect a repo today.</div>
              </div>
              <div className="flex items-center gap-3">
                <Button asChild><Link href="/auth/signup">Join Open Beta</Link></Button>
                <Button variant="outline" asChild><Link href="/auth/signin">I have an account</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Beta perks */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="font-semibold mb-1">Early access</div>
                <div className="text-sm text-muted-foreground">Be first to try new detectors and features.</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="font-semibold mb-1">Founder support</div>
                <div className="text-sm text-muted-foreground">Direct line for feedback and priority fixes.</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="font-semibold mb-1">Beta pricing</div>
                <div className="text-sm text-muted-foreground">Preferential pricing when we launch GA.</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="font-semibold mb-1">Fast setup</div>
                <div className="text-sm text-muted-foreground">Connect GitHub and generate docs in minutes.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Modern Documentation
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <Code className="w-6 h-6" />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Automatically scan repositories to detect APIs, types, events, and dependencies.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <CardTitle>Living Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Generate comprehensive documentation that evolves with your codebase.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <CardTitle>Intelligent Q&A</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Ask questions about your code and get instant answers with citations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <GitBranch className="w-6 h-6" />
                </div>
                <CardTitle>Version-aware Changelogs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Track what changed across commits and releases with auto-linked references.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <CardTitle>Lightning-fast Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connect your repo and get high-quality docs in minutes, not weeks.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <CardTitle>Contextual Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Generate usage snippets and diagrams grounded in your actual code.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">From repo connect to living docs in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">1</div>
                <CardTitle>Connect your repository</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Securely link GitHub and select the repos you want to document.</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">2</div>
                <CardTitle>Automatic scan</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Codaxi detects APIs, routes, types, events, and creates a knowledge graph.</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">3</div>
                <CardTitle>Living docs + Q&A</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Browse docs, ask questions, and keep everything in sync with each commit.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive product preview */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Explore Codaxi</h3>
            <p className="text-muted-foreground">Switch between views to see what you get out of the box.</p>
          </div>
          <Tabs defaultValue="scan" className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="scan">Scan</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
              <TabsTrigger value="qa">Q&A</TabsTrigger>
            </TabsList>
            <TabsContent value="scan">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Repository Scan</CardTitle>
                  <CardDescription>Detectors identify frameworks, routes, APIs, schemas, and events.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted rounded-lg p-4 text-sm overflow-auto">
{`detected:
- framework: nextjs
- routes: 23
- api endpoints: 12
- types: 48
- events: 9`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="docs">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Living Documentation</CardTitle>
                  <CardDescription>Generated pages with code-aware examples and citations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <div className="font-medium mb-2">API: GET /api/users</div>
                      <pre className="text-sm">{`200 OK -> User[]\nAuth: Bearer token`}</pre>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="font-medium mb-2">Type: User</div>
                      <pre className="text-sm">{`id: string\nemail: string\nrole: 'admin' | 'member'`}</pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="qa">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Code Q&A</CardTitle>
                  <CardDescription>Ask natural language questions and get cited answers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 text-sm">
                    Q: How do we authenticate users?\n
                    A: We use JWT with refresh tokens. See auth controller and middleware for details.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Why Codaxi (Beta) */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why join the beta?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Help shape Codaxi, get early value, and influence our roadmap.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Real impact</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Your feedback directly ships into weekly releases.</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Core use-cases first</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Docs, Q&A, and change tracking—focused and fast.</CardDescription>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>No vendor lock-in</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Export your docs any time. Self-hosting coming soon.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ - Beta */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Beta FAQ</h3>
            <p className="text-muted-foreground">Details about the open beta, pricing, and support.</p>
          </div>
          <div className="space-y-4">
            <details className="group rounded-lg border bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                What does “open beta” mean?
                <span className="text-primary">+</span>
              </summary>
              <div className="mt-2 text-sm text-muted-foreground">Core features are production-ready, but we’re still polishing and expanding detectors. Expect fast iteration and occasional sharp edges.</div>
            </details>
            <details className="group rounded-lg border bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Is my source code safe during beta?
                <span className="text-primary">+</span>
              </summary>
              <div className="mt-2 text-sm text-muted-foreground">Yes. We support scoped access and never share your code. Self-hosted options are available.</div>
            </details>
            <details className="group rounded-lg border bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                How much does the beta cost?
                <span className="text-primary">+</span>
              </summary>
              <div className="mt-2 text-sm text-muted-foreground">We offer introductory beta pricing. You’ll keep a preferential rate when we launch GA.</div>
            </details>
            <details className="group rounded-lg border bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                How does Codaxi keep docs up to date?
                <span className="text-primary">+</span>
              </summary>
              <div className="mt-2 text-sm text-muted-foreground">We monitor your default branch and regenerate docs on changes, versioning when you release.</div>
            </details>
            <details className="group rounded-lg border bg-background p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                Which languages and frameworks are supported?
                <span className="text-primary">+</span>
              </summary>
              <div className="mt-2 text-sm text-muted-foreground">Popular stacks including TypeScript/Node, Python, Java, and more. Detectors are extensible.</div>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA - Open Beta */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the Codaxi Open Beta</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Be part of the first cohort, influence the roadmap, and lock in beta pricing.</p>
          
          <Button size="lg" className="text-lg px-8" asChild>
            <Link href="/auth/signup">
              Join Open Beta
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 pb-10">
        <div className="container mx-auto border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Image src={mounted ? ((resolvedTheme ?? theme) === 'dark' ? '/darklogo.png' : '/lightlogo.png') : '/lightlogo.png'} alt="Codaxi logo" width={20} height={20} />
            </div>
            <span>© {new Date().getFullYear()} Codaxi</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/analytics">Analytics</Link>
            <Link href="/repos">Repos</Link>
            <Link href="/settings">Settings</Link>
            <Link href="/auth/signin">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}