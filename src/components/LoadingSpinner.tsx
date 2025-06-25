import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  text = "Loading...",
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-32 w-32"
  };

  const containerClasses = fullScreen
    ? "flex justify-center items-center min-h-screen"
    : "flex flex-col justify-center items-center py-12";

  return (
    <div className={containerClasses}>
      <div
        className={`animate-spin rounded-full border-b-2 border-tropical-teal ${sizeClasses[size]} mb-4`}
      />
      <p className="text-tropical-teal font-medium">{text}</p>
    </div>
  );
}
