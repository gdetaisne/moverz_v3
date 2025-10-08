// Dismountable utilities
export function isDismountable(item: string): boolean {
  const dismountableItems = [
    'table', 'chaise', 'meuble', 'armoire', 'étagère',
    'lit', 'bureau', 'canapé', 'fauteuil'
  ];
  
  const normalizedItem = item.toLowerCase();
  return dismountableItems.some(dItem => normalizedItem.includes(dItem));
}
