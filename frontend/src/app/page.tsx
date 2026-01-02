export default function Dashboard() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Live Games</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option>All Conferences</option>
            <option>SEC</option>
            <option>Big Ten</option>
            <option>Big 12</option>
            <option>ACC</option>
            <option>Pac-12</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
            Refresh
          </button>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder Game Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase">SEC</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">LIVE Q3</span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">#3 Georgia</span>
              <span className="text-xl font-bold">21</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">#1 Alabama</span>
              <span className="text-xl font-bold">17</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Moneyline</span>
              <span>UGA -150 | ALA +130</span>
            </div>
            <div className="flex justify-between">
              <span>Spread</span>
              <span>UGA -3.5</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                Edge: +8%
              </span>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Analyze →
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-8 flex items-center justify-center col-span-1 md:col-span-2">
          <div className="text-center text-slate-500">
            <p className="text-sm">No other games currently live</p>
            <p className="text-xs mt-1">Check back during game times</p>
          </div>
        </div>
      </div>
    </div>
  );
}
