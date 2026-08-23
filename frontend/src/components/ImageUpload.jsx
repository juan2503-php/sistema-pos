import { useRef, useState } from 'react';
import { ImagePlus, Trash2, RefreshCw, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Campo de carga de imagen con drag-and-drop (PC), botón de adjuntar/tomar foto (móvil)
 * y vista previa con opción de eliminar o cambiar.
 */
export default function ImageUpload({ value, onChange, label = 'Comprobante de Pago' }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(value ? URL.createObjectURL(value) : null);

  const validateAndSet = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      return toast.error('Formato no permitido. Solo imágenes JPG, PNG o WebP');
    }
    if (file.size > MAX_SIZE) {
      return toast.error('La imagen supera el límite de 5MB');
    }
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-400">{label}</label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-primary bg-neutral-900">
          <img src={preview} alt="Vista previa del comprobante" className="w-full max-h-48 object-contain bg-neutral-950" />
          <div className="flex gap-2 p-2 bg-neutral-800 border-t border-neutral-700">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Cambiar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
            isDragging
              ? 'border-primary bg-primary/20'
              : 'border-neutral-700 hover:border-neutral-500 bg-neutral-900'
          }`}
        >
          <ImagePlus className="w-8 h-8 text-neutral-500 hidden sm:block" />
          <Camera className="w-8 h-8 text-neutral-500 sm:hidden" />
          <p className="text-sm font-bold text-neutral-300">Adjuntar comprobante</p>
          <p className="text-xs text-neutral-500">
            <span className="hidden sm:inline">Arrastra y suelta una imagen aquí o haz clic para seleccionar</span>
            <span className="sm:hidden">Toma una foto o elige de tu galería</span>
          </p>
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">JPG, PNG o WebP · Máx. 5MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => validateAndSet(e.target.files?.[0])}
      />
    </div>
  );
}
