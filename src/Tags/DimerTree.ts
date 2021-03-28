/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.comharminder@cav.ai>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { TagContract, TagTokenContract } from 'edge.js'
import { EdgeError } from 'edge-error'

/**
 * An array of allowed expression
 */
const ALLOWED_EXPRESSIONS = ['MemberExpression', 'ArrayExpression', 'Identifier']

/**
 * Raises exception for an invalid expression
 */
function invalidExpressionException(
	type: string,
	expectedTypes: string[],
	token: TagTokenContract
) {
	return new EdgeError(
		`Invalid "${type}" expression. Excepted ${expectedTypes.join(',')} expressions`,
		'E_UNALLOWED_EXPRESSION',
		{
			line: token.loc.start.line,
			col: token.loc.start.col,
			filename: token.filename,
		}
	)
}

/**
 * Raises exception for too many arguments
 */
function tooManyArgumentsException(token: TagTokenContract) {
	return new EdgeError('"@dimerTree" accepts a maximum of two arguments', 'E_TOO_MANY_ARGUMENTS', {
		line: token.loc.start.line,
		col: token.loc.start.col,
		filename: token.filename,
	})
}

/**
 * Raises exception for missing arguments
 */
function missingArgumentsExceptions(token: TagTokenContract) {
	return new EdgeError('"@dimerTree" expects an argument to be passed', 'E_MISSING_ARGUMENT', {
		line: token.loc.start.line,
		col: token.loc.start.col,
		filename: token.filename,
	})
}

/**
 * Edge tag to recursively render Dimer AST
 */
export const DimerTree: TagContract = {
	tagName: 'dimerTree',
	block: false,
	seekable: true,

	compile(parser, buffer, token) {
		const awaitKeyword = parser.asyncMode ? 'await ' : ''
		const loopFunctionName = parser.asyncMode ? 'loopAsync' : 'loop'
		const asyncKeyword = parser.asyncMode ? 'async ' : ''

		/**
		 * Raise exception when no arg is passed
		 */
		if (!token.properties.jsArg) {
			throw missingArgumentsExceptions(token)
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
		 * Tree expression is dimer tree to loop over
		 */
		let treeExpression: any

		/**
		 * The renderer reference is the renderer to use to render the node. One
		 * can define a custom value too
		 */
		let rendererReference = 'state.dimerRenderer'

		/**
		 * Handle sequence expression to allow two arguments. Expecting first
		 * to be the dimer tree reference and other be the custom renderer
		 * reference
		 */
		if (expression.type === 'SequenceExpression') {
			const childrenExpression = expression.expressions
			if (childrenExpression.length > 2) {
				throw tooManyArgumentsException(token)
			}

			treeExpression = childrenExpression[0]

			/**
			 * The second argument has to be an identifier. Inline renderers cannot
			 * be created at all
			 */
			if (childrenExpression[1].type !== 'Identifier') {
				throw invalidExpressionException(childrenExpression[1].type.type, ['Identifier'], token)
			}

			rendererReference = `${parser.utils.stringify(
				parser.utils.transformAst(childrenExpression[1], token.filename, parser)
			)}`
		} else {
			treeExpression = expression
		}

		/**
		 * Raise error, if "treeExpression" is not one of the allowed expression
		 */
		if (!ALLOWED_EXPRESSIONS.includes(treeExpression.type)) {
			throw invalidExpressionException(treeExpression.type, ALLOWED_EXPRESSIONS, token)
		}

		/**
		 * Parse ast expression to a Javascript string expression
		 */
		const list = parser.utils.stringify(
			parser.utils.transformAst(treeExpression, token.filename, parser)
		)

		/**
		 * Loop over the list
		 */
		buffer.writeStatement(
			`${awaitKeyword}template.${loopFunctionName}(${list}, ${asyncKeyword}function (node) {`,
			token.filename,
			token.loc.start.line
		)

		/**
		 * For each children node recursively render this component
		 */
		buffer.outputExpression(
			[
				`${awaitKeyword}(function () {`,
				`  const [name, props] = ${rendererReference}.getComponentFor(node, ${rendererReference})`,
				`  return template.compileComponent(name)(`,
				`		template,`,
				`		template.getComponentState(props, {}, {}), $context)})()`,
			].join('\n'),
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
