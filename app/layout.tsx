import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/* Tipografías de marca autoalojadas (el build no depende de Google Fonts):
 * se exponen como --font-heading y --font-sans en globals.css. */
const baloo = localFont({
  src: "../public/fonts/baloo2-latin.woff2",
  variable: "--font-baloo",
  weight: "600 700",
  display: "swap",
});

const nunito = localFont({
  src: "../public/fonts/nunito-latin.woff2",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Plan de Packing · Pura Fruit",
    template: "%s · Plan de Packing",
  },
  description: "Planificación semanal y ejecución diaria de packing por planta.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${baloo.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
