import fs from 'fs';
const file = 'app/shop/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
  return (
    <div className="flex flex-col h-full bg-[#071318] w-full min-h-screen animate-in fade-in duration-700 relative">
      <CartDrawer />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-green-500/5 blur-[120px] rounded-full opacity-30" />
         <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 relative z-10 w-full">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-[#0a1a1f] to-[#0d2a33] border border-green-500/20 rounded-3xl overflow-hidden shadow-2xl p-8 lg:p-12 mb-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-500/10 blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded inline-block mb-3 border border-green-500/20">Protocol Dispensary</span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white font-playfair leading-tight mb-4">Clinical Apothecary</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Dermatologist-approved formulations targeted to your specific protocol signals.
                Every product is vetted for strict adherence to clinical standards and zero-interference.
              </p>
           </div>
           
           <div className="relative z-10 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Query protocol treatments..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 pl-12 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-green-500/50 focus:bg-black/60 shadow-inner"
                />
              </div>
           </div>
        </div>

        {/* Categories */}
        <div className="no-scrollbar mb-10 flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={\`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-semibold transition-all \${
                activeCategory === cat.id
                  ? "bg-green-500 text-black shadow-[0_0_15px_rgba(74,222,128,0.3)] hover:bg-green-400"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
              }\`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-16">
            <section>
              <div className="mb-6">
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> High Urgency</p>
                <h2 className="text-2xl font-bold text-white mb-2">Protocol Prescriptions</h2>
                <p className="text-sm text-zinc-500">Foundation components mathematically mapped to your current recovery phase.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(protocolProducts.length > 0 ? protocolProducts : filteredProducts).map((product) => (
                  <ProductCard key={product.name} product={product} />
                ))}
              </div>
            </section>

            {advancedProducts.length > 0 && (
              <section className="pt-8 border-t border-white/5">
                <div className="mb-6">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 shadow-blue">Optimization Layer</p>
                  <h2 className="text-2xl font-bold text-white mb-2">Advanced Modules</h2>
                  <p className="text-sm text-zinc-500">Optional high-impact add-ons for targeted symptom resolution and accelerated timelines.</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {advancedProducts.map((product) => (
                    <ProductCard key={\`adv-\${product.name}\`} product={product} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-black/20 border border-white/5 backdrop-blur-sm py-24 text-center">
            <div className="mb-6 rounded-2xl bg-white/5 border border-white/10 p-5 shadow-inner">
              <Sparkles className="h-10 w-10 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No formulations isolated</h3>
            <p className="max-w-md text-sm text-zinc-500">
              The query matrix returned zero compatible matches within the current clinical restrictions.
            </p>
            <button 
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              className="mt-8 px-6 py-2.5 rounded-full border border-green-500/30 text-green-400 font-semibold hover:bg-green-500/10 transition-colors text-sm flex items-center gap-2"
            >
              Reset Protocol Parameters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
`;

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('  return ('));

if (startIdx !== -1) {
  const keep = lines.slice(0, startIdx);
  fs.writeFileSync(file, keep.join('\n') + '\n' + replacement.trim() + '\n');
  console.log("Success");
} else {
  console.error("Could not find start index");
}
