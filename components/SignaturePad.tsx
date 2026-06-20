"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Check, Loader2, PenLine } from "lucide-react";

/**
 * Pad de signature électronique (souris + tactile). Exporte un PNG en data URL.
 * onConfirm reçoit (dataUrl, signerName).
 */
export default function SignaturePad({
  onConfirm,
  onCancel,
  submitting = false,
  defaultName = "",
  error,
}: {
  onConfirm: (dataUrl: string, signerName: string) => void;
  onCancel: () => void;
  submitting?: boolean;
  defaultName?: string;
  error?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState(defaultName);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1A3A6B";
    }
  }, []);

  useEffect(() => {
    setup();
  }, [setup]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const { x, y } = point(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = point(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  }
  function end() {
    drawing.current = false;
  }

  function clear() {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  function confirm() {
    if (!hasInk || !name.trim() || submitting) return;
    onConfirm(canvasRef.current!.toDataURL("image/png"), name.trim());
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>
          Nom du signataire *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom et nom"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white"
          style={{ fontFamily: "var(--font-lato)" }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>
            Signez ci-dessous *
          </label>
          <button onClick={clear} type="button" className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
            <Eraser size={13} /> Effacer
          </button>
        </div>
        <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="w-full h-40 block cursor-crosshair"
            style={{ touchAction: "none" }}
          />
          {!hasInk && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="flex items-center gap-2 text-sm text-gray-300" style={{ fontFamily: "var(--font-lato)" }}>
                <PenLine size={16} /> Dessinez votre signature
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>
        En signant, vous acceptez le devis. Cette signature électronique vaut accord ; la date, l'heure et votre adresse IP sont enregistrées comme preuve.
      </p>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100">
          <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel} type="button" className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black uppercase text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>
          Annuler
        </button>
        <button
          onClick={confirm}
          disabled={!hasInk || !name.trim() || submitting}
          type="button"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black uppercase disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#16a34a", fontFamily: "var(--font-montserrat)" }}
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {submitting ? "Signature…" : "Accepter & signer"}
        </button>
      </div>
    </div>
  );
}
