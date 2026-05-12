import { motion } from 'framer-motion';
import { Lock, Zap, Flame, Ambulance, HeartPulse, ShieldAlert, PhoneCall, Clock } from 'lucide-react';

const urgencyItems = [
  { name: 'Cerrajería Urgente', icon: Lock, desc: 'Aperturas de hogares y autos las 24hs.' },
  { name: 'Electricista de Guardia', icon: Zap, desc: 'Cortes de luz, cortocircuitos y urgencias.' },
  { name: 'Gasista Matriculado', icon: Flame, desc: 'Fugas de gas y reparaciones críticas.' },
  { name: 'Ambulancia Privada', icon: Ambulance, desc: 'Traslados programados y emergencias.' },
  { name: 'Emergencias Médicas', icon: HeartPulse, desc: 'Atención domiciliaria inmediata.' },
  { name: 'Cerrajería Automotor', icon: ShieldAlert, desc: 'Llaves codificadas y bloqueos.' },
];

const Urgencias = () => {
  return (
    <section className="py-20 relative bg-black overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-end justify-between mb-12 gap-6">
           <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Disponibilidad Inmediata 24/7</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                ¿Tenés una <span className="text-red-600 italic">emergencia</span>?
              </h2>
              <p className="text-gray-400 text-lg">
                Atención profesional garantizada en menos de 60 minutos. Equipos de guardia listos para actuar.
              </p>
           </div>
           
           <div className="flex items-center gap-4 p-4 glass rounded-3xl border-red-500/10">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                 <PhoneCall className="w-6 h-6 text-white" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-gray-500 uppercase">Línea Directa</p>
                 <p className="text-xl font-black text-white">0800-999-PROS</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {urgencyItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group relative bg-[#0c0c0e] border border-white/5 rounded-[32px] p-8 transition-all hover:border-red-500/30 overflow-hidden"
            >
               {/* Accent Gradient */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
               
               <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/10 group-hover:bg-red-600 group-hover:border-transparent transition-all">
                     <item.icon className="w-7 h-7 text-red-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold text-gray-500">
                     <Clock className="w-3 h-3" />
                     {idx % 2 === 0 ? '15-30 MIN' : '30-45 MIN'}
                  </div>
               </div>

               <h3 className="text-xl font-bold mb-3 text-white">{item.name}</h3>
               <p className="text-gray-500 text-sm leading-relaxed mb-8">{item.desc}</p>
               
               <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:border-transparent transition-all group-hover:text-white">
                 Solicitar Ahora
               </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs font-bold text-gray-400">Técnicos Certificados</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs font-bold text-gray-400">Garantía Escrita</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs font-bold text-gray-400">Pagos con Tarjeta</span>
           </div>
        </div>
      </div>
    </section>
  );
};

export default Urgencias;
