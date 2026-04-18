import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // 👈 1. AJOUT DE L'IMPORT SCRIPT
import Chatbot from "../components/Chatbot"; // Vérifie que le chemin est bon !
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyBellePlagne",
  description: "Louez votre appartement idéal à Belle Plagne. Ski aux pieds, confort et vue imprenable."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 👇 2. LANGUE PASSÉE EN "fr" ET AJOUT DU SCROLL FLUIDE
    <html lang="fr" className="scroll-smooth"> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      {/* NOTRE NOUVEAU CHATBOT */}
        <Chatbot />
{/* ========================================== */}
        {/* 👇 NOUVEAU BLOC : GTRANSLATE (PRO & GRATUIT) 👇 */}
        {/* ========================================== */}
        
        {/* Le conteneur du menu déroulant (fixé en bas à droite) */}
        <div className="fixed bottom-4 right-4 z-50 shadow-lg rounded">
          <div className="gtranslate_wrapper"></div>
        </div>

        {/* Les paramètres du widget */}
        <Script id="gtranslate-settings" strategy="beforeInteractive">
          {`window.gtranslateSettings = {
            "default_language": "fr",
            "languages": ["fr", "en", "nl"],
            "wrapper_selector": ".gtranslate_wrapper",
            "flag_style": "2d"
          }`}
        </Script>
        
        {/* Le moteur GTranslate */}
        <Script src="https://cdn.gtranslate.net/widgets/latest/dropdown.js" strategy="afterInteractive" />
        
        {/* ========================================== */}

      </body>
    </html>
  );
}