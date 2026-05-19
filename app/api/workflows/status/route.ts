import type { NextRequest } from 'next/server'
import { API_KEY } from '@/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const API_BASE_URL = process.env.APP_API_URL || 'http://8.149.128.82/v1'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowRunId = searchParams.get('id')

    if (!workflowRunId) {
      return Response.json({ error: 'Missing workflow run id' }, { status: 400 })
    }

    if (!API_KEY) {
      return Response.json({ error: 'Missing Dify API key' }, { status: 500 })
    }

    const res = await fetch(`${API_BASE_URL}/workflows/run/${workflowRunId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      cache: 'no-store',
    })

    const text = await res.text()

    if (!res.ok) {
      return new Response(text, {
        status: res.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    }

    return new Response(text, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
  catch (error: any) {
    console.error('workflow status error:', error)
    return Response.json(
      { error: error?.message || 'Failed to fetch workflow status' },
      { status: 500 },
    )
  }
}