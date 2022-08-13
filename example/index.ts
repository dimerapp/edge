import { Edge, GLOBALS } from 'edge.js'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { MarkdownFile } from '@dimerapp/markdown'
import * as macros from '@dimerapp/markdown/macros'
import { Shiki, codeblocks } from '@dimerapp/shiki'

import { dimerProvider, MarkdownRenderer } from '../index.js'

createServer(async (_, res) => {
  const file = new MarkdownFile(await readFile(new URL('./doc.md', import.meta.url), 'utf-8'), {
    generateToc: true,
    enableDirectives: true,
  })

  for (const macro of Object.values(macros)) {
    file.use(macro)
  }

  const shiki = new Shiki()
  await shiki.boot()

  file.transform(codeblocks, shiki)
  await file.process()

  const edge = new Edge()
  const renderer = new MarkdownRenderer()
  renderer.use((node) => {
    if (node.tagName === 'pre') {
      return ['elements/pre', { node, renderer }]
    }
  })

  for (const name of Object.keys(GLOBALS)) {
    edge.global(name, GLOBALS[name as keyof typeof GLOBALS])
  }

  edge.use(dimerProvider)
  edge.mount(fileURLToPath(new URL('views', import.meta.url)))
  const html = await edge.render('guide', { file, dimerRenderer: renderer })

  res.writeHead(200, { 'content-type': 'text/html' })
  res.end(html)
}).listen(3000, () => {
  console.log('Server ready http://localhost:3000')
})
