/*
 * @dimerapp/edge
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { htmlEscape } from 'escape-goat'
import { find, html } from 'property-information'
import { hastTypes } from '@dimerapp/markdown/types'
import htmlTags, { type htmlTagsVoid } from 'html-tags/void.js'

/**
 * Find if element is a void HTML element or not
 */
export function isVoidElement(element: htmlTagsVoid): boolean {
  return htmlTags.includes(element)
}

/**
 * Stringify an object to props to HTML attributes
 */
export function stringifyAttributes(props: any): string {
  const attributes = Object.keys(props)
  if (attributes.length === 0) {
    return ''
  }

  return ` ${attributes
    .reduce<string[]>((result, key) => {
      const propInfo = find(html, key)
      if (!propInfo || propInfo.space === 'svg') {
        return result
      }

      let value = props[key]

      /**
       * Join array values with correct seperator
       */
      if (Array.isArray(value)) {
        value = value.join(propInfo.commaSeparated ? ',' : ' ')
      }

      /**
       * Wrap values inside double quotes when not booleanish
       */
      if (!propInfo.booleanish && !propInfo.number) {
        value = `"${htmlEscape(value)}"`
      }

      /**
       * Push key value string
       */
      result.push(`${propInfo.attribute}=${value}`)
      return result
    }, [])
    .join(' ')}`
}

/**
 * Returns an classes for a node. The method ensures that you always
 * get back an array, even when no classes are defined
 */
export function getClasses(node: hastTypes.Element): string[] {
  if (!node.properties || !node.properties.className) {
    return []
  }

  if (typeof node.properties.className === 'string') {
    return [node.properties.className]
  }

  if (Array.isArray(node.properties.className)) {
    return node.properties.className as string[]
  }

  return []
}

/**
 * Returns a boolean telling if an element has a given class name
 * or not.
 */
export function hasClass(node: hastTypes.Element, className: string): boolean {
  return getClasses(node).includes(className)
}
