import type { CaseStudyContent, ProjectMeta } from '../intake/schema'
import { loadOpenAICredentials } from './openAICredentials'

const MODEL = 'gpt-4o-mini'

type RawCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

const stripJsonFence = (value: string): string => {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '')
    return withoutFence.trim()
  }
  return trimmed
}

const ensureArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|•|-/)
      .map(item => item.trim())
      .filter(Boolean)
  }
  return []
}

const coerceContent = (input: Partial<CaseStudyContent>, fallback: CaseStudyContent): CaseStudyContent => {
  const approach = ensureArray(input.approach)
  const results = ensureArray(input.results)

  return {
    overview: typeof input.overview === 'string' && input.overview.trim() ? input.overview.trim() : fallback.overview,
    challenge: typeof input.challenge === 'string' && input.challenge.trim() ? input.challenge.trim() : fallback.challenge,
    approach: approach.length > 0 ? approach : fallback.approach,
    results: results.length > 0 ? results : fallback.results,
    learnings: typeof input.learnings === 'string' && input.learnings.trim() ? input.learnings.trim() : fallback.learnings,
    callToAction:
      typeof input.callToAction === 'string' && input.callToAction.trim()
        ? input.callToAction.trim()
        : fallback.callToAction,
  }
}

export const generateCaseStudyNarrative = async (
  project: ProjectMeta,
  current: CaseStudyContent,
): Promise<CaseStudyContent> => {
  const credentials = loadOpenAICredentials()
  if (!credentials) {
    throw new Error('OpenAI API key not configured. Add it from the settings screen.')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credentials.apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You create concise portfolio-ready case studies. Respond with polished yet direct language. Keep bullets short and impactful.',
        },
        {
          role: 'user',
          content: `Project title: ${project.title}\n` +
            `Summary: ${project.summary ?? ''}\n` +
            `Problem: ${project.problem}\n` +
            `Solution: ${project.solution}\n` +
            `Outcomes: ${project.outcomes}\n` +
            `Tags: ${(project.tags ?? []).join(', ')}\n` +
            `Current overview: ${current.overview}\n` +
            `Current challenge: ${current.challenge}\n` +
            `Current approach points: ${current.approach.join(' | ')}\n` +
            `Current results points: ${current.results.join(' | ')}\n` +
            `Current learnings: ${current.learnings}\n` +
            `Current call to action: ${current.callToAction ?? ''}\n` +
            'Respond in JSON with the keys overview, challenge, approach, results, learnings, callToAction. Keep overview under 90 words.',
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'case_study',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              overview: { type: 'string' },
              challenge: { type: 'string' },
              approach: { type: 'array', items: { type: 'string' } },
              results: { type: 'array', items: { type: 'string' } },
              learnings: { type: 'string' },
              callToAction: { type: 'string' },
            },
            required: ['overview', 'challenge', 'approach', 'results', 'learnings'],
          },
        },
      },
    }),
  })

  if (!response.ok) {
    let detail: string | null = null
    try {
      detail = await response.text()
    } catch (_error) {
      detail = null
    }

    const buildErrorMessage = (): string => {
      if (detail) {
        try {
          const parsed = JSON.parse(detail) as {
            error?: { message?: string | null; code?: string | null }
          }
          const code = parsed.error?.code ?? undefined
          const message = parsed.error?.message?.trim() ?? ''

          if (code === 'invalid_api_key' || /incorrect api key/i.test(message)) {
            return 'OpenAI rejected the API key. Double-check it in the OpenAI settings and try again.'
          }

          if (message) {
            return `OpenAI error: ${message}`
          }
        } catch (_error) {
          // If the response isn't JSON, fall back to the raw string below.
        }

        const trimmed = detail.trim()
        if (trimmed) {
          return `Failed to generate narrative: ${trimmed}`
        }
      }

      if (response.status === 401 || response.status === 403) {
        return 'OpenAI rejected the request. Please ensure your API key is valid and try again.'
      }

      return `Failed to generate narrative: ${response.statusText || response.status}`
    }

    const errorMessage = buildErrorMessage()
    if (detail) {
      console.error('OpenAI narrative generation failed', {
        status: response.status,
        statusText: response.statusText,
        detail,
      })
    }

    throw new Error(errorMessage)
  }

  const payload = (await response.json()) as RawCompletion
  const message = payload.choices?.[0]?.message?.content
  if (!message) {
    throw new Error('The AI response was empty. Try again.')
  }

  try {
    const parsed = JSON.parse(stripJsonFence(message)) as Partial<CaseStudyContent>
    return coerceContent(parsed, current)
  } catch (error) {
    console.error('Failed to parse AI narrative response', error, message)
    throw new Error('Unable to understand the AI response. Please try again.')
  }
}
