'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  GitBranch, 
  Github, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  FileText,
  Zap,
  Users,
  BarChart3
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { connectGitHub, handleGitHubCallback, isGitHubConnected } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)

  // Handle GitHub OAuth callback
  useEffect(() => {
    const github = searchParams.get('github')
    if (github === 'success') {
      toast.success('GitHub account connected successfully!')
      setCurrentStep(3)
    } else if (github === 'error') {
      toast.error('Failed to connect GitHub account')
    }
  }, [searchParams])

  const handleGitHubConnect = async () => {
    try {
      setIsConnecting(true)
      const response = await apiClient.generateGitHubAuthUrl()
      if (response.success && response.data?.authUrl) {
        window.location.href = response.data.authUrl
      } else {
        throw new Error('Failed to get GitHub auth URL')
      }
    } catch (error) {
      console.error('Failed to connect GitHub:', error)
      toast.error('Failed to connect GitHub. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const steps = [
    {
      id: 1,
      title: "Welcome to Codaxi! 🎉",
      description: "Let's get you set up with AI-powered documentation",
      icon: Sparkles,
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">Welcome aboard!</h3>
            <p className="text-muted-foreground text-lg">
              You're just a few steps away from transforming your codebase into living documentation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Account created</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-500" />
              <span>Connect GitHub</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <span>Generate docs</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Connect Your GitHub",
      description: "Connect your repositories to start generating documentation",
      icon: Github,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Github className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your GitHub Account</h3>
            <p className="text-muted-foreground mb-6">
              Connect your GitHub repositories to automatically generate and maintain documentation
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  GitHub OAuth
                </CardTitle>
                <CardDescription>Quick and secure connection</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={handleGitHubConnect}
                  disabled={isConnecting || isGitHubConnected}
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : isGitHubConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Connected to GitHub
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4 mr-2" />
                      Connect with GitHub
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {isGitHubConnected 
                    ? 'Your GitHub account is connected! You can now manage your repositories.'
                    : 'Connect your GitHub account to start generating documentation.'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-muted-foreground/25">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Manual Setup
                </CardTitle>
                <CardDescription>Add repositories manually</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  <GitBranch className="w-4 h-4 mr-2" />
                  Add Repository
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Coming soon! For now, you can explore the platform.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              What happens when you connect GitHub?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Automatically scan your repositories</li>
              <li>• Generate comprehensive documentation</li>
              <li>• Keep docs in sync with code changes</li>
              <li>• AI-powered Q&A about your codebase</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: isGitHubConnected ? "GitHub Connected! 🎉" : "Explore the Platform",
      description: isGitHubConnected 
        ? "Your repositories are ready for documentation generation"
        : "Discover what Codaxi can do for your team",
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Explore!</h3>
            <p className="text-muted-foreground mb-6">
              While GitHub integration is coming soon, you can explore the platform and see what's possible
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentation Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>AI-powered doc generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Real-time updates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Smart code analysis</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Code Q&A system</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Smart suggestions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Context-aware answers</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              What's Next?
            </h4>
            <p className="text-sm text-muted-foreground">
              GitHub integration will be available soon! You'll be able to connect your repositories 
              and start generating documentation automatically. For now, explore the platform and 
              see what Codaxi can do for your development workflow.
            </p>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps.find(step => step.id === currentStep)
  const isLastStep = currentStep === steps.length

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Getting Started</h1>
            <Badge variant="outline">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
            <CardDescription className="text-lg">
              {currentStepData?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {currentStepData?.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  )
}
