export default function AnalyzePage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Analysis Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Game Selector */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Select Game</h3>
          <select className="w-full px-3 py-2 border border-slate-300 rounded-md">
            <option>Georgia vs Alabama - LIVE</option>
            <option>Ohio State vs Michigan - Sat 3:30pm</option>
            <option>Texas vs Oklahoma - Sat 7:00pm</option>
          </select>
        </div>

        {/* Edge Calculator */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-4">Edge Calculator</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Your Probability Estimate</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="65"
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-slate-900 w-16 text-right">65%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <span className="text-sm text-slate-500">Market Price</span>
                <p className="text-xl font-semibold text-slate-900">60%</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Your Edge</span>
                <p className="text-xl font-semibold text-green-600">+5%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bayesian Workbench Placeholder */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-4">Bayesian Workbench</h3>
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">Evidence chain will appear here</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              Start Analysis with Agents
            </button>
          </div>
        </div>
      </div>

      {/* Agent Panel */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Agent Pipeline</h3>

          {/* Pipeline Status */}
          <div className="space-y-3">
            {['Research', 'Analysis', 'Validation', 'Output'].map((phase, i) => (
              <div key={phase} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  i === 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  {i === 0 ? '✓' : i + 1}
                </span>
                <span className={`text-sm ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                  {phase}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Configuration */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Analysis Mode</h3>
          <div className="space-y-2">
            {['Quick', 'Balanced', 'Deep'].map((mode) => (
              <button
                key={mode}
                className={`w-full px-3 py-2 text-left text-sm rounded-md border ${
                  mode === 'Balanced'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {mode}
                {mode === 'Balanced' && <span className="float-right text-xs">Recommended</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
