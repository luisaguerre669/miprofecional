import { motion } from 'framer-motion';
import { Hammer, Settings, Monitor, Heart, ShieldAlert, ArrowRight } from 'lucide-react';

const categoryGroups = [
  {
    id: 'construction',
    name: 'Construcción',
    icon: Hammer,
    items: ['Electricista', 'Plomero', 'Gasista', 'Albañil', 'Pintor', 'Carpintería'],
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1200&auto=format&fit=crop',
    color: 'from-blue-600/20'
  },
  {
    id: 'services',
    name: 'Servicios',
    icon: Settings,
    items: ['Jardinería', 'Limpieza', 'Mudanzas', 'Cerrajería'],
    image: 'https://images.unsplash.com/photo-1581578731522-aa0281cc9393?q=80&w=1200&auto=format&fit=crop',
    color: 'from-emerald-600/20'
  },
  {
    id: 'technology',
    name: 'Tecnología',
    icon: Monitor,
    items: ['Técnico PC', 'Redes', 'Cámaras', 'Soporte técnico'],
    image: 'https://images.unsplash.com/photo-1597872200382-0fb339749101?q=80&w=1200&auto=format&fit=crop',
    color: 'from-purple-600/20'
  },
  {
    id: 'health',
    name: 'Salud y Bienestar',
    icon: Heart,
    items: ['Enfermeros', 'Médicos', 'Terapias', 'Psicología', 'Acompañantes'],
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop',
    color: 'from-rose-600/20'
  },
  {
    id: 'emergencies',
    name: 'Emergencias 24/7',
    icon: ShieldAlert,
    items: ['Cerrajería urgente', 'Electricista urgente', 'Ambulancias'],
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1200&auto=format&fit=crop',
    color: 'from-red-600/20'
  }
];

const Categories = () => {
  return (
    <section id="categories" className="py-24 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16">
           <p className="text-[11px] font-bold text-premium-accent uppercase tracking-[0.3em] mb-4">Nuestra Red de Profesionales</p>
           <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
             Todo lo que necesitás, <br />
             en un solo <span className="premium-gradient-text">universo premium</span>.
           </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {categoryGroups.map((group, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`group relative h-[450px] rounded-[40px] overflow-hidden border border-white/5 hover:border-white/10 transition-all cursor-pointer`}
            >
               {/* Background Image */}
               <img 
                 src={group.image} 
                 alt={group.name} 
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0"
               />
               <div className={`absolute inset-0 bg-gradient-to-t ${group.color} via-black/60 to-black/20`} />
               
               {/* Content Overlay */}
               <div className="absolute inset-0 p-10 flex flex-col justify-end">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-14 h-14 glass-premium rounded-2xl flex items-center justify-center">
                        <group.icon className="w-7 h-7 text-white" />
                     </div>
                     <h3 className="text-3xl font-black text-white">{group.name}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                     {group.items.map((item, i) => (
                        <span key={i} className="text-[11px] font-medium px-4 py-2 rounded-full glass text-gray-300">
                          {item}
                        </span>
                     ))}
                  </div>

                  <button className="flex items-center gap-2 text-sm font-bold text-white group-hover:gap-4 transition-all">
                    Ver todos los profesionales <ArrowRight className="w-5 h-5 text-premium-accent" />
                  </button>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
