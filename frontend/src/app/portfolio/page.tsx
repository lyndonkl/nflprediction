export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Bankroll</span>
          <p className="text-2xl font-bold text-slate-900">$1,000</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Deployed</span>
          <p className="text-2xl font-bold text-slate-900">$450 <span className="text-sm font-normal text-slate-500">(45%)</span></p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Total P&L</span>
          <p className="text-2xl font-bold text-green-600">+$47.50</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Win Rate</span>
          <p className="text-2xl font-bold text-slate-900">62%</p>
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Open Positions</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Game</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Contract</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Side</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Qty</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Entry</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">Current</th>
                <th className="px-4 py-3 text-right text-slate-600 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 text-slate-900">UGA @ ALA</td>
                <td className="px-4 py-3 text-slate-600">UGA ML</td>
                <td className="px-4 py-3"><span className="text-green-600">YES</span></td>
                <td className="px-4 py-3 text-right">100</td>
                <td className="px-4 py-3 text-right">$0.62</td>
                <td className="px-4 py-3 text-right">$0.68</td>
                <td className="px-4 py-3 text-right text-green-600">+$6.00</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-900">OSU vs MICH</td>
                <td className="px-4 py-3 text-slate-600">MICH +7.5</td>
                <td className="px-4 py-3"><span className="text-green-600">YES</span></td>
                <td className="px-4 py-3 text-right">50</td>
                <td className="px-4 py-3 text-right">$0.48</td>
                <td className="px-4 py-3 text-right">$0.45</td>
                <td className="px-4 py-3 text-right text-red-600">-$1.50</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-900">LSU @ TAMU</td>
                <td className="px-4 py-3 text-slate-600">Over 52.5</td>
                <td className="px-4 py-3"><span className="text-green-600">YES</span></td>
                <td className="px-4 py-3 text-right">75</td>
                <td className="px-4 py-3 text-right">$0.55</td>
                <td className="px-4 py-3 text-right">$0.58</td>
                <td className="px-4 py-3 text-right text-green-600">+$2.25</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm">
          <span className="text-slate-600">Total Exposure: $165</span>
          <span className="text-slate-900 font-medium">Unrealized P&L: <span className="text-green-600">+$6.75</span></span>
        </div>
      </div>

      {/* Add Position Button */}
      <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-slate-400 hover:text-slate-600">
        + Add New Position
      </button>
    </div>
  );
}
