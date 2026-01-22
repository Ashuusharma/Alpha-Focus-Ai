"use client";

import { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div
      className={`
        w-full
        max-w-4xl
        mx-auto
        px-4 sm:px-6 md:px-8
        ${className}
      `}
    >
      {children}
    </div>
  );
}
