import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  hoverable = false,
  padding = "md",
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-white rounded-card shadow-card ${paddings[padding]} ${
        hoverable
          ? "transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
