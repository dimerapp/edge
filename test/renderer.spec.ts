/*
 * @dimerapp/markdown
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Edge } from 'edge.js'
import dedent from 'ts-dedent'
import { MarkdownFile, macros } from '@dimerapp/markdown'

import dimerEdge from '../index'
import { Renderer } from '../src/Renderer'

test.group('Edge renderer', () => {
	test('render markdown AST using the renderer', async (assert) => {
		const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.render('guide', { file })

		assert.equal(
			html,
			dedent`
			<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>
			<p>This is a paragraph</p>
			<ul>
			<li>List item</li>
			</ul>
		`
		)
	})

	test('render markdown AST when using macros', async (assert) => {
		const markdown = [
			'# Hello world',
			'',
			'This is a paragraph',
			'',
			':::note',
			'This is a note',
			':::',
		].join('\n')

		const file = new MarkdownFile(markdown, { enableDirectives: true })
		Object.keys(macros).forEach((name) => macros[name](file))
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.render('guide', { file })

		assert.equal(
			html,
			dedent`
			<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>
			<p>This is a paragraph</p>
			<div class="alert alert-note"><p>This is a note</p></div>
		`
		)
	})

	test('render markdown AST when using html', async (assert) => {
		const markdown = [
			'# Hello world',
			'',
			'This is a paragraph',
			'',
			'<div class="note">This is a note</div>',
		].join('\n')

		const file = new MarkdownFile(markdown, { allowHtml: true })
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.render('guide', { file })

		assert.equal(
			html,
			dedent`
			<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>
			<p>This is a paragraph</p>
			<div class="note">This is a note</div>
		`
		)
	})

	test('render toc', async (assert) => {
		const markdown = [
			'# Hello world',
			'',
			'This is a paragraph',
			'',
			'<div class="note">This is a note</div>',
		].join('\n')

		const file = new MarkdownFile(markdown, { generateToc: true })
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.toc.children)`,
		})

		const html = edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.render('guide', { file })

		assert.equal(
			html,
			dedent`
			<li><a href="#hello-world">Hello world</a></li>
		`
		)
	})

	test('use custom renderer functions', async (assert) => {
		const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		edge.registerTemplate('pre', {
			template: dedent`
				<div class="highlight">
					<pre>
					@dimerTree(node.children)
					</pre>
				</div>
			`,
		})

		const html = edge
			.share({
				dimerRenderer: new Renderer().use((node) => {
					if (node.tagName === 'pre') {
						return ['pre', { node }]
					}
				}),
			})
			.render('guide', { file })

		assert.equal(
			html,
			dedent`
			<p>This is a codeblock</p>
			<div class="highlight">
				<pre><code>const a = require(&quot;a&quot;)
			</code>
				</pre>
			</div>
		`
		)
	})

	test('skip nodes when custom renderer returns false', async (assert) => {
		const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = edge
			.share({
				dimerRenderer: new Renderer().use((node) => {
					if (node.tagName === 'pre') {
						return false
					}
				}),
			})
			.render('guide', { file })

		assert.equal(
			html,
			dedent`
			<p>This is a codeblock</p>
		`
		)
	})

	test('use different renderer with dimerTree tag', async (assert) => {
		const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children, secondaryRenderer)`,
		})

		edge.registerTemplate('pre', {
			template: dedent`
				<div class="highlight">
					<pre>
					@dimerTree(node.children, secondaryRenderer)
					</pre>
				</div>
			`,
		})

		const html = edge
			.share({
				secondaryRenderer: new Renderer().use((node) => {
					if (node.tagName === 'pre') {
						return ['pre', { node }]
					}
				}),
			})
			.render('guide', { file })

		assert.equal(
			html,
			dedent`
			<p>This is a codeblock</p>
			<div class="highlight">
				<pre><code>const a = require(&quot;a&quot;)
			</code>
				</pre>
			</div>
		`
		)
	})
})

test.group('Edge renderer  | async', () => {
	test('render markdown AST using the renderer', async (assert) => {
		const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = await edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.renderAsync('guide', { file })

		assert.equal(
			html,
			dedent`
			<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>
			<p>This is a paragraph</p>
			<ul>
			<li>List item</li>
			</ul>
		`
		)
	})

	test('render markdown AST when using macros', async (assert) => {
		const markdown = [
			'# Hello world',
			'',
			'This is a paragraph',
			'',
			':::note',
			'This is a note',
			':::',
		].join('\n')

		const file = new MarkdownFile(markdown, { enableDirectives: true })
		Object.keys(macros).forEach((name) => macros[name](file))
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = await edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.renderAsync('guide', { file })

		assert.equal(
			html,
			dedent`
			<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>
			<p>This is a paragraph</p>
			<div class="alert alert-note"><p>This is a note</p></div>
		`
		)
	})

	test('render markdown AST when using html', async (assert) => {
		const markdown = [
			'# Hello world',
			'',
			'This is a paragraph',
			'',
			'<div class="note">This is a note</div>',
		].join('\n')

		const file = new MarkdownFile(markdown, { allowHtml: true })
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = await edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.renderAsync('guide', { file })

		assert.equal(
			html,
			dedent`
			<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>
			<p>This is a paragraph</p>
			<div class="note">This is a note</div>
		`
		)
	})

	test('render toc', async (assert) => {
		const markdown = [
			'# Hello world',
			'',
			'This is a paragraph',
			'',
			'<div class="note">This is a note</div>',
		].join('\n')

		const file = new MarkdownFile(markdown, { generateToc: true, allowHtml: true })
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `
			@dimerTree(file.ast.children)~
			@dimerTree(file.toc.children)~
			`,
		})

		const html = await edge
			.share({
				dimerRenderer: new Renderer(),
			})
			.renderAsync('guide', { file })

		assert.equal(
			html.trim(),
			dedent`
			<h1 id="hello-world"><a href="#hello-world" aria-hidden=true tabindex=-1><span class="icon icon-link"></span></a>Hello world</h1>
			<p>This is a paragraph</p>
			<div class="note">This is a note</div>
			<li><a href="#hello-world">Hello world</a></li>`
		)
	})

	test('use custom renderer functions', async (assert) => {
		const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		edge.registerTemplate('pre', {
			template: dedent`
				<div class="highlight">
					<pre>
					@dimerTree(node.children)
					</pre>
				</div>
			`,
		})

		const html = await edge
			.share({
				dimerRenderer: new Renderer().use((node) => {
					if (node.tagName === 'pre') {
						return ['pre', { node }]
					}
				}),
			})
			.renderAsync('guide', { file })

		assert.equal(
			html,
			dedent`
			<p>This is a codeblock</p>
			<div class="highlight">
				<pre><code>const a = require(&quot;a&quot;)
			</code>
				</pre>
			</div>
		`
		)
	})

	test('skip nodes when custom renderer returns false', async (assert) => {
		const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children)`,
		})

		const html = await edge
			.share({
				dimerRenderer: new Renderer().use((node) => {
					if (node.tagName === 'pre') {
						return false
					}
				}),
			})
			.renderAsync('guide', { file })

		assert.equal(
			html,
			dedent`
			<p>This is a codeblock</p>
		`
		)
	})

	test('use different renderer with dimerTree tag', async (assert) => {
		const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
		const file = new MarkdownFile(markdown)
		await file.process()

		const edge = new Edge()
		edge.use(dimerEdge)
		edge.registerTemplate('guide', {
			template: `@dimerTree(file.ast.children, secondaryRenderer)`,
		})

		edge.registerTemplate('pre', {
			template: dedent`
				<div class="highlight">
					<pre>
					@dimerTree(node.children, secondaryRenderer)
					</pre>
				</div>
			`,
		})

		const html = await edge
			.share({
				secondaryRenderer: new Renderer().use((node) => {
					if (node.tagName === 'pre') {
						return ['pre', { node }]
					}
				}),
			})
			.renderAsync('guide', { file })

		assert.equal(
			html,
			dedent`
			<p>This is a codeblock</p>
			<div class="highlight">
				<pre><code>const a = require(&quot;a&quot;)
			</code>
				</pre>
			</div>
		`
		)
	})
})
