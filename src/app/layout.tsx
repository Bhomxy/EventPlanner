import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist_Mono, Outfit, Sora } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const bodyFont = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eventplanner-black.vercel.app"),
  title: {
    default: "EventPlanner — AI checklists for any event",
    template: "%s · EventPlanner",
  },
  description:
    "Describe your event, get a tailored checklist, and work from venue to launch day — weddings, parties, conferences, and more.",
  openGraph: {
    title: "EventPlanner — AI checklists for any event",
    description:
      "Describe your event, get a tailored checklist, and work from venue to launch day — weddings, parties, conferences, and more.",
    url: "/",
    siteName: "EventPlanner",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "EventPlanner — AI checklists for any event",
    description:
      "Describe your event, get a tailored checklist, and work from venue to launch day — weddings, parties, conferences, and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body
          suppressHydrationWarning
          className="relative min-h-dvh flex flex-col text-stone-900 dark:text-stone-50"
        >
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
