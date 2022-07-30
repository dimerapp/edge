# Dimer Edge
> Use Edge template engine to render Dimer markdown AST

[![gh-workflow-image]][gh-workflow-url] [![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url]

> **Note**: This package is ESM only

The `@dimerapp/edge` allows you to render the [@dimerapp/markdown](https://github.com/dimerapp/markdown) AST using Edge templates.

By using Edge as the rendering layer for Markdown, you can capture any AST node and render them using components.

## Setup
Install the package from the npm registry as follows:

```sh
npm i @dimerapp/edge

# yarn
yarn add @dimerapp/edge
```

This package has a peer dependency on `@dimerapp/markdown`. So make sure to install it as well.

```sh
npm i @dimerapp/markdown

# yarn
yarn add @dimerapp/markdown
```

## Usage
Import the `dimerProvider` function and register it as the edge plugin. The function registers the neccessary helpers and in-memory templates to render the markdown AST.

```ts
import { Edge } from 'edge.js'
import { fileURLToPath } from 'node:url'
import { dimerProvider, MarkdownRenderer } from '@dimerapp/edge'

const viewsPath = fileURLToPath(new URL('./views', import.meta.url))
const edge = new Edge()
const renderer = new MarkdownRenderer()

edge.mount(viewsPath)
edge.use(dimerProvider)

await edge.render('guide.edge', {
  markdownFile: md,
  renderer
})
```

Next, create the `guide.edge` file and paste the following markup inside it.

```edge
<!DOCTYPE html>
<html>
<head>
</head>
<body>
  @!component('dimer_contents', { node: md.ast.children, renderer })~
</body>
</html>
```

That's all you need to do.

## Self rendering AST nodes
The benefit of generating the AST and then using a template engine to render its nodes comes in the form of flexbility.

In the following example, we capture the node with the tagName of `pre` and render it using the `elements/pre.edge` file. The second element inside the array is the props for edge component. You can name them as you like.

```ts
import { hasClass } from '@dimerapp/edge/utils'
import { MarkdownRenderer } from '@dimerapp/edge'

const renderer = new MarkdownRenderer()

renderer.use((node) => {
  if (node.tagName === 'pre') {
    return ['elements/pre', { node, renderer }]
  }
})
```

Inside the edge file we wrap the pre tag inside a custom div and create a **Copy to clipboard** button to copy the contents of the codeblock to the clipboard.

Also, we are using Alpine.js to implement the frontend. For this example, you can pull in Alpine from the CDN.

```html
<script src="//unpkg.com/alpinejs" defer></script>
```

```html
<div x-data="{
  copy() {
    navigator.clipboard.writeText($el.querySelector('code').textContent)
  }
}">
  <button @click="copy"> Copy to clipboard </button>
  @!component('dimer_element', { node, renderer })~
</div>
```

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]:  "typescript"

[npm-image]: https://img.shields.io/npm/v/@dimerapp/edge.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@dimerapp/edge "npm"

[license-image]: https://img.shields.io/npm/l/@dimerapp/edge?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md "license"

[gh-workflow-image]: https://img.shields.io/github/workflow/status/dimerapp/edge/test?style=for-the-badge
[gh-workflow-url]: https://github.com/dimerapp/edge/actions/workflows/test.yml "Github actions"
