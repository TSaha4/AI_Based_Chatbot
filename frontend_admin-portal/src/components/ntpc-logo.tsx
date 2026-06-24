import React from "react";

export function NtpcLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rounded rect border */}
      <rect
        x="15"
        y="15"
        width="210"
        height="150"
        rx="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
      />
      {/* Hindi text "एनटीपीसी" */}
      <text
        x="120"
        y="78"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="40"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        एनटीपीसी
      </text>
      {/* English text "NTPC" */}
      <text
        x="120"
        y="136"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="44"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        NTPC
      </text>
    </svg>
  );
}
