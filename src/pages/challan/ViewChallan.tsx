import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import { Share2, Download, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ViewChallan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [challan, setChallan] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [party, setParty] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    fetchChallanData();
  }, [id]);

  const fetchChallanData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: challanData } = await supabase
        .from('challans')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!challanData) {
        navigate('/dashboard');
        return;
      }
      setChallan(challanData);

      const { data: itemsData } = await supabase
        .from('challan_items')
        .select('*')
        .eq('challan_id', id);
      setItems(itemsData || []);

      const { data: partyData } = await supabase
        .from('parties')
        .select('*')
        .eq('id', challanData.party_id)
        .single();
      setParty(partyData);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

    } catch (error) {
      console.error('Error fetching challan:', error);
    } finally {
      setLoading(false);
    }
  };

  const numberToWords = (amount: number) => {
    const num = Math.floor(amount);
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

    if (num.toString().length > 9) return 'Amount too large';
    const n = ('000000000' + num).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Only' : 'Only';
    
    return str || 'Zero Only';
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setGeneratingPDF(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${challan.challan_no}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    const challanTitle = challan.type === 'DC' ? 'Delivery Challan' : 
                         challan.type === 'GP' ? 'Gate Pass' :
                         challan.type === 'MRC' ? 'Material Return Challan' : 'Job Work Challan';
                         
    const message = `Hello ${party?.name},\n\nPlease find the details of your ${challanTitle} - ${challan.challan_no} below.\n\nDate: ${new Date(challan.date).toLocaleDateString()}\nTotal Amount: ₹${challan.total_amount.toFixed(2)}\n\nPlease contact us to collect the PDF copy.\n\nThanks,\n${profile?.company_name}`;
    
    const encodedMessage = encodeURIComponent(message);
    let phoneStr = party?.phone || '';
    if (phoneStr && !phoneStr.startsWith('91')) {
        phoneStr = '91' + phoneStr;
    }
    const waUrl = phoneStr ? `https://wa.me/${phoneStr}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
  };

  if (loading || !challan || !profile) {
    return (
      <Layout>
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const challanTitle = challan.type === 'DC' ? 'DELIVERY CHALLAN' : 
                       challan.type === 'GP' ? 'GATE PASS' :
                       challan.type === 'MRC' ? 'MATERIAL RETURN CHALLAN' : 'JOB WORK CHALLAN';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-12">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 sm:mb-0"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* A4 Print Preview Container */}
        <div className="overflow-x-auto pb-4">
          <div 
            ref={printRef}
            className="print-container bg-white mx-auto shadow-xl" 
            style={{ 
              width: '210mm', 
              minHeight: '297mm', 
              padding: '20mm',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
              <div className="flex space-x-4 max-w-[60%]">
                {profile.logo_url && (
                  <img src={profile.logo_url} alt="Company Logo" className="h-20 w-20 object-contain" crossOrigin="anonymous" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{profile.company_name}</h1>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {profile.address_line1}
                    {profile.address_line2 ? `, ${profile.address_line2}` : ''}
                  </p>
                  <p className="text-sm text-gray-700">{profile.city}, {profile.state} - {profile.pin_code}</p>
                  <p className="text-sm text-gray-700 mt-1">Ph: {profile.phone} {profile.email ? `| Email: ${profile.email}` : ''}</p>
                  {profile.gst_number && <p className="text-sm font-bold text-gray-900 mt-1">GSTIN: {profile.gst_number}</p>}
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <h2 className="text-xl font-bold text-gray-800 uppercase bg-gray-100 px-4 py-2 border border-gray-300 rounded-sm inline-block self-end">{challanTitle}</h2>
                <div className="mt-4 text-sm">
                  <p><span className="font-semibold text-gray-700">Challan No:</span> <span className="font-bold">{challan.challan_no}</span></p>
                  <p className="mt-1"><span className="font-semibold text-gray-700">Date:</span> {new Date(challan.date).toLocaleDateString()}</p>
                  {challan.vehicle_no && <p className="mt-1"><span className="font-semibold text-gray-700">Vehicle No:</span> {challan.vehicle_no}</p>}
                </div>
              </div>
            </div>

            {/* To Section */}
            <div className="mb-8 p-4 border border-gray-300 bg-gray-50 rounded-sm">
              <p className="text-sm font-semibold text-gray-500 mb-2 uppercase">Billed To:</p>
              <h3 className="text-lg font-bold text-gray-900">{party?.name}</h3>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{party?.address}</p>
              {party?.phone && <p className="text-sm text-gray-700 mt-1">Ph: {party.phone}</p>}
              {party?.gst_number && <p className="text-sm font-bold text-gray-900 mt-2">GSTIN: {party.gst_number}</p>}
            </div>

            {/* Items Table */}
            <div className="mb-6 border border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-800">
                    <th className="py-2 px-3 text-left border-r border-gray-800 w-12 text-center">Sr.</th>
                    <th className="py-2 px-3 text-left border-r border-gray-800">Description of Goods</th>
                    <th className="py-2 px-3 text-left border-r border-gray-800 w-24">HSN</th>
                    <th className="py-2 px-3 text-right border-r border-gray-800 w-20">Qty</th>
                    <th className="py-2 px-3 text-left border-r border-gray-800 w-16 text-center">Unit</th>
                    <th className="py-2 px-3 text-right border-r border-gray-800 w-24">Rate</th>
                    <th className="py-2 px-3 text-right w-32">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {items.map((item, index) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-2 px-3 border-r border-gray-800 text-center">{index + 1}</td>
                      <td className="py-2 px-3 border-r border-gray-800 whitespace-pre-wrap">{item.description}</td>
                      <td className="py-2 px-3 border-r border-gray-800">{item.hsn}</td>
                      <td className="py-2 px-3 text-right border-r border-gray-800">{item.qty}</td>
                      <td className="py-2 px-3 text-center border-r border-gray-800">{item.unit}</td>
                      <td className="py-2 px-3 text-right border-r border-gray-800">{item.rate.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-medium">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Fill empty rows to make it look like a standard bill (optional, keeping it simple for now) */}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800">
                    <td colSpan={6} className="py-3 px-3 text-right font-bold border-r border-gray-800 uppercase tracking-wider">Total Amount:</td>
                    <td className="py-3 px-3 text-right font-bold text-lg">₹ {challan.total_amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Amount in words */}
            <div className="mb-8">
              <p className="text-sm">
                <span className="font-semibold text-gray-700">Amount in words: </span> 
                <span className="capitalize font-medium italic text-gray-900">Rupees {numberToWords(challan.total_amount)}</span>
              </p>
            </div>

            {/* Footer / Terms & Signature */}
            <div className="grid grid-cols-2 gap-8 border-t border-gray-300 pt-6 mt-auto">
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase mb-2">Terms & Conditions:</p>
                <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {challan.terms}
                </div>
              </div>
              
              <div className="flex flex-col items-end justify-between min-h-[120px]">
                <p className="text-sm font-bold text-gray-800">For {profile.company_name}</p>
                
                <div className="border-t border-gray-800 w-48 text-center pt-2 mt-16">
                  <p className="text-xs text-gray-600 uppercase font-medium">Authorized Signatory</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center border-t border-gray-200 pt-4">
              <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Generated by Challan Karo</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
