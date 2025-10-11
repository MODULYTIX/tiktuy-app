import React from 'react';

interface TittleXProps {
  children: React.ReactNode;
  className?: string;
}

export default function TittleX({ children, className = '' }: TittleXProps) {
  return (
    <h2
      className={`
        relative inline-block font-bold text-gray-900 text-4xl
        after:content-[''] after:absolute after:left-0 after:bottom-0
        after:w-6 after:h-2 after:bg-blue-600 after:rounded-2xl after:mb-[-4px]
        ${className}
      `}>
      {children}
    </h2>
  );
}
