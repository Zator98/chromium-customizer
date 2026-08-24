import { Toast } from '@shared/types';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          style={{
            padding: '12px 16px',
            background: toast.type === 'error' ? '#da3633' : toast.type === 'success' ? '#238636' : '#0969da',
            color: 'white',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            maxWidth: '320px',
            cursor: 'pointer',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
