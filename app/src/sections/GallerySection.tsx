import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const galleryImages = [
  { src: '/gallery_1.jpg', x: '18vw', y: '62vh', rotate: -6, scale: 1 },
  { src: '/gallery_2.jpg', x: '34vw', y: '54vh', rotate: 4, scale: 1 },
  { src: '/gallery_3.jpg', x: '50vw', y: '60vh', rotate: -2, scale: 1 },
  { src: '/gallery_4.jpg', x: '66vw', y: '52vh', rotate: 6, scale: 1 },
  { src: '/gallery_5.jpg', x: '82vw', y: '64vh', rotate: -4, scale: 1 },
  { src: '/gallery_6.jpg', x: '28vw', y: '38vh', rotate: -10, scale: 0.75, opacity: 0.55 },
  { src: '/gallery_7.jpg', x: '72vw', y: '36vh', rotate: 8, scale: 0.75, opacity: 0.55 },
];

export default function GallerySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: 0.7,
        }
      });

      // ENTRANCE (0% - 30%)
      // Headline and CTA
      scrollTl.fromTo(headlineRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, ease: 'power2.out' },
        0
      );

      // Floating cards entrance
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        const data = galleryImages[index];
        scrollTl.fromTo(card,
          { 
            opacity: 0, 
            y: '60vh', 
            scale: 0.92, 
            rotate: data.rotate + 8 
          },
          { 
            opacity: data.opacity || 1, 
            y: 0, 
            scale: data.scale, 
            rotate: data.rotate,
            ease: 'power2.out' 
          },
          0.06 + index * 0.04
        );
      });

      // EXIT (70% - 100%)
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        scrollTl.fromTo(card,
          { y: 0, opacity: card.style.opacity ? parseFloat(card.style.opacity) : 1 },
          { y: '-18vh', opacity: 0, ease: 'power2.in' },
          0.7 + index * 0.02
        );
      });

      scrollTl.fromTo(headlineRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.75
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="section-pinned bg-[#f7efe4] z-40"
    >
      {/* Header */}
      <div 
        ref={headlineRef}
        className="absolute top-[10vh] left-[7vw] right-[7vw] flex justify-between items-start"
        style={{ opacity: 0 }}
      >
        <div>
          <h2 
            className="text-[clamp(34px,3.6vw,56px)] font-bold text-[#111216] mb-2"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Browse stories.
          </h2>
          <p className="text-[#6B6F7A] text-base md:text-lg max-w-md">
            Filter by city, interests, and intentions. No endless swiping—just people ready to meet.
          </p>
        </div>
        <button className="flex items-center gap-2 text-[#b84f45] font-semibold hover:gap-3 transition-all">
          Search profiles
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Cards */}
      {galleryImages.map((image, index) => (
        <div
          key={index}
          ref={el => { cardsRef.current[index] = el; }}
          className="floating-card absolute cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: image.x,
            top: image.y,
            transform: `translate(-50%, -50%) rotate(${image.rotate}deg) scale(${image.scale})`,
            width: 'clamp(160px, 16vw, 240px)',
            aspectRatio: '3/4',
            opacity: image.opacity || 0,
          }}
        >
          <img 
            src={image.src} 
            alt={`Profile ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Glass overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </section>
  );
}
