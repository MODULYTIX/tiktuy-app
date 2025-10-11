// src/shared/layout/PublicLayout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
      <div>
        {/* Aqui headder*/}
        {children}
        {/* Aqui footer*/}
      </div>
    );
  }
  
