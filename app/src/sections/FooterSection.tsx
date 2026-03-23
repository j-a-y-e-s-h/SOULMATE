import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, MapPin, Send, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const footerLinks = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Safety', href: '#' },
  { label: 'Careers', href: '#' },
];

const socialLinks = [
  { icon: Instagram, href: '#' },
  { icon: Twitter, href: '#' },
  { icon: Facebook, href: '#' },
  { icon: Linkedin, href: '#' },
];

export default function FooterSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Flowing section animations
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      gsap.fromTo(formRef.current,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      const linkItems = linksRef.current?.children;
      if (linkItems) {
        gsap.fromTo(linkItems,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <footer 
      ref={sectionRef}
      className="bg-[#f7efe4] py-20 px-[7vw] z-60"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column - Contact Info */}
          <div ref={contentRef} className="space-y-8">
            <div>
              <h2 
                className="text-[clamp(34px,3vw,48px)] font-bold text-[#111216] mb-4"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Say hello
              </h2>
              <p className="text-[#6B6F7A] text-lg">
                Questions, partnerships, or feedback—we read everything.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#111216]">
                <div className="w-10 h-10 rounded-full bg-[#b84f45]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#b84f45]" />
                </div>
                <span className="font-medium">hello@soulmate.app</span>
              </div>
              <div className="flex items-center gap-3 text-[#111216]">
                <div className="w-10 h-10 rounded-full bg-[#b84f45]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#b84f45]" />
                </div>
                <span className="font-medium">Remote-first, UTC-8 to UTC+1</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-12 h-12 rounded-full bg-white border border-[#111216]/8 flex items-center justify-center hover:bg-[#b84f45] hover:text-white hover:border-[#b84f45] transition-all"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div 
            ref={formRef}
            className="glass-card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#111216] mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-[#f7efe4] border border-[#111216]/8 focus:outline-none focus:ring-2 focus:ring-[#b84f45]/50"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111216] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl bg-[#f7efe4] border border-[#111216]/8 focus:outline-none focus:ring-2 focus:ring-[#b84f45]/50"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111216] mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-5 py-3 rounded-xl bg-[#f7efe4] border border-[#111216]/8 focus:outline-none focus:ring-2 focus:ring-[#b84f45]/50 resize-none"
                  placeholder="How can we help?"
                  required
                />
              </div>
              <button 
                type="submit"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send message
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[#111216]/8 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div 
            className="text-2xl font-bold text-[#111216]"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Soulmate
          </div>

          {/* Links */}
          <div ref={linksRef} className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-[#6B6F7A] hover:text-[#b84f45] transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[#6B6F7A] text-sm">
            © 2026 Soulmate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
