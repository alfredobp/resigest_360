import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { SandboxProvider } from '@/context/SandboxContext';
import { TenantProvider } from '@/context/TenantContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ResiGest 360 | Plataforma de Gestión Integral de Residuos",
    template: "%s | ResiGest 360"
  },
  description: "Software integral para la trazabilidad, gestión y cumplimiento legal de residuos (DI, DCS, NT, SIRA/e-SIR).",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: "/apple-icon.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100`}>
        <ThemeProvider>
          <ToastProvider>
            <TenantProvider>
              <SandboxProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </SandboxProvider>
            </TenantProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
