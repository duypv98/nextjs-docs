import type { ReactNode } from 'react'
import { DocsSidebar } from './DocsSidebar'

type Props = { children: ReactNode }

export function DocsLayout({ children }: Props) {
  return (
    <div className="docs-shell">
      <DocsSidebar />
      <main className="docs-main">{children}</main>
    </div>
  )
}
