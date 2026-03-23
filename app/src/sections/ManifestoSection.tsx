import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, Video, Calendar, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Heart, label: 'Values-first matching' },
  { icon: Video, label: 'Video profiles' },
  { icon: Calendar, label: 'Date planning' },
  { icon: Shield, label: 'Safety-first' },
];

export default function ManifestoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const underlineRef = useRef<HTMLDivElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      // ENTRANCE (0% - 30%)
      // Outline word
      scrollTl.fromTo(outlineRef.current,
        { opacity: 0, scale: 0.92, y: '10vh' },
        { opacity: 1, scale: 1, y: 0, ease: 'power2.out' },
        0
      );

      // Headline words
      const words = headlineRef.current?.querySelectorAll('.word');
      if (words) {
        scrollTl.fromTo(words,
          { opacity: 0, y: 40, rotateX: 22 },
          { opacity: 1, y: 0, rotateX: 0, stagger: 0.03, ease: 'power2.out' },
          0.05
        );
      }

      // Violet underline
      scrollTl.fromTo(underlineRef.current,
        { scaleX: 0 },
        { scaleX: 1, ease: 'power2.out' },
        0.14
      );

      // Subheadline
      scrollTl.fromTo(sublineRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, ease: 'power2.out' },
        0.12
      );

      // Feature chips
      const chips = chipsRef.current?.children;
      if (chips) {
        scrollTl.fromTo(chips,
          { opacity: 0, y: 24, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.06, ease: 'power2.out' },
          0.16
        );
      }

      // EXIT (70% - 100%)
      scrollTl.fromTo(headlineRef.current,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(outlineRef.current,
        { scale: 1, opacity: 1 },
        { scale: 1.06, opacity: 0.2, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(sublineRef.current,
        { y: 0, opacity: 1 },
        { y: '-8vh', opacity: 0, ease: 'power2.in' },
        0.72
      );

      if (chips) {
        scrollTl.fromTo(chips,
          { y: 0, opacity: 1 },
          { y: '8vh', opacity: 0, stagger: 0.02, ease: 'power2.in' },
          0.75
        );
      }

    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="section-pinned bg-[#f7efe4] z-20 flex items-center justify-center"
    >
      {/* Outline Background Text */}
      <div 
        ref={outlineRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ opacity: 0 }}
      >
        <span 
          className="outline-text text-[clamp(140px,18vw,260px)] font-bold tracking-tighter"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          STORY
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Headline */}
        <h2 
          ref={headlineRef}
          className="text-[clamp(34px,3.6vw,56px)] font-bold text-[#111216] mb-4"
        >
          <span className="word inline-block">It</span>{' '}
          <span className="word inline-block">starts</span>{' '}
          <span className="word inline-block">with</span>{' '}
          <span className="word inline-block">a</span>{' '}
          <span className="word inline-block relative">
            story
            <div 
              ref={underlineRef}
              className="absolute -bottom-2 left-0 w-full h-1.5 bg-[#b84f45] rounded-full origin-left"
              style={{ transform: 'scaleX(0)' }}
            />
          </span>
          <span className="word inline-block">.</span>
        </h2>

        {/* Subheadline */}
        <p 
          ref={sublineRef}
          className="text-[#6B6F7A] text-lg md:text-xl max-w-xl mx-auto mb-12"
          style={{ opacity: 0 }}
        >
          We turn what you value into matches that feel obvious—once you meet them.
        </p>

        {/* Feature Chips */}
        <div 
          ref={chipsRef}
          className="flex flex-wrap justify-center gap-3"
        >
          {features.map((feature, index) => (
            <div 
              key={index}
              className="chip flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
              style={{ opacity: 0 }}
            >
              <feature.icon className="w-4 h-4 text-[#b84f45]" />
              <span className="text-[#111216]">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
