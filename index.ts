/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { EdgeContract } from 'edge.js'

import { Utils } from './src/Utils'
import { DimerTree } from './src/Tags/DimerTree'

export { Renderer } from './src/Renderer'

/**
 * Edge plugin to register dimer specific globals, components
 * and tags
 */
export default function (edge: EdgeContract) {
	/**
	 * Always needs to be registered once
	 */
	edge.global('dimerUtils', new Utils())

	/**
	 * Always needs to be registered once
	 */
	edge.registerTag(DimerTree)

	/**
	 * Always needs to be registered once
	 */
	edge.registerTemplate('dimer::text', {
		template: '{{node.value}}',
	})

	/**
	 * Render an element
	 */
	edge.registerTemplate('dimer::element', {
		template: [
			'@if(dimerUtils.isVoidElement(node.tagName))~',
			'<{{node.tagName}}{{{dimerUtils.propsToAttributes(node.properties)}}}/>',
			'@else~',
			'<{{node.tagName}}{{{dimerUtils.propsToAttributes(node.properties)}}}>',
			'@dimerTree(node.children, renderer)~',
			'</{{node.tagName}}>',
			'@endif',
		].join('\n'),
	})

	/**
	 * Used when renderer wants to skip a node
	 */
	edge.registerTemplate('dimer::void', {
		template: '',
	})
}
