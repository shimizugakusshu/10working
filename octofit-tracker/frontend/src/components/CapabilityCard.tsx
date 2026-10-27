import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  emptyMessage: string;
  loadItems: () => Promise<T[]>;
  itemKey: (item: T, index: number) => string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, emptyMessage, loadItems, itemKey, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    loadItems()
      .then((result) => {
        if (active) {
          setItems(result);
          setState('success');
        }
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [loadItems]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state === 'error' && <p role="alert">Unable to load {title.toLowerCase()}. Please try again.</p>}
        {state === 'success' && items.length === 0 && <p role="status">{emptyMessage}</p>}
        {state === 'success' && items.length > 0 && (
          <ul className="list-group list-group-flush">
            {items.map((item, index) => (
              <li className="list-group-item" key={itemKey(item, index)}>{renderItem(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
