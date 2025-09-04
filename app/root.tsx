import { useEffect, useRef } from 'react'

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from 'react-router'

import type { Route } from './+types/root'
import './app.css'

import { getDomainUrl, removeTrailingSlash } from './utils/misc.ts'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.cdnfonts.com' },
  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/favicons/apple-touch-icon.png',
  },
  {
    rel: 'manifest',
    href: '/site.webmanifest',
    crossOrigin: 'use-credentials',
  },
  { rel: 'icon', href: '/favicon.ico' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.cdnfonts.com/css/druk-wide-trial',
  },
]

export async function loader({ request }: Route.LoaderArgs) {
  return {
    requestInfo: {
      origin: getDomainUrl(request),
      path: new URL(request.url).pathname,
    },
  }
}

declare global {
  interface Window {
    fathom:
      | {
          trackPageview(): void
          trackGoal(id: string, cents: number): void
        }
      | undefined
  }
}

type FathomQueue = Array<{ command: 'trackPageview' }>

function CanonicalUrl({
  origin,
  fathomQueue,
}: {
  origin: string
  fathomQueue: React.RefObject<FathomQueue>
}) {
  const { pathname } = useLocation()
  const canonicalUrl = removeTrailingSlash(`${origin}${pathname}`)

  // biome-ignore lint/correctness/useExhaustiveDependencies: Fathom looks uses the canonical URL to track visits, so we're using it as a dependency even though we're not using it explicitly
  useEffect(() => {
    if (window.fathom) {
      window.fathom.trackPageview()
    } else {
      fathomQueue.current.push({ command: 'trackPageview' })
    }
  }, [canonicalUrl])

  return <link rel="canonical" href={canonicalUrl} />
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>()
  const fathomQueue = useRef<FathomQueue>([])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <CanonicalUrl
          origin={data.requestInfo.origin}
          fathomQueue={fathomQueue}
        />
      </head>
      <body className="dark">
        {children}
        <ScrollRestoration />
        <Scripts />
        <script src="/sw-registration.js" />
        <script
          src="https://cdn.usefathom.com/script.js"
          data-site="PWBHRUJI"
          data-spa="history"
          data-auto="false" // prevent tracking visit twice on initial page load
          data-excluded-domains="localhost"
          defer
          onLoad={() => {
            fathomQueue.current.forEach(({ command }) => {
              if (window.fathom) {
                window.fathom[command]()
              }
            })
            fathomQueue.current = []
          }}
        />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
    // @ts-ignore
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
