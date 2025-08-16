'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useQAThreads, useAskQuestion } from '@/lib/queries'
import { useAnalyticsStore } from '@/lib/store'
import { QAThread, QAMessage } from '@/types'
import { 
  Send, 
  MessageSquare, 
  User, 
  Bot, 
  ThumbsUp, 
  ThumbsDown, 
  Copy, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QATabProps {
  repoId: string
}

export function QATab({ repoId }: QATabProps) {
  const { track } = useAnalyticsStore()
  const [question, setQuestion] = useState('')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { data: threads, isLoading: threadsLoading } = useQAThreads(repoId)
  const askQuestionMutation = useAskQuestion()

  const selectedThread = threads?.data.find(t => t.id === selectedThreadId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedThread?.messages])

  // Listen for AI response events
  useEffect(() => {
    const handleQAResponse = (event: CustomEvent) => {
      if (selectedThread && event.detail.threadId === selectedThread.id) {
        // The query will automatically refetch
      }
    }

    window.addEventListener('qa-response', handleQAResponse as EventListener)
    return () => {
      window.removeEventListener('qa-response', handleQAResponse as EventListener)
    }
  }, [selectedThread])

  const handleAskQuestion = async () => {
    if (!question.trim()) return

    try {
      track('qa_ask', { repoId, question })
      const result = await askQuestionMutation.mutateAsync({
        repoId,
        data: { question, includeContext: true }
      })
      setSelectedThreadId(result.data.id)
      setQuestion('')
      toast.success('Question sent')
    } catch (error) {
      toast.error('Failed to send question')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied to clipboard')
  }

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    track('qa_feedback_given', { messageId, feedback })
    toast.success('Feedback submitted')
  }

  const toggleTrace = (messageId: string) => {
    setExpandedTraces(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  const ThreadsList = () => (
    <div className="space-y-3">
      {threadsLoading ? (
        [...Array(3)].map((_, i) => (
          <div key={i} className="p-3 border rounded-lg space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))
      ) : threads?.data ? (
        threads.data.map((thread) => (
          <div
            key={thread.id}
            className={cn(
              'p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
              selectedThreadId === thread.id && 'border-primary bg-primary/5'
            )}
            onClick={() => setSelectedThreadId(thread.id)}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium line-clamp-2">{thread.question}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{thread.messages.length} messages</span>
                <span>
                  {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2" />
          <p>No questions yet</p>
        </div>
      )}
    </div>
  )

  const MessageBubble = ({ message }: { message: QAMessage }) => (
    <div className={cn(
      'flex gap-3',
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {message.role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className={cn(
        'max-w-[80%] space-y-2',
        message.role === 'user' ? 'items-end' : 'items-start'
      )}>
        <div className={cn(
          'px-4 py-3 rounded-2xl',
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        )}>
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        </div>
        
        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Sources:</div>
            <div className="space-y-1">
              {message.citations.map((citation, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs cursor-pointer hover:bg-muted"
                >
                  <FileText className="w-3 h-3" />
                  <span className="flex-1 truncate">{citation.filePath}</span>
                  <span className="text-muted-foreground">
                    {citation.startLine}-{citation.endLine}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retrieval Trace */}
        {message.retrievalTrace && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => toggleTrace(message.id)}
            >
              Why this answer?
              {expandedTraces[message.id] ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
            
            {expandedTraces[message.id] && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                {message.retrievalTrace.map((step, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-xs font-medium">{step.step}</div>
                    <div className="text-xs text-muted-foreground">{step.details}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => handleCopyMessage(message.content)}
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          
          {message.role === 'assistant' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-green-600 hover:text-green-700"
                onClick={() => handleFeedback(message.id, 'positive')}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-red-600 hover:text-red-700"
                onClick={() => handleFeedback(message.id, 'negative')}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </>
          )}
          
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
      
      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  )

  return (
    <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Threads Sidebar */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Q&A History</CardTitle>
            <CardDescription>
              Your questions about this repository
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <ThreadsList />
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg line-clamp-2">
                  {selectedThread.question}
                </CardTitle>
                <CardDescription>
                  Started {formatDistanceToNow(new Date(selectedThread.createdAt), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedThread.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ask about this repository</h3>
                <p className="text-muted-foreground max-w-sm">
                  Start a conversation to get AI-powered answers about the codebase, architecture, and implementation details.
                </p>
              </div>
            </CardContent>
          )}
          
          {/* Input Area */}
          <div className="border-t p-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Ask a question about this repository... (Cmd/Ctrl + Enter to send)"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[80px] resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Every answer includes source code citations for transparency
                </div>
                
                <Button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || askQuestionMutation.isPending}
                  size="sm"
                >
                  {askQuestionMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
