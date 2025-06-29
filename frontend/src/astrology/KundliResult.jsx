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
import jsPDF from 'jspdf';
import useAuthStore from '@/store/useAuthStore';

export default function KundliResult() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore.getState();
  const containerRef = useRef(null);

  const q = new URLSearchParams(search);
  const datetime = q.get('datetime');
  const coordinates = q.get('coordinates');

  useEffect(() => {
    if (!datetime || !coordinates) {
      toast.error('Missing params, redirecting…');
      navigate('/');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_ASTROLOGY_URL}/kundli/detailed${search}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load Kundli');
      } finally {
        setLoading(false);
      }
    })();
  }, [search, datetime, coordinates, navigate, token]);

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const lineHeight = 16;
    const pageHeight = doc.internal.pageSize.getHeight();
    let cursorY = margin;
    const writeLine = (text, opts = {}) => {
      const { x = margin, size = 12 } = opts;
      doc.setFontSize(size);
      doc.text(text, x, cursorY);
      cursorY += lineHeight;
      if (cursorY + margin > pageHeight) {
        doc.addPage();
        cursorY = margin;
      }
    };

    // // Top quote: Gita 2.47
    writeLine('English: “Your right is to perform your duty only, never to its fruits.”',
      { size: 12 });
    writeLine('');

    // Main content...
    writeLine('🪐 Kundli Details', { size: 16 });
    writeLine('');
    writeLine(`Location: ${coordinates}`);
    writeLine(`Date & Time: ${new Date(datetime).toLocaleString()}`);
    writeLine('');

    if (data.nakshatra_details) {
      const nd = data.nakshatra_details;
      writeLine('Nakshatra Details:', { size: 14 });
      writeLine(`• Nakshatra: ${nd.nakshatra.name}`);
      writeLine(`• Pada: ${nd.nakshatra.pada}`);
      writeLine(`• Lord: ${nd.nakshatra.lord.name} (${nd.nakshatra.lord.vedic_name})`);
      writeLine(`• Chandra Rasi: ${nd.chandra_rasi.name}`);
      writeLine(`• Zodiac: ${nd.zodiac.name}`);
      Object.entries(nd.additional_info).forEach(([k, v]) =>
        writeLine(`• ${k.replace(/_/g, ' ')}: ${v}`)
      );
      writeLine('');
    }

    if (data.mangal_dosha) {
      writeLine('Mangal Dosha:', { size: 14 });
      writeLine(`• ${data.mangal_dosha.description}`);
      (data.mangal_dosha.exceptions || []).forEach(exc =>
        writeLine(`  – ${exc}`)
      );
      writeLine('');
    }

if (Array.isArray(data.yoga_details)) {
  writeLine('Yoga Details:', { size: 14 });
  data.yoga_details.forEach(group => {
    writeLine(`• ${group.name}: ${group.description}`, { size: 12 });
    if (Array.isArray(group.yoga_list)) {
      group.yoga_list.forEach(yoga => {
        writeLine(`   → ${yoga.name}: ${yoga.description}`, { size: 11 });
      });
    }
    writeLine('');
  });
}


    if (Array.isArray(data.kundli)) {
      writeLine('Planets & Houses:', { size: 14 });
      data.kundli.forEach(p =>
        writeLine(`• ${p.name} → House ${p.house_number}`)
      );
      writeLine('');
    }

    if (data.dasha_balance) {
      writeLine('Dasha & Anthardashas:', { size: 14 });
      writeLine(`• Balance: ${data.dasha_balance.description}`);
      writeLine('');
      data.dasha_periods.forEach((mah, mi) => {
        writeLine(`Mahadasha ${mi + 1}: ${mah.name}`, { size: 13 });
        mah.antardasha.forEach((ant) => {
          writeLine(`• ${ant.name} (${ant.start.split('T')[0]} → ${ant.end.split('T')[0]})`);
        });
        writeLine('');
      });
    }

    // // Bottom quote: Gita 18.66
  
    writeLine('Quote: “Abandon all varieties of dharma and just surrender unto Me. I shall free you from all sinful reactions, do not fear.”',
      { size: 12 });

    doc.save('kundli.pdf');
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

console.log(nakshatra_details);

  return (
    <div ref={containerRef} className="bg-black text-white min-h-screen px-6 py-8 max-w-5xl mx-auto space-y-8">
      <Toaster />

      {/* Top Quote */}
   <blockquote className="border-l-4 border-yellow-400 pl-4 italic text-sm text-gray-300">
        <p className="font-semibold">संस्कृत:</p>
        <p>“कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।</p>
        <p>मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥”</p>
        <p className="mt-2 font-semibold">हिन्दी:</p>
        <p>“कर्म करने का अधिकार तुम्हें है, फल में नहीं; कर्म में लीन रहो,</p>
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
            <Sun className="h-5 w-5" /><span>Nakshatra Details</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><b>Nakshatra:</b> {nakshatra_details.nakshatra.name}</div>
            <div><b>Nakshatra Pada:</b> {nakshatra_details.nakshatra.pada}</div>
            <div>
              <b>Lord:</b> {nakshatra_details.nakshatra.lord.name}<br/>
              <small className="text-gray-400">({nakshatra_details.nakshatra.lord.vedic_name})</small>
            </div>
            <div><b>Chandra Rasi:</b> {nakshatra_details.chandra_rasi.name}</div>
            <div>
              <b>Chandra Lord:</b> {nakshatra_details.chandra_rasi.lord.name}<br/>
              <small className="text-gray-400">({nakshatra_details.chandra_rasi.lord.vedic_name})</small>
            </div>
            <div><b>Soorya Rasi:</b> {nakshatra_details.soorya_rasi.name}</div>
            <div>
              <b>Soorya Lord:</b> {nakshatra_details.soorya_rasi.lord.name}<br/>
              <small className="text-gray-400">({nakshatra_details.soorya_rasi.lord.vedic_name})</small>
            </div>
            <div><b>Zodiac:</b> {nakshatra_details.zodiac.name}</div>
 {Object.entries(nakshatra_details.additional_info)
  .filter(([k]) => k !== 'gender')
  .map(([k, v]) => {
    const label = k
      .replace(/_/g, ' ')                // Replace underscores with spaces
      .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
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
            <Moon className="h-5 w-5" /><span>Mangal Dosha</span>
          </h2>
          <p>{mangal_dosha.description}</p>
          {mangal_dosha.exceptions?.length > 0 && (
            <ul className="list-disc list-inside mt-2 text-sm">
              {mangal_dosha.exceptions.map((ex, i) => <li key={i}>{ex}</li>)}
            </ul>
          )}
        </section>
      )}

      {/* Yoga Details */}
      {Array.isArray(yoga_details) && yoga_details.length > 0 && (
        <section className="bg-gray-900 p-6 rounded border border-gray-700">
          <h2 className="flex items-center space-x-2 mb-4 text-xl font-semibold text-green-400">
            <Star className="h-5 w-5"/><span>Yoga Details</span>
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
            <Home className="h-5 w-5"/><span>Planets & Houses</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {kundli.map((p, i) => (
              <div key={i} className="flex items-start space-x-2">
                <Globe className="h-4 w-4 text-yellow-300 mt-1"/>
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
            <Clock className="h-5 w-5"/><span>Dasha & Anthardashas</span>
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
              {Array.isArray(mah.antardasha) && mah.antardasha.map((ant, ai) => (
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
                        {ant.pratyantardasha.map((p, pi) => (
                          <tr key={pi} className={pi % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
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
        <p>“Abandon all varieties of dharma and just surrender unto Me. I shall free you from all sinful reactions.”</p>
      </blockquote>

      {/* Download Button at Bottom */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={downloadPDF}
          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
        >
          <Download className="h-5 w-5" />
          <span>Download PDF</span>
        </button>
      </div>
    </div>
  );
}
