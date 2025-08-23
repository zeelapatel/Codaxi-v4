# GitHub Integration

This document describes the GitHub integration features implemented in the Codaxi backend.

## Features

### 🔐 OAuth Authentication
- **GitHub OAuth 2.0 Flow**: Secure authentication using GitHub's OAuth system
- **Scope Management**: Requests `repo` and `user` scopes for repository access
- **Token Management**: Handles access tokens, refresh tokens, and expiration
- **CSRF Protection**: Uses state parameter to prevent CSRF attacks

### 📚 Repository Management
- **Repository Discovery**: Lists user's GitHub repositories
- **Repository Connection**: Connect specific repositories to Codaxi
- **Access Control**: Verifies user has access to repositories
- **Webhook Setup**: Automatically creates webhooks for connected repositories

### 🔄 Webhook Processing
- **Push Events**: Triggers documentation updates on code changes
- **Pull Request Events**: Analyzes code changes in pull requests
- **Signature Verification**: Securely verifies webhook authenticity
- **Event Processing**: Handles different GitHub event types

### 🗄️ Data Models

#### GitHubConnection
- Links user account to GitHub account
- Stores OAuth tokens and metadata
- Manages connection status and expiration

#### GitHubRepositoryConnection
- Connects specific repositories to Codaxi
- Tracks sync status and last update
- Links to webhook configurations

#### GitHubWebhook
- Stores webhook configuration
- Manages webhook secrets and URLs
- Tracks webhook status

#### GitHubOAuthState
- Prevents CSRF attacks during OAuth
- Temporary storage with expiration
- Links to user account

## API Endpoints

### Authentication
- `POST /api/github/auth/url` - Generate OAuth authorization URL
- `POST /api/github/auth/callback` - Handle OAuth callback

### Repository Management
- `GET /api/github/repositories` - Get user's GitHub repositories
- `POST /api/github/repositories/connect` - Connect a repository
- `DELETE /api/github/repositories/:connectionId` - Disconnect a repository
- `GET /api/github/repositories/connected` - Get connected repositories

### Account Management
- `DELETE /api/github/account` - Disconnect GitHub account

### Webhooks
- `POST /api/github/webhook` - Handle GitHub webhooks

## Setup Instructions

### 1. GitHub OAuth App Configuration

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: Codaxi
   - **Homepage URL**: `http://localhost:3000` (development)
   - **Authorization callback URL**: `http://localhost:5000/api/github/auth/callback`
4. Copy the Client ID and Client Secret

### 2. Environment Variables

Add the following to your `.env` file:

```env
# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_REDIRECT_URI="http://localhost:5000/api/github/auth/callback"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# Backend URL
BACKEND_URL="http://localhost:5000"
```

### 3. Database Setup

Run the database migrations to create the GitHub tables:

```bash
npm run db:push
```

## Usage Flow

### 1. User Initiates GitHub Connection
1. User clicks "Connect GitHub" button
2. Frontend calls `/api/github/auth/url`
3. Backend generates OAuth URL with state parameter
4. User is redirected to GitHub for authorization

### 2. OAuth Callback
1. GitHub redirects user back with authorization code
2. Frontend sends code to `/api/github/auth/callback`
3. Backend exchanges code for access token
4. GitHub account is connected and stored

### 3. Repository Connection
1. User selects repositories to connect
2. Frontend calls `/api/github/repositories/connect`
3. Backend verifies access and creates connection
4. Webhook is automatically created for the repository

### 4. Webhook Processing
1. GitHub sends webhook on repository events
2. Backend verifies webhook signature
3. Event is processed based on type
4. Documentation updates are queued

## Security Features

### OAuth Security
- **State Parameter**: Prevents CSRF attacks
- **Token Storage**: Secure storage of access tokens
- **Scope Limitation**: Minimal required permissions

### Webhook Security
- **Signature Verification**: HMAC-SHA256 verification
- **Secret Management**: Unique secrets per webhook
- **Event Validation**: Validates webhook payloads

### Data Protection
- **Token Encryption**: Sensitive data is encrypted
- **Access Control**: User can only access their own data
- **Audit Logging**: All actions are logged

## Error Handling

### Common Errors
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Repository or connection not found
- **409 Conflict**: Repository already connected

### Error Responses
All errors follow the standard API response format:
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Future Enhancements

### Planned Features
- **Token Refresh**: Automatic token renewal
- **Repository Scanning**: Deep repository analysis
- **Documentation Generation**: AI-powered doc creation
- **Change Tracking**: Monitor repository changes
- **Integration APIs**: Connect with other tools

### Webhook Events
- **Issues**: Track issue creation and updates
- **Releases**: Monitor new releases
- **Stars**: Track repository popularity
- **Forks**: Monitor repository forks

## Troubleshooting

### Common Issues

#### OAuth Errors
- **Invalid redirect URI**: Check callback URL configuration
- **Missing scopes**: Ensure required scopes are requested
- **Token expiration**: Implement token refresh logic

#### Webhook Issues
- **Signature verification failed**: Check webhook secret
- **Missing headers**: Verify GitHub sends required headers
- **Delivery failures**: Check webhook URL accessibility

#### Database Errors
- **Connection failures**: Verify database connectivity
- **Migration issues**: Run `npm run db:push`
- **Constraint violations**: Check unique constraints

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV="development"
DEBUG="github:*"
```

## Support

For issues with GitHub integration:
1. Check the logs for error details
2. Verify environment variables
3. Test OAuth flow manually
4. Check GitHub API rate limits
5. Verify webhook delivery status
