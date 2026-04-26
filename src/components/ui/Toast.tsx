import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

const Toast = ({ show, message, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed top-10 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none"
        >
          <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center gap-3 w-full max-w-sm pointer-events-auto">
            <div className="bg-green-500/20 p-2 rounded-full">
              <CheckCircle2 className="text-green-500" size={24} />
            </div>
            
            <div className="flex-1">
              <p className="text-white text-sm font-medium leading-tight">
                {message}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
