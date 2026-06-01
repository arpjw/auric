import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Auric Docs',
  description: 'Documentation for the Auric DeFi project — ERC-20 token, vesting, and AMM on Sepolia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
