import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('api/timetable', 'routes/api/timetable.ts'),
] satisfies RouteConfig
