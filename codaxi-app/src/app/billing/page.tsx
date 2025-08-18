'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useBillingUsage } from '@/lib/queries'
import { useAnalyticsStore } from '@/lib/store'
import { 
  CreditCard, 
  Users, 
  Zap, 
  Check, 
  ArrowUp,
  Download,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useEffect } from 'react'

export default function BillingPage() {
  const { track } = useAnalyticsStore()
  const { data: usage } = useBillingUsage()

  useEffect(() => {
    track('view_billing')
  }, [track])

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for personal projects',
      features: [
        '5 repositories',
        '50K tokens/month',
        'Basic documentation',
        'Community support'
      ],
      current: false
    },
    {
      name: 'Team',
      price: '$29',
      period: 'per month',
      description: 'Great for small teams',
      features: [
        '25 repositories',
        '500K tokens/month',
        'Advanced Q&A',
        'Slack integration',
        'Priority support'
      ],
      current: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations',
      features: [
        'Unlimited repositories',
        'Unlimited tokens',
        'SSO integration',
        'Advanced analytics',
        'Dedicated support',
        'Custom integrations'
      ],
      current: false
    }
  ]

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
            <p className="text-muted-foreground">
              Manage your subscription and monitor usage
            </p>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>
        </div>

        {/* Current Usage */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repositories</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(usage?.data?.reposScanned ?? 0)} / {(usage?.data?.maxRepos ?? 0)}
              </div>
              <Progress 
                value={((usage?.data?.reposScanned ?? 0) / ((usage?.data?.maxRepos ?? 0) || 1) * 100)} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage?.data?.tokensUsed?.toLocaleString() ?? '0'}
              </div>
              <div className="text-xs text-muted-foreground">
                of {usage?.data?.maxTokens?.toLocaleString() ?? '0'} this month
              </div>
              <Progress 
                value={((usage?.data?.tokensUsed ?? 0) / ((usage?.data?.maxTokens ?? 0) || 1) * 100)} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billing Cycle</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage?.data?.daysRemaining ?? 0}</div>
              <div className="text-xs text-muted-foreground">
                days remaining
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Team</div>
              <div className="text-xs text-muted-foreground">
                $29/month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Comparison */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.current ? 'border-primary ring-2 ring-primary/20' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.current && (
                      <Badge className="bg-primary">Current Plan</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.current ? 'outline' : 'default'}
                    onClick={() => track('billing_upgrade_click', { plan: plan.name })}
                  >
                    {plan.current ? 'Current Plan' : 
                     plan.name === 'Enterprise' ? 'Contact Sales' : 
                     'Upgrade'}
                    {!plan.current && plan.name !== 'Enterprise' && (
                      <ArrowUp className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              Your recent invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: '2024-01-01', amount: '$29.00', status: 'Paid', invoice: 'INV-001' },
                { date: '2023-12-01', amount: '$29.00', status: 'Paid', invoice: 'INV-002' },
                { date: '2023-11-01', amount: '$29.00', status: 'Paid', invoice: 'INV-003' }
              ].map((invoice) => (
                <div key={invoice.invoice} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="space-y-1">
                    <div className="font-medium">{invoice.invoice}</div>
                    <div className="text-sm text-muted-foreground">{invoice.date}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{invoice.amount}</div>
                      <Badge variant="outline" className="text-xs">
                        {invoice.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Manage your payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">•••• •••• •••• 4242</div>
                  <div className="text-sm text-muted-foreground">Expires 12/26</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
            
            <Button variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
