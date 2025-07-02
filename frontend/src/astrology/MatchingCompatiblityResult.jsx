// src/pages/CompatibilityResult.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2, Download, Globe, Clock } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

export default function MatchingCompatibilityResult() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore.getState();

  const q = new URLSearchParams(search);
  const ayanamsa = q.get('ayanamsa');
  const girl_coordinates = q.get('girl_coordinates');
  const girl_dob = q.get('girl_dob');
  const boy_coordinates = q.get('boy_coordinates');
  const boy_dob = q.get('boy_dob');


  useEffect(() => {
    if (!ayanamsa || !girl_coordinates || !girl_dob || !boy_coordinates || !boy_dob) {
      toast.error('Missing params, redirecting…');
      navigate('/');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_ASTROLOGY_URL}/kundali-matching/detailed${search}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Prokerala nests real payload under .data
        setData(res.data.data || res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load compatibility');
      } finally {
        setLoading(false);
      }
    })();
  }, [
    search,
    navigate,
    ayanamsa,
    girl_coordinates,
    girl_dob,
    boy_coordinates,
    boy_dob,
    token
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Fetching compatibility…
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 min-h-screen text-white p-6">
      <Toaster />
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🌟 Compatibility Report</h1>
        <button
          onClick={() => window.print()}
          className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded flex items-center gap-2"
        >
          <Download className="h-5 w-5" /> Print / Download
        </button>
      </header>

      <section className="bg-white bg-opacity-10 p-6 rounded-lg mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Globe />{' '}
          <span>
            <b>Girl:</b>{' '}
            {data.girl?.name || data.girl?.dob || girl_dob} @ {girl_coordinates}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Clock />{' '}
          <span>
            <b>Boy:</b>{' '}
            {data.boy?.name || data.boy?.dob || boy_dob} @ {boy_coordinates}
          </span>
        </div>
      </section>

      <section className="bg-white bg-opacity-10 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Match Findings:</h2>
        <div className="space-y-3">
          {Object.entries(data.match || {}).map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="font-medium">{String(val)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
