import { useEffect, useState, useRef } from 'react';
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
  Home,
  MapPin,
  Download,
} from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';

export default function KundliResult() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { token } = useAuthStore.getState();
  const containerRef = useRef(null);

  const q = new URLSearchParams(search);

  // Extract params either from direct params or from packed JSON in 'data'
  let datetime = q.get('datetime');
  let coordinates = q.get('coordinates');
  let ayanamsa = q.get('ayanamsa') || '';
  let la = q.get('la') || 'en';
  const orderId = q.get('order_id');

  // Attempt to parse packed data param if needed
  if (!datetime || !coordinates) {
    const dataStr = q.get('data');
    if (dataStr) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataStr));
        datetime = datetime || parsedData.datetime;
        coordinates = coordinates || parsedData.coordinates;
        ayanamsa = ayanamsa || parsedData.ayanamsa || '';
        la = la || parsedData.la || 'en';
      } catch (err) {
        console.error('Failed to parse kundli data from URL:', err);
      }
    }
  }

  useEffect(() => {
    if (!orderId) {
      toast.error('Missing order ID, redirecting…');
      navigate('/');
      return;
    }
    if (!datetime || !coordinates) {
      toast.error('Missing parameters, redirecting…');
      navigate('/');
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
        console.log("RESPONSE statusRes:",statusRes);
        
        if (statusRes.data.status !== 'SUCCESS') {
          toast.error('Payment not successful. Redirecting...');
          navigate('/');
          return;
        }

        // 2. Fetch kundli details only if payment success
        const apiParams = new URLSearchParams({
          datetime,
          coordinates,
          ayanamsa,
          la,
        });

        const kundliRes = await axios.get(
          `${import.meta.env.VITE_ASTROLOGY_URL}/kundli/detailed?${apiParams.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setData(kundliRes.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Error verifying payment or loading Kundli');
        navigate('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, datetime, coordinates, ayanamsa, la, navigate, token]);

  const downloadPDF = async () => {
    try {
      setIsDownloading(true);
      const params = new URLSearchParams({
        coordinates,
        datetime,
        ayanamsa,
        la,
      }).toString();

      const response = await axios.post(
        `${import.meta.env.VITE_KUNDLIPDF_URL}/pdf?${params}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Siddhivinayak_Kundali_${datetime || 'kundli'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('PDF Download failed. ' + (err.message || ''));
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Fetching your Kundli…
      </div>
    );
  }
  if (!data) return null;

  const {
    nakshatra_details,
    mangal_dosha,
    yoga_details,
    dasha_balance,
    dasha_periods = [],
    kundli,
  } = data;

  return (
    <div
      ref={containerRef}
      className="bg-black text-white min-h-screen px-6 py-8 max-w-5xl mx-auto space-y-8"
    >
      <Toaster />

      {/* Download Button at Top */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={downloadPDF}
          disabled={isDownloading}
          className={`flex items-center space-x-1 px-6 py-2 rounded ${
            isDownloading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Download className="h-5 w-5" />
          <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
        </button>
      </div>

      {/* Top Quote */}
      <blockquote className="border-l-4 border-yellow-400 pl-4 italic text-sm text-gray-300">
        <p className="font-semibold">संस्कृत:</p>
        <p>“कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।</p>
        <p>मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥”</p>
        <p className="mt-2 font-semibold">हिन्दी:</p>
        <p>
          “कर्म करने का अधिकार तुम्हें है, फल में नहीं; कर्म में लीन रहो,
        </p>
        <p>परिणाम में आसक्त न हो।”</p>
        <p className="mt-2 font-semibold">English:</p>
        <p>“Your right is to perform your duty, never to its fruits.”</p>
      </blockquote>

      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-yellow-400">🪐 Kundli Details</h1>
      </header>

      {/* Location & Datetime */}
      <section className="bg-gray-900 p-4 rounded border border-gray-700 flex flex-wrap gap-4 items-center">
        <MapPin className="h-5 w-5 text-pink-400" />
        <span>{coordinates}</span>
        <Clock className="h-5 w-5 text-green-400 ml-4" />
        <span>{new Date(datetime).toLocaleString()}</span>
      </section>

      {/* Nakshatra Details */}
      {nakshatra_details && (
        <section className="bg-gray-900 p-6 rounded border border-gray-700">
          <h2 className="flex items-center space-x-2 mb-4 text-xl font-semibold text-blue-300">
            <Sun className="h-5 w-5" />
            <span>Nakshatra Details</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <b>Nakshatra:</b> {nakshatra_details.nakshatra.name}
            </div>
            <div>
              <b>Nakshatra Pada:</b> {nakshatra_details.nakshatra.pada}
            </div>
            <div>
              <b>Lord:</b> {nakshatra_details.nakshatra.lord.name}
              <br />
              <small className="text-gray-400">
                ({nakshatra_details.nakshatra.lord.vedic_name})
              </small>
            </div>
            <div>
              <b>Chandra Rasi:</b> {nakshatra_details.chandra_rasi.name}
            </div>
            <div>
              <b>Chandra Lord:</b> {nakshatra_details.chandra_rasi.lord.name}
              <br />
              <small className="text-gray-400">
                ({nakshatra_details.chandra_rasi.lord.vedic_name})
              </small>
            </div>
            <div>
              <b>Soorya Rasi:</b> {nakshatra_details.soorya_rasi.name}
            </div>
            <div>
              <b>Soorya Lord:</b> {nakshatra_details.soorya_rasi.lord.name}
              <br />
              <small className="text-gray-400">
                ({nakshatra_details.soorya_rasi.lord.vedic_name})
              </small>
            </div>
            <div>
              <b>Zodiac:</b> {nakshatra_details.zodiac.name}
            </div>
            {Object.entries(nakshatra_details.additional_info)
              .filter(([k]) => k !== 'gender')
              .map(([k, v]) => {
                const label = k
                  .replace(/_/g, ' ')
                  .replace(/^\w/, (c) => c.toUpperCase());
                return (
                  <div key={k}>
                    <b>{label}:</b> {v}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Mangal Dosha */}
      {mangal_dosha && (
        <section className="bg-gray-900 p-6 rounded border border-gray-700">
          <h2 className="flex items-center space-x-2 mb-2 text-xl font-semibold text-red-400">
            <Moon className="h-5 w-5" />
            <span>Mangal Dosha</span>
          </h2>
          <p>{mangal_dosha.description}</p>
          {mangal_dosha.exceptions?.length > 0 && (
            <ul className="list-disc list-inside mt-2 text-sm">
              {mangal_dosha.exceptions.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Yoga Details */}
      {Array.isArray(yoga_details) && yoga_details.length > 0 && (
        <section className="bg-gray-900 p-6 rounded border border-gray-700">
          <h2 className="flex items-center space-x-2 mb-4 text-xl font-semibold text-green-400">
            <Star className="h-5 w-5" />
            <span>Yoga Details</span>
          </h2>
          {yoga_details.map((group, i) => (
            <div key={i} className="mb-4">
              <p className="font-semibold">{group.name}</p>
              <p className="text-sm text-gray-300 mb-2">{group.description}</p>
              {Array.isArray(group.yoga_list) && (
                <div className="space-y-1 pl-3 border-l-2 border-blue-500">
                  {group.yoga_list.map((y, j) => (
                    <div key={j}>
                      <p className="font-medium">{y.name}</p>
                      <p className="text-sm">{y.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Planets & Houses */}
      {Array.isArray(kundli) && kundli.length > 0 && (
        <section className="bg-gray-900 p-6 rounded border border-gray-700">
          <h2 className="flex items-center space-x-2 mb-4 text-xl font-semibold text-indigo-400">
            <Home className="h-5 w-5" />
            <span>Planets & Houses</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {kundli.map((p, i) => (
              <div key={i} className="flex items-start space-x-2">
                <Globe className="h-4 w-4 text-yellow-300 mt-1" />
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p>House {p.house_number}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dasha & Anthardashas */}
      {dasha_balance && (
        <section className="bg-gray-900 p-6 rounded border border-gray-700 space-y-6">
          <h2 className="flex items-center space-x-2 text-xl font-semibold text-blue-400">
            <Clock className="h-5 w-5" />
            <span>Dasha & Anthardashas</span>
          </h2>
          <p>
            <b>Balance:</b> {dasha_balance.description}
            <span className="ml-2 font-medium">
              ({dasha_balance.lord.name} / {dasha_balance.lord.vedic_name})
            </span>
          </p>
          {dasha_periods.map((mah, mi) => (
            <div key={mi} className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-300">
                Mahadasha #{mi + 1}: {mah.name}
              </h3>
              {Array.isArray(mah.antardasha) &&
                mah.antardasha.map((ant, ai) => (
                  <div key={ai} className="mb-2">
                    <h4 className="font-semibold text-green-300">
                      Antardasha #{ai + 1}: {ant.name}
                    </h4>
                    <p className="text-sm text-gray-400 mb-1">
                      {ant.start.split('T')[0]} → {ant.end.split('T')[0]}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-gray-800 text-sm border border-gray-700">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left">No.</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Start</th>
                            <th className="px-4 py-2 text-left">End</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ant.pratyantardasha?.map((p, pi) => (
                            <tr
                              key={pi}
                              className={pi % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}
                            >
                              <td className="px-4 py-2">{pi + 1}</td>
                              <td className="px-4 py-2">{p.name}</td>
                              <td className="px-4 py-2">{p.start.split('T')[0]}</td>
                              <td className="px-4 py-2">{p.end.split('T')[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </section>
      )}

      {/* Bottom Quote */}
      <blockquote className="border-l-4 border-yellow-400 pl-4 italic text-sm text-gray-300">
        <p className="font-semibold">संस्कृत:</p>
        <p>“सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज ।</p>
        <p>अहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः ॥”</p>
        <p className="mt-2 font-semibold">हिन्दी:</p>
        <p>“सभी धर्मों को त्यागकर केवल मेरी शरण में आओ, मैं तुम्हें सभी पापों से मुक्त कर दूँगा।”</p>
        <p className="mt-2 font-semibold">English:</p>
        <p>
          “Abandon all varieties of dharma and just surrender unto Me. I shall
          free you from all sinful reactions.”
        </p>
      </blockquote>

      {/* Download Button at Bottom */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={downloadPDF}
          disabled={isDownloading}
          className={`flex items-center space-x-1 px-6 py-2 rounded ${
            isDownloading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Download className="h-5 w-5" />
          <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
        </button>
      </div>
    </div>
  );
}
