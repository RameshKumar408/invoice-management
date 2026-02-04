import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Inventory & Billing Management',
    description: 'A comprehensive system for managing products, customers, vendors, and transactions',
}

export default function RootLayout({
    children,
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
