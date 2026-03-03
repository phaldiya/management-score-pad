interface KbdProps {
  children: string;
}

export function Kbd({ children }: KbdProps) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-gray-700 text-xs shadow-[0_1px_0_1px_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  );
}
