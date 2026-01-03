'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';

interface Position {
  id: string;
  game: string;
  contract: string;
  side: 'YES' | 'NO';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bankroll, setBankroll] = useState(1000);

  // Calculate portfolio metrics
  const totalDeployed = positions.reduce((sum, p) => sum + (p.quantity * p.entryPrice), 0);
  const totalPnL = positions.reduce((sum, p) => sum + (p.quantity * (p.currentPrice - p.entryPrice)), 0);
  const winningPositions = positions.filter(p => p.currentPrice > p.entryPrice).length;
  const winRate = positions.length > 0 ? (winningPositions / positions.length) * 100 : 0;

  const handleAddPosition = (position: Omit<Position, 'id'>) => {
    setPositions([...positions, { ...position, id: `pos-${Date.now()}` }]);
    setShowAddModal(false);
  };

  const handleRemovePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Bankroll</span>
          <p className="text-2xl font-bold text-slate-900">${bankroll.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Deployed</span>
          <p className="text-2xl font-bold text-slate-900">
            ${totalDeployed.toFixed(2)}
            <span className="text-sm font-normal text-slate-500">
              ({((totalDeployed / bankroll) * 100).toFixed(0)}%)
            </span>
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Total P&L</span>
          <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <span className="text-sm text-slate-500">Win Rate</span>
          <p className="text-2xl font-bold text-slate-900">
            {positions.length > 0 ? `${winRate.toFixed(0)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Open Positions</h3>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 mb-4">No open positions yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Use the Analyze page to find opportunities and track your positions here
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Analyze
            </Link>
          </div>
        ) : (
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
                  <th className="px-4 py-3 text-right text-slate-600 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {positions.map((position) => {
                  const pnl = position.quantity * (position.currentPrice - position.entryPrice);
                  return (
                    <tr key={position.id}>
                      <td className="px-4 py-3 text-slate-900">{position.game}</td>
                      <td className="px-4 py-3 text-slate-600">{position.contract}</td>
                      <td className="px-4 py-3">
                        <span className={position.side === 'YES' ? 'text-green-600' : 'text-red-600'}>
                          {position.side}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{position.quantity}</td>
                      <td className="px-4 py-3 text-right">${position.entryPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${position.currentPrice.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemovePosition(position.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-sm">
              <span className="text-slate-600">Total Exposure: ${totalDeployed.toFixed(2)}</span>
              <span className="text-slate-900 font-medium">
                Unrealized P&L:
                <span className={totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}{totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Position Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add New Position
      </button>

      {/* Add Position Modal */}
      {showAddModal && (
        <AddPositionModal
          onAdd={handleAddPosition}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function AddPositionModal({
  onAdd,
  onClose
}: {
  onAdd: (position: Omit<Position, 'id'>) => void;
  onClose: () => void;
}) {
  const [game, setGame] = useState('');
  const [contract, setContract] = useState('');
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [quantity, setQuantity] = useState(10);
  const [entryPrice, setEntryPrice] = useState(0.50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      game,
      contract,
      side,
      quantity,
      entryPrice,
      currentPrice: entryPrice, // Start at entry price
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Add New Position</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Game</label>
            <input
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              placeholder="e.g., Georgia @ Alabama"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contract</label>
            <input
              type="text"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="e.g., Georgia ML, Over 52.5"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as 'YES' | 'NO')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Entry Price</label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              min="0.01"
              max="0.99"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
