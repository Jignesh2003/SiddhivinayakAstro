// src/pages/PanchangResult.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  Loader2,
  Sun,
  Moon,
  Star,
  Clock,
  Globe,
  ArrowRightCircle,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

export default function PanchangResult() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [panchang, setPanchang] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore.getState();

  useEffect(() => {
    const q = new URLSearchParams(search);
    const ayanamsa   = q.get('ayanamsa');
    const coordinates = q.get('coordinates');
    const datetime    = q.get('datetime');
    if (!ayanamsa || !coordinates || !datetime) {
      toast.error('Missing required parameters, redirecting…');
      navigate('/');
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_ASTROLOGY_URL}/panchang/detailed${search}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPanchang(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load Panchang');
      } finally {
        setLoading(false);
      }
    })();
  }, [search, navigate, token]);

  const fmtTime = dt =>
    new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Fetching Panchang…
      </div>
    );
  }
  if (!panchang) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900  p-6">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" /> Panchang Details
        </h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded"
        >
          <ArrowRightCircle className="h-5 w-5" /> Print / Download
        </button>
      </header>

      {/* Overview */}
      <section className="bg-white bg-opacity-10 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">
          Vaara (Weekday):{' '}
          <span className="font-bold">{panchang.vaara}</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-300" /> Sunrise:{' '}
            <span className="font-medium">{fmtTime(panchang.sunrise)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-300 rotate-180" /> Sunset:{' '}
            <span className="font-medium">{fmtTime(panchang.sunset)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-gray-300" /> Moonrise:{' '}
            <span className="font-medium">{fmtTime(panchang.moonrise)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-gray-300 rotate-180" /> Moonset:{' '}
            <span className="font-medium">{fmtTime(panchang.moonset)}</span>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      <div className="space-y-6">
        {[
          { key: 'nakshatra', icon: Star,  title: 'Nakshatras' },
          { key: 'tithi',     icon: Sun,   title: 'Tithis' },
          { key: 'karana',    icon: Clock, title: 'Karanas' },
          { key: 'yoga',      icon: Globe, title: 'Yogas' },
        ].map(({ key, icon: Icon, title }) => (
          <section
            key={key}
            className="bg-white bg-opacity-10 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon className="h-5 w-5 text-green-400" /> {title}
            </h3>
            <div className="space-y-3 text-sm">
              {panchang[key].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white bg-opacity-5 rounded"
                >
                  <p className="font-medium">{item.name}</p>
                  {item.paksha && (
                    <p className="italic text-xs">{item.paksha}</p>
                  )}
                  <p>
                    <strong>Starts:</strong>{' '}
                    {new Date(item.start).toLocaleString()}
                  </p>
                  <p>
                    <strong>Ends:  </strong>{' '}
                    {new Date(item.end).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Auspicious / Inauspicious Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {[
          {
            list: 'auspicious_period',
            title: 'Auspicious Periods',
            bg: 'bg-yellow-600',
          },
          {
            list: 'inauspicious_period',
            title: 'Inauspicious Periods',
            bg: 'bg-red-900' ,
          },
        ].map(({ list, title, bg }) => (
          <section
            key={list}
            className={`${bg} bg-opacity-30 rounded-lg p-6`}
          >
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <div className="space-y-4 text-sm">
              {panchang[list].map((entry) => (
                <div key={entry.id} className="space-y-1">
                  <p className="font-medium">
                    {entry.name} <span className="italic">({entry.type})</span>
                  </p>
                  {entry.period.map((p, i) => (
                    <p key={i} className="pl-2">
                      {new Date(p.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      –{' '}
                      {new Date(p.end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
