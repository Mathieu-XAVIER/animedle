import type { Metadata } from 'next'
import { Chakra_Petch, Barlow } from 'next/font/google'
import './globals.css'

const chakra = Chakra_Petch({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
  display: 'swap',
})

const barlow = Barlow({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Animedle — Le défi anime quotidien',
  description: 'Devine le personnage anime du jour. Mode classique, mode citation. Gratuit, sans compte.',
  keywords: ['anime', 'jeu', 'wordle', 'one piece', 'jujutsu kaisen', 'demon slayer'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${chakra.variable} ${barlow.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
