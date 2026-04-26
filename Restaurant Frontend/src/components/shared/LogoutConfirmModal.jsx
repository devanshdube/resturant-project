import { useEffect } from 'react';
import { LogOut } from 'lucide-react';

const LogoutConfirmModal = ({ onConfirm, onCancel }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm p-6 flex flex-col items-center text-center animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <LogOut size={26} className="text-red-500" />
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-1">Logout karna chahte hain?</h3>
        <p className="text-sm text-gray-500 mb-6">
          Aapka session close ho jayega. Dobara use karne ke liye login karna padega.
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-md shadow-red-200"
          >
            Haan, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
