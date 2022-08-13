/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { EdgeContract } from 'edge.js'

import * as utils from './src/utils.js'
export { MarkdownRenderer } from './src/markdown_renderer.js'

/**
 * Edge plugin to register dimer specific globals, components
 * and tags
 */
export function dimerProvider(edge: EdgeContract) {
  /**
   * Always needs to be registered once
   */
  edge.global('dimer', {
    utils: utils,
  })

  edge.registerTemplate('dimer_contents', {
    template: [
      '@each(node in nodes)~',
      `@set('nodeComponent', await renderer.componentFor(node, renderer))`,
      `@!component(nodeComponent[0], {
        ...$props.except(['nodes', 'renderer']),
        ...nodeComponent[1],
      })~`,
      '@end',
    ].join('\n'),
  })

  /**
   * Renders an element node of the HAST syntax
   * tree
   */
  edge.registerTemplate('dimer_element', {
    template: [
      '@if(dimer.utils.isVoidElement(node.tagName))~',
      '<{{node.tagName}}{{{dimer.utils.stringifyAttributes(node.properties)}}}/>',
      '@else~',
      '<{{node.tagName}}{{{dimer.utils.stringifyAttributes(node.properties)}}}>',
      `@!component('dimer_contents', {
        nodes: node.children,
        ...$props.except(['node']),
      })~`,
      '</{{node.tagName}}>',
      '@endif',
    ].join('\n'),
  })

  /**
   * Used when renderer wants to skip a node
   */
  edge.registerTemplate('dimer_void', {
    template: '',
  })

  /**
   * Renders the text node value
   */
  edge.registerTemplate('dimer_text', {
    template: '{{node.value}}',
  })
}
