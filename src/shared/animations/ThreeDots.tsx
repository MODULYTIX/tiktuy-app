
export function ThreeDots({ label = 'Procesando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div className="flex items-center gap-2">
        <span className="dot animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="dot animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="dot animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-gray-600">{label}</span>

      {/* estilos inline para que sea plug-and-play */}
      <style>{`
        .dot {
          width: 10px;
          height: 10px;
          background: #4b5563;
          display: inline-block;
          border-radius: 999px;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: .6; }
          40% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce {
          animation: bounce 1s infinite ease-in-out both;
        }
      `}</style>
    </div>
  );
}
