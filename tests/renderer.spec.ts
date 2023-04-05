/*
 * @dimerapp/markdown
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { EOL } from 'node:os'
import { Edge } from 'edge.js'
import { dedent } from 'ts-dedent'
import { test } from '@japa/runner'

import { MarkdownFile } from '@dimerapp/markdown'
import * as macros from '@dimerapp/markdown/macros'

import { dimer, RenderingPipeline } from '../index.js'

test.group('Edge pipeline', () => {
  test('render markdown AST using the pipeline', async ({ assert }) => {
    const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join(EOL)
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline })`,
    })

    const html = await edge
      .share({
        pipeline: new RenderingPipeline(),
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
    ].join(EOL)

    const file = new MarkdownFile(markdown, { enableDirectives: true })
    for (const macro of Object.values(macros)) {
      macro(file)
    }

    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline })`,
    })

    const html = await edge
      .share({
        pipeline: new RenderingPipeline(),
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
    ].join(EOL)

    const file = new MarkdownFile(markdown, { allowHtml: true })
    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline })`,
    })

    const html = await edge
      .share({
        pipeline: new RenderingPipeline(),
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
    ].join(EOL)

    const file = new MarkdownFile(markdown, { generateToc: true })
    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.toc.children, pipeline })`,
    })

    const html = await edge
      .share({
        pipeline: new RenderingPipeline(),
      })
      .render('guide', { file })

    assert.equal(
      html,
      dedent`
      <li><a href="#this-will-in-toc">This will in toc</a></li>
    `
    )
  })

  test('use pipeline hooks', async ({ assert }) => {
    const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join(EOL)
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline })`,
    })

    edge.registerTemplate('pre', {
      template: [
        '<div class="highlight">',
        '<pre>',
        `@!component('dimer_contents', { nodes: node.children, pipeline })`,
        '</pre>',
        '</div>',
      ].join(EOL),
    })

    const html = await edge
      .share({
        pipeline: new RenderingPipeline().use((node, pipeline) => {
          if (node.tagName === 'pre') {
            return ['pre', { node, pipeline }]
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
    const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join(EOL)
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline })`,
    })

    const html = await edge
      .share({
        pipeline: new RenderingPipeline().use((node) => {
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

  test('use different pipeline for dimer_contents component', async ({ assert }) => {
    const markdown = ['This is a codeblock', '', '```', 'const a = require("a")', '```'].join(EOL)
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline: secondaryPipeline })`,
    })

    edge.registerTemplate('pre', {
      template: [
        '<div class="highlight">',
        '<pre>',
        `@!component('dimer_contents', { nodes: node.children, pipeline: secondaryPipeline })`,
        '</pre>',
        '</div>',
      ].join(EOL),
    })

    const html = await edge
      .share({
        secondaryPipeline: new RenderingPipeline().use((node) => {
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
    const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join(EOL)
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimer)
    edge.use(dimer)
    edge.use(dimer)
    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline })`,
    })

    const html = await edge
      .share({
        pipeline: new RenderingPipeline(),
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
    const markdown = ['# Hello world', '', 'This is a paragraph', '', '- List item'].join(EOL)
    const file = new MarkdownFile(markdown)
    await file.process()

    const edge = new Edge()
    edge.use(dimer, { recurring: true })

    edge.registerTemplate('guide', {
      template: `@!component('dimer_contents', { nodes: file.ast.children, pipeline })`,
    })

    const html = await edge.render('guide', { file, pipeline: new RenderingPipeline() })
    const html1 = await edge.render('guide', { file, pipeline: new RenderingPipeline() })
    const html2 = await edge.render('guide', { file, pipeline: new RenderingPipeline() })

    assert.equal(html, html1)
    assert.equal(html, html2)
  })
})
