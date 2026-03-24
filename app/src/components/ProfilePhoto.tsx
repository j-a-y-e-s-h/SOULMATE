import type { Gender } from '@/types';
import { cn } from '@/lib/utils';

interface ProfilePhotoProps {
  src?: string | null;
  name: string;
  gender?: Gender | null;
  alt?: string;
  className?: string;
  mediaClassName?: string;
  placeholderClassName?: string;
  label?: string;
  hint?: string;
  labelClassName?: string;
  hintClassName?: string;
  animated?: boolean;
}


function normalizeGender(gender?: Gender | null): Gender {
  if (gender === 'male' || gender === 'female') return gender;
  return 'other';
}

function AvatarIllustration({
  gender,
}: {
  gender: Gender;
}) {
  if (gender === 'male') {
    return (
      <svg
        viewBox="0 0 240 240"
        aria-hidden="true"
        className="avatar-illustration-figure h-full w-full drop-shadow-[0_22px_34px_rgba(34,30,27,0.14)]"
      >
        <defs>
          <radialGradient id="male-bg" cx="50%" cy="45%" r="52%">
            <stop offset="0%" stopColor="#e8cdb5" />
            <stop offset="100%" stopColor="#c9a882" />
          </radialGradient>
          <linearGradient id="male-skin" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#f2dcc8" />
            <stop offset="60%" stopColor="#e8c8a8" />
            <stop offset="100%" stopColor="#ddb890" />
          </linearGradient>
          <linearGradient id="male-shirt" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#3d3a36" />
            <stop offset="100%" stopColor="#2a2825" />
          </linearGradient>
          <radialGradient id="male-iris" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#b07840" />
            <stop offset="55%" stopColor="#7a5020" />
            <stop offset="100%" stopColor="#3a2010" />
          </radialGradient>
        </defs>

        <ellipse cx="120" cy="222" rx="48" ry="8" fill="rgba(31,35,48,0.06)" />
        <circle className="avatar-background-circle" cx="120" cy="112" r="78" fill="url(#male-bg)" />

        <g className="avatar-figure-bob">
          {/* === Layer 1: Shirt/shoulders === */}
          <g className="avatar-shoulder-sway">
            <path
              d="M64 214c0-4 2-10 6-18 10-20 28-34 50-34s40 14 50 34c4 8 6 14 6 18v6H64v-6Z"
              fill="url(#male-shirt)"
            />
            {/* Collar V-shape */}
            <path d="M107 166l13 18 13-18" fill="none" stroke="#504c47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Collar shadow fold */}
            <path d="M108 167 Q114 172 120 173.5 Q126 172 132 167" fill="none" stroke="#252220" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
          </g>

          {/* === Layer 2: Neck === */}
          <path
            d="M108 140 Q107 152 108 162 Q114 165 120 165 Q126 165 132 162 Q133 152 132 140 Z"
            fill="url(#male-skin)"
          />
          {/* Neck side shadows */}
          <path d="M110 142c0 5 0 11 0 17" fill="none" stroke="#c8a882" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
          <path d="M130 142c0 5 0 11 0 17" fill="none" stroke="#c8a882" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />

          {/* === Layer 3: Head === */}
          <ellipse cx="120" cy="104" rx="36" ry="42" fill="url(#male-skin)" />
          {/* Subtle forehead highlight */}
          <ellipse cx="118" cy="88" rx="16" ry="10" fill="rgba(255,255,255,0.08)" />
          {/* Jawline definition */}
          <path d="M88 116c4 16 16 26 32 26s28-10 32-26" fill="none" stroke="#dbb89a" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          {/* Cheek blush */}
          <ellipse cx="96" cy="115" rx="10" ry="6.5" fill="#e89080" opacity="0.14" />
          <ellipse cx="144" cy="115" rx="10" ry="6.5" fill="#e89080" opacity="0.14" />

          {/* === Layer 4: Hair, face, details === */}
          {/* Hair */}
          <path
            className="avatar-hair-sway"
            d="M84 94c0-30 16-44 36-44s36 14 36 42c0 8-2 16-5 22v-28c-7-11-17-17-31-17s-25 7-31 19v28c-3-7-5-14-5-22Z"
            fill="#2c2420"
          />
          {/* Hair highlight */}
          <path d="M100 68 Q112 61 124 64" fill="none" stroke="#5a4a42" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
          <path d="M97 72 Q105 65 116 64" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.18" />

          {/* Eyebrows — arched */}
          <path d="M97 95 Q103.5 91 110 92" fill="none" stroke="#2c2420" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M130 95 Q136.5 91 143 92" fill="none" stroke="#2c2420" strokeWidth="2.8" strokeLinecap="round" />

          {/* Eyes */}
          <g className="avatar-face-blink">
            {/* Left eye: sclera → iris → pupil → highlight → eyelid */}
            <ellipse cx="105" cy="104" rx="5.5" ry="5" fill="#f8f2ec" />
            <ellipse cx="105.2" cy="104.4" rx="3.6" ry="3.6" fill="url(#male-iris)" />
            <ellipse cx="105.2" cy="104.4" rx="2.1" ry="2.1" fill="#130e0c" />
            <circle cx="103.7" cy="102.8" r="1.2" fill="white" opacity="0.85" />
            <circle cx="106.5" cy="106.2" r="0.7" fill="white" opacity="0.35" />
            <path d="M99.5 101 Q105 98.2 110.5 101" fill="none" stroke="#2c2420" strokeWidth="2" strokeLinecap="round" />
            {/* Right eye */}
            <ellipse cx="135" cy="104" rx="5.5" ry="5" fill="#f8f2ec" />
            <ellipse cx="135.2" cy="104.4" rx="3.6" ry="3.6" fill="url(#male-iris)" />
            <ellipse cx="135.2" cy="104.4" rx="2.1" ry="2.1" fill="#130e0c" />
            <circle cx="133.7" cy="102.8" r="1.2" fill="white" opacity="0.85" />
            <circle cx="136.5" cy="106.2" r="0.7" fill="white" opacity="0.35" />
            <path d="M129.5 101 Q135 98.2 140.5 101" fill="none" stroke="#2c2420" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Nose + nostrils */}
          <path d="M120 106v10" fill="none" stroke="#c9a882" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M116 118 Q118 120 120 119 Q122 120 124 118" fill="none" stroke="#b89070" strokeWidth="1.6" strokeLinecap="round" />

          {/* Mouth — upper lip + smile */}
          <path d="M113 122.5 Q116.5 120.5 120 121 Q123.5 120.5 127 122.5" fill="none" stroke="#a88262" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <path d="M112 123.5 Q116 129.5 120 130 Q124 129.5 128 123.5" fill="none" stroke="#a88262" strokeWidth="2.4" strokeLinecap="round" />

          {/* Ears + inner ear detail */}
          <ellipse cx="84" cy="106" rx="5.5" ry="7.5" fill="url(#male-skin)" />
          <path d="M87 100 Q90 106 87 112" fill="none" stroke="#c0a080" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
          <ellipse cx="156" cy="106" rx="5.5" ry="7.5" fill="url(#male-skin)" />
          <path d="M153 100 Q150 106 153 112" fill="none" stroke="#c0a080" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />

          {/* Chain necklace */}
          <path d="M110 158c3 4 6 6 10 6s7-2 10-6" fill="none" stroke="#c8a86e" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          <path d="M112 160c2 3 5 5 8 5s6-2 8-5" fill="none" stroke="#c8a86e" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </g>
      </svg>
    );
  }

  if (gender === 'female') {
    return (
      <svg
        viewBox="0 0 240 240"
        aria-hidden="true"
        className="avatar-illustration-figure h-full w-full drop-shadow-[0_22px_34px_rgba(34,30,27,0.14)]"
      >
        <defs>
          <radialGradient id="female-bg" cx="50%" cy="45%" r="52%">
            <stop offset="0%" stopColor="#e4bfb0" />
            <stop offset="100%" stopColor="#c9998a" />
          </radialGradient>
          <linearGradient id="female-skin" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#f6e0d0" />
            <stop offset="60%" stopColor="#eed0b8" />
            <stop offset="100%" stopColor="#e8c8b0" />
          </linearGradient>
          <linearGradient id="female-top" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#c9998a" />
            <stop offset="100%" stopColor="#a87868" />
          </linearGradient>
          <radialGradient id="female-iris" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#7a9880" />
            <stop offset="55%" stopColor="#4a7060" />
            <stop offset="100%" stopColor="#243830" />
          </radialGradient>
        </defs>

        <ellipse cx="120" cy="222" rx="48" ry="8" fill="rgba(31,35,48,0.06)" />
        <circle className="avatar-background-circle" cx="120" cy="112" r="78" fill="url(#female-bg)" />

        <g className="avatar-figure-bob">
          {/* === Layer 1: Top/shoulders === */}
          <g className="avatar-shoulder-sway">
            <path
              d="M66 214c0-4 2-10 6-18 10-20 28-34 48-34s38 14 48 34c4 8 6 14 6 18v6H66v-6Z"
              fill="url(#female-top)"
            />
            {/* Neckline curve */}
            <path d="M102 166c5 9 11 14 18 14s13-5 18-14" fill="none" stroke="#b88474" strokeWidth="2" strokeLinecap="round" />
            {/* Subtle fabric fold */}
            <path d="M108 168 Q114 174 120 175 Q126 174 132 168" fill="none" stroke="#9a6858" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          </g>

          {/* === Layer 2: Neck === */}
          <path
            d="M109 140 Q108 152 109 162 Q115 165 120 165 Q125 165 131 162 Q132 152 131 140 Z"
            fill="url(#female-skin)"
          />
          {/* Neck side shadows */}
          <path d="M111 142c0 5 0 11 0 17" fill="none" stroke="#d0b898" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
          <path d="M129 142c0 5 0 11 0 17" fill="none" stroke="#d0b898" strokeWidth="1" strokeLinecap="round" opacity="0.35" />

          {/* === Layer 3: Head === */}
          <ellipse cx="120" cy="104" rx="34" ry="42" fill="url(#female-skin)" />
          {/* Subtle forehead highlight */}
          <ellipse cx="118" cy="88" rx="14" ry="9" fill="rgba(255,255,255,0.1)" />
          {/* Jawline */}
          <path d="M90 114c4 18 15 28 30 28s26-10 30-28" fill="none" stroke="#e0c0a4" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
          {/* Cheek blush — more prominent for female */}
          <ellipse cx="95" cy="115" rx="12" ry="7.5" fill="#f0a090" opacity="0.22" />
          <ellipse cx="145" cy="115" rx="12" ry="7.5" fill="#f0a090" opacity="0.22" />

          {/* === Layer 4: Hair, face, jewelry === */}
          {/* Hair main shape */}
          <path
            className="avatar-hair-sway"
            d="M86 98c0-32 15-46 34-46s34 14 34 44c0 10-2 20-6 28 1-14-6-28-18-36-5 3-12 5-20 5-4 0-8 0-12-1-4 8-6 16-7 24-3-5-4-12-5-18Z"
            fill="#2c2420"
          />
          {/* Side hair — thinner, medium length */}
          <path d="M90 82 C82 92 78 112 78 134 C78 148 82 158 88 158 C96 158 100 148 100 134 C100 116 98 96 90 82 Z" fill="#2c2420" />
          <path d="M150 82 C158 92 162 112 162 134 C162 148 158 158 152 158 C144 158 140 148 140 134 C140 116 142 96 150 82 Z" fill="#2c2420" />
          {/* Hair top highlights */}
          <path d="M100 72 Q110 64 122 66" fill="none" stroke="#564840" strokeWidth="3.5" strokeLinecap="round" opacity="0.55" />
          <path d="M98 76 Q107 67 119 68" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.18" />
          {/* Side hair shine */}
          <path d="M88 96 Q83 118 83 146" fill="none" stroke="#4a3e38" strokeWidth="1.8" strokeLinecap="round" opacity="0.38" />
          <path d="M152 96 Q157 118 157 146" fill="none" stroke="#4a3e38" strokeWidth="1.8" strokeLinecap="round" opacity="0.38" />

          {/* Eyebrows — soft natural arch */}
          <path d="M99 95 Q104.5 92 110 92.5" fill="none" stroke="#3d3028" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M130 95 Q135.5 92 141 92.5" fill="none" stroke="#3d3028" strokeWidth="1.6" strokeLinecap="round" />

          {/* Eyes */}
          <g className="avatar-face-blink">
            {/* Left eye: sclera → iris → pupil → highlight → eyelid */}
            <ellipse cx="105" cy="104" rx="5.5" ry="5.2" fill="#f9f3ee" />
            <ellipse cx="105.2" cy="104.4" rx="3.8" ry="3.8" fill="url(#female-iris)" />
            <ellipse cx="105.2" cy="104.4" rx="2.2" ry="2.2" fill="#120e0c" />
            <circle cx="103.6" cy="102.6" r="1.4" fill="white" opacity="0.85" />
            <circle cx="107" cy="106.4" r="0.7" fill="white" opacity="0.4" />
            {/* Eyelid + subtle wing */}
            <path d="M100 101 Q105 98 110.5 101" fill="none" stroke="#2c2420" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M110.5 101 L111.8 99.8" fill="none" stroke="#2c2420" strokeWidth="1.4" strokeLinecap="round" />
            {/* Right eye */}
            <ellipse cx="135" cy="104" rx="5.5" ry="5.2" fill="#f9f3ee" />
            <ellipse cx="135.2" cy="104.4" rx="3.8" ry="3.8" fill="url(#female-iris)" />
            <ellipse cx="135.2" cy="104.4" rx="2.2" ry="2.2" fill="#120e0c" />
            <circle cx="133.6" cy="102.6" r="1.4" fill="white" opacity="0.85" />
            <circle cx="137" cy="106.4" r="0.7" fill="white" opacity="0.4" />
            <path d="M129.5 101 Q135 98 140.5 101" fill="none" stroke="#2c2420" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M140.5 101 L141.8 99.8" fill="none" stroke="#2c2420" strokeWidth="1.4" strokeLinecap="round" />
          </g>

          {/* Nose */}
          <path d="M120 106v10" fill="none" stroke="#c9a086" strokeWidth="2" strokeLinecap="round" />
          <path d="M116.5 117 Q118.5 119.5 120 118.5 Q121.5 119.5 123.5 117" fill="none" stroke="#b89070" strokeWidth="1.4" strokeLinecap="round" />

          {/* Mouth — warm gentle smile */}
          <path d="M114 124 Q120 121 126 124" fill="none" stroke="#c07868" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M113 124.5 Q120 131 127 124.5" fill="none" stroke="#c07868" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M114 124.2 Q120 126 126 124.2" fill="none" stroke="#a86858" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />

          {/* Ears + inner detail */}
          <ellipse cx="86" cy="106" rx="4.5" ry="6.5" fill="url(#female-skin)" />
          <path d="M88 101 Q91 106 88 111" fill="none" stroke="#d0a888" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          <ellipse cx="154" cy="106" rx="4.5" ry="6.5" fill="url(#female-skin)" />
          <path d="M152 101 Q149 106 152 111" fill="none" stroke="#d0a888" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

          {/* Drop earrings — improved with chain */}
          <circle cx="85" cy="113" r="2" fill="#d4a574" opacity="0.9" />
          <path d="M84.8 115 Q85 119 85 121" fill="none" stroke="#c8963c" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
          <ellipse cx="85" cy="122" rx="2" ry="2.5" fill="#c8963c" opacity="0.75" />
          <ellipse cx="85" cy="122" rx="1" ry="1.3" fill="#f0d8a0" opacity="0.9" />
          <circle cx="85" cy="121.5" r="0.5" fill="white" opacity="0.55" />
          <circle cx="155" cy="113" r="2" fill="#d4a574" opacity="0.9" />
          <path d="M154.8 115 Q155 119 155 121" fill="none" stroke="#c8963c" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
          <ellipse cx="155" cy="122" rx="2" ry="2.5" fill="#c8963c" opacity="0.75" />
          <ellipse cx="155" cy="122" rx="1" ry="1.3" fill="#f0d8a0" opacity="0.9" />
          <circle cx="155" cy="121.5" r="0.5" fill="white" opacity="0.55" />

          {/* Pendant necklace */}
          <path d="M106 152c4 6 8 9 14 9s10-3 14-9" fill="none" stroke="#c8963c" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
          <circle cx="120" cy="161" r="2.5" fill="#c8963c" opacity="0.6" />
          <circle cx="120" cy="161" r="1.2" fill="#f0d8a0" opacity="0.8" />
          <circle cx="120" cy="160.5" r="0.5" fill="white" opacity="0.6" />
        </g>
      </svg>
    );
  }

  // Gender: other / neutral
  return (
    <svg
      viewBox="0 0 240 240"
      aria-hidden="true"
      className="avatar-illustration-figure h-full w-full drop-shadow-[0_22px_34px_rgba(34,30,27,0.14)]"
    >
      <defs>
        <radialGradient id="neutral-bg" cx="50%" cy="45%" r="52%">
          <stop offset="0%" stopColor="#d8ccbf" />
          <stop offset="100%" stopColor="#b8a898" />
        </radialGradient>
        <linearGradient id="neutral-skin" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#f2dece" />
          <stop offset="60%" stopColor="#eacebe" />
          <stop offset="100%" stopColor="#e0c4a8" />
        </linearGradient>
        <linearGradient id="neutral-top" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#6b6560" />
          <stop offset="100%" stopColor="#4a4540" />
        </linearGradient>
        <radialGradient id="neutral-iris" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#9a7848" />
          <stop offset="55%" stopColor="#6a4e28" />
          <stop offset="100%" stopColor="#3a2810" />
        </radialGradient>
      </defs>

      <ellipse cx="120" cy="222" rx="48" ry="8" fill="rgba(31,35,48,0.06)" />
      <circle className="avatar-background-circle" cx="120" cy="112" r="78" fill="url(#neutral-bg)" />

      <g className="avatar-figure-bob">
        {/* === Layer 1: Shirt === */}
        <g className="avatar-shoulder-sway">
          <path
            d="M65 214c0-4 2-10 6-18 10-20 29-34 49-34s39 14 49 34c4 8 6 14 6 18v6H65v-6Z"
            fill="url(#neutral-top)"
          />
          <path d="M106 168c4 6 9 8 14 8s10-2 14-8" fill="none" stroke="#5a5550" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M108 169 Q114 174 120 175 Q126 174 132 169" fill="none" stroke="#3a3530" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* === Layer 2: Neck === */}
        <path
          d="M108 140 Q107 152 108 162 Q114 165 120 165 Q126 165 132 162 Q133 152 132 140 Z"
          fill="url(#neutral-skin)"
        />
        {/* Neck side shadows */}
        <path d="M110 142c0 5 0 11 0 17" fill="none" stroke="#c8a882" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        <path d="M130 142c0 5 0 11 0 17" fill="none" stroke="#c8a882" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />

        {/* === Layer 3: Head === */}
        <ellipse cx="120" cy="104" rx="35" ry="42" fill="url(#neutral-skin)" />
        {/* Subtle forehead highlight */}
        <ellipse cx="118" cy="88" rx="15" ry="9.5" fill="rgba(255,255,255,0.08)" />
        {/* Jawline */}
        <path d="M89 116c4 16 16 26 31 26s27-10 31-26" fill="none" stroke="#d4b89e" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
        {/* Cheek blush */}
        <ellipse cx="96" cy="115" rx="10" ry="6" fill="#e8a088" opacity="0.15" />
        <ellipse cx="144" cy="115" rx="10" ry="6" fill="#e8a088" opacity="0.15" />

        {/* === Layer 4: Hair, face === */}
        <path
          className="avatar-hair-sway"
          d="M85 96c0-30 16-44 35-44s35 14 35 42c0 10-2 19-5 26-1-12-8-24-20-32-6 4-14 6-22 6-5 0-10-1-14-2-2 6-4 12-5 18-2-4-3-9-4-14Z"
          fill="#3d3430"
        />
        {/* Hair highlight */}
        <path d="M102 70 Q112 62 122 65" fill="none" stroke="#6a5a52" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
        <path d="M99 74 Q108 65 120 66" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.18" />

        {/* Eyebrows */}
        <path d="M97 95 Q103.5 91 110 92" fill="none" stroke="#3d3430" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M130 95 Q136.5 91 143 92" fill="none" stroke="#3d3430" strokeWidth="2.5" strokeLinecap="round" />

        {/* Eyes */}
        <g className="avatar-face-blink">
          {/* Left eye: sclera → iris → pupil → highlight → eyelid */}
          <ellipse cx="105" cy="104" rx="5.2" ry="4.8" fill="#f8f2ec" />
          <ellipse cx="105.2" cy="104.4" rx="3.6" ry="3.6" fill="url(#neutral-iris)" />
          <ellipse cx="105.2" cy="104.4" rx="2" ry="2" fill="#130e0c" />
          <circle cx="103.7" cy="102.8" r="1.2" fill="white" opacity="0.85" />
          <circle cx="106.4" cy="106.1" r="0.6" fill="white" opacity="0.35" />
          <path d="M99.5 101 Q105 98.2 110.5 101" fill="none" stroke="#2c2420" strokeWidth="2" strokeLinecap="round" />
          {/* Right eye */}
          <ellipse cx="135" cy="104" rx="5.2" ry="4.8" fill="#f8f2ec" />
          <ellipse cx="135.2" cy="104.4" rx="3.6" ry="3.6" fill="url(#neutral-iris)" />
          <ellipse cx="135.2" cy="104.4" rx="2" ry="2" fill="#130e0c" />
          <circle cx="133.7" cy="102.8" r="1.2" fill="white" opacity="0.85" />
          <circle cx="136.4" cy="106.1" r="0.6" fill="white" opacity="0.35" />
          <path d="M129.5 101 Q135 98.2 140.5 101" fill="none" stroke="#2c2420" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Nose + nostril hints */}
        <path d="M120 106v10" fill="none" stroke="#c4a48a" strokeWidth="2" strokeLinecap="round" />
        <path d="M116.5 117 Q118.5 119.5 120 118.5 Q121.5 119.5 123.5 117" fill="none" stroke="#b09070" strokeWidth="1.5" strokeLinecap="round" />

        {/* Mouth — upper lip + smile */}
        <path d="M113.5 122.5 Q117 120.5 120 121 Q123 120.5 126.5 122.5" fill="none" stroke="#a88878" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        <path d="M113 123.5 Q116.5 129 120 129.5 Q123.5 129 127 123.5" fill="none" stroke="#a88878" strokeWidth="2.2" strokeLinecap="round" />

        {/* Ears + inner ear detail */}
        <ellipse cx="85" cy="106" rx="5" ry="7" fill="url(#neutral-skin)" />
        <path d="M87.5 100 Q90.5 106 87.5 112" fill="none" stroke="#c0a080" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
        <ellipse cx="155" cy="106" rx="5" ry="7" fill="url(#neutral-skin)" />
        <path d="M152.5 100 Q149.5 106 152.5 112" fill="none" stroke="#c0a080" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      </g>
    </svg>
  );
}

export function ProfilePhoto({
  src,
  name,
  gender,
  alt,
  className,
  mediaClassName,
  placeholderClassName,
  label,
  hint,
  labelClassName,
  hintClassName,
  animated = false,
}: ProfilePhotoProps) {
  const trimmedSource = typeof src === 'string' ? src.trim() : '';
  const photoSource = trimmedSource || null;
  const showText = Boolean(label || hint);
  const resolvedGender = normalizeGender(gender);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {photoSource ? (
        <img
          src={photoSource}
          alt={alt ?? name}
          className={cn('h-full w-full object-cover', mediaClassName)}
        />
      ) : (
        <div
          className={cn(
            'relative flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_40%,_rgba(232,205,181,0.5),_transparent_60%),linear-gradient(160deg,#f8f0e6,#fff8f1_40%,#f5ebe0)] px-4 text-[#1f2330]',
            mediaClassName,
            placeholderClassName,
          )}
        >
          {!showText && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] bg-[linear-gradient(180deg,transparent,rgba(245,235,224,0.4)_50%,rgba(31,35,48,0.18)_100%)]" />
          )}
          <div
            className={cn(
              'avatar-illustration-shell relative z-10 flex items-center justify-center',
              showText
                ? 'h-[72%] w-[82%] max-h-[22rem] max-w-[22rem]'
                : 'h-[88%] w-[88%] max-h-[26rem] max-w-[26rem]',
              animated && 'avatar-illustration-animated',
            )}
          >
            <div className="avatar-illustration-halo absolute inset-[8%] rounded-[42%] bg-[radial-gradient(circle,_rgba(255,255,255,0.5),_rgba(255,255,255,0.05)_65%,_transparent_85%)]" />
            <div className="avatar-illustration-orb avatar-illustration-orb-left absolute left-[6%] top-[14%] h-[20%] w-[20%] rounded-full bg-[radial-gradient(circle,_rgba(232,205,181,0.5),_transparent_72%)] blur-xl" />
            <div className="avatar-illustration-orb avatar-illustration-orb-right absolute bottom-[16%] right-[8%] h-[16%] w-[16%] rounded-full bg-[radial-gradient(circle,_rgba(200,170,140,0.3),_transparent_72%)] blur-lg" />
            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <AvatarIllustration gender={resolvedGender} />
            </div>
          </div>

          {showText && (
            <div className="mt-4 text-center">
              {label && (
                <p
                  className={cn(
                    'text-[10px] font-black uppercase tracking-[0.28em] text-[#8c7c6c]',
                    labelClassName,
                  )}
                >
                  {label}
                </p>
              )}
              {hint && (
                <p className={cn('mt-2 text-sm leading-6 text-[#62584d]', hintClassName)}>
                  {hint}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
