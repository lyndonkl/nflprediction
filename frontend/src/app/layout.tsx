import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CFB Prediction App',
  description: 'College Football Prediction and Analysis Tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-slate-900">CFB Predictor</h1>
              <div className="flex gap-4">
                <a href="/" className="text-slate-600 hover:text-slate-900">Dashboard</a>
                <a href="/analyze" className="text-slate-600 hover:text-slate-900">Analyze</a>
                <a href="/portfolio" className="text-slate-600 hover:text-slate-900">Portfolio</a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Agent Status:</span>
              <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Ready
              </span>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
