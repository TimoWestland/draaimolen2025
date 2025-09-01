import { readFile } from 'node:fs/promises'

export async function loader() {
  const data = await readFile(new URL('./data.json', import.meta.url), 'utf-8')
  const json = JSON.parse(data)
  return Response.json(json)
}
