/**
 * 📋 Inventory table component
 */

'use client';

import { useState } from 'react';
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
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const toggleDetails = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

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
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Détails
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
            <>
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
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => toggleDetails(item.id)}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    title="Voir les détails"
                  >
                    <span className="mr-1">ℹ️</span>
                    {expandedItemId === item.id ? 'Masquer' : 'Détails'}
                  </button>
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
              {expandedItemId === item.id && (
                <tr key={`${item.id}-details`} className="bg-blue-50">
                  <td colSpan={readOnly ? 6 : 7} className="px-6 py-4">
                    <div className="text-sm space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        📏 Détails complets - {item.name}
                      </h4>
                      
                      {item.dimensions_cm && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Dimensions :</span>
                            <div className="text-gray-600 mt-1">
                              {item.dimensions_cm.length} × {item.dimensions_cm.width} × {item.dimensions_cm.height} cm
                              {item.dimensions_cm.source && (
                                <span className="text-xs text-gray-500 ml-2">
                                  (source: {item.dimensions_cm.source})
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Volume :</span>
                            <div className="text-gray-600 mt-1">
                              {item.volume_m3 !== undefined && (
                                <div>Original : {item.volume_m3.toFixed(3)} m³</div>
                              )}
                              {item.packaged_volume_m3 !== undefined && (
                                <div>Emballé : {item.packaged_volume_m3.toFixed(3)} m³</div>
                              )}
                              {item.packaging_display && (
                                <div className="text-blue-600 font-medium">{item.packaging_display}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        {item.confidence !== undefined && (
                          <div>
                            <span className="font-medium text-gray-700">Confiance IA :</span>
                            <span className="text-gray-600 ml-2">{(item.confidence * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        
                        {item.stackable !== undefined && (
                          <div>
                            <span className="font-medium text-gray-700">Empilable :</span>
                            <span className="text-gray-600 ml-2">{item.stackable ? 'Oui ✓' : 'Non ✗'}</span>
                          </div>
                        )}
                        
                        {item.is_small_object !== undefined && (
                          <div>
                            <span className="font-medium text-gray-700">Petit objet :</span>
                            <span className="text-gray-600 ml-2">{item.is_small_object ? 'Oui' : 'Non'}</span>
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">Notes :</span>
                          <div className="text-gray-600 mt-1 italic">{item.notes}</div>
                        </div>
                      )}
                      
                      {item.packaging_calculation_details && (
                        <div className="mt-3">
                          <details className="cursor-pointer">
                            <summary className="font-medium text-gray-700 hover:text-gray-900">
                              📦 Détails du calcul d'emballage
                            </summary>
                            <pre className="mt-2 text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
                              {item.packaging_calculation_details}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}




