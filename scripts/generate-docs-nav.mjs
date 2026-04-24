import { readdir, writeFile, mkdir } from 'node:fs/promises'
import { join, relative, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAGES = join(__dirname, '..', 'pages')

function titleFromName(name) {
  const base = name.replace(/\.md$/i, '')
  return base
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** @param {string} r relative path with / */
function fileToPage(r) {
  let href
  if (r === 'index.md') href = '/'
  else if (r.endsWith('/index.md')) href = '/' + r.slice(0, -'/index.md'.length)
  else if (r.endsWith('.md')) href = '/' + r.slice(0, -3)
  else href = '/' + r
  const fileName = r.split('/').pop() || r
  let title
  if (r === 'index.md') title = 'Home'
  else if (r.endsWith('/index.md')) {
    const parent = r.split('/').slice(-2, -1)[0] || 'Page'
    title = titleFromName(parent)
  } else {
    title = titleFromName(fileName)
  }
  return { href, path: r, title }
}

/**
 * @returns {import('node:fs').PathLike[]}
 */
async function collectMdFiles(dir) {
  const out = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await collectMdFiles(p)))
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(p)
    }
  }
  return out
}

function getOrCreateFolder(node, pathSegments) {
  let current = node
  const acc = []
  for (const seg of pathSegments) {
    acc.push(seg)
    const id = acc.join('/')
    let sub = current.subfolders.find((f) => f.pathSegment === seg)
    if (!sub) {
      sub = {
        id,
        pathSegment: seg,
        label: titleFromName(seg),
        pages: [],
        subfolders: [],
      }
      current.subfolders.push(sub)
    }
    current = sub
  }
  return current
}

function sortNode(node) {
  node.pages.sort((a, b) => a.path.localeCompare(b.path, 'en'))
  node.subfolders.sort((a, b) => a.label.localeCompare(b.label, 'en'))
  for (const f of node.subfolders) sortNode(f)
}

async function main() {
  const filePaths = await collectMdFiles(PAGES)
  const relPath = (f) => relative(PAGES, f).split(sep).join('/')

  const root = {
    id: 'root',
    path: '',
    label: 'Pages',
    pages: [],
    subfolders: [],
  }

  for (const f of filePaths) {
    const r = relPath(f)
    const item = fileToPage(r)
    const parts = r.split('/')
    if (parts.length === 1) {
      root.pages.push(item)
    } else {
      const dirParts = parts.slice(0, -1)
      const folder = getOrCreateFolder(root, dirParts)
      folder.pages.push(item)
    }
  }

  sortNode(root)

  await mkdir(join(__dirname, '..', 'lib'), { recursive: true })
  const out = join(__dirname, '..', 'lib', 'docs-nav.json')
  const pageCount = filePaths.length
  await writeFile(out, JSON.stringify({ root }, null, 2))
  console.log('Wrote', out, 'with', pageCount, 'pages')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
