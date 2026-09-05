import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  BarChart3,
  TrendingUp,
  Camera,
  Truck,
  ShoppingBag,
  PackageCheck,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  User,
  PlusCircle,
  LayoutDashboard,
  Download,
  Bell,
  Check,
  ExternalLink
} from 'lucide-react';
import { AppNotification } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.warn('Notifications fetch error:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('krishimitra_token') || localStorage.getItem('agriconnect_token') || ''}`,
        },
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // If user is not logged in or on login/register page, DO NOT render top bar
  if (!user || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  // Define role-specific isolated navigation links in English
  const getNavLinks = () => {
    if (user.role === 'farmer') {
      return [
        {
          to: '/farmer/place-harvest',
          label: 'Sell Harvest',
          icon: PlusCircle,
          tag: '1-Click',
          highlight: true,
        },
        {
          to: '/farmer/dashboard',
          label: 'Farmer Hub',
          icon: LayoutDashboard,
        },
        {
          to: '/route-optimizer',
          label: 'AI Route Logistics',
          icon: Truck,
          tag: 'VRP',
        },
        {
          to: '/mandi-rates',
          label: 'Mandi Rates',
          icon: BarChart3,
        },
        {
          to: '/price-predictor',
          label: 'Price Forecast',
          icon: TrendingUp,
        },
        {
          to: '/quality-predictor',
          label: 'AI Quality Grader',
          icon: Camera,
        },
        {
          to: '/orders',
          label: 'Orders & Payouts',
          icon: PackageCheck,
        },
      ];
    }

    if (user.role === 'buyer') {
      return [
        {
          to: '/buyer/browse',
          label: 'Wholesale Mart',
          icon: ShoppingBag,
          highlight: true,
        },
        {
          to: '/mandi-rates',
          label: 'Mandi Rates',
          icon: BarChart3,
        },
        {
          to: '/route-optimizer',
          label: 'Logistics & Route',
          icon: Truck,
        },
        {
          to: '/price-predictor',
          label: 'Price Trends',
          icon: TrendingUp,
        },
        {
          to: '/orders',
          label: 'My Orders & Escrow',
          icon: PackageCheck,
        },
      ];
    }

    // Default to Buyer links
    return [
      {
        to: '/buyer/browse',
        label: 'Wholesale Mart',
        icon: ShoppingBag,
        highlight: true,
      },
      {
        to: '/mandi-rates',
        label: 'Mandi Rates',
        icon: BarChart3,
      },
      {
        to: '/route-optimizer',
        label: 'Logistics & Route',
        icon: Truck,
      },
      {
        to: '/price-predictor',
        label: 'Price Trends',
        icon: TrendingUp,
      },
      {
        to: '/orders',
        label: 'My Orders & Escrow',
        icon: PackageCheck,
      },
    ];
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isFarmer = user.role === 'farmer';
  const isBuyer = user.role === 'buyer';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Role Identifier */}
          <Link
            to={isFarmer ? '/farmer/place-harvest' : '/buyer/browse'}
            className="flex items-center gap-3 group shrink-0"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs transition-transform group-hover:scale-105 ${
                isFarmer ? 'bg-emerald-600' : 'bg-slate-900'
              }`}
            >
              {isFarmer ? '🌱' : '🛒'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                  Krishi<span className={isFarmer ? 'text-emerald-600' : 'text-slate-900'}>Mitra</span>
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    isFarmer
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  {isFarmer ? 'Farmer Portal' : 'Buyer Portal'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 hidden sm:block">
                {isFarmer
                  ? 'Direct Farm Produce Placement & Payouts'
                  : 'Wholesale Produce Sourcing & Delivery'}
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links - Strictly Role-Isolated */}
          <nav className="hidden lg:flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-2xs gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? isFarmer
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.tag && !isActive && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded-md">
                      {link.tag}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Info & Logout / Switch Role Button */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                type="button"
                id="nav-notification-bell"
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-emerald-700 font-bold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifs(false);
                            if (n.orderId) navigate('/orders');
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                            !n.read ? 'bg-amber-50/70 border border-amber-200/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-extrabold text-xs text-slate-900">{n.title}</p>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl py-1 px-3 text-left">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-sm">
                {isFarmer ? '👨‍🌾' : '🏢'}
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-slate-900 leading-tight truncate max-w-[130px]">
                  {user.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                  {user.district || 'Bhopal'}
                </p>
              </div>
            </div>

            {/* Download Project ZIP Button */}
            <a
              href="/api/download-zip"
              download="krishimitra-app.zip"
              id="download-project-zip-btn"
              title="Download full project source code as ZIP"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden md:inline">Download ZIP</span>
            </a>

            {/* Logout & Change Role Button */}
            <button
              type="button"
              id="nav-logout-btn"
              onClick={handleLogout}
              title="Logout / Change Role"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-xl bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer (Strictly Role-Isolated) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{isFarmer ? '👨‍🌾' : isBuyer ? '🏢' : '⚖️'}</span>
              <div>
                <p className="font-extrabold text-xs text-slate-900">{user.name}</p>
                <p className="text-[10px] text-slate-500">{user.phone} • {user.district}</p>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isFarmer ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'}`}>
              {isFarmer ? 'Farmer' : isBuyer ? 'Buyer' : 'Admin'}
            </span>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold ${
                  isActive
                    ? isFarmer
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-900 border border-slate-300'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.tag && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {link.tag}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <a
              href="/api/download-zip"
              download="krishimitra-app.zip"
              className="w-full py-2.5 px-3 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-black text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>📥 Download Project ZIP Source</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full py-2.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 font-black text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout / Switch Role</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
