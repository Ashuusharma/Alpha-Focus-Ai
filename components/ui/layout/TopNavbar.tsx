import Link from 'next/link';
import { Bell, Flame, ShoppingBag, MapPin, User, ChevronDown } from 'lucide-react';

export function TopNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-3xl bg-[#071318]/80 border-b border-white/5 shadow-2xl">
      <div className="flex h-20 items-center justify-between px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-6 hidden md:flex text-sm font-medium tracking-wide">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
          <div className="w-px h-4 bg-white/10"></div>
          <Link href="/protocol" className="text-zinc-400 hover:text-white transition-colors">Protocol</Link>
          <div className="w-px h-4 bg-white/10"></div>
          <Link href="/analytics" className="text-zinc-400 hover:text-white transition-colors">Analytics</Link>
        </div>
        
        {/* Mobile Logo Fallback */}
        <div className="md:hidden flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
            <span className="text-white font-bold text-lg leading-none">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex gap-1">
            Alpha<span className="text-green-500">Focus</span>
          </span>
        </div>

        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-colors shadow-inner">
            <MapPin className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-zinc-300">London, UK</span>
          </div>

          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-orange-400/5 border border-orange-500/20 rounded-full px-4 py-2 shadow-orange-500/10 shadow-lg">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-sm font-bold text-orange-400 tracking-wide">3 Day Streak</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-[#071318]" />
            </button>
            <button className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all group">
              <ShoppingBag className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-[#071318] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
            </button>
            <button className="hidden sm:flex items-center gap-2 p-1.5 pl-3 pr-2 ml-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors group">
              <span className="text-sm font-semibold text-zinc-300 group-hover:text-white">Profile</span>
              <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            </button>
          </div>
          
          <button className="hidden sm:flex items-center justify-center bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:bg-green-400 transition-colors shadow-xl">
            Upgrade Data
          </button>
        </div>
      </div>
    </header>
  );
}