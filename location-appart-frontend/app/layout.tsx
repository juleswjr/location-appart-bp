import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // 👈 1. AJOUT DE L'IMPORT SCRIPT

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

        {/* ========================================== */}
        {/* 👇 3. LE BLOC GOOGLE TRANSLATE EST ICI 👇 */}
        {/* ========================================== */}
        
        {/* Le conteneur du bouton (placé en bas à droite de l'écran) */}
        <div id="google_translate_element" className="fixed bottom-4 right-4 z-50 bg-white p-2 rounded shadow-lg"></div>
        
        {/* Le moteur de traduction Google */}
        <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'fr',
                includedLanguages: 'en,nl', // Traduction dispo en Anglais et Néerlandais
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
              }, 'google_translate_element');
            }
          `}
        </Script>
        
        {/* ========================================== */}
        {/* 👆 FIN DU BLOC GOOGLE TRANSLATE 👆 */}
        {/* ========================================== */}

      </body>
    </html>
  );
}