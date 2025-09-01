import type { LoaderFunctionArgs } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const host =
    request.headers.get('X-Forwarded-Host') || request.headers.get('host')

  try {
    await fetch(`${new URL(request.url).protocol}${host}`, {
      method: 'HEAD',
      headers: { 'X-Healthcheck': 'true' },
    }).then((r) => {
      if (!r.ok) return Promise.reject(r)
    })
    return new Response('OK')
  } catch (error) {
    console.error('healthcheck ❌', { error })
    return new Response('ERROR', { status: 500 })
  }
}
