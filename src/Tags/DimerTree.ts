/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.comharminder@cav.ai>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { TagContract } from 'edge.js'
import { EdgeError } from 'edge-error'

/**
 * An array of allowed expression
 */
const ALLOWED_EXPRESSIONS = ['MemberExpression', 'ArrayExpression', 'Identifier']

/**
 * Edge tag to recursively render Dimer AST
 */
export const DimerTree: TagContract = {
	tagName: 'dimerTree',
	block: false,
	seekable: true,

	compile(parser, buffer, token) {
		/**
		 * Raise exception when no arg is passed
		 */
		if (!token.properties.jsArg) {
			throw new EdgeError('"@dimerTree" expects an argument to be passed', 'E_MISSING_ARGUMENT', {
				line: token.loc.start.line,
				col: token.loc.start.col,
				filename: token.filename,
			})
		}

		/**
		 * We just generate the AST and do not transform it, since the transform
		 * function attempts to resolve identifiers and we don't want that
		 */
		const { expression } = parser.utils.generateAST(
			token.properties.jsArg,
			token.loc,
			token.filename
		)

		/**
		 * Raise error, if value is not an identifier or an array expression
		 */
		if (!ALLOWED_EXPRESSIONS.includes(expression.type)) {
			throw new EdgeError(
				'"@dimerTree" only accepts an Identifier or an ArrayExpression',
				'E_UNALLOWED_EXPRESSION',
				{
					line: token.loc.start.line,
					col: token.loc.start.col,
					filename: token.filename,
				}
			)
		}

		/**
		 * Parse ast expression to a Javascript string expression
		 */
		const list = parser.utils.stringify(
			parser.utils.transformAst(expression, token.filename, parser)
		)

		/**
		 * Loop over the list
		 */
		buffer.writeStatement(
			`ctx.loop(${list}, function (node) {`,
			token.filename,
			token.loc.start.line
		)

		/**
		 * For each children node recursively render this component
		 */
		buffer.outputExpression(
			'template.renderWithState(...state.dimerRenderer.getComponentFor(node))',
			token.filename,
			token.loc.start.line,
			false
		)

		/**
		 * Close each loop
		 */
		buffer.writeExpression('})', token.filename, -1)
	},
}
