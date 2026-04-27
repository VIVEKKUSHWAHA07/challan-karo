import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Menu, X } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Create Challan', href: '/challan/dc', icon: FileText },
    { name: 'Party Book', href: '/parties', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar */}
      <div className={`md:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity ${isMobileMenuOpen ? 'block' : 'hidden'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-[#1E3A5F] text-white z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-blue-900 border-b border-blue-800">
          <span className="text-xl font-bold tracking-wider">CHALLAN KARO</span>
          <button className="md:hidden ml-auto" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-blue-200" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-blue-800 p-4">
          <button
            onClick={handleLogout}
            className="flex-shrink-0 w-full group block text-left"
          >
            <div className="flex items-center text-blue-100 hover:text-white">
              <LogOut className="inline-block h-5 w-5 mr-3" />
              <p className="text-sm font-medium">Logout</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="flex-shrink-0 flex items-center px-4 md:px-0">
                  {profile && (
                    <div className="flex items-center space-x-3">
                      {profile.logo_url && (
                        <img src={profile.logo_url} alt="Logo" className="h-8 w-8 rounded object-contain" />
                      )}
                      <h1 className="text-xl font-bold text-gray-900">{profile.company_name}</h1>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
