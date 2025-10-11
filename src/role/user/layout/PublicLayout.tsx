import Footer from '../components/Footer';

// src/shared/layout/PublicLayout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
      <div>
        
        {children}
        <Footer />
      </div>
    );
  }
  
