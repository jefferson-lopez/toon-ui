import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { cn } from '@/lib/utils';
import { docsTitle } from '@/lib/shared';
const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });
export const metadata: Metadata = { title: { default: docsTitle, template: `%s | ${docsTitle}` }, description: 'Official documentation for ToonUI, the protocol and runtime for AI-generated UI blocks rendered safely in React apps.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable)}><body className="flex min-h-screen flex-col antialiased"><RootProvider>{children}</RootProvider></body></html>; }
