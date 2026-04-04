import { useCallback, useRef, useState } from 'react';

interface DragState {
  dragIndex: number | null;
  overIndex: number | null;
}

export function useDragReorder<T>(
  items: T[],
  onReorder: (items: T[]) => void,
  orientation: 'vertical' | 'horizontal' = 'vertical',
) {
  const [drag, setDrag] = useState<DragState>({ dragIndex: null, overIndex: null });
  const touchStartPos = useRef(0);
  const touchCurrentIndex = useRef<number | null>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);

  const setRowRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      rowRefs.current[index] = el;
    },
    [],
  );

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onReorder(updated);
    },
    [items, onReorder],
  );

  // Desktop drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDrag({ dragIndex: index, overIndex: null });
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (drag.dragIndex !== null && index !== drag.overIndex) {
        setDrag((prev) => ({ ...prev, overIndex: index }));
      }
    },
    [drag.dragIndex, drag.overIndex],
  );

  const handleDragEnd = useCallback(() => {
    if (drag.dragIndex !== null && drag.overIndex !== null) {
      reorder(drag.dragIndex, drag.overIndex);
    }
    setDrag({ dragIndex: null, overIndex: null });
  }, [drag, reorder]);

  // Touch handlers
  const handleTouchStart = useCallback(
    (index: number, e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = orientation === 'vertical' ? touch.clientY : touch.clientX;
      touchCurrentIndex.current = index;
      setDrag({ dragIndex: index, overIndex: null });
    },
    [orientation],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchCurrentIndex.current === null) return;
      const touch = e.touches[0];
      const pos = orientation === 'vertical' ? touch.clientY : touch.clientX;

      for (let i = 0; i < rowRefs.current.length; i++) {
        const el = rowRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const [start, end] = orientation === 'vertical' ? [rect.top, rect.bottom] : [rect.left, rect.right];
        if (pos >= start && pos <= end && i !== drag.overIndex) {
          setDrag((prev) => ({ ...prev, overIndex: i }));
          break;
        }
      }
    },
    [drag.overIndex, orientation],
  );

  const handleTouchEnd = useCallback(() => {
    if (touchCurrentIndex.current !== null && drag.overIndex !== null) {
      reorder(touchCurrentIndex.current, drag.overIndex);
    }
    touchCurrentIndex.current = null;
    setDrag({ dragIndex: null, overIndex: null });
  }, [drag.overIndex, reorder]);

  const getDragProps = useCallback(
    (index: number) => ({
      ref: setRowRef(index),
      draggable: true,
      onDragStart: () => handleDragStart(index),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
      onDragEnd: handleDragEnd,
    }),
    [setRowRef, handleDragStart, handleDragOver, handleDragEnd],
  );

  const getHandleProps = useCallback(
    (index: number) => ({
      onTouchStart: (e: React.TouchEvent) => handleTouchStart(index, e),
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }),
    [handleTouchStart, handleTouchMove, handleTouchEnd],
  );

  return {
    dragIndex: drag.dragIndex,
    overIndex: drag.overIndex,
    getDragProps,
    getHandleProps,
  };
}
