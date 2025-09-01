import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('health', 'routes/resources/healthcheck.ts'),
] satisfies RouteConfig
