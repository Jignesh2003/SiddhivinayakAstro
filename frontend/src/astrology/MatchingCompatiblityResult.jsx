import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import {
  Loader2,
  Download,
  Table as TableIcon,
} from 'lucide-react';

export default function MatchingCompatibilityResult() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const q = new URLSearchParams(search);
  let ayanamsa = q.get('ayanamsa');
  let girl_coordinates = q.get('girl_coordinates');
  let girl_dob = q.get('girl_dob');
  let boy_coordinates = q.get('boy_coordinates');
  let boy_dob = q.get('boy_dob');
  const orderId = q.get('order_id');

  // Support for packed data param (from payment flow)
  if (
    !ayanamsa ||
    !girl_coordinates ||
    !girl_dob ||
    !boy_coordinates ||
    !boy_dob
  ) {
    const dataStr = q.get('data');
    if (dataStr) {
      try {
        const parsed = JSON.parse(decodeURIComponent(dataStr));
        if (!ayanamsa) ayanamsa = parsed.ayanamsa;
        if (!girl_coordinates) girl_coordinates = parsed.girl_coordinates;
        if (!girl_dob) girl_dob = parsed.girl_dob;
        if (!boy_coordinates) boy_coordinates = parsed.boy_coordinates;
        if (!boy_dob) boy_dob = parsed.boy_dob;
      } catch (err) {
        console.log('Failed to parse data param:', err);
      }
    }
  }

  useEffect(() => {
    if (
      !ayanamsa ||
      !girl_coordinates ||
      !girl_dob ||
      !boy_coordinates ||
      !boy_dob
    ) {
      toast.error('Missing required parameters. Redirecting...');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    (async () => {
      setLoading(true);

      try {
        // 🚫 PAYMENT CHECK REMOVED - Direct API call
        // Build query string for Prokerala API
        const qs = new URLSearchParams({
          ayanamsa,
          girl_coordinates,
          girl_dob,
          boy_coordinates,
          boy_dob,
          la: 'en',
        }).toString();

        // Direct call to backend (which calls Prokerala)
        const res = await axios.get(
          `${import.meta.env.VITE_ASTROLOGY_URL}/kundali-matching/detailed?${qs}`
        );

        setData(res.data.data || res.data);
        toast.success('Kundali matching completed!');
      } catch (err) {
        console.error('Matching error:', err);
        toast.error(err.response?.data?.error || 'Failed to load compatibility');
        setTimeout(() => navigate('/'), 3000);
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
    navigate,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> 
        Fetching compatibility data...
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
  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <Toaster position="top-center" />

      {/* Print / Download Header */}
      <header className="flex items-center justify-between mb-8 print:hidden">
        <h1 className="text-3xl font-bold">🌟 Kundli Matching Report</h1>
        <button
          onClick={() => window.print()}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Download className="h-5 w-5" /> Print / Download
        </button>
      </header>

      {/* Birth Details Section */}
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
              <td className="p-2 border font-medium">Date Of Birth</td>
              <td className="p-2 border">{formatDate(girl_dob)}</td>
              <td className="p-2 border">{formatDate(boy_dob)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border font-medium">Nakshatra Name</td>
              <td className="p-2 border">{girl_info?.nakshatra?.name || 'N/A'}</td>
              <td className="p-2 border">{boy_info?.nakshatra?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td className="p-2 border font-medium">Nakshatra Pada</td>
              <td className="p-2 border">{girl_info?.nakshatra?.pada || 'N/A'}</td>
              <td className="p-2 border">{boy_info?.nakshatra?.pada || 'N/A'}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border font-medium">Nakshatra Lord</td>
              <td className="p-2 border">
                {girl_info?.nakshatra?.lord?.name || 'N/A'} 
                {girl_info?.nakshatra?.lord?.vedic_name && ` (${girl_info.nakshatra.lord.vedic_name})`}
              </td>
              <td className="p-2 border">
                {boy_info?.nakshatra?.lord?.name || 'N/A'}
                {boy_info?.nakshatra?.lord?.vedic_name && ` (${boy_info.nakshatra.lord.vedic_name})`}
              </td>
            </tr>
            <tr>
              <td className="p-2 border font-medium">Rasi Name</td>
              <td className="p-2 border">{girl_info?.rasi?.name || 'N/A'}</td>
              <td className="p-2 border">{boy_info?.rasi?.name || 'N/A'}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="p-2 border font-medium">Rasi Lord</td>
              <td className="p-2 border">
                {girl_info?.rasi?.lord?.name || 'N/A'} 
                {girl_info?.rasi?.lord?.vedic_name && ` (${girl_info.rasi.lord.vedic_name})`}
              </td>
              <td className="p-2 border">
                {boy_info?.rasi?.lord?.name || 'N/A'}
                {boy_info?.rasi?.lord?.vedic_name && ` (${boy_info.rasi.lord.vedic_name})`}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Guna Milan Details Section */}
      {guna_milan && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TableIcon className="h-5 w-5" /> Guna Milan Details
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">#</th>
                <th className="p-2 border">Guna</th>
                <th className="p-2 border">Girl Koot</th>
                <th className="p-2 border">Boy Koot</th>
                <th className="p-2 border">Maximum Points</th>
                <th className="p-2 border">Obtained Points</th>
              </tr>
            </thead>
            <tbody>
              {guna_milan.guna?.map((g, idx) => (
                <tr key={g.id || idx} className={idx % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="p-2 border text-center">{idx + 1}</td>
                  <td className="p-2 border">{g.name}</td>
                  <td className="p-2 border">{g.girl_koot}</td>
                  <td className="p-2 border">{g.boy_koot}</td>
                  <td className="p-2 border text-center">{g.maximum_points}</td>
                  <td className="p-2 border text-center">{g.obtained_points}</td>
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
      )}

      {/* Detailed Interpretation */}
      {guna_milan?.guna && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Guna Milan Detailed Interpretation
          </h2>
          {guna_milan.guna.map((g) => (
            <div key={g.id} className="mb-6">
              <h3 className="font-semibold text-lg">
                {g.id}. {g.name}
              </h3>
              <p className="text-gray-700">{g.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* Mangal Dosha & Summary */}
      <section className="mb-8 space-y-4">
        {girl_mangal_dosha_details && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Girl Mangal Dosha Details
            </h3>
            <div className="bg-red-100 text-red-800 p-4 rounded">
              {girl_mangal_dosha_details.description}
            </div>
          </div>
        )}
        
        {boy_mangal_dosha_details && (
          <div>
            <h3 className="text-xl font-semibold mb-2">
              Boy Mangal Dosha Details
            </h3>
            <div className="bg-red-100 text-red-800 p-4 rounded">
              {boy_mangal_dosha_details.description}
            </div>
          </div>
        )}
        
        {message && (
          <div className={`p-4 rounded ${message.type === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <h3 className="text-xl font-semibold mb-2">Summary</h3>
            <p>{message.description}</p>
          </div>
        )}
      </section>
    </div>
  );
}