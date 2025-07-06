// src/components/LifePathNumber.jsx
import { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { Calendar, Loader2, Star, CheckCircle, AlertCircle } from 'lucide-react'

const PROFILES = [
  {
    number: 1,
    title: 'The Visionary Leader',
    description: `Ones are natural-born trailblazers, endowed with an unwavering drive to carve their own path. You possess an inner fire that propels you forward, even when obstacles arise. Independence is your hallmark: you trust your own judgment, take initiative without hesitation, and aren’t afraid to stand alone when pursuing your goals.

Your journey as a One is about learning to balance this fierce autonomy with the heart of a compassionate leader. When you temper your ambition with empathy, you inspire others to follow—and together you can achieve remarkable heights.`,
    traits: {
      positive: [
        'Unshakable self‑confidence',
        'Visionary problem‑solver',
        'Courageous in adversity',
        'Decisive and action‑oriented'
      ],
      challenging: [
        'Can be overly self‑reliant',
        'May disregard others’ input',
        'Tendency toward impatience',
        'Prone to perfectionism'
      ]
    },
    compatibility: {
      compatible_with: [3, 5, 7],
      challenging_with: [2, 4, 8]
    }
  },
  {
    number: 2,
    title: 'The Harmonious Diplomat',
    description: `Twos are gifted mediators, naturally attuned to the emotions of those around them. You bring people together, smooth conflicts, and create environments where collaboration can flourish. Your gentle persuasion and diplomatic grace make you a beloved friend and partner.

Your soul’s growth lies in cultivating inner strength so you can stand firm in your convictions without sacrificing your innate kindness. When you learn to honor your own needs as much as others’, your peacemaking abilities become a profound force for unity.`,
    traits: {
      positive: [
        'Deep empathy and sensitivity',
        'Exceptional team player',
        'Tactful communicator',
        'Intuitive understanding'
      ],
      challenging: [
        'May become overly dependent',
        'Struggles with indecision',
        'Can absorb others’ negative emotions',
        'Tendency toward self‑doubt'
      ]
    },
    compatibility: {
      compatible_with: [4, 6, 8],
      challenging_with: [1, 3, 5]
    }
  },
  {
    number: 3,
    title: 'The Creative Communicator',
    description: `Threes are the life of the party—overflowing with creativity, joy, and expressive flair. Storytelling, performance, writing, or any form of self‑expression fuels your spirit. You uplift others through humor and optimism, painting the world in bright, inspiring colors.

Your growth comes from grounding this exuberance in discipline. When you direct your creative gifts with focus, you transform from an entertaining soul into an influential visionary whose ideas can shift culture itself.`,
    traits: {
      positive: [
        'Boundless creativity',
        'Charismatic storyteller',
        'Optimism that inspires',
        'Adaptable and versatile'
      ],
      challenging: [
        'Can scatter energy too thinly',
        'Tendency toward superficiality',
        'Prone to impatience with routine',
        'May avoid deeper emotional work'
      ]
    },
    compatibility: {
      compatible_with: [1, 5, 7],
      challenging_with: [2, 4, 6]
    }
  },
  {
    number: 4,
    title: 'The Steadfast Builder',
    description: `Fours are the architects of the material world. You prize stability, structure, and reliability. With a meticulous eye for detail and an unshakeable work ethic, you methodically build your dreams brick by brick. Your perseverance and honesty make you a rock that others can lean on.

Your lesson is to invite flexibility into your ordered life. When you allow occasional spontaneity, you blend your practical genius with creative breakthroughs that elevate your lasting legacies.`,
    traits: {
      positive: [
        'Disciplined and organized',
        'Loyal and responsible',
        'Pragmatic problem‑solver',
        'Enduring perseverance'
      ],
      challenging: [
        'Can be inflexible',
        'Tendency toward rigidity',
        'May resist new ideas',
        'Prone to workaholism'
      ]
    },
    compatibility: {
      compatible_with: [2, 6, 8],
      challenging_with: [1, 3, 5]
    }
  },
  {
    number: 5,
    title: 'The Adventurous Free‑Spirit',
    description: `Fives crave freedom, variety, and adventure. You thrive on change, exploration, and pushing boundaries—whether through travel, learning, or daring life experiments. Your magnetic energy draws others to you, eager to share in your bold pursuits.

Your path calls you to cultivate responsibility alongside your independence. When you balance your wanderlust with commitment, you become a dynamic trailblazer who inspires innovation and growth in every realm you touch.`,
    traits: {
      positive: [
        'Adventurous and curious',
        'Charismatic socializer',
        'Highly adaptable',
        'Energetic risk‑taker'
      ],
      challenging: [
        'Can be restless and unfocused',
        'Tendency to avoid commitment',
        'May act impulsively',
        'Prone to inconsistency'
      ]
    },
    compatibility: {
      compatible_with: [1, 3, 7],
      challenging_with: [2, 4, 6]
    }
  },
  {
    number: 6,
    title: 'The Nurturing Caregiver',
    description: `Sixes embrace responsibility for the welfare of family and community. You excel at creating loving, supportive environments where everyone feels safe. Your strong sense of duty and innate compassion make you a natural healer, counselor, and mentor.

Your challenge is to tend to your own needs as tenderly as you care for others. When you honor your boundaries and self‑care, your nurturing gifts become a sustainable force for healing and harmony.`,
    traits: {
      positive: [
        'Deep compassion',
        'Natural mediator',
        'Loyal and protective',
        'Artistic and graceful'
      ],
      challenging: [
        'Can become over‑responsible',
        'Tendency toward martyrdom',
        'May worry excessively',
        'Prone to people‑pleasing'
      ]
    },
    compatibility: {
      compatible_with: [2, 4, 8],
      challenging_with: [3, 5, 7]
    }
  },
  {
    number: 7,
    title: 'The Intuitive Seeker',
    description: `Sevens are drawn to the mysteries of existence. You possess a deep intellectual curiosity and an intuitive sense that guides you toward spiritual and philosophical truths. Solitude and introspection fuel your inner growth and wisdom.

Your mission is to bridge your inner revelations with compassionate service to others. When you share your insights openly, you awaken minds and hearts to greater depths of understanding.`,
    traits: {
      positive: [
        'Keen analytical mind',
        'Profound intuition',
        'Devoted to spiritual growth',
        'Independent thinker'
      ],
      challenging: [
        'Can become withdrawn',
        'Tendency toward skepticism',
        'May struggle with practical matters',
        'Prone to overthinking'
      ]
    },
    compatibility: {
      compatible_with: [1, 3, 5],
      challenging_with: [2, 6, 8]
    }
  },
  {
    number: 8,
    title: 'The Powerful Achiever',
    description: `Eights command the energies of abundance, authority, and influence. You possess a formidable drive to succeed in the material world and a remarkable capacity for leadership and financial acumen. Your ability to manifest wealth and power can transform organizations and communities.

Your soul’s growth comes from wielding your power with integrity and compassion. When you align your ambition with service, you become a true steward of prosperity who lifts others as you rise.`,
    traits: {
      positive: [
        'Strong executive ability',
        'Natural leader',
        'Strategic thinker',
        'Resilient under pressure'
      ],
      challenging: [
        'Can be overly materialistic',
        'Tendency toward control issues',
        'May neglect emotional needs',
        'Prone to work‑obsession'
      ]
    },
    compatibility: {
      compatible_with: [2, 4, 6],
      challenging_with: [1, 3, 5]
    }
  },
  {
    number: 9,
    title: 'The Compassionate Humanitarian',
    description: `Nines embody universal love and altruism. You feel a profound kinship with all humanity and are driven to make the world a better place. Your generosity, empathy, and broad perspective inspire collective healing and understanding.

Your challenge is to balance giving with receiving. When you honor your own worth and allow others to support you, your humanitarian vision gains sustainability and depth.`,
    traits: {
      positive: [
        'Boundless empathy',
        'Idealistic vision',
        'Selfless dedication',
        'Global awareness'
      ],
      challenging: [
        'Can be overly self‑sacrificing',
        'Tendency to become disillusioned',
        'May struggle with boundaries',
        'Prone to emotional overwhelm'
      ]
    },
    compatibility: {
      compatible_with: [2, 6, 8],
      challenging_with: [1, 4, 5]
    }
  }
]

export default function LifePathNumber() {
  const [dob, setDob] = useState('')            // YYYY-MM-DD
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)  // found profile

  // reduce to single digit
  const reduceToDigit = n => {
    const s = String(n)
      .split('')
      .map(Number)
      .reduce((a, b) => a + b, 0)
    return s > 9 ? reduceToDigit(s) : s
  }

  // compute from YYYY-MM-DD
  const computeLifePath = isoDate => {
    const digits = isoDate.replace(/-/g, '')
    const sum = digits.split('').map(Number).reduce((a, b) => a + b, 0)
    return reduceToDigit(sum)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!dob) {
      toast.error('Please select your date of birth')
      return
    }
    setLoading(true)
    setProfile(null)
    const lp = computeLifePath(dob)
    // lookup static
    const found = PROFILES.find(p => p.number === lp)
    setTimeout(() => {
      setLoading(false)
      if (!found) {
        toast.error(`No profile for Life Path ${lp}`)
      } else {
        setProfile(found)
      }
    }, 500)
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
      <Toaster position="top-center" />

      <header className="text-center">
        <h1 className="text-2xl font-bold text-indigo-600 flex items-center justify-center gap-2">
          <Star className="w-6 h-6"/> Life Path Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your birth date to discover your Life Path Number
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          <span className="flex items-center gap-1"><Calendar className="w-5 h-5"/> Date of Birth</span>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center gap-2 py-2 rounded text-white ${
            loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading
            ? <Loader2 className="animate-spin w-5 h-5"/>
            : <CheckCircle className="w-5 h-5"/>
          }
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>

      {profile && (
        <section className="bg-indigo-50 p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-indigo-700 flex items-center gap-2">
            <Star className="w-6 h-6"/> {profile.title} (#{profile.number})
          </h2>
          <p className="text-gray-700 whitespace-pre-line">
            {profile.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-800 flex items-center gap-1">
                <Star className="w-4 h-4 text-green-500"/> Positive Traits
              </h3>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                {profile.traits.positive.map((t,i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-500"/> Challenging Traits
              </h3>
              <ul className="list-disc list-inside mt-2 text-gray-700">
                {profile.traits.challenging.map((t,i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <strong>Compatible with:</strong> {profile.compatibility.compatible_with.join(', ')}<br/>
            <strong>Challenging with:</strong> {profile.compatibility.challenging_with.join(', ')}
          </div>
        </section>
      )}
    </div>
  )
}
