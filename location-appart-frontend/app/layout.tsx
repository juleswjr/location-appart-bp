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
        {/* 👇 BLOC GOOGLE TRANSLATE + BOUTON FR 👇 */}
        {/* ========================================== */}
        
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
          {/* NOTRE BOUTON DE RETOUR AU FRANÇAIS */}
          <button 
            id="btn-reset-french" 
            className="bg-white text-gray-700 font-bold px-3 py-2 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
          >
            🇫🇷 FR
          </button>

          {/* LE BOUTON GOOGLE */}
          <div id="google_translate_element" className="bg-white p-1 rounded-lg shadow-lg"></div>
        </div>
        
        <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'fr',
                includedLanguages: 'en,nl',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
              }, 'google_translate_element');
            }

            // Technique du délai pour être sûr que le bouton existe bien dans Next.js
            setTimeout(function() {
              var btn = document.getElementById('btn-reset-french');
              if (btn) {
                btn.onclick = function() {
                  // On écrase le cookie Google partout où il pourrait se cacher
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + window.location.hostname + "; path=/;";
                  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=." + window.location.hostname + "; path=/;";
                  // On recharge la page à neuf
                  window.location.reload();
                };
              }
            }, 1000);
          `}
        </Script>
        
        {/* ========================================== */}
        {/* 👆 FIN DU BLOC GOOGLE TRANSLATE 👆 */}
        {/* ========================================== */}

      </body>
    </html>
  );
}