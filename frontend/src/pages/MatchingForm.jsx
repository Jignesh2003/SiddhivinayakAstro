// src/pages/MatchForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { Globe, User, ArrowRight } from 'lucide-react';

export default function MatchingForm() {
  const navigate = useNavigate();
  const [ayanamsa, setAyanamsa] = useState('1');
  const [girlDob, setGirlDob] = useState('');
  const [girlCoords, setGirlCoords] = useState('');
  const [boyDob, setBoyDob] = useState('');
  const [boyCoords, setBoyCoords] = useState('');
  const [la, setLa] = useState('en');

  const handleSubmit = e => {
    e.preventDefault();
    if (!ayanamsa || !girlDob || !girlCoords || !boyDob || !boyCoords) {
      return toast.error('Please fill all fields');
    }
    const params = new URLSearchParams({
      ayanamsa,
      girl_coordinates: girlCoords,
      girl_dob: girlDob,
      boy_coordinates: boyCoords,
      boy_dob: boyDob,
      la,
    }).toString();
    navigate(`/matching-compatibility-result?${params}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-6">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 space-y-6 w-full max-w-lg text-white"
      >
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          Kundli Compatibility
        </h1>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Ayanamsa</label>
            <select
              value={ayanamsa}
              onChange={e => setAyanamsa(e.target.value)}
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            >
              <option value="1">1 – Lahiri</option>
              <option value="3">3 – Raman</option>
              <option value="5">5 – KP</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Language</label>
            <select
              value={la}
              onChange={e => setLa(e.target.value)}
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 flex items-center gap-1">
              <User className="inline-block" /> Girl’s DOB
            </label>
            <input
              type="datetime-local"
              value={girlDob}
              onChange={e => setGirlDob(e.target.value)}
              required
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">
              <Globe className="inline-block" /> Girl’s Coordinates
            </label>
            <input
              type="text"
              placeholder="e.g. 10.2147,78.0976"
              value={girlCoords}
              onChange={e => setGirlCoords(e.target.value)}
              required
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">
              <User className="inline-block" /> Boy’s DOB
            </label>
            <input
              type="datetime-local"
              value={boyDob}
              onChange={e => setBoyDob(e.target.value)}
              required
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            />
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">
              <Globe className="inline-block" /> Boy’s Coordinates
            </label>
            <input
              type="text"
              placeholder="e.g. 10.2147,78.0976"
              value={boyCoords}
              onChange={e => setBoyCoords(e.target.value)}
              required
              className="w-full p-2 bg-white bg-opacity-20 rounded"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 hover:bg-yellow-600 transition rounded py-3 font-semibold flex items-center justify-center gap-2"
        >
          <ArrowRight className="h-5 w-5" />
          Check Compatibility
        </button>
      </form>
    </div>
  );
}
