import { Edge } from 'edge.js'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { MarkdownFile } from '@dimerapp/markdown'
import * as macros from '@dimerapp/markdown/macros'
import { Shiki, codeblocks } from '@dimerapp/shiki'

import { dimer, RenderingPipeline } from '../index.js'

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
  const pipeline = new RenderingPipeline()
  pipeline.use((node) => {
    if (node.tagName === 'pre') {
      return pipeline.component('elements/pre', { node })
    }
  })

  edge.use(dimer)
  edge.mount(fileURLToPath(new URL('views', import.meta.url)))
  const html = await edge.render('guide', { file, pipeline })

  res.writeHead(200, { 'content-type': 'text/html' })
  res.end(html)
}).listen(3000, () => {
  console.log('Server ready http://localhost:3000')
})
