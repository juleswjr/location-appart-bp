"use client";

import { useState, useRef, useEffect } from "react";

export default function Chatbot({ apartmentId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "Bonjour ! Je suis l'assistant de la conciergerie MyBellePlagne. Avez-vous une question sur nos appartements ?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Référence pour faire défiler le chat vers le bas automatiquement
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    // On ajoute le message de l'utilisateur à l'historique
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // On utilise ton URL d'API (comme dans ta page.js)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userMessage,
          apartmentId: apartmentId // On envoie l'ID si on est sur la page d'un appart
        }),
      });

      if (!response.ok) throw new Error("Erreur réseau");

      const data = await response.json();
      
      // On ajoute la réponse de l'IA
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "bot", content: "Oups, je suis indisponible pour le moment. Veuillez réessayer plus tard !" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* BOUTON FLOTTANT (Placé en bas à gauche pour ne pas gêner GTranslate) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform ${isOpen ? "scale-0" : "scale-100"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* FENÊTRE DE CHAT */}
      <div className={`fixed bottom-4 left-4 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 transition-all duration-300 origin-bottom-left ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}>
        
        {/* En-tête */}
        <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h3 className="font-bold">Conciergerie MyBellePlagne</h3>
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
            ✖
          </button>
        </div>

        {/* Zone des messages */}
        <div className="h-80 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
          {messages.map((msg, index) => (
            <div key={index} className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-blue-600 text-white self-end rounded-br-none" : "bg-white border border-gray-200 text-gray-800 self-start rounded-bl-none shadow-sm"}`}>
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="bg-white border border-gray-200 text-gray-500 self-start p-3 rounded-lg rounded-bl-none shadow-sm text-sm flex gap-1">
              <span className="animate-bounce">●</span><span className="animate-bounce delay-100">●</span><span className="animate-bounce delay-200">●</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200 rounded-b-xl flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            Envoyer
          </button>
        </form>
      </div>
    </>
  );
}