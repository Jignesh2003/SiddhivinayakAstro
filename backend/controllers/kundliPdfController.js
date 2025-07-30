import path from 'path';
import fs from 'fs';
import ejs from 'ejs';
import redis from '../utils/redisClient.js';
import puppeteer from 'puppeteer-core';

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

    // EXPLICITLY define all variables used in your EJS template
    const templateData = {
      name: kundaliData.name || 'Unknown',
      dob: kundaliData.dob || '',
      nakshatra_details: kundaliData.nakshatra_details || null,
      mangal_dosha: kundaliData.mangal_dosha || null,
      yoga_details: kundaliData.yoga_details || [],
      kundli: kundaliData.kundli || [],
      dasha_balance: kundaliData.dasha_balance || null,
      dasha_periods: kundaliData.dasha_periods || [],
      kundali_chart_url: kundaliData.chart_url || '',
      other_sections_html: kundaliData.html_section || ''
    };

    const templatePath = path.join(process.cwd(), 'templates', 'kundali.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');
    const html = ejs.render(templateHtml, templateData);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=kundali.pdf`);
    return res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Unable to generate PDF' });
  }
};
