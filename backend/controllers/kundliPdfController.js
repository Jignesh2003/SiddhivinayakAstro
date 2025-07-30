import wkhtmltopdf from 'wkhtmltopdf';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import redis from '../utils/redisClient.js';

export const generateKundaliPDF = async (req, res) => {
  try {
    const { coordinates, datetime, ayanamsa = '', la = 'en' } = req.query;
    if (!coordinates || !datetime) {
      return res.status(400).json({ error: 'Missing required params' });
    }

    const cacheKey = `kundli:${coordinates}:${datetime}:${ayanamsa}:${la}`;
    const cachedDataString = await redis.get(cacheKey);
    if (!cachedDataString) {
      return res.status(404).json({ error: 'Kundali data not found in cache, please generate again' });
    }
    const kundaliData = JSON.parse(cachedDataString);
    const rawDob = kundaliData.data || {};  // Extract nested data

let formattedDob = rawDob;
if (rawDob) {
  const dateObj = new Date(rawDob);
  if (!isNaN(dateObj)) {
    formattedDob = dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',   // <-- force IST
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'       // shows "IST"
    });
  }
}


    const templateData = {
      name: kundaliInfo.name || 'Unknown',
      dob: formattedDob || '',
      nakshatra_details: kundaliInfo.nakshatra_details || null,
      mangal_dosha: kundaliInfo.mangal_dosha || null,
      yoga_details: kundaliInfo.yoga_details || [],
      kundli: kundaliInfo.kundli || [],
      dasha_balance: kundaliInfo.dasha_balance || null,
      dasha_periods: kundaliInfo.dasha_periods || [],
      kundali_chart_url: kundaliInfo.chart_url || '',
      other_sections_html: kundaliInfo.html_section || '',
    };

    const templatePath = path.join(process.cwd(), 'templates', 'kundali.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const html = ejs.render(templateHtml, templateData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=kundali.pdf`);
    wkhtmltopdf(html, {
      'enable-local-file-access': true,
      // You can add options here, such as page size or margins
      pageSize: 'A4',
      marginTop: '10mm',
      marginBottom: '10mm',
      marginLeft: '10mm',
      marginRight: '10mm',
      // For custom fonts/images, you may need special options
      // To enable local file access for images/CSS, you may add:
      // 'enable-local-file-access': true
    }).pipe(res);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Unable to generate PDF' });
  }
};
