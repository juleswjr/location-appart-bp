"use client";
import { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // 'success', 'error', 'loading'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch( process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Une question ?</h2>
        <p className="text-gray-600 mb-8">N'hésitez pas à nous écrire, nous répondons généralement sous 24h.</p>

        {status === "success" ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            Merci ! Votre message a bien été envoyé.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left bg-gray-50 p-8 rounded-xl shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre Nom</label>
                <input
                  type="text"
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre Email</label>
                <input
                  type="email"
                  required
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Votre Message</label>
              <textarea
                rows="4"
                required
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition-colors"
            >
              {status === "loading" ? "Envoi..." : "Envoyer mon message"}
            </button>
            
            {status === "error" && (
              <p className="text-red-500 text-center text-sm">Une erreur est survenue, réessayez.</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}