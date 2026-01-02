import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ForecastProvider } from '@/context/ForecastContext';
import { HeaderAgentStatus } from '@/components/layout/HeaderAgentStatus';

export const metadata: Metadata = {
  title: 'CFB Predictor - College Football Prediction & Analysis',
  description: 'Multi-agent AI superforecaster for college football predictions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <ForecastProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </ForecastProvider>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CF</span>
            </div>
            <span className="text-xl font-bold text-slate-900">CFB Predictor</span>
          </Link>

          <div className="hidden md:flex gap-1">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/analyze">Analyze</NavLink>
            <NavLink href="/portfolio">Portfolio</NavLink>
          </div>
        </div>

        <HeaderAgentStatus />
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
    >
      {children}
    </Link>
  );
}
