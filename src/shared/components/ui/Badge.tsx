interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary';
  }
  
  export function Badge({ children, variant = 'default' }: BadgeProps) {
    const color = variant === 'default' ? 'bg-black text-white' : 'bg-gray-300 text-gray-700';
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>
        {children}
      </span>
    );
  }
  