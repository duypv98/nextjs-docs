import type { AppProps } from 'next/app'
import { ConfigProvider, theme } from 'antd'
import { Inter } from 'next/font/google'
import { DocsLayout } from '../components/DocsLayout'
import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

const antdTheme = {
  token: {
    colorPrimary: '#2563eb',
    fontFamily: inter.style.fontFamily,
    fontSize: 14,
  },
  algorithm: theme.defaultAlgorithm,
  components: {
    Collapse: {
      headerPadding: '6px 4px 6px 0',
      contentPadding: '0 0 0 0',
    },
  },
} as const

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider theme={antdTheme} wave={{ disabled: true }}>
      <div className={inter.className}>
        <DocsLayout>
          <Component {...pageProps} />
        </DocsLayout>
      </div>
    </ConfigProvider>
  )
}
