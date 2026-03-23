import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: ReactNode;
  offset?: number;
  block?: boolean;
}

interface Position {
  top: number;
  left: number;
}

const VIEWPORT_PADDING = 8;
const SHOW_DELAY = 300;

export function Tooltip({ text, children, offset = 6, block = false }: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Default: centered below trigger
    let top = triggerRect.bottom + offset;
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    // Flip to top if overflows bottom
    if (top + tooltipRect.height > window.innerHeight - VIEWPORT_PADDING) {
      top = triggerRect.top - tooltipRect.height - offset;
    }

    // Shift horizontally if overflows right
    if (left + tooltipRect.width > window.innerWidth - VIEWPORT_PADDING) {
      left = window.innerWidth - VIEWPORT_PADDING - tooltipRect.width;
    }

    // Shift horizontally if overflows left
    if (left < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING;
    }

    setPosition({ top, left });
  }, [offset]);

  useEffect(() => {
    if (visible) {
      calculatePosition();
    }
  }, [visible, calculatePosition]);

  useEffect(() => {
    if (!visible) return;

    const handleScrollOrResize = () => calculatePosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [visible, calculatePosition]);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setPosition(null);
  };

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper for tooltip hover/focus detection */}
      <span
        ref={triggerRef}
        className={block ? 'flex' : 'inline-flex'}
        onMouseEnter={show}
        onMouseLeave={hide}
        onMouseDown={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={visible ? tooltipId : undefined}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none fixed z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-white text-xs shadow-lg transition-opacity duration-150"
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              opacity: position ? 1 : 0,
            }}
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  );
}
