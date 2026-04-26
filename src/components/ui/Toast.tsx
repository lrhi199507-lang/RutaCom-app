import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

// Definimos qué espera recibir el componente
interface ToastProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

const Toast = ({ show, message, onClose }: ToastProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }} // Bajamos un poco más el inicio
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          // CAMBIAMOS Z-INDEX A 9999 Y ASEGURAMOS QUE SEA FIXED
          className="fixed top-5 left-0 right-0 z-[9999] flex justify-center px-4"
        >
          {/* Añadimos un shadow-2xl más profundo y un borde definido */}
          <div className="bg-slate-900 border-2 border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[25px] p-5 flex items-center gap-4 w-full max-w-sm pointer-events-auto">
            <div className="bg-green-500/20 p-2 rounded-full">
              <CheckCircle2 className="text-green-400" size={28} />
            </div>
            
            <div className="flex-1">
              <p className="text-white text-sm font-bold leading-tight">
                {message}
              </p>
            </div>

            <button 
              onClick={onClose}
              className="bg-white/10 p-1 rounded-full text-slate-300 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
