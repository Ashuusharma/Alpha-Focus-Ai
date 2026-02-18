export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#030917] text-white px-4 py-10">
      <main className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-gray-400 mt-2">How Alpha Focus collects, uses, stores, and deletes user data.</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold mb-3">What Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-200">
            <li>Profile information (name, optional city)</li>
            <li>Lifestyle logs (sleep, hydration, mood)</li>
            <li>Scan metadata and score history</li>
            <li>Permission preferences and consent choices</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold mb-3">Why We Collect It</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-200">
            <li>Personalize routine suggestions and alerts</li>
            <li>Generate climate and lifestyle adjusted recommendations</li>
            <li>Track progress over time and report improvements</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold mb-3">Storage & Security</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-200">
            <li>Data is stored locally and/or in secured backend systems</li>
            <li>Use HTTPS, environment-based secrets, and authenticated APIs in production</li>
            <li>Only required data is retained to deliver product features</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold mb-3">Data Deletion</h2>
          <p className="text-gray-200">Users can remove tracked data from Data Settings via the “Delete All Data” action.</p>
        </section>
      </main>
    </div>
  );
}
