import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: "--font-inter" });

export const metadata: Metadata = {
  title: 'ResumeRank',
  description: 'AI-Powered Resume Screening',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The existing font links are fine for Inter, next/font is also good.
            No new <link> elements needed as Inter is already handled.
        */}
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased", inter.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
