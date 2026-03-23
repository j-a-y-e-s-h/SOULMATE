import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    const subheadline = subheadlineRef.current;
    const cta = ctaRef.current;
    const social = socialRef.current;
    const bg = bgRef.current;

    if (!section || !headline || !subheadline || !cta || !social || !bg) return;

    const ctx = gsap.context(() => {
      // Auto-play entrance animation
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Background entrance
      tl.fromTo(bg, 
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1, duration: 1.2 }
      );

      // Headline words entrance
      const words = headline.querySelectorAll('.word');
      tl.fromTo(words,
        { opacity: 0, y: 24, rotateX: 18 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.035 },
        '-=0.7'
      );

      // Subheadline
      tl.fromTo(subheadline,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      );

      // CTAs
      tl.fromTo(cta.children,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
        '-=0.3'
      );

      // Social proof
      tl.fromTo(social,
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6 },
        '-=0.2'
      );

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset all elements when scrolling back to top
            gsap.set([headline, subheadline, cta, social], { opacity: 1, x: 0, y: 0 });
            gsap.set(bg, { scale: 1, y: 0 });
          }
        }
      });

      // EXIT phase (70% - 100%)
      scrollTl.fromTo(headline,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(subheadline,
        { x: 0, opacity: 1 },
        { x: '-14vw', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(cta,
        { x: 0, opacity: 1 },
        { x: '-10vw', opacity: 0, ease: 'power2.in' },
        0.74
      );

      scrollTl.fromTo(social,
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(bg,
        { scale: 1, y: 0 },
        { scale: 1.08, y: '-6vh', ease: 'none' },
        0.7
      );

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="section-pinned z-10"
    >
      {/* Background Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0 }}
      >
        <img 
          src="/hero_dock_couple.jpg" 
          alt="Indian couple at scenic lakefront"
          className="w-full h-full object-cover"
        />
        {/* Vignette overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-[7vw]">
        {/* Headline */}
        <h1 
          ref={headlineRef}
          className="text-white text-[clamp(44px,5vw,76px)] font-bold leading-[0.95] max-w-[42vw] mb-6"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}
        >
          <span className="word inline-block">Find</span>{' '}
          <span className="word inline-block">your</span>{' '}
          <span className="word inline-block">person.</span>
        </h1>

        {/* Subheadline */}
        <p 
          ref={subheadlineRef}
          className="text-white/90 text-lg md:text-xl max-w-[38vw] mb-8 leading-relaxed"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
        >
          A matchmaking experience designed for clarity, chemistry, and real dates.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex items-center gap-4 mb-12">
          <button className="btn-primary text-base">
            Start your story
          </button>
          <button className="text-white font-medium hover:underline underline-offset-4 transition-all">
            See how it works
          </button>
        </div>

        {/* Social Proof */}
        <div 
          ref={socialRef}
          className="glass-card inline-flex items-center gap-3 px-5 py-3 w-fit"
        >
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#b84f45] text-[#b84f45]" />
            <span className="font-semibold text-sm">4.8</span>
          </div>
          <span className="text-[#6B6F7A] text-sm">— Joined by 12,000+ singles</span>
        </div>
      </div>

      {/* Scroll Hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
}
