import Link from 'next/link';
import { Home, Activity, FileText, Target, Award, BookOpen, ShoppingBag, LogOut } from 'lucide-react';

export function Sidebar() {
  const links = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Analyze', href: '/assessment', icon: Activity },
    { name: 'Protocol', href: '/protocol', icon: FileText },
    { name: 'Progress', href: '/dashboard', icon: Target },
    { name: 'Challenges', href: '/challenges', icon: Award },
    { name: 'Knowledge', href: '/learning-center', icon: BookOpen },
    { name: 'Shop', href: '/shop', icon: ShoppingBag },
  ];

  return (
    <aside className="w-72 h-full bg-[#0a1a1f] border-r border-white/5 flex flex-col justify-between hidden lg:flex font-sans backdrop-blur-3xl relative overflow-hidden">
      {/* Subtle Glow Behind Brand */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      <div className="relative z-10">
        <div className="h-24 px-8 flex items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <span className="text-white font-bold text-lg leading-none">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white flex gap-1">
              Alpha<span className="text-green-500">Focus</span>
            </span>
          </div>
        </div>

        <nav className="px-4 space-y-1 relative z-10">
          <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-widest text-[#5e7a70]">Navigation</div>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.name} href={link.href}>
                <span className="flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
                  <Icon className="w-5 h-5 text-zinc-500 group-hover:text-green-400 transition-colors" />
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 relative z-10 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-teal-500 border-2 border-green-900 overflow-hidden shrink-0 shadow-lg">
            <img src="/avatars/demo-user.png" alt="User" className="w-full h-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Alex Williamson</p>
            <p className="text-xs text-green-400 truncate tracking-wide">#alpha-1974</p>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}