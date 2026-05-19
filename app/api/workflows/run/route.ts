import type { NextRequest } from 'next/server'
import { getInfo } from '@/app/api/utils/common'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const API_BASE_URL = process.env.APP_API_URL || 'http://8.149.128.82/v1'
const API_KEY = process.env.APP_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      inputs,
      files,
    } = body

    const { user } = getInfo(request)

    if (!API_KEY) {
      return Response.json(
        { error: 'Missing Dify API key' },
        { status: 500 },
      )
    }

    const difyRes = await fetch(`${API_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputs || {},
        files: files || [],
        response_mode: 'streaming',
        user,
      }),
      cache: 'no-store',
    })

    if (!difyRes.ok || !difyRes.body) {
      const text = await difyRes.text()
      return new Response(text || 'Dify workflow run failed', {
        status: difyRes.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }

    return new Response(difyRes.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  }
  catch (error: any) {
    console.error('workflows/run error:', error)

    return Response.json(
      {
        error: error?.message || 'Workflow run failed',
      },
      {
        status: 500,
      },
    )
  }
}