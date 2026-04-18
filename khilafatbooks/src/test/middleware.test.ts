import { describe, it, expect } from 'vitest'
import middleware from '../../middleware'

describe('Middleware', () => {
  it('should rewrite for bots', async () => {
    const request = new Request('https://khilafatbooks.vercel.app/shop', {
      headers: {
        'user-agent': 'Googlebot'
      }
    })
    const response = await middleware(request)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/_prerendered/shop.html')
  })

  it('should rewrite / to /index.html for bots', async () => {
    const request = new Request('https://khilafatbooks.vercel.app/', {
      headers: {
        'user-agent': 'Googlebot'
      }
    })
    const response = await middleware(request)
    expect(response.headers.get('x-middleware-rewrite')).toContain('/_prerendered/index.html')
  })

  it('should continue for regular users', async () => {
    const request = new Request('https://khilafatbooks.vercel.app/shop', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    const response = await middleware(request)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})
