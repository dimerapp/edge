/*
 * @dimerapp/edge
 *
 * (c) DimerApp
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { hastTypes } from '@dimerapp/markdown/types'
import type { RenderingPipeline } from './pipeline.js'

/**
 * Shape of the pipeline hook
 */
export type PipelineHook = (
  node: hastTypes.Element,
  renderer: RenderingPipeline
) => void | boolean | [string, Record<string, any>]
