import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

/**
 * Toast notification system.
 * Usage: addToast({ type: 'success'|'error'|'info', title, message })
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}

function Toast({ id, type, title, message, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), type === 'error' ? 8000 : 4000);
    return () => clearTimeout(timer);
  }, [id, type, onRemove]);

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info;

  return (
    <div className={`toast toast-${type}`} onClick={() => onRemove(id)} style={{ cursor: 'pointer' }}>
      <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        {title && <div className="font-semibold text-sm mb-0.5">{title}</div>}
        {message && <div className="text-xs leading-relaxed" style={{ opacity: 0.85 }}>{message}</div>}
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onRemove={removeToast} />
      ))}
    </div>
  );
}
