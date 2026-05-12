import { motion } from 'framer-motion';
import { ExternalLink, ShoppingBag, Wrench, Construction } from 'lucide-react';

const sponsors = [
  { 
    name: 'Corralón Norte', 
    desc: 'Materiales para construcción con 20% OFF.', 
    icon: Construction, 
    color: 'from-orange-600/20',
    border: 'border-orange-500/20'
  },
  { 
    name: 'Herramientas Pro', 
    desc: 'Importador directo de primeras marcas.', 
    icon: ShoppingBag, 
    color: 'from-blue-600/20',
    border: 'border-blue-500/20'
  },
  { 
    name: 'Ferretería El Paso', 
    desc: 'Todo para el profesional en un solo lugar.', 
    icon: Wrench, 
    color: 'from-emerald-600/20',
    border: 'border-emerald-500/20'
  },
];

const Banners = () => {
  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
           <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.3em]">Patrocinadores Premium</p>
           <button className="text-xs font-bold text-premium-accent hover:underline flex items-center gap-2">
             Anunciate aquí <ExternalLink className="w-3 h-3" />
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sponsors.map((brand, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className={`relative h-48 rounded-[32px] bg-gradient-to-br ${brand.color} to-black border ${brand.border} p-8 flex flex-col justify-between overflow-hidden group cursor-pointer shadow-xl`}
            >
               <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10 group-hover:bg-white/10 transition-colors">
                     <brand.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">{brand.name}</h4>
                  <p className="text-xs text-gray-500 max-w-[200px]">{brand.desc}</p>
               </div>
               
               <div className="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                  Visitar Tienda <ExternalLink className="w-3 h-3" />
               </div>

               {/* Decorative Background Icon */}
               <brand.icon className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 -rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Banners;
