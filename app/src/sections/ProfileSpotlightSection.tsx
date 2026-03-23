import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Send, ExternalLink } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const tags = ['Hiking', 'Film', 'Food'];

export default function ProfileSpotlightSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.7,
        }
      });

      // ENTRANCE (0% - 30%)
      // Left photo panel slides in
      scrollTl.fromTo(leftPanelRef.current,
        { x: '-50vw' },
        { x: 0, ease: 'power2.out' },
        0
      );

      // Right dark panel slides in
      scrollTl.fromTo(rightPanelRef.current,
        { x: '50vw' },
        { x: 0, ease: 'power2.out' },
        0
      );

      // Profile card entrance
      scrollTl.fromTo(cardRef.current,
        { x: '60vw', opacity: 0, scale: 0.96, rotateZ: 1.5 },
        { x: '50vw', opacity: 1, scale: 1, rotateZ: 0, ease: 'power2.out' },
        0.1
      );

      // Card content stagger
      const contentItems = cardContentRef.current?.children;
      if (contentItems) {
        scrollTl.fromTo(contentItems,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.05, ease: 'power2.out' },
          0.18
        );
      }

      // EXIT (70% - 100%)
      scrollTl.fromTo(cardRef.current,
        { x: '50vw', opacity: 1, scale: 1 },
        { x: '26vw', opacity: 0, scale: 0.98, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(leftPanelRef.current,
        { x: 0, scale: 1 },
        { x: '-12vw', scale: 1.04, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(rightPanelRef.current,
        { x: 0 },
        { x: '12vw', ease: 'power2.in' },
        0.7
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="section-pinned z-30 overflow-hidden"
    >
      {/* Left Photo Panel */}
      <div 
        ref={leftPanelRef}
        className="absolute left-0 top-0 w-1/2 h-full"
        style={{ transform: 'translateX(-50vw)' }}
      >
        <img 
          src="/profile_emma.jpg" 
          alt="Priya - Designer from Ahmedabad"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Dark Panel */}
      <div 
        ref={rightPanelRef}
        className="absolute right-0 top-0 w-1/2 h-full bg-[#0B0D10]"
        style={{ transform: 'translateX(50vw)' }}
      />

      {/* Profile Card */}
      <div 
        ref={cardRef}
        className="absolute top-1/2 -translate-y-1/2 glass-card p-8 w-[min(520px,44vw)]"
        style={{ 
          left: '50vw', 
          transform: 'translate(-50%, -50%)',
          opacity: 0 
        }}
      >
        <div ref={cardContentRef} className="space-y-5">
          {/* Name */}
          <h3 
            className="text-4xl md:text-5xl font-bold text-[#111216]"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Priya
          </h3>

          {/* Location & Profession */}
          <div className="flex items-center gap-2 text-[#6B6F7A]">
            <MapPin className="w-4 h-4" />
            <span>Ahmedabad • Designer</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="px-4 py-1.5 bg-[#f7efe4] rounded-full text-sm text-[#111216] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA Button */}
          <button className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
            <Send className="w-4 h-4" />
            Say hello
          </button>

          {/* Secondary Link */}
          <button className="w-full flex items-center justify-center gap-2 text-[#6B6F7A] hover:text-[#b84f45] transition-colors text-sm">
            <ExternalLink className="w-4 h-4" />
            View full profile
          </button>
        </div>
      </div>
    </section>
  );
}
