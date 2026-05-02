import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { type Pet } from '@/schemas/pet';
import { type HealthRecord } from '@/schemas/healthRecord';
import { type Medication } from '@/schemas/medication';
import { getParameterLabel } from '@/lib/i18n-helpers';

interface ReportData {
  pet: Pet;
  records: HealthRecord[];
  medications: Medication[];
  charts: Record<string, HTMLElement>; // Ref to DOM elements of charts
  t: any;
  locale: string;
}

export async function generatePetReport({ pet, records, medications, charts, t, locale }: ReportData) {
  // Create a hidden container for the report
  const reportContainer = document.createElement('div');
  reportContainer.className = `report-print-container ${locale === 'tr' ? 'lang-tr' : 'lang-en'}`;
  reportContainer.style.width = '800px';
  reportContainer.style.padding = '40px';
  reportContainer.style.background = 'white';
  reportContainer.style.color = '#1c1917';
  reportContainer.style.fontFamily = "'Inter', sans-serif";
  reportContainer.style.position = 'absolute';
  reportContainer.style.left = '-9999px';
  reportContainer.style.top = '0';

  const dateLocale = locale === 'tr' ? tr : enUS;
  const today = format(new Date(), 'dd.MM.yyyy');

  reportContainer.innerHTML = `
    <div style="border-bottom: 2px solid #829c8e; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; color: #829c8e; margin: 0;">${t('report.title')}</h1>
      <p style="margin: 5px 0 0 0; color: #78716c; font-size: 14px;">${t('report.generatedAt')}: ${today}</p>
    </div>

    <div style="margin-bottom: 40px;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 15px;">${t('report.petInfo')}</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="background: #faf9f6;">
          <th style="text-align: left; padding: 10px; border: 1px solid #e7e5e4; width: 30%;">${t('report.field')}</th>
          <th style="text-align: left; padding: 10px; border: 1px solid #e7e5e4;">${t('report.value')}</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${t('pets.name')}</td>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${pet.name}</td>
        </tr>
        <tr style="background: #faf9f6;">
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${t('pets.species')}</td>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${t(`pets.species_values.${pet.species}`)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${t('pets.breed')}</td>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${pet.breed || '---'}</td>
        </tr>
        <tr style="background: #faf9f6;">
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${t('pets.dateOfBirth')}</td>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${pet.dateOfBirth ? format(new Date(pet.dateOfBirth), 'd MMMM yyyy', { locale: dateLocale }) : '---'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${t('pets.weight')}</td>
          <td style="padding: 10px; border: 1px solid #e7e5e4;">${pet.weightKg ? `${pet.weightKg} kg` : '---'}</td>
        </tr>
      </table>
    </div>

    ${medications.filter(m => m.active).length > 0 ? `
      <div style="margin-bottom: 40px;">
        <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 15px;">${t('medications.activeTreatments')}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #829c8e; color: white;">
            <th style="text-align: left; padding: 10px;">${t('medications.name')}</th>
            <th style="text-align: left; padding: 10px;">${t('medications.dosage')}</th>
            <th style="text-align: left; padding: 10px;">${t('medications.frequency')}</th>
          </tr>
          ${medications.filter(m => m.active).map(m => `
            <tr style="border-bottom: 1px solid #e7e5e4;">
              <td style="padding: 10px;">${m.name}</td>
              <td style="padding: 10px;">${m.dosage}</td>
              <td style="padding: 10px;">${t(`medications.frequencies.${m.frequency}`)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    ` : ''}

    ${records.filter(r => r.recordType === 'vaccination').length > 0 ? `
      <div style="margin-bottom: 40px;">
        <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 15px;">${t('healthRecords.recordTypes.vaccination')}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #829c8e; color: white;">
            <th style="text-align: left; padding: 10px;">${t('healthRecords.recordDate')}</th>
            <th style="text-align: left; padding: 10px;">${t('healthRecords.description')}</th>
            <th style="text-align: left; padding: 10px;">${t('healthRecords.nextDoseDate')}</th>
          </tr>
          ${records.filter(r => r.recordType === 'vaccination').sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()).map(v => `
            <tr style="border-bottom: 1px solid #e7e5e4;">
              <td style="padding: 10px;">${format(new Date(v.recordDate), 'dd.MM.yyyy')}</td>
              <td style="padding: 10px;">${v.description}</td>
              <td style="padding: 10px;">${(v as any).nextDoseDate ? format(new Date((v as any).nextDoseDate), 'dd.MM.yyyy') : '---'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    ` : ''}

    <div style="margin-bottom: 40px;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; margin-bottom: 15px;">${t('report.medicalHistory')}</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr style="background: #f5f5f4;">
          <th style="text-align: left; padding: 8px; border: 1px solid #e7e5e4;">${t('healthRecords.recordDate')}</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #e7e5e4;">${t('healthRecords.recordType')}</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #e7e5e4;">${t('healthRecords.description')}</th>
        </tr>
        ${records.slice(0, 20).map(r => `
          <tr>
            <td style="padding: 8px; border: 1px solid #e7e5e4;">${format(new Date(r.recordDate), 'dd.MM.yyyy')}</td>
            <td style="padding: 8px; border: 1px solid #e7e5e4;">${t(`healthRecords.recordTypes.${r.recordType}`)}</td>
            <td style="padding: 8px; border: 1px solid #e7e5e4;">${r.description || '---'}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;

  document.body.appendChild(reportContainer);

  try {
    const canvas = await html2canvas(reportContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const doc = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // If there are charts, add them on new pages
    const paramKeys = Object.keys(charts);
    if (paramKeys.length > 0) {
      for (const param of paramKeys) {
        const chartEl = charts[param];
        if (!chartEl) continue;

        const chartCanvas = await html2canvas(chartEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const root = clonedDoc.documentElement;
            root.classList.remove('dark');
            root.classList.add('light');
          }
        });

        doc.addPage();
        doc.setFontSize(14);
        doc.text(getParameterLabel(param, '', t), 14, 20);
        
        const chartImgData = chartCanvas.toDataURL('image/jpeg', 0.8);
        const chartWidth = 180;
        const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
        
        doc.addImage(chartImgData, 'JPEG', 14, 30, chartWidth, chartHeight);
      }
    }

    doc.save(`${pet.name.toLowerCase()}-rapor-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  } catch (error) {
    console.error('PDF Generation failed:', error);
    throw error;
  } finally {
    document.body.removeChild(reportContainer);
  }
}
