/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { hastTypes } from '@dimerapp/markdown/types'
import type { HookCallback } from './types.js'

/**
 * Renderers allows using custom components for any node
 * inside the AST.
 *
 * Just define the hook to capture a node and return the
 * name and props for the component.
 *
 * ```ts
 * const renderer = new DimerEdgeRenderer()
 * renderer.use((node, self) => {
 *   if (node.tagName === 'pre') {
 *     return ['components/pre', { node, renderer: self }]
 *   }
 * })
 * ```
 */
export class DimerEdgeRenderer {
  #hooks: HookCallback[] = []

  /**
   * Define a callback to handle rendering of a given node. The callback
   * will be invoked for all the nodes.
   *
   * - Return "undefined" to use the default renderer.
   * - Return "false" to skip the node from the output.
   * - Return an array with the component name and the props to pass to the component.
   */
  use(callback: HookCallback): this {
    this.#hooks.push(callback)
    return this
  }

  /**
   * Returns the component name and props for a given AST node
   */
  componentFor(
    node: hastTypes.Element | hastTypes.Text,
    renderer: DimerEdgeRenderer
  ): [string, Record<string, any>] {
    /**
     * Always uses the "dimer_text" component for
     * text node
     */
    if (node.type === 'text') {
      return ['dimer_text', { node }]
    }

    let component: void | boolean | [string, any]

    /**
     * Check to see if there is any custom component defined
     * for a specific node
     */
    for (let hook of this.#hooks) {
      component = hook(node, renderer)
      if (component !== undefined) {
        break
      }
    }

    /**
     * Skip rendering of the node when "renderer" returns
     * false
     */
    if (component === false) {
      return ['dimer_void', {}]
    }

    /**
     * Render custom component when exists
     */
    if (Array.isArray(component)) {
      return component
    }

    /**
     * Self handle node rendering
     */
    return ['dimer_element', { node, renderer: renderer }]
  }
}
