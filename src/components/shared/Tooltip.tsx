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
const CURSOR_OFFSET_X = 12;
const CURSOR_OFFSET_Y = 16;

export function Tooltip({ text, children, offset = 6, block = false }: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  const calculatePosition = useCallback(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    let top = my + CURSOR_OFFSET_Y;
    let left = mx + CURSOR_OFFSET_X;

    // Flip up if overflows bottom
    if (top + tooltipRect.height > window.innerHeight - VIEWPORT_PADDING) {
      top = my - tooltipRect.height - offset;
    }

    // Shift left if overflows right
    if (left + tooltipRect.width > window.innerWidth - VIEWPORT_PADDING) {
      left = mx - tooltipRect.width - CURSOR_OFFSET_X;
    }

    // Shift right if overflows left
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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (visible) {
        calculatePosition();
      }
    },
    [visible, calculatePosition],
  );

  const show = (e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
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
        onMouseMove={handleMouseMove}
        onMouseLeave={hide}
        onMouseDown={hide}
        onFocus={() => {
          timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY);
        }}
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
