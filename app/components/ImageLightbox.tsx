"use client";

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-[#0B1E36]/90 backdrop-blur-md z-[200] flex items-center justify-center cursor-zoom-out animate-in fade-in duration-200"
    >
      <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-10 right-2 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all border border-white/15"
          aria-label="Tutup"
        >
          ✕
        </button>
        
        {/* Full Image */}
        <img
          src={src}
          alt="Preview"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border-2 border-white/10"
        />
      </div>
    </div>
  );
}
