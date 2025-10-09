/**
 * 📋 Inventory table component
 */

'use client';

import { InventoryItem } from '../hooks/useInventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onUpdateItem?: (id: string, updates: Partial<InventoryItem>) => void;
  onRemoveItem?: (id: string) => void;
  readOnly?: boolean;
}

export function InventoryTable({
  items,
  onUpdateItem,
  onRemoveItem,
  readOnly = false,
}: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun objet dans l'inventaire</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nom
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Catégorie
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantité
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fragile
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Démontable
            </th>
            {!readOnly && (
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-gray-900">
                  {item.name}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-600">{item.category}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {readOnly ? (
                  <span className="text-sm text-gray-900">
                    {item.quantity || 1}
                  </span>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || 1}
                    onChange={(e) =>
                      onUpdateItem?.(item.id, {
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {readOnly ? (
                  <span>{item.fragile ? '✓' : '—'}</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={item.fragile}
                    onChange={(e) =>
                      onUpdateItem?.(item.id, { fragile: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {readOnly ? (
                  <span>{item.dismountable ? '✓' : '—'}</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={item.dismountable}
                    onChange={(e) =>
                      onUpdateItem?.(item.id, {
                        dismountable: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                )}
              </td>
              {!readOnly && (
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onRemoveItem?.(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Supprimer
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



