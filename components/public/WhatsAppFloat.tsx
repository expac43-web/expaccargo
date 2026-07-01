"use client";

/**
 * Bouton WhatsApp flottant fixe (pages publiques).
 * Numéro : +242 06 436 38 82 → wa.me/242064363882
 */
export default function WhatsAppFloat() {
  const phone = "242064363882";
  const message = encodeURIComponent("Bonjour EXPAC, j'aimerais des informations.");
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="fixed z-50 bottom-5 right-5 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110"
      style={{ backgroundColor: "#25D366" }}
    >
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping"
        style={{ backgroundColor: "#25D366" }}
      />
      <svg viewBox="0 0 32 32" width="30" height="30" fill="#ffffff" className="relative" aria-hidden="true">
        <path d="M16.003 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.46 1.73 6.4L3.2 28.8l6.57-1.72a12.74 12.74 0 006.23 1.62h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8zm0 23.36h-.01a10.5 10.5 0 01-5.36-1.47l-.38-.23-3.9 1.02 1.04-3.8-.25-.39a10.56 10.56 0 01-1.62-5.62c0-5.83 4.75-10.58 10.58-10.58 2.83 0 5.48 1.1 7.48 3.1a10.5 10.5 0 013.1 7.48c0 5.83-4.75 10.58-10.58 10.58zm5.8-7.92c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.5-2.56-1.58-.95-.84-1.58-1.88-1.77-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.6-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.64 0 1.56 1.13 3.06 1.29 3.27.16.21 2.23 3.4 5.4 4.77.75.32 1.34.52 1.8.66.76.24 1.44.21 1.98.13.6-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  );
}
