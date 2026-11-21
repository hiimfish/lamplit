import type { ComponentChildren } from 'preact';

/**
 * English text inside the zh-Hant page. lang="en" makes screen readers switch
 * to an English voice instead of reading the words with a Chinese one.
 */
export function En({
  children,
  class: className,
}: {
  children: ComponentChildren;
  class?: string;
}) {
  return (
    <span lang="en" class={className}>
      {children}
    </span>
  );
}
