"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react"; // Icônes pour mobile

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Petit effet : la barre devient blanche quand on scrolle
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Nos Appartements", href: "#appartements" },
    { name: "Avis Clients", href: "#avis" },
    { name: "Localisation", href: "#localisation" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
    }`}>
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        
        {/* Logo / Nom du site */}
        <a href="#" className={`text-xl font-bold ${scrolled ? "text-blue-900" : "text-white"}`}>
          Location Belle Plagne
        </a>

        {/* Menu PC */}
        <div className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className={`font-medium hover:text-blue-500 transition-colors ${
                scrolled ? "text-gray-700" : "text-white/90"
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Bouton Menu Mobile */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className={scrolled ? "text-black" : "text-white"} /> : <Menu className={scrolled ? "text-black" : "text-white"} />}
        </button>
      </div>

      {/* Menu Mobile (Déroulant) */}
      {isOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 w-full shadow-lg p-4 flex flex-col space-y-4">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-gray-800 font-medium block"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}