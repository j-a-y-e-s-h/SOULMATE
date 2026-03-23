import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Quote, Sparkles, Star } from 'lucide-react';

const successStories = [
  {
    id: '1',
    coupleName: 'Nisha & Karan',
    photo: '/story_mumbai.jpg',
    quote: 'We matched on Soulmate, had one long sea-facing conversation in Mumbai, and both knew the pace felt right.',
    story:
      'Nisha and Karan matched in early 2025. Their first meeting was a long coffee-and-walk date at Marine Drive. What started as easy conversation quickly turned into family introductions, a roka ceremony, and a wedding plan they are both genuinely excited about.',
    location: 'Mumbai, Maharashtra',
    marriedDate: 'Wedding in February 2026',
  },
  {
    id: '2',
    coupleName: 'Ananya & Rohit',
    photo: '/story_chennai.jpg',
    quote: 'I wanted detail, calm, and seriousness. Soulmate gave us that from the first introduction.',
    story:
      'Rohit had tried fast-moving apps before, but nothing felt grounded. When he saw Ananya\'s profile on Soulmate, the cultural detail and clarity made it easy to start a real conversation. Their first coffee in Chennai turned into weekly calls, family visits, and a wedding plan.',
    location: 'Chennai, Tamil Nadu',
    marriedDate: 'Engaged in December 2025',
  },
  {
    id: '3',
    coupleName: 'Meera & Saurabh',
    photo: '/hero_dock_couple.jpg',
    quote: 'The values-based matching actually worked. We did not have to explain ourselves from scratch.',
    story:
      'Both Meera and Saurabh were looking for a marriage-minded partner with similar ideas about family, work, and lifestyle. Soulmate matched them on those signals first. They are now married in Pune and planning their first home together.',
    location: 'Pune, Maharashtra',
    marriedDate: 'Married in June 2025',
  },
  {
    id: '4',
    coupleName: 'Priya & Aditya',
    photo: '/cta_field_couple.jpg',
    quote: 'Even from different cities, the introduction felt trustworthy and easy to build on.',
    story:
      'Priya was in Kochi and Aditya was in Bengaluru when they matched. They started with video calls, involved their families early, and met in person after a month of intentional conversation. They are now planning their move and engagement timeline together.',
    location: 'Kochi & Bengaluru',
    marriedDate: 'Roka completed',
  },
  {
    id: '5',
    coupleName: 'Kavya & Nitin',
    photo: '/story_mumbai.jpg',
    quote: 'We both came in after difficult experiences. Soulmate made the second chance feel respectful and calm.',
    story:
      'Kavya and Nitin were both divorced and careful about starting again. Soulmate\'s slower, detail-first approach helped them move from curiosity to comfort without pressure. They built trust gradually, involved family when they were ready, and are now happily remarried.',
    location: 'Delhi NCR',
    marriedDate: 'Married in March 2025',
  },
  {
    id: '6',
    coupleName: 'Sneha & Rohan',
    photo: '/hero_dock_couple.jpg',
    quote: 'From the first message, I felt like he understood both my ambition and my family priorities.',
    story:
      'Sneha and Rohan connected over work ethic, family values, and a shared love for travel. Their first date became a four-hour dinner in Ahmedabad, followed by easy family conversations and a relationship that felt strong from the beginning.',
    location: 'Ahmedabad, Gujarat',
    marriedDate: 'Together 1 year',
  },
];

export default function SuccessStories() {
  return (
    <div className="page-shell px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-card overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-end">
            <div>
              <Link to="/" className="btn-secondary w-fit">
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Link>

              <span className="eyebrow mt-8">
                <Heart className="h-4 w-4 fill-current" />
                Success stories
              </span>

              <h1 className="mt-6 text-[clamp(2.4rem,5vw,4rem)] font-black leading-[1.05] tracking-tight text-[#1f2330]">Real stories from members who turned introductions into commitment.</h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#62584d] sm:text-lg">
                Introductions that became meetings, meetings that became family conversations,
                and relationships that turned into weddings and shared lives.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <Heart className="h-5 w-5 text-[#b84f45]" />
                <p className="mt-4 text-4xl font-semibold text-[#1f2330]">32k+</p>
                <p className="mt-2 text-sm leading-6 text-[#62584d]">Happy couples</p>
              </div>
              <div className="metric-card">
                <Star className="h-5 w-5 text-[#c08a45]" />
                <p className="mt-4 text-4xl font-semibold text-[#1f2330]">8k+</p>
                <p className="mt-2 text-sm leading-6 text-[#62584d]">Marriages</p>
              </div>
              <div className="metric-card">
                <Sparkles className="h-5 w-5 text-[#4b7165]" />
                <p className="mt-4 text-4xl font-semibold text-[#1f2330]">4.6 lakh+</p>
                <p className="mt-2 text-sm leading-6 text-[#62584d]">Introductions made</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {successStories.map((story) => (
            <article key={story.id} className="glass-card overflow-hidden">
              <div className="relative">
                <img src={story.photo} alt={story.coupleName} className="h-80 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17161c] via-[#17161c]/32 to-transparent" />
                <div className="absolute left-5 top-5">
                  <span className="chip bg-white/85 text-[#b84f45]">{story.marriedDate}</span>
                </div>
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <h2 className="text-3xl font-black tracking-tight">{story.coupleName}</h2>
                  <p className="mt-1.5 text-sm text-white/72">{story.location}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="relative">
                  <Quote className="absolute -left-1 -top-2 h-8 w-8 text-[#b84f45]/20" />
                  <p className="pl-5 text-base font-semibold leading-8 text-[#1f2330]">"{story.quote}"</p>
                </div>
                <p className="mt-4 text-sm leading-7 text-[#62584d]">{story.story}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="glass-dark p-8 text-center sm:p-10 lg:p-12">
          <Heart className="mx-auto h-12 w-12 fill-white text-white" />
          <h2 className="mt-5 text-[clamp(2.6rem,5vw,4.4rem)] font-black tracking-tight text-white">Your story could be next.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
            Join the members who came for a calmer matrimony experience and stayed long enough to build something real.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className="btn-primary">
              Create free account
            </Link>
            <Link to="/" className="btn-secondary">
              Explore the product
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/55">
            Have a story to share?{' '}
            <a href="mailto:stories@soulmate.app" className="font-semibold text-[#efc18d] hover:opacity-80">
              We’d love to hear it.
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
