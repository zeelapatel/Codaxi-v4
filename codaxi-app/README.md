## Docs Editor and Scan Streaming

### Configure API base URL

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### Docs editor

- Open a repository → Docs tab
- Select a route node
- Click "Generate Examples (AI)" to preview and save generated schema
- Only users with `ADMIN` or `EDITOR` role can save

### Scan streaming (SSE)

The Scan tab connects to `GET /api/scans/:id/stream` via SSE to receive progress updates.
# Codaxi - AI-Powered Documentation Generator

A modern, production-quality web application for real-time, RAG-powered documentation generation from codebases.

## 🚀 Features

### Core Functionality
- **Repository Management**: Connect and manage multiple Git repositories
- **AI-Powered Scanning**: Automatically analyze codebases to detect APIs, types, events, and dependencies
- **Interactive Documentation**: Generated docs with source code citations and navigable structure
- **Q&A Interface**: Ask questions about your codebase and get AI-powered answers with citations
- **Change Detection**: Track breaking changes and updates across versions
- **Knowledge Graph**: Visualize relationships between services, routes, types, and events

### User Experience
- **Modern UI**: Clean, accessible interface with dark/light mode support
- **Global Search**: Cmd/Ctrl+K to search across repositories, docs, and code
- **Keyboard Shortcuts**: Full keyboard navigation support (g+d for dashboard, g+r for repos, etc.)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live progress tracking for scans and AI responses

### Technical Highlights
- **Next.js 14**: App Router with server components and TypeScript
- **Modern Stack**: TanStack Query, Zustand, shadcn/ui, Tailwind CSS
- **Mock API**: Complete fake backend with realistic data and latency simulation
- **Accessibility**: WCAG AA compliance with proper ARIA labels and keyboard navigation
- **Performance**: Code splitting, lazy loading, and optimized rendering

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS Variables
- **Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand for UI state
- **Data Fetching**: TanStack Query with mock API
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts (ready for metrics visualization)

### Development
- **Code Quality**: ESLint with Next.js config
- **Package Manager**: npm
- **Dev Server**: Next.js with Turbopack

## 🎯 Pages & Features

### Dashboard (`/dashboard`)
- Overview tiles showing repository count, scan status, docs freshness
- Recent activity feed with real-time updates
- Quick action buttons for common tasks
- Usage metrics and billing information

### Repositories (`/repos`)
- List/grid view toggle with filtering and search
- Repository cards showing status, languages, and freshness
- Bulk operations and favorites management
- Add repository flow with provider selection

### Repository Detail (`/repos/[id]`)
- **Scan Tab**: Start scans, view progress, see metrics and errors
- **Docs Tab**: Navigate generated documentation with citation links
- **Q&A Tab**: Conversational interface with AI-powered answers
- **Changelog Tab**: Breaking change detection and diff viewing
- **Graph Tab**: Interactive knowledge graph (visualization placeholder)

### Settings (`/settings`)
- Organization configuration
- Theme preferences (light/dark/system)
- Data retention and privacy settings
- Notification preferences
- Integration management (Slack, GitHub Actions, etc.)
- Data export and danger zone

### Billing (`/billing`)
- Usage monitoring and plan limits
- Plan comparison and upgrade flow
- Billing history and invoice downloads
- Payment method management

## 🎨 Design System

### Brand Colors
- **Primary**: Indigo (600/700 variants)
- **Accents**: Emerald (success), Amber (warning), Rose (danger)
- **Neutral**: Zinc scale for backgrounds and text
- **Surface**: Card backgrounds with subtle shadows

### Typography
- **UI Font**: Inter (clean, readable)
- **Code Font**: JetBrains Mono (programming ligatures)
- **Hierarchy**: Strong typographic scale with consistent spacing

### Layout
- **8px Grid**: Consistent spacing system
- **Rounded Corners**: 2xl radius for cards (16px)
- **Generous Whitespace**: Breathing room between sections
- **Responsive**: Mobile-first with thoughtful breakpoints

## 🔧 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn package manager

### Installation

1. **Clone and setup**:
   ```bash
   cd codaxi-app
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Configuration

The application uses mock data by default. To configure:

- `NEXT_PUBLIC_USE_MOCKS=true` - Enable mock mode (default)
- All API calls are intercepted and return simulated data with realistic delays

## 📱 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open global search |
| `/` | Focus search input |
| `g + d` | Go to dashboard |
| `g + r` | Go to repositories |
| `g + s` | Go to settings |
| `Esc` | Close modals/search |
| `Shift + Enter` | Multi-line input in Q&A |

## 🧪 Mock Data & API

### Repositories
- 6 sample repositories with varied languages and statuses
- Realistic scan progression (queued → parsing → embedding → generating → completed)
- Error scenarios and different freshness scores

### Documentation
- 30+ doc nodes covering routes, types, events, and modules
- Source code citations with file paths and line numbers
- HTML content with code blocks and anchors

### Q&A Threads
- Pre-seeded conversations with citation examples
- Simulated AI responses with retrieval traces
- Real-time typing indicators and streaming effects

### Analytics
- All user interactions tracked to console in development
- Event names: `view_repo_list`, `start_scan`, `qa_ask`, etc.
- Metadata included for context and debugging

## 🔒 Accessibility Features

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full app usable without mouse
- **Focus Management**: Clear focus indicators and logical tab order
- **ARIA Labels**: Screen reader friendly descriptions
- **Color Contrast**: WCAG AA compliant color combinations
- **Reduced Motion**: Respects user's motion preferences

## 🚀 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Suspense boundaries for heavy components
- **Query Optimization**: Stale-while-revalidate caching
- **Bundle Size**: Tree-shaking and minimal dependencies
- **Image Optimization**: Next.js automatic optimization

## 🔧 Customization

### Replacing Mock API
To integrate with real backend:

1. Update `src/lib/api.ts` with actual endpoints
2. Remove mock delays and simulations
3. Set `NEXT_PUBLIC_USE_MOCKS=false`
4. Configure authentication and error handling

### Theme Customization
Edit `src/app/globals.css` CSS variables:
- `--primary` - Brand color
- `--background` - Page backgrounds
- `--card` - Card surfaces
- `--radius` - Border radius scale

### Adding Features
- New pages in `src/app/` directory
- UI components in `src/components/`
- API queries in `src/lib/queries.ts`
- Mock data in `src/data/mock-data.ts`

## 📊 File Structure

```
src/
├── app/                    # Next.js 14 App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── repos/             # Repository management
│   ├── settings/          # Configuration
│   └── billing/           # Subscription management
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Navigation and shell
│   └── repo/              # Repository-specific components
├── lib/
│   ├── api.ts            # Mock API client
│   ├── queries.ts        # TanStack Query hooks
│   ├── store.ts          # Zustand state management
│   └── utils.ts          # Shared utilities
├── types/
│   └── index.ts          # TypeScript type definitions
└── data/
    └── mock-data.ts      # Sample data and fixtures
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **shadcn** - Beautiful UI component system
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack** - Powerful data synchronization
- **Lucide** - Consistent icon library

---

Built with ❤️ for the developer community. Ready for production deployment and real-world usage.