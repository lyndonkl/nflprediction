export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Bankroll</span>
          <p className="text-2xl font-bold text-slate-900">$0.00</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Deployed</span>
          <p className="text-2xl font-bold text-slate-900">$0.00 <span className="text-sm font-normal text-slate-500">(0%)</span></p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Total P&L</span>
          <p className="text-2xl font-bold text-slate-500">$0.00</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Win Rate</span>
          <p className="text-2xl font-bold text-slate-500">—</p>
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Open Positions</h3>
        </div>

        <div className="p-8 text-center">
          <p className="text-slate-500 mb-4">No open positions yet</p>
          <p className="text-sm text-slate-400">
            Use the Analyze page to find opportunities and track your positions here
          </p>
        </div>
      </div>

      {/* Add Position Button */}
      <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600">
        + Add New Position
      </button>
    </div>
  );
}
