import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { Home, Activity, FileText, Target, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#071318] text-white overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-auto bg-[#050C10] relative">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Top Navigation */}
        <TopNavbar />
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative z-10 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0a1a1f]/90 backdrop-blur-2xl border-t border-white/5 z-50 px-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <Link href="/" className="flex flex-col items-center gap-1 text-green-400">
          <Home className="w-6 h-6" />
        </Link>
        <Link href="/protocol" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-green-400 transition-colors">
          <FileText className="w-6 h-6" />
        </Link>
        <div className="relative -top-6 bg-gradient-to-tr from-green-500 to-emerald-400 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 border-4 border-[#071318]">
           <Activity className="w-6 h-6 text-[#071318] fill-current" />
        </div>
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-green-400 transition-colors">
          <Target className="w-6 h-6" />
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-green-400 transition-colors">
          <ShoppingBag className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
