import { join } from 'path'
import { createServer } from 'http'
import { Edge, GLOBALS } from 'edge.js'
import { readFile } from 'fs/promises'
import { MarkdownFile, macros } from '@dimerapp/markdown'

import dimerEdge from '../index'
import { Renderer } from '../src/Renderer'

function getSourceFrame(contents: string[], lineNumber: number) {
	const pre = contents
		.slice(Math.max(0, lineNumber - (3 + 1)), lineNumber - 1)
		.map((row) => `<div class="line dim">${row}</div>`)
		.join('')

	const line = `<div class="line highlight">${contents[lineNumber - 1]}</div>`
	const post = contents
		.slice(lineNumber, lineNumber + 3)
		.map((row) => `<div class="line dim">${row}</div>`)
		.join('')

	return `<pre><code>${pre}${line}${post}</code></pre>`
}

createServer(async (_, res) => {
	const file = new MarkdownFile(await readFile(join(__dirname, './doc.md'), 'utf-8'), {
		generateToc: true,
		enableDirectives: true,
	})

	Object.keys(macros).forEach((name) => macros[name](file))
	await file.process()

	const edge = new Edge()
	Object.keys(GLOBALS).forEach((name) => edge.global(name, GLOBALS[name]))

	edge.use(dimerEdge)
	edge.mount(join(__dirname, 'views'))

	const html = edge
		.share({
			dimerRenderer: new Renderer(),
			getSourceFrame: getSourceFrame,
		})
		.render('guide', { file })

	res.writeHead(200, { 'content-type': 'text/html' })
	res.end(html)
}).listen(3000, () => {
	console.log('Server ready http://localhost:3000')
})
