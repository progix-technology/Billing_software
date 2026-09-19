import React from 'react';

/**
 * A Tailwind-based Skeleton loader that mimics the MUI Skeleton API.
 */
export const Skeleton = ({ variant = 'text', width, height, className = '', style = {} }) => {
  // Base classes for the pulse animation and color
  let baseClasses = 'animate-pulse bg-slate-200';

  // Variant classes
  if (variant === 'text') {
    baseClasses += ' rounded';
    // For text, if height isn't explicitly provided, we often rely on font-size or a default height.
    if (!height) {
      style.height = style.fontSize || '1.2em';
    }
    if (!width) {
      style.width = '100%';
    }
  } else if (variant === 'circular') {
    baseClasses += ' rounded-full';
  } else if (variant === 'rectangular') {
    baseClasses += ' rounded-none';
  } else if (variant === 'rounded') {
    baseClasses += ' rounded-md';
  }

  // Combine with explicit width/height
  const finalStyle = {
    ...style,
    width: width ?? style.width,
    height: height ?? style.height,
  };

  return (
    <div 
      className={`${baseClasses} ${className}`}
      style={finalStyle}
    />
  );
};

/**
 * A Tailwind-based Stack component that mimics the MUI Stack API.
 */
export const Stack = ({ spacing = 1, children, className = '' }) => {
  // Tailwind spacing map (1 MUI spacing = 8px roughly = gap-2 in Tailwind)
  // spacing={1} -> gap-2, spacing={2} -> gap-4, etc.
  const gapClass = `gap-${spacing * 2}`;
  
  return (
    <div className={`flex flex-col ${gapClass} ${className}`}>
      {children}
    </div>
  );
};
