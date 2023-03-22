/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { hastTypes } from '@dimerapp/markdown/types'
import type { DimerEdgeRenderer } from './dimer_edge_renderer.js'

/**
 * Shape of the renderer hook
 */
export type HookCallback = (
  node: hastTypes.Element,
  renderer: DimerEdgeRenderer
) => void | boolean | [string, Record<string, any>]
