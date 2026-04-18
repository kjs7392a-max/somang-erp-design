import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary: "bg-[#2F80ED] text-white hover:bg-[#2563c4] active:bg-[#1d4fa3]",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
  ghost: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
  outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
};

const sizeClasses = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
