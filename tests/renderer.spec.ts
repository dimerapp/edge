/*
 * @dimerapp/markdown
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { dedent } from 'ts-dedent'
import { test } from '@japa/runner'

import { MarkdownFile } from '@dimerapp/markdown'
import * as macros from '@dimerapp/markdown/macros'

import { dimerEdge, DimerEdgeRenderer } from '../index.js'

test.group('Edge renderer', () => {
  test('render markdown AST using the renderer', async ({ assert }) => {
    const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join('\n')
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer })`,
    })

    const html = await edge
      .share({
        renderer: new DimerEdgeRenderer(),
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

  test('render markdown with macros', async ({ assert }) => {
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
    for (const macro of Object.values(macros)) {
      macro(file)
    }

    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer })`,
    })

    const html = await edge
      .share({
        renderer: new DimerEdgeRenderer(),
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

  test('render markdown with HTML', async ({ assert }) => {
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
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer })`,
    })

    const html = await edge
      .share({
        renderer: new DimerEdgeRenderer(),
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

  test('render toc', async ({ assert }) => {
    const markdown = [
      '# Hello world',
      '',
      '',
      '## This will in toc',
      'This is a paragraph',
      '',
      '<div class="note">This is a note</div>',
    ].join('\n')

    const file = new MarkdownFile(markdown, { generateToc: true })
    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.toc.children, renderer })`,
    })

    const html = await edge
      .share({
        renderer: new DimerEdgeRenderer(),
      })
      .render('guide', { file })

    assert.equal(
      html,
      dedent`
      <li><a href="#this-will-in-toc">This will in toc</a></li>
    `
    )
  })

  test('use renderer hooks', async ({ assert }) => {
    const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer })`,
    })

    edge.registerTemplate('pre', {
      template: [
        '<div class="highlight">',
        '<pre>',
        `@!component('dimer_contents', { nodes: node.children, renderer })`,
        '</pre>',
        '</div>',
      ].join('\n'),
    })

    const html = await edge
      .share({
        renderer: new DimerEdgeRenderer().use((node, renderer) => {
          if (node.tagName === 'pre') {
            return ['pre', { node, renderer }]
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

  test('skip nodes when hook returns false', async ({ assert }) => {
    const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer })`,
    })

    const html = await edge
      .share({
        renderer: new DimerEdgeRenderer().use((node) => {
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

  test('use different renderer for dimer_contents component', async ({ assert }) => {
    const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join('\n')
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer: secondaryRenderer })`,
    })

    edge.registerTemplate('pre', {
      template: [
        '<div class="highlight">',
        '<pre>',
        `@!component('dimer_contents', { nodes: node.children, renderer: secondaryRenderer })`,
        '</pre>',
        '</div>',
      ].join('\n'),
    })

    const html = await edge
      .share({
        secondaryRenderer: new DimerEdgeRenderer().use((node) => {
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

  test('work fine when plugin is registered multiple times', async ({ assert }) => {
    const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join('\n')
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge)
    edge.use(dimerEdge)
    edge.use(dimerEdge)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer })`,
    })

    const html = await edge
      .share({
        renderer: new DimerEdgeRenderer(),
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

  test('work fine when plugin is registered in recurring mode', async ({ assert }) => {
    const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join('\n')
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimerEdge, { recurring: true })

    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, renderer })`,
    })

    const html = await edge.render('guide', { file, renderer: new DimerEdgeRenderer() })
    const html1 = await edge.render('guide', { file, renderer: new DimerEdgeRenderer() })
    const html2 = await edge.render('guide', { file, renderer: new DimerEdgeRenderer() })

    assert.equal(html, html1)
    assert.equal(html, html2)
  })
})
