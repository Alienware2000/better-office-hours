"use client";

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// Programmatic smooth-scroll events must not look like a student scrolling
// back through history. Each new working page begins following again.
export function useBoardFollow(pageId: number, active: boolean, reduceMotion: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const targetRef = useRef<number | null>(null);
  const [earlierPage, setEarlierPage] = useState<number | null>(null);

  const pageTop = (scroll: HTMLElement) => {
    const page = scroll.querySelector<HTMLElement>('.board-current');
    return page ? page.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop : 0;
  };
  const moveTo = useCallback((top: number) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const target = Math.max(0, Math.min(top, scroll.scrollHeight - scroll.clientHeight));
    targetRef.current = Math.abs(target - scroll.scrollTop) > 1 ? target : null;
    scroll.scrollTo({ top: target, behavior: reduceMotion ? 'instant' : 'smooth' });
  }, [reduceMotion]);

  const latest = useCallback(() => {
    followRef.current = true;
    setEarlierPage(null);
    if (scrollRef.current) moveTo(pageTop(scrollRef.current));
  }, [moveTo]);

  useLayoutEffect(() => {
    if (!active) return;
    followRef.current = true;
    if (scrollRef.current) moveTo(pageTop(scrollRef.current));
  }, [pageId, active, moveTo]);

  const onScroll = () => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    if (targetRef.current !== null) {
      if (Math.abs(scroll.scrollTop - targetRef.current) <= 1) targetRef.current = null;
      setEarlierPage(null);
      return;
    }
    const currentTop = Math.min(pageTop(scroll), scroll.scrollHeight - scroll.clientHeight);
    followRef.current = scroll.scrollTop >= currentTop - 48;
    setEarlierPage(followRef.current ? null : pageId);
  };

  const interrupt = () => {
    const scroll = scrollRef.current;
    if (scroll && targetRef.current !== null) scroll.scrollTo({ top: scroll.scrollTop, behavior: 'instant' });
    targetRef.current = null;
    onScroll();
  };

  const reveal = useCallback((element: Element) => {
    const scroll = scrollRef.current;
    if (!scroll || !followRef.current) return;
    // Calculate from the destination during a page transition so the next
    // revealed mark cannot cancel that transition with a relative scroll.
    const top = targetRef.current ?? scroll.scrollTop;
    const viewport = scroll.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    const bottom = bounds.bottom - viewport.top + scroll.scrollTop;
    const elementTop = bounds.top - viewport.top + scroll.scrollTop;
    if (elementTop < top) moveTo(Math.max(pageTop(scroll), elementTop - 24));
    else if (bottom > top + scroll.clientHeight - 16) moveTo(bottom - scroll.clientHeight + 24);
  }, [moveTo]);

  return { scrollRef, followRef, readingEarlier: earlierPage === pageId, latest, reveal,
    scrollHandlers: { onScroll, onWheel: interrupt, onTouchStart: interrupt, onPointerDown: interrupt,
      onKeyDown: (event: React.KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
      },
    },
  };
}
