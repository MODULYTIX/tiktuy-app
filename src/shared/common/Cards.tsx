import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Cardx({ children, className }: Props) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray30 p-4 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
