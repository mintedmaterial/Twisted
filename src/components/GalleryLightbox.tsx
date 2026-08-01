'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import type { GalleryImage } from '@/data/galleries';
import {
  closeLightbox,
  nextLightboxIndex,
  openLightbox,
  previousLightboxIndex,
  type LightboxIndex,
} from '@/components/galleryLightboxModel';

type GalleryLightboxProps = {
  images: GalleryImage[];
  imageFit?: 'cover' | 'contain';
};

export default function GalleryLightbox({ images, imageFit = 'cover' }: GalleryLightboxProps) {
  const [selectedIndex, setSelectedIndex] = useState<LightboxIndex>(null);
  const photoButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const captionId = useId();
  const selectedImage = selectedIndex === null ? null : images[selectedIndex];

  const handleClose = () => {
    const opener = selectedIndex === null ? null : photoButtons.current[selectedIndex];
    setSelectedIndex(closeLightbox());
    requestAnimationFrame(() => opener?.focus());
  };

  const showPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(previousLightboxIndex(selectedIndex, images.length));
    }
  };

  const showNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(nextLightboxIndex(selectedIndex, images.length));
    }
  };

  useEffect(() => {
    if (selectedIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {images.map((image, index) => (
          <article key={image.src} className="group overflow-hidden rounded-lg border border-copper/30 bg-wood-dark/70 card-glow">
            <button
              ref={(element) => { photoButtons.current[index] = element; }}
              type="button"
              aria-label={`View larger: ${image.alt}`}
              onClick={() => setSelectedIndex(openLightbox(images.length, index))}
              className="relative block aspect-[4/3] w-full cursor-zoom-in bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className={`absolute inset-0 h-full w-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover transition-transform duration-500 group-hover:scale-105'}`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </button>
            <div className="p-5">
              <h2 className="heading-western text-2xl text-cream">{image.title}</h2>
            </div>
          </article>
        ))}
      </div>

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={captionId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
        >
          <button ref={closeButton} type="button" aria-label="Close larger image" onClick={handleClose} className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-copper bg-charcoal/90 text-3xl text-cream hover:bg-copper hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">×</button>
          <button type="button" aria-label="Previous image" onClick={showPrevious} className="absolute left-2 top-1/2 z-10 flex h-14 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-copper bg-charcoal/90 text-4xl text-cream hover:bg-copper hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:left-5">‹</button>
          <figure className="flex max-h-full max-w-6xl flex-col items-center gap-3 px-10 sm:px-16">
            <Image src={selectedImage.src} alt={selectedImage.alt} width={selectedImage.width} height={selectedImage.height} className="max-h-[calc(100vh-7rem)] max-w-full h-auto w-auto object-contain" sizes="100vw" priority />
            <figcaption id={captionId} className="heading-western text-center text-lg text-cream sm:text-xl">{selectedImage.title}</figcaption>
          </figure>
          <button type="button" aria-label="Next image" onClick={showNext} className="absolute right-2 top-1/2 z-10 flex h-14 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-copper bg-charcoal/90 text-4xl text-cream hover:bg-copper hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream sm:right-5">›</button>
        </div>
      )}
    </>
  );
}
