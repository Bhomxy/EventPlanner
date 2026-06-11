import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist_Mono, Outfit, Sora } from "next/font/google";
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
    default: "EventPlanner — AI event planning for tech communities",
    template: "%s · EventPlanner",
  },
  description:
    "Describe your event, get a tailored checklist, and work top-down from venue to launch day.",
  openGraph: {
    title: "EventPlanner — AI event planning for tech communities",
    description:
      "Describe your event, get a tailored checklist, and work top-down from venue to launch day.",
    url: "/",
    siteName: "EventPlanner",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "EventPlanner — AI event planning for tech communities",
    description:
      "Describe your event, get a tailored checklist, and work top-down from venue to launch day.",
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
          className="min-h-full flex flex-col text-stone-900 dark:text-stone-50"
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
