import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { SandboxProvider } from '@/context/SandboxContext';

const outfit = Outfit({
  subsets: ["latin"],
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
    <html lang="es">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <ToastProvider>
            <SandboxProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </SandboxProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
