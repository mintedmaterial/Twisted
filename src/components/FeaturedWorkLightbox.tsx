'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  nextFeaturedFocusIndex,
  nextFeaturedPhoto,
  openFeaturedPhoto,
  previousFeaturedPhoto,
} from '@/components/featuredWorkLightboxModel';

export type FeaturedWorkItem = {
  src: string;
  alt: string;
  title: string;
  category: string;
  width: number;
  height: number;
  position?: string;
  href?: string;
  span?: string;
};

const focusableSelector = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

type BackgroundState = {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
};

function makeBackgroundInert(dialog: HTMLElement) {
  const states: BackgroundState[] = [];
  let foreground: HTMLElement = dialog;
  while (foreground.parentElement) {
    const parent = foreground.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === foreground || !(sibling instanceof HTMLElement)) continue;
      states.push({
        element: sibling,
        inert: sibling.hasAttribute('inert'),
        ariaHidden: sibling.getAttribute('aria-hidden'),
      });
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-hidden', 'true');
    }
    if (parent === document.body) break;
    foreground = parent;
  }
  return () => states.forEach(({ element, inert, ariaHidden }) => {
    if (!inert) element.removeAttribute('inert');
    if (ariaHidden === null) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', ariaHidden);
  });
}

export default function FeaturedWorkLightbox({ items }: { items: FeaturedWorkItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const previousOverflow = useRef('');
  const scrollPosition = useRef({ x: 0, y: 0 });
  const captionId = useId();
  const selectedItem = selectedIndex === null ? null : items[selectedIndex] ?? null;

  const close = useCallback(() => {
    const opener = openerRef.current;
    setSelectedIndex(null);
    openerRef.current = null;
    requestAnimationFrame(() => {
      opener?.focus();
      window.scrollTo(scrollPosition.current.x, scrollPosition.current.y);
    });
  }, []);

  const previous = useCallback(() => {
    setSelectedIndex((current) => current === null ? null : previousFeaturedPhoto(current, items.length));
  }, [items.length]);

  const next = useCallback(() => {
    setSelectedIndex((current) => current === null ? null : nextFeaturedPhoto(current, items.length));
  }, [items.length]);

  useEffect(() => {
    if (!selectedItem) return;
    previousOverflow.current = document.body.style.overflow;
    const restoreBackground = dialogRef.current ? makeBackgroundInert(dialogRef.current) : () => {};
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow.current;
      restoreBackground();
    };
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
        const current = focusable.indexOf(document.activeElement as HTMLElement);
        const target = nextFeaturedFocusIndex(current, focusable.length, event.shiftKey);
        if (target !== null) {
          event.preventDefault();
          focusable[target].focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, next, previous, selectedItem]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`View larger: ${item.title}`}
            onClick={(event) => {
              const nextIndex = openFeaturedPhoto(items.length, index);
              if (nextIndex === null) return;
              openerRef.current = event.currentTarget;
              scrollPosition.current = { x: window.scrollX, y: window.scrollY };
              setSelectedIndex(nextIndex);
            }}
            className="group text-left cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
          >
            <article className={`relative overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/60 min-h-[18rem] ${item.span ?? ''}`}>
              {item.src.startsWith('http') ? (
                <img src={item.src} alt={item.alt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: item.position ?? 'center' }} />
              ) : (
                <Image src={item.src} alt={item.alt} width={item.width} height={item.height} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: item.position ?? 'center' }} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-wood-dark/80 via-wood-dark/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-copper-light text-sm font-bold uppercase">{item.category}</p>
                <h3 className="heading-western text-2xl text-cream">{item.title}</h3>
              </div>
            </article>
          </button>
        ))}
      </div>

      {selectedItem && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={captionId} onClick={(event) => { if (event.target === event.currentTarget) close(); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6">
          <button ref={closeRef} type="button" aria-label="Close larger image" onClick={close} className="absolute right-3 top-3 z-10 h-12 w-12 rounded-full border border-copper bg-charcoal/90 text-3xl text-cream">×</button>
          <button type="button" aria-label="Previous image" onClick={previous} className="absolute left-2 top-1/2 z-10 h-14 w-12 -translate-y-1/2 rounded-full border border-copper bg-charcoal/90 text-4xl text-cream sm:left-5">‹</button>
          <figure className="flex max-h-full max-w-6xl flex-col items-center gap-3 px-10 sm:px-16">
            <img src={selectedItem.src} alt={selectedItem.alt} className="max-h-[calc(100vh-10rem)] max-w-full h-auto w-auto object-contain" />
            <figcaption id={captionId} className="text-center">
              <p className="text-copper-light text-sm font-bold uppercase">{selectedItem.category}</p>
              <p className="heading-western text-xl text-cream">{selectedItem.title}</p>
            </figcaption>
            {selectedItem.href && <a href={selectedItem.href} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-copper px-5 py-3 font-bold text-charcoal hover:bg-cream">View Full Album</a>}
          </figure>
          <button type="button" aria-label="Next image" onClick={next} className="absolute right-2 top-1/2 z-10 h-14 w-12 -translate-y-1/2 rounded-full border border-copper bg-charcoal/90 text-4xl text-cream sm:right-5">›</button>
        </div>
      )}
    </>
  );
}
