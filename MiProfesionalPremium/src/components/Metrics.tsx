import { motion } from 'framer-motion';
import { Users, BadgeCheck, LayoutGrid, CheckCircle2, ClipboardList } from 'lucide-react';

const metrics = [
  { label: 'Usuarios Activos', val: '12,482', icon: Users },
  { label: 'Profesionales Verificados', val: '3,850', icon: BadgeCheck },
  { label: 'Categorías Disponibles', val: '24', icon: LayoutGrid },
  { label: 'Servicios Realizados', val: '45,200', icon: CheckCircle2 },
  { label: 'Reportes Mensuales', val: '124', icon: ClipboardList },
];

const Metrics = () => {
  return (
    <section className="py-20 bg-black border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {metrics.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                <stat.icon className="w-6 h-6 text-premium-accent" />
              </div>
              <h4 className="text-3xl font-black text-white mb-1 font-['Outfit']">{stat.val}</h4>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Metrics;
