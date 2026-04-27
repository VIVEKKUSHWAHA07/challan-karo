import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import { Plus, Trash2 } from 'lucide-react';

export default function CreateChallan() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    challan_no: '',
    date: new Date().toISOString().split('T')[0],
    vehicle_no: '',
    party_id: '',
    terms: ''
  });
  
  const [items, setItems] = useState([
    { description: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, amount: 0 }
  ]);

  const challanTypes: Record<string, { title: string, prefix: string, defaultTerms: string }> = {
    dc: { title: 'Delivery Challan', prefix: 'DC', defaultTerms: '1. Goods once sold will not be taken back.\n2. Subject to Ahmedabad Jurisdiction.' },
    gp: { title: 'Gate Pass', prefix: 'GP', defaultTerms: '1. Please return this copy signed.' },
    mrc: { title: 'Material Return Challan', prefix: 'MRC', defaultTerms: '1. Material returning as per prior discussion.' },
    jwc: { title: 'Job Work Challan', prefix: 'JWC', defaultTerms: '1. Please complete job work within 7 days.\n2. Rejections will be debited.' },
  };

  const currentType = type ? challanTypes[type.toLowerCase()] : null;

  useEffect(() => {
    if (!currentType) {
      navigate('/dashboard');
      return;
    }
    fetchInitialData();
  }, [type]);

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch parties
      const { data: partiesData } = await supabase
        .from('parties')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
        
      if (partiesData) setParties(partiesData);

      // Fetch last challan to generate next number
      const currentYear = new Date().getFullYear();
      const { data: lastChallan } = await supabase
        .from('challans')
        .select('challan_no')
        .eq('user_id', user.id)
        .eq('type', currentType!.prefix)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNo = 1;
      if (lastChallan && lastChallan.challan_no) {
        const parts = lastChallan.challan_no.split('-');
        if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
          nextNo = parseInt(parts[2]) + 1;
        }
      }
      
      const paddedNo = nextNo.toString().padStart(3, '0');
      
      setFormData(prev => ({
        ...prev,
        challan_no: `${currentType!.prefix}-${currentYear}-${paddedNo}`,
        terms: currentType!.defaultTerms
      }));
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'qty' || field === 'rate') {
      item.amount = Number(item.qty || 0) * Number(item.rate || 0);
    }
    
    newItems[index] = item as any;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.party_id) {
      alert('Please select a party');
      return;
    }
    
    if (items.some(item => !item.description.trim())) {
      alert('Please fill in all item descriptions');
      return;
    }

    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedParty = parties.find(p => p.id === formData.party_id);

      // Insert Challan
      const { data: challan, error: challanError } = await supabase
        .from('challans')
        .insert({
          user_id: user.id,
          type: currentType!.prefix,
          challan_no: formData.challan_no,
          date: formData.date,
          party_id: formData.party_id,
          party_name: selectedParty?.name || '',
          vehicle_no: formData.vehicle_no,
          total_amount: totalAmount,
          terms: formData.terms,
          status: 'final'
        })
        .select()
        .single();

      if (challanError) throw challanError;

      // Insert Items
      const itemsToInsert = items.map(item => ({
        challan_id: challan.id,
        description: item.description,
        hsn: item.hsn,
        qty: Number(item.qty),
        unit: item.unit,
        rate: Number(item.rate),
        amount: Number(item.amount)
      }));

      const { error: itemsError } = await supabase
        .from('challan_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      navigate(`/challan/view/${challan.id}`);
      
    } catch (error: any) {
      alert(error.message || 'Error saving challan');
      setSaving(false);
    }
  };

  if (loading || !currentType) {
    return (
      <Layout>
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create {currentType.title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Metadata & Party */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Challan No.</label>
                <input
                  type="text"
                  value={formData.challan_no}
                  onChange={(e) => setFormData({...formData, challan_no: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary bg-gray-50 sm:text-sm font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Vehicle No. (Optional)</label>
                <input
                  type="text"
                  value={formData.vehicle_no}
                  onChange={(e) => setFormData({...formData, vehicle_no: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm uppercase"
                  placeholder="GJ 01 XX 1234"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Select Party *</label>
                <div className="mt-1 flex items-center space-x-3">
                  <select
                    required
                    value={formData.party_id}
                    onChange={(e) => setFormData({...formData, party_id: e.target.value})}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm"
                  >
                    <option value="">-- Select a Party --</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.gst_number ? `(${p.gst_number})` : ''}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => navigate('/parties')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Party
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Items List */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Item Details</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">HSN</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Unit</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Rate</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Amount</th>
                    <th className="px-2 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                          placeholder="Item description"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          readOnly
                          value={item.amount.toFixed(2)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="text-red-600 hover:text-red-900 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </button>
              
              <div className="text-xl font-bold text-gray-900 flex items-center">
                <span className="mr-4 text-gray-500 text-sm font-medium uppercase">Total Amount:</span>
                ₹ {totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Section 3: Terms */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Terms & Conditions</h3>
            <textarea
              rows={4}
              value={formData.terms}
              onChange={(e) => setFormData({...formData, terms: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="flex justify-end pt-5">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Generating...' : 'Generate Challan'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
