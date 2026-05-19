import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const API_BASE_URL = (process.env.APP_API_URL || 'http://8.149.128.82/v1').replace(/\/$/, '')
const API_KEY = (process.env.APP_API_KEY || '').trim()

function extractWorkflowRunId(text: string) {
  const patterns = [
    /"workflow_run_id"\s*:\s*"([^"]+)"/,
    /workflow_run_id['"]?\s*[:=]\s*['"]([^'"]+)['"]/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1])
      return match[1]
  }

  return ''
}

export async function POST(request: NextRequest) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55000)

  try {
    const body = await request.json()

    if (!API_KEY) {
      return Response.json(
        {
          error: 'Missing Dify API key',
          checked: {
            APP_API_KEY: !!process.env.APP_API_KEY,
            NEXT_PUBLIC_APP_API_KEY: !!process.env.NEXT_PUBLIC_APP_API_KEY,
            NEXT_PUBLIC_APP_KEY: !!process.env.NEXT_PUBLIC_APP_KEY,
          },
        },
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
        ...body,
        response_mode: 'streaming',
        user: body.user || 'web-user',
      }),
      signal: controller.signal,
    })

    if (!difyRes.ok) {
      const errorText = await difyRes.text()
      clearTimeout(timeout)
      return Response.json(
        { error: errorText || 'Dify workflow start failed' },
        { status: difyRes.status },
      )
    }

    if (!difyRes.body) {
      clearTimeout(timeout)
      return Response.json(
        { error: 'Dify response body is empty' },
        { status: 500 },
      )
    }

    const reader = difyRes.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done)
        break

      buffer += decoder.decode(value, { stream: true })

      const workflowRunId = extractWorkflowRunId(buffer)

      if (workflowRunId) {
        try {
          await reader.cancel()
        }
        catch { }

        clearTimeout(timeout)

        return Response.json({
          workflow_run_id: workflowRunId,
          status: 'started',
        })
      }

      if (buffer.length > 20000)
        buffer = buffer.slice(-10000)
    }

    clearTimeout(timeout)

    return Response.json(
      {
        error: 'Workflow started, but workflow_run_id was not captured.',
        raw: buffer.slice(0, 2000),
      },
      { status: 500 },
    )
  }
  catch (error: any) {
    clearTimeout(timeout)

    if (error?.name === 'AbortError') {
      return Response.json(
        { error: 'Workflow start timeout before workflow_run_id was captured.' },
        { status: 504 },
      )
    }

    console.error('workflow start error:', error)

    return Response.json(
      { error: error?.message || 'Workflow start failed' },
      { status: 500 },
    )
  }
}