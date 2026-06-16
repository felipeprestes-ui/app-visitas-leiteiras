'use client';

import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
