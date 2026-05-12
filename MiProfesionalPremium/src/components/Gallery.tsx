import { motion } from 'framer-motion';
import { Camera, ZoomIn, Calendar, MapPin, Tag } from 'lucide-react';

const projects = [
  { 
    title: 'Remodelación Eléctrica Completa', 
    category: 'Instalación', 
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    tag: 'Antes/Después'
  },
  { 
    title: 'Reparación de Cañerías Termofusión', 
    category: 'Plomería', 
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=800&auto=format&fit=crop',
    tag: 'Finalizado'
  },
  { 
    title: 'Pintura Interior en Altura', 
    category: 'Pintura', 
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop',
    tag: 'Garantizado'
  },
  { 
    title: 'Instalación de Aire Acondicionado', 
    category: 'Climatización', 
    image: 'https://images.unsplash.com/photo-1631541909061-70e088195882?q=80&w=800&auto=format&fit=crop',
    tag: 'Nuevo'
  },
];

const Gallery = () => {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6">
           <div className="max-w-2xl">
              <p className="text-[11px] font-bold text-premium-accent uppercase tracking-[0.3em] mb-4">Portfolio de Trabajos</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Inspiración real <br />de <span className="premium-gradient-text">expertos reales</span></h2>
              <p className="text-gray-500 text-lg">
                Explorá los trabajos realizados por nuestra comunidad de profesionales verificados.
              </p>
           </div>
           <button className="px-8 py-4 glass rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
              <Camera className="w-5 h-5 text-premium-accent" />
              Ver Galería Completa
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              className="group relative h-[450px] rounded-[40px] overflow-hidden border border-white/5 bg-[#0c0c0e] cursor-pointer"
            >
               <img 
                 src={item.image} 
                 alt={item.title} 
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
               
               <div className="absolute top-6 right-6">
                  <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                     <Tag className="w-3 h-3 text-premium-accent" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.tag}</span>
                  </div>
               </div>

               <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                     <div className="flex items-center gap-2 text-premium-accent mb-2">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Realizado: Mayo 2026</span>
                     </div>
                     <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                     <p className="text-gray-400 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        Trabajo realizado con materiales de alta gama y terminación profesional certificada.
                     </p>
                     
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <MapPin className="w-3 h-3 text-gray-500" />
                           <span className="text-xs text-gray-500">Buenos Aires</span>
                        </div>
                        <div className="w-10 h-10 glass rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                           <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
