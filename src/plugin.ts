/*
 * @dimerapp/edge
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Edge } from 'edge.js'
import * as utils from './utils.js'

/**
 * Edge plugin to register dimer specific globals, components
 * and tags
 */
export function dimer(edge: Edge, firstRun: boolean) {
  /**
   * Return early when plugin is registered in recurring mode
   */
  if (!firstRun) {
    return
  }

  /**
   * Do not register globals and templates when already
   * exists.
   */
  if (edge.globals.dimer) {
    return
  }

  /**
   * Always needs to be registered once
   */
  edge.global('dimer', {
    utils: utils,
  })

  edge.registerTemplate('dimer_contents', {
    template: [
      '@each(node in nodes)~',
      `@let(nodeComponent = await pipeline.componentFor(node, pipeline))`,
      `@!component(nodeComponent[0], {
        ...$props.except(['nodes', 'pipeline']).all(),
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
        ...$props.except(['node']).all(),
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
