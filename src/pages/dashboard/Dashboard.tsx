import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { FileText, ArrowRightLeft, CornerDownLeft, Wrench, Eye, Download, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    DC: 0,
    GP: 0,
    MRC: 0,
    JWC: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real app we'd fetch this month's data, for now fetch all to populate stats
      const { data: allChallans } = await supabase
        .from('challans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allChallans) {
        setRecentChallans(allChallans.slice(0, 10));
        
        const newStats = {
          total: allChallans.length,
          DC: allChallans.filter(c => c.type === 'DC').length,
          GP: allChallans.filter(c => c.type === 'GP').length,
          MRC: allChallans.filter(c => c.type === 'MRC').length,
          JWC: allChallans.filter(c => c.type === 'JWC').length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this challan?')) return;
    
    try {
      await supabase.from('challans').delete().eq('id', id);
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting challan:', error);
    }
  };

  const challanTypes = [
    { type: 'DC', name: 'Delivery Challan', icon: FileText, color: 'bg-blue-600', hover: 'hover:bg-blue-700' },
    { type: 'GP', name: 'Gate Pass', icon: ArrowRightLeft, color: 'bg-green-600', hover: 'hover:bg-green-700' },
    { type: 'MRC', name: 'Material Return', icon: CornerDownLeft, color: 'bg-orange-600', hover: 'hover:bg-orange-700' },
    { type: 'JWC', name: 'Job Work Challan', icon: Wrench, color: 'bg-purple-600', hover: 'hover:bg-purple-700' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Quick Create Buttons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {challanTypes.map((cType) => (
            <Link
              key={cType.type}
              to={`/challan/${cType.type.toLowerCase()}`}
              className={`${cType.color} ${cType.hover} rounded-lg shadow-sm p-6 flex flex-col items-center justify-center text-white transition-colors duration-200`}
            >
              <cType.icon className="h-10 w-10 mb-3" />
              <span className="text-lg font-semibold">{cType.name}</span>
            </Link>
          ))}
        </div>

        {/* Stats Row */}
        <div className="bg-white shadow rounded-lg p-6 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center divide-x divide-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-500">Total This Month</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">DC</p>
            <p className="mt-1 text-2xl font-semibold text-blue-600">{stats.DC}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">GP</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">{stats.GP}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">MRC</p>
            <p className="mt-1 text-2xl font-semibold text-orange-600">{stats.MRC}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">JWC</p>
            <p className="mt-1 text-2xl font-semibold text-purple-600">{stats.JWC}</p>
          </div>
        </div>

        {/* Recent Challans Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Challans</h3>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentChallans.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No challans generated yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan No</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentChallans.map((challan) => (
                    <tr key={challan.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{challan.challan_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${challan.type === 'DC' ? 'bg-blue-100 text-blue-800' : 
                            challan.type === 'GP' ? 'bg-green-100 text-green-800' :
                            challan.type === 'MRC' ? 'bg-orange-100 text-orange-800' :
                            'bg-purple-100 text-purple-800'}`}>
                          {challan.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{challan.party_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(challan.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${challan.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {challan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link to={`/challan/view/${challan.id}`} className="text-blue-600 hover:text-blue-900 p-1">
                            <Eye className="h-5 w-5" />
                          </Link>
                          <button className="text-gray-600 hover:text-gray-900 p-1">
                            <Download className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(challan.id)} className="text-red-600 hover:text-red-900 p-1">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
