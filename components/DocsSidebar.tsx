import { Collapse } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import nav from '../lib/docs-nav.json'

type NavPage = { href: string; path: string; title: string }
type NavFolder = {
  id: string
  path?: string
  pathSegment?: string
  label: string
  pages: NavPage[]
  subfolders: NavFolder[]
}

function normalizePath(p: string) {
  const base = p.split('?')[0] || '/'
  if (base.length > 1) return base.replace(/\/$/, '')
  return base
}

/** Panels that sit on the current URL path (direct children to expand by default). */
function getDefaultOpenKeys(
  currentPath: string,
  subfolders: NavFolder[],
): string | string[] {
  const p = normalizePath(currentPath)
  const keys = subfolders
    .filter((s) => {
      const prefix = `/${s.id}`
      return p === prefix || p.startsWith(`${prefix}/`)
    })
    .map((s) => s.id)
  if (keys.length === 0) return []
  if (keys.length === 1) return keys[0]!
  return keys
}

function pageMatches(
  p: NavPage,
  q: string,
) {
  return (
    p.title.toLowerCase().includes(q) || p.path.toLowerCase().includes(q)
  )
}

function filterFolder(
  node: NavFolder,
  q: string,
  isRoot: boolean,
): NavFolder | null {
  if (!q) return node
  const lq = q.toLowerCase()
  if (!isRoot && node.label.toLowerCase().includes(lq)) {
    return node
  }
  const subfolders = node.subfolders
    .map((s) => filterFolder(s, lq, false))
    .filter((f): f is NavFolder => f !== null)
  const pages = node.pages.filter((p) => pageMatches(p, lq))
  if (isRoot) {
    if (subfolders.length === 0 && pages.length === 0) return null
  } else {
    if (subfolders.length === 0 && pages.length === 0) return null
  }
  return { ...node, pages, subfolders }
}

export function DocsSidebar() {
  const { asPath, pathname } = useRouter()
  const [query, setQuery] = useState('')

  const isActive = useCallback(
    (href: string) => {
      const p = normalizePath(asPath || pathname)
      const h = normalizePath(href)
      return p === h
    },
    [asPath, pathname],
  )

  const tree = useMemo(() => {
    const q = query.trim()
    if (!q) return nav.root
    return filterFolder(
      nav.root as unknown as NavFolder,
      q,
      true,
    )
  }, [query])

  const pathKey = `${normalizePath(asPath || pathname)}|${query.trim()}`

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      <div className="docs-sidebar__brand">
        <Link href="/">Next.js docs</Link>
      </div>
      <label className="docs-sidebar__search">
        <span className="visually-hidden">Filter pages</span>
        <input
          type="search"
          placeholder="Filter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      <div className="docs-sidebar__groups">
        {tree == null ? (
          <p className="docs-nav-empty">No pages match this filter.</p>
        ) : (
          <div key={pathKey} className="docs-nav-tree">
            <NavTree
              folder={tree as NavFolder}
              isActive={isActive}
              currentPath={normalizePath(asPath || pathname)}
            />
          </div>
        )}
      </div>
    </nav>
  )
}

type NavTreeProps = {
  folder: NavFolder
  isActive: (href: string) => boolean
  currentPath: string
}

function NavTree({ folder, isActive, currentPath }: NavTreeProps) {
  if (folder.subfolders.length === 0 && folder.pages.length === 0) {
    return null
  }

  return (
    <>
      {folder.pages.length > 0 && (
        <ul className="docs-nav-list docs-nav-list--root">
          {folder.pages.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  isActive(item.href) ? 'docs-nav-link is-active' : 'docs-nav-link'
                }
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {folder.subfolders.length > 0 && (
        <SubfolderCollapse
          subfolders={folder.subfolders}
          currentPath={currentPath}
          isActive={isActive}
          depth={0}
        />
      )}
    </>
  )
}

type SubfolderCollapseProps = {
  subfolders: NavFolder[]
  currentPath: string
  isActive: (href: string) => boolean
  depth: number
}

function SubfolderCollapse({
  subfolders,
  currentPath,
  isActive,
  depth,
}: SubfolderCollapseProps) {
  return (
    <Collapse
      size="small"
      ghost
      bordered={false}
      expandIconPosition="end"
      className="docs-nav-collapse"
      data-depth={depth}
      defaultActiveKey={getDefaultOpenKeys(currentPath, subfolders)}
      items={subfolders.map((sub) => ({
        key: sub.id,
        label: <span className="docs-nav-collapse__label">{sub.label}</span>,
        children: (
          <FolderBlock
            folder={sub}
            currentPath={currentPath}
            isActive={isActive}
            depth={depth + 1}
          />
        ),
      }))}
    />
  )
}

type FolderBlockProps = {
  folder: NavFolder
  currentPath: string
  isActive: (href: string) => boolean
  depth: number
}

function FolderBlock({
  folder,
  currentPath,
  isActive,
  depth,
}: FolderBlockProps) {
  if (folder.subfolders.length === 0 && folder.pages.length === 0) {
    return null
  }

  return (
    <div className="docs-nav-folder__inner" data-depth={depth}>
      {folder.subfolders.length > 0 && (
        <SubfolderCollapse
          subfolders={folder.subfolders}
          currentPath={currentPath}
          isActive={isActive}
          depth={depth}
        />
      )}
      {folder.pages.length > 0 && (
        <ul className="docs-nav-list">
          {folder.pages.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  isActive(item.href) ? 'docs-nav-link is-active' : 'docs-nav-link'
                }
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
