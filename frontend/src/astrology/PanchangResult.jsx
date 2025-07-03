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
    const ayanamsa = q.get('ayanamsa');
    const coordinates = q.get('coordinates');
    const datetime = q.get('datetime');
    // la is optional
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
        toast.error('Failed to load panchang');
      } finally {
        setLoading(false);
      }
    })();
  }, [search, navigate, token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Fetching Panchang…
      </div>
    );
  }
  if (!panchang) return null;

  const fmt = dt => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6">
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
        <h2 className="text-2xl font-semibold mb-4">Vaara (Weekday): <span className="font-bold">{panchang.vaara}</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><Sun className="inline h-5 w-5 mr-1 text-yellow-300"/> Sunrise: {fmt(panchang.sunrise)}</div>
          <div><Sun className="inline h-5 w-5 mr-1 text-yellow-300 rotate-180"/> Sunset: {fmt(panchang.sunset)}</div>
          <div><Moon className="inline h-5 w-5 mr-1 text-gray-300"/> Moonrise: {fmt(panchang.moonrise)}</div>
          <div><Moon className="inline h-5 w-5 mr-1 text-gray-300 rotate-180"/> Moonset: {fmt(panchang.moonset)}</div>
        </div>
      </section>

      {/* Dynamic Elements */}
      <div className="space-y-6">
        {[
          { key: 'nakshatra', icon: Star, title: 'Nakshatras' },
          { key: 'tithi',     icon: Sun,  title: 'Tithis' },
          { key: 'karana',    icon: Clock, title: 'Karanas' },
          { key: 'yoga',      icon: Globe, title: 'Yogas' },
        ].map(({ key, icon: Icon, title }) => (
          <section key={key} className="bg-white bg-opacity-10 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon className="h-5 w-5 text-green-400"/> {title}
            </h3>
            <div className="space-y-3 text-sm">
              {panchang[key].map((item, i) => (
                <div key={i} className="p-3 bg-white bg-opacity-5 rounded">
                  <p><b>{item.name}</b> <small className="italic">({item.paksha || ''})</small></p>
                  <p>Starts: {new Date(item.start).toLocaleString()}</p>
                  <p>Ends:   {new Date(item.end).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Auspicious & Inauspicious */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {[
          { list: 'auspicious_period', title: 'Auspicious Periods', bg: 'bg-green-800' },
          { list: 'inauspicious_period', title: 'Inauspicious Periods', bg: 'bg-red-800' },
        ].map(({ list, title, bg }) => (
          <section key={list} className={`${bg} bg-opacity-30 rounded-lg p-6`}>
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <div className="space-y-4 text-sm">
              {panchang[list].map((entry) => (
                <div key={entry.id} className="space-y-1">
                  <p><b>{entry.name}</b> ({entry.type})</p>
                  {entry.period.map((p, i) => (
                    <p key={i}>
                      {new Date(p.start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                      {" – "}
                      {new Date(p.end).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
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
