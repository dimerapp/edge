/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { hastTypes } from '@dimerapp/markdown/types'
import type { PipelineHook } from './types.js'

/**
 * The rendering pipeline is used to hook into the markdown
 * rendering phase and use custom components to render
 * a done.
 *
 * ```ts
 * const pipeline = new RenderingPipeline()
 * pipeline.use((node, self) => {
 *   if (node.tagName === 'pre') {
 *     return pipeline.component(
 *      'components/pre',
 *      { node }
 *     )
 *   }
 * })
 * ```
 */
export class RenderingPipeline {
  #hooks: PipelineHook[] = []

  /**
   * Define a callback to handle rendering of a given node. The callback
   * will be invoked for all the nodes.
   *
   * - Return "undefined" to use the default renderer.
   * - Return "false" to skip the node from the output.
   * - Return an array with the component name and the props to pass to the component.
   */
  use(callback: PipelineHook): this {
    this.#hooks.push(callback)
    return this
  }

  /**
   * Use a custom edge component and define its state
   */
  component(
    name: string,
    state: { node: hastTypes.Element } & Record<string, any>
  ): [string, { node: hastTypes.Element; pipeline: RenderingPipeline } & Record<string, any>] {
    return [name, { pipeline: this, ...state }]
  }

  /**
   * Returns the component name and props for a given AST node
   */
  componentFor(
    node: hastTypes.Element | hastTypes.Text,
    pipeline: RenderingPipeline
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
      component = hook(node, pipeline)
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
    return ['dimer_element', { node, pipeline }]
  }
}
