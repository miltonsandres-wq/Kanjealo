import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
}

export function Input({
  etiqueta,
  error,
  ayuda,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || etiqueta?.toLowerCase().replace(/\s/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {etiqueta && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-navy/80 font-outfit"
        >
          {etiqueta}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-btn border border-[#e0dcd6] bg-white text-navy font-outfit text-sm
          placeholder:text-navy/30
          focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20
          transition-all duration-200
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}
          ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 font-outfit">{error}</p>
      )}
      {ayuda && !error && (
        <p className="text-xs text-navy/40 font-outfit">{ayuda}</p>
      )}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta?: string;
  error?: string;
}

export function TextArea({
  etiqueta,
  error,
  className = "",
  id,
  ...props
}: TextAreaProps) {
  const inputId = id || etiqueta?.toLowerCase().replace(/\s/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {etiqueta && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-navy/80 font-outfit"
        >
          {etiqueta}
        </label>
      )}
      <textarea
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-btn border border-[#e0dcd6] bg-white text-navy font-outfit text-sm
          placeholder:text-navy/30
          focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20
          transition-all duration-200 resize-none
          ${error ? "border-red-500" : ""}
          ${className}`}
        rows={3}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 font-outfit">{error}</p>
      )}
    </div>
  );
}
