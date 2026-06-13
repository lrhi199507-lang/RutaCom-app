import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

interface ToastProps {
  show: boolean;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error'; // Nuevo prop
}

const Toast = ({ show, message, onClose, type = 'success' }: ToastProps) => {
  const isError = type === 'error';
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-24 left-0 right-0 z-[9999] flex justify-center px-6 pointer-events-none"
        >
          <div className={`border shadow-2xl rounded-3xl p-5 flex items-center gap-4 w-full max-w-xs pointer-events-auto ${isError ? 'bg-slate-900 border-red-500/50' : 'bg-slate-900 border-slate-700'}`}>
            <div className={`p-2 rounded-full ${isError ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              {isError ? (
                <AlertCircle className="text-red-400" size={28} />
              ) : (
                <CheckCircle2 className="text-green-400" size={28} />
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-white text-sm font-bold leading-tight">
                {message}
              </p>
            </div>

            <button onClick={onClose} className="bg-white/10 p-1 rounded-full text-slate-300 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
