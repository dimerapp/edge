/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { hastTypes } from '@dimerapp/markdown'

/**
 * Renderer to decide the component to be used for a node
 */
export class Renderer {
  private customRenderers: ((
    node: any,
    renderer: Renderer
  ) => void | boolean | [string, any])[] = []

  /**
   * Define a callback to handle rendering of a given node. The callback
   * will be invoked for all the nodes
   */
  public use(callback: (node: hastTypes.Element) => void | boolean | [string, any]): this {
    this.customRenderers.push(callback)
    return this
  }

  /**
   * Returns the component name and props for a given AST node
   */
  public getComponentFor(node: hastTypes.Node, renderReference: Renderer) {
    /**
     * Notify listeners for the text node
     */
    if (node.type === 'text') {
      return ['dimer::text', { node }]
    }

    let customComponent: void | boolean | [string, any]
    for (let customRenderer of this.customRenderers) {
      customComponent = customRenderer(node, renderReference)
      if (customComponent !== undefined) {
        break
      }
    }

    /**
     * False means, the renderer wants to skip rendering of
     * a node
     */
    if (customComponent === false) {
      return ['dimer::void']
    }

    /**
     * Return custom component when "customComponent" is not undefined
     */
    if (customComponent !== undefined) {
      return customComponent
    }

    /**
     * Self handle node rendering
     */
    return ['dimer::element', { node, renderer: renderReference }]
  }
}
