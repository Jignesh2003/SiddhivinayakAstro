import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  Loader2,
  Download,  Table as TableIcon,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

export default function MatchingCompatibilityResult() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore.getState();

  const q = new URLSearchParams(search);
  let ayanamsa = q.get('ayanamsa');
  let girl_coordinates = q.get('girl_coordinates');
  let girl_dob = q.get('girl_dob');
  let boy_coordinates = q.get('boy_coordinates');
  let boy_dob = q.get('boy_dob');
  const orderId = q.get('order_id');

  // Also support for packed data param (if needed in your flow)
  if (
    !ayanamsa ||
    !girl_coordinates ||
    !girl_dob ||
    !boy_coordinates ||
    !boy_dob ||
    !orderId
  ) {
    const dataStr = q.get('data');
    if (dataStr) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataStr));
        // Fill in missing params if packed JSON present
        if (!ayanamsa) ayanamsa = parsed.ayanamsa;
        if (!girl_coordinates) girl_coordinates = parsed.girl_coordinates;
        if (!girl_dob) girl_dob = parsed.girl_dob;
        if (!boy_coordinates) boy_coordinates = parsed.boy_coordinates;
        if (!boy_dob) boy_dob = parsed.boy_dob;
      } catch (err) {
        console.log(err);
        
        // fallback below
      }
    }
  }

  useEffect(() => {
    if (!orderId) {
      toast.error('Missing order ID, redirecting...');
      setTimeout(() => navigate('/'), 3000);
      return;
    }
    
    if (
      !ayanamsa ||
      !girl_coordinates ||
      !girl_dob ||
      !boy_coordinates ||
      !boy_dob
    ) {
      toast.error('Missing params, redirecting…');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    (async () => {
      setLoading(true);

      try {
        // 1. Verify payment status
        const statusRes = await axios.get(
          `${import.meta.env.VITE_PAYMENT_URL}/status/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (statusRes.data.status !== 'SUCCESS') {
          toast.error('Payment not verified!', { duration: 3000 });
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // 2. Fetch compatibility data
        const qs = new URLSearchParams({
          ayanamsa,
          girl_coordinates,
          girl_dob,
          boy_coordinates,
          boy_dob,
        }).toString();

        const res = await axios.get(
          `${import.meta.env.VITE_ASTROLOGY_URL}/kundali-matching/detailed?${qs}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setData(res.data.data || res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load compatibility');
        setTimeout(() => navigate('/'), 2500);
      } finally {
        setLoading(false);
      }
    })();
  }, [
    ayanamsa,
    girl_coordinates,
    girl_dob,
    boy_coordinates,
    boy_dob,
    orderId,
    navigate,
    token,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Fetching compatibility…
      </div>
    );
  }
  if (!data) return null;

  const {
    girl_info,
    boy_info,
    guna_milan,
    girl_mangal_dosha_details,
    boy_mangal_dosha_details,
    message,
  } = data;

  // Format date of birth display
  const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <Toaster />

      {/* Print / Download */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">🌟 Kundli Matching Report</h1>
        <button
          onClick={() => window.print()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Download className="h-5 w-5" /> Print / Download
        </button>
      </header>

      {/* Birth Details */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Birth Details</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Details of Girl</th>
              <th className="p-2 border">Details of Boy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border">Date Of Birth</td>
              <td className="p-2 border">{formatDate(girl_dob)}</td>
              <td className="p-2 border">{formatDate(boy_dob)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border">Nakshatra Name</td>
              <td className="p-2 border">{girl_info.nakshatra.name}</td>
              <td className="p-2 border">{boy_info.nakshatra.name}</td>
            </tr>
            <tr>
              <td className="p-2 border">Nakshatra Pada</td>
              <td className="p-2 border">{girl_info.nakshatra.pada}</td>
              <td className="p-2 border">{boy_info.nakshatra.pada}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border">Nakshatra Lord</td>
              <td className="p-2 border">
                {girl_info.nakshatra.lord.name} (
                {girl_info.nakshatra.lord.vedic_name})
              </td>
              <td className="p-2 border">
                {boy_info.nakshatra.lord.name} (
                {boy_info.nakshatra.lord.vedic_name})
              </td>
            </tr>
            <tr>
              <td className="p-2 border">Rasi Name</td>
              <td className="p-2 border">{girl_info.rasi.name}</td>
              <td className="p-2 border">{boy_info.rasi.name}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border">Rasi Lord</td>
              <td className="p-2 border">
                {girl_info.rasi.lord.name} ({girl_info.rasi.lord.vedic_name})
              </td>
              <td className="p-2 border">
                {boy_info.rasi.lord.name} ({boy_info.rasi.lord.vedic_name})
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Guna Milan Details */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TableIcon className="h-5 w-5" /> Guna Milan Details
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Guna</th>
              <th className="p-2 border">Girl</th>
              <th className="p-2 border">Boy</th>
              <th className="p-2 border">Maximum Points</th>
              <th className="p-2 border">Obtained Points</th>
            </tr>
          </thead>
          <tbody>
            {guna_milan.guna.map((g, idx) => (
              <tr
                key={g.id}
                className={idx % 2 === 0 ? '' : 'bg-gray-50'}
              >
                <td className="p-2 border text-center">{idx + 1}</td>
                <td className="p-2 border">{g.name}</td>
                <td className="p-2 border">{g.girl_koot}</td>
                <td className="p-2 border">{g.boy_koot}</td>
                <td className="p-2 border text-center">
                  {g.maximum_points}
                </td>
                <td className="p-2 border text-center">
                  {g.obtained_points}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={4} className="p-2 border text-right">
                Total Guna Milan Points :
              </td>
              <td className="p-2 border text-center">
                {guna_milan.maximum_points}
              </td>
              <td className="p-2 border text-center">
                {guna_milan.total_points}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Detailed Interpretation */}
      <section className="mb-8 prose prose-white max-w-none">
        <h2 className="text-2xl font-semibold mb-4">
          Guna Milan Detailed Interpretation
        </h2>
        {guna_milan.guna.map((g) => (
          <div key={g.id} className="mb-6">
            <h3 className="font-semibold">
              {g.id}. {g.name}
            </h3>
            <p>{g.description}</p>
          </div>
        ))}
      </section>

      {/* Mangal Dosha & Summary */}
      <section className="mb-8 space-y-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Girl Mangal Dosha Details
          </h3>
          <div className="bg-red-100 text-red-800 p-4 rounded">
            {girl_mangal_dosha_details.description}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Boy Mangal Dosha Details
          </h3>
          <div className="bg-red-100 text-red-800 p-4 rounded">
            {boy_mangal_dosha_details.description}
          </div>
        </div>
        <div className={`p-4 rounded ${message.type === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p>{message.description}</p>
        </div>
      </section>
    </div>
  );
}
