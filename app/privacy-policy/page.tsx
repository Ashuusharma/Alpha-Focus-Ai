export default function PrivacyPolicyPage() {
  return (
    <div className="af-page-shell min-h-screen text-[#1F3D2B] px-4 py-10">
      <main className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-clinical-heading text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-[#6B665D]">How Alpha Focus collects, uses, stores, and deletes user data.</p>
        </header>

        <section className="af-surface-card p-6">
          <h2 className="text-2xl font-semibold mb-3">What Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#5F5A51]">
            <li>Profile information (name, optional city)</li>
            <li>Lifestyle logs (sleep, hydration, mood)</li>
            <li>Scan metadata and score history</li>
            <li>Permission preferences and consent choices</li>
          </ul>
        </section>

        <section className="af-surface-card p-6">
          <h2 className="text-2xl font-semibold mb-3">Why We Collect It</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#5F5A51]">
            <li>Personalize routine suggestions and alerts</li>
            <li>Generate climate and lifestyle adjusted recommendations</li>
            <li>Track progress over time and report improvements</li>
          </ul>
        </section>

        <section className="af-surface-card p-6">
          <h2 className="text-2xl font-semibold mb-3">Storage & Security</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#5F5A51]">
            <li>Data is stored locally and/or in secured backend systems</li>
            <li>Use HTTPS, environment-based secrets, and authenticated APIs in production</li>
            <li>Only required data is retained to deliver product features</li>
          </ul>
        </section>

        <section className="af-surface-card p-6">
          <h2 className="text-2xl font-semibold mb-3">Data Deletion</h2>
          <p className="text-[#5F5A51]">Users can remove tracked data from Data Settings via the “Delete All Data” action.</p>
        </section>
      </main>
    </div>
  );
}
