import * as validate from '../functions/api/validate.js'
import * as rsvpModule from '../functions/api/rsvp.js'
import * as giftsModule from '../functions/api/gifts.js'
import * as giftsReserve from '../functions/api/gifts/reserve.js'
import * as contentModule from '../functions/api/content.js'
import * as imagesModule from '../functions/api/images/handler.js'
import * as adminInvitations from '../functions/api/admin/invitations.js'
import * as adminRsvp from '../functions/api/admin/rsvp.js'
import * as adminGifts from '../functions/api/admin/gifts.js'
import * as adminContent from '../functions/api/admin/content.js'
import * as adminUpload from '../functions/api/admin/upload.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'X-Invite-Token, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

function withCors(response) {
  const r = new Response(response.body, response)
  Object.entries(CORS_HEADERS).forEach(([k, v]) => r.headers.set(k, v))
  return r
}

function dispatch(module, method, request, env, params = {}) {
  const cap = method.charAt(0) + method.slice(1).toLowerCase()
  const fn = module[`onRequest${cap}`] || module.onRequest
  if (!fn) return new Response('Method Not Allowed', { status: 405 })
  return fn({ request, env, params })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method.toUpperCase()

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (!path.startsWith('/api/')) {
      return env.ASSETS.fetch(request)
    }

    let response
    try {
      if (path === '/api/validate') {
        response = await dispatch(validate, method, request, env)
      } else if (path === '/api/rsvp') {
        response = await dispatch(rsvpModule, method, request, env)
      } else if (path === '/api/gifts' || path === '/api/gifts/') {
        response = await dispatch(giftsModule, method, request, env)
      } else if (path === '/api/gifts/reserve') {
        response = await dispatch(giftsReserve, method, request, env)
      } else if (path === '/api/content') {
        response = await dispatch(contentModule, method, request, env)
      } else if (path.startsWith('/api/images/')) {
        const imagePath = path.slice('/api/images/'.length)
        const params = { path: imagePath.split('/').filter(Boolean) }
        response = await dispatch(imagesModule, method, request, env, params)
      } else if (path === '/api/admin/invitations') {
        response = await dispatch(adminInvitations, method, request, env)
      } else if (path === '/api/admin/rsvp') {
        response = await dispatch(adminRsvp, method, request, env)
      } else if (path === '/api/admin/gifts') {
        response = await dispatch(adminGifts, method, request, env)
      } else if (path === '/api/admin/content') {
        response = await dispatch(adminContent, method, request, env)
      } else if (path === '/api/admin/upload') {
        response = await dispatch(adminUpload, method, request, env)
      } else {
        response = new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (e) {
      console.error(e)
      response = new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return withCors(response)
  },
}
