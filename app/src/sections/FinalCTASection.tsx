import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState('');

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
      scrollTl.fromTo(bgRef.current,
        { opacity: 0, scale: 1.08 },
        { opacity: 1, scale: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(headlineRef.current,
        { opacity: 0, y: 40, rotateX: 18 },
        { opacity: 1, y: 0, rotateX: 0, ease: 'power2.out' },
        0.08
      );

      scrollTl.fromTo(sublineRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, ease: 'power2.out' },
        0.14
      );

      scrollTl.fromTo(formRef.current,
        { opacity: 0, y: 24, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, ease: 'power2.out' },
        0.18
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(headlineRef.current,
        { opacity: 1, y: 0 },
        { opacity: 0, y: '-6vh', ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(sublineRef.current,
        { opacity: 1, y: 0 },
        { opacity: 0, y: '-4vh', ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(formRef.current,
        { opacity: 1, y: 0 },
        { opacity: 0, y: '6vh', ease: 'power2.in' },
        0.74
      );

      scrollTl.fromTo(bgRef.current,
        { scale: 1 },
        { scale: 1.06, ease: 'none' },
        0.7
      );

    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert('Thank you for joining! We\'ll be in touch soon.');
      setEmail('');
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="section-pinned z-50"
    >
      {/* Background Image */}
      <div 
        ref={bgRef}
        className="absolute inset-0"
        style={{ opacity: 0 }}
      >
        <img 
          src="/cta_field_couple.jpg" 
          alt="Indian couple in golden fields"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0B0D10]/35" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Headline */}
        <h2 
          ref={headlineRef}
          className="text-white text-[clamp(34px,3.6vw,56px)] font-bold text-center mb-4"
          style={{ 
            fontFamily: 'Space Grotesk',
            textShadow: '0 4px 30px rgba(0,0,0,0.3)',
            opacity: 0 
          }}
        >
          Ready to start yours?
        </h2>

        {/* Subheadline */}
        <p 
          ref={sublineRef}
          className="text-white/85 text-lg md:text-xl text-center mb-10"
          style={{ opacity: 0 }}
        >
          Join in two minutes. Meet someone this week.
        </p>

        {/* Form */}
        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
          style={{ opacity: 0 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 px-6 py-4 rounded-full bg-white text-[#111216] placeholder:text-[#6B6F7A] focus:outline-none focus:ring-2 focus:ring-[#b84f45]/50"
            required
          />
          <button 
            type="submit"
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Microcopy */}
        <p className="text-white/60 text-sm mt-4">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
