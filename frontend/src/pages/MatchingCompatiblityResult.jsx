// src/pages/CompatibilityResult.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2, Download, Globe, Clock } from 'lucide-react';

export default function MatchingCompatiblityResult() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // parse the exact same params
  const q = new URLSearchParams(search);
  const ayanamsa = q.get('ayanamsa');
  const girl_coordinates = q.get('girl_coordinates');
  const girl_dob = q.get('girl_dob');
  const boy_coordinates = q.get('boy_coordinates');
  const boy_dob = q.get('boy_dob');
  const la = q.get('la');

  useEffect(() => {
    if (!ayanamsa || !girl_coordinates || !girl_dob || !boy_coordinates || !boy_dob) {
      toast.error('Missing params, redirecting…');
      navigate('/');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/compatibility${search}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load compatibility');
      } finally {
        setLoading(false);
      }
    })();
  }, [search, navigate, ayanamsa, girl_coordinates, girl_dob, boy_coordinates, boy_dob]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Fetching compatibility…
      </div>
    );
  }
  if (!data) return null;

  // Example of rendering a few fields—adjust to match your API schema
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
          <Globe /> <span><b>Girl:</b> {data.girl.name || data.girl_dob} @ {girl_coordinates}</span>
        </div>
        <div className="flex items-center gap-4">
          <Clock /> <span><b>Boy:</b> {data.boy.name || data.boy_dob} @ {boy_coordinates}</span>
        </div>
      </section>

      {/* Compatibility details */}
      <section className="bg-white bg-opacity-10 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Match Findings:</h2>
        <div className="space-y-3">
          {Object.entries(data.match || {}).map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace(/_/g,' ')}</span>
              <span className="font-medium">{String(val)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
