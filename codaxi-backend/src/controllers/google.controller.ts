import { Request, Response } from 'express'
import crypto from 'crypto'
import { sendSuccess, sendError } from '../utils/response'
import { config } from '../config'
import { GoogleService } from '../services/google.service'
import { generateToken } from '../utils/jwt'
import { UserRole } from '../types'
import { db } from '../utils/database'
import { hashPassword } from '../utils/password'

async function generateUniqueSlug(base: string): Promise<string> {
  const sanitized = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  let candidate = sanitized || 'organization'
  let suffix = 0
  // Try up to a reasonable number to avoid infinite loops
  while (true) {
    const existing = await db.organization.findUnique({ where: { slug: candidate } })
    if (!existing) return candidate
    suffix += 1
    candidate = `${sanitized}-${suffix}`
  }
}

const googleService = new GoogleService({
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  redirectUri: config.google.redirectUri
})

export class GoogleController {
  static async generateAuthUrl(req: Request, res: Response) {
    try {
      const state = crypto.randomBytes(32).toString('hex')
      const authUrl = googleService.generateAuthUrl(state)
      sendSuccess(res, { authUrl, state }, 'Google authorization URL generated')
    } catch (error) {
      sendError(res, 'Failed to generate Google authorization URL', 500)
    }
  }

  static async handleOAuthCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.method === 'GET' ? req.query : req.body as any

      if (!code) {
        return sendError(res, 'Missing authorization code', 400)
      }

      // If Google is calling our backend directly via GET, forward user to frontend callback
      if (req.method === 'GET') {
        const qs = new URLSearchParams()
        qs.set('code', String(code))
        if (state) qs.set('state', String(state))
        const redirectUrl = `${config.server.corsOrigin}/auth/google/callback?${qs.toString()}`
        res.redirect(302, redirectUrl)
        return
      }

      // Exchange code for tokens
      let tokenResponse
      try {
        tokenResponse = await googleService.exchangeCodeForToken(String(code))
      } catch (e) {
        return sendError(res, 'Google authorization code invalid or expired', 400)
      }

      // Fetch user info
      let userInfo
      try {
        userInfo = await googleService.getUserInfo(tokenResponse.access_token)
      } catch (e) {
        return sendError(res, 'Failed to fetch Google user info', 502)
      }

      // Find or create user (idempotent)
      const email = userInfo.email.toLowerCase()

      const randomPassword = await hashPassword(crypto.randomBytes(16).toString('hex'))
      const user = await db.user.upsert({
        where: { email },
        update: {
          name: userInfo.name || undefined,
          avatar: userInfo.picture || undefined,
          emailVerified: !!userInfo.email_verified
        },
        create: {
          email,
          name: userInfo.name || email.split('@')[0],
          password: randomPassword,
          avatar: userInfo.picture || null,
          emailVerified: !!userInfo.email_verified,
          role: UserRole.MEMBER
        }
      })

      // Get user's primary organization (admin). If none, ensure a default one exists and membership is created
      let membership = await db.organizationMember.findFirst({
        where: { userId: user.id, role: UserRole.ADMIN },
        include: { organization: true }
      })

      if (!membership) {
        const baseSlug = (user.name || email)
        const uniqueSlug = await generateUniqueSlug(baseSlug)
        const org = await db.organization.create({
          data: {
            name: `${user.name}'s Organization`,
            slug: uniqueSlug,
            members: { create: { userId: user.id, role: UserRole.ADMIN } }
          }
        })

        // Ensure membership exists (idempotent)
        membership = await db.organizationMember.upsert({
          where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
          update: {},
          create: { userId: user.id, organizationId: org.id, role: UserRole.ADMIN },
          include: { organization: true }
        })
      }

      const organization = membership?.organization || null

      // Create session token (idempotent)
      const token = generateToken({ userId: user.id, email: user.email, role: user.role as any, organizationId: organization?.id })
      await db.session.upsert({
        where: { token },
        update: {},
        create: { userId: user.id, token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      })

      return sendSuccess(res, {
        user,
        token,
        organization: organization ? { id: organization.id, name: organization.name, slug: organization.slug } : null
      }, 'Login successful')
    } catch (error) {
      return sendError(res, 'Failed to authenticate with Google', 500)
    }
  }
}


