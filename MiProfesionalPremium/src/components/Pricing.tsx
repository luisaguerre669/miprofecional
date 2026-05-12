import { motion } from 'framer-motion';
import { Check, Zap, LayoutGrid, TrendingUp, ShieldCheck, Star } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: 'Plan Básico',
      price: 'Gratis',
      desc: 'Ideal para comenzar y probar la plataforma.',
      features: [
        'Perfil visible en búsquedas',
        'Hasta 3 fotos de trabajos',
        'Recibir mensajes de clientes',
        'Acceso a soporte básico',
      ],
      icon: LayoutGrid,
      highlight: false
    },
    {
      name: 'Plan Premium',
      price: '$4.990',
      period: '/mes',
      desc: 'Para profesionales que buscan el máximo crecimiento.',
      features: [
        'Prioridad absoluta en búsquedas',
        'Insignia "Premium" verificada',
        'Aparición en sección Emergencias 24/7',
        'Galería de fotos ilimitada',
        'Analítica avanzada de perfil',
        'Soporte prioritario 24/7',
      ],
      icon: Zap,
      highlight: true
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
           <p className="text-[11px] font-bold text-premium-accent uppercase tracking-[0.3em] mb-4">Planes Profesionales</p>
           <h2 className="text-4xl md:text-5xl font-bold mb-6">Llevá tu oficio al <br /><span className="premium-gradient-text italic">siguiente nivel</span></h2>
           <p className="text-gray-500">Elegí el plan que mejor se adapte a tus necesidades de crecimiento.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              className={`relative p-12 rounded-[48px] border transition-all duration-500 ${
                plan.highlight 
                ? 'bg-[#0c0c0e] border-premium-accent/30 shadow-[0_0_80px_-15px_rgba(0,223,154,0.1)]' 
                : 'bg-black border-white/5 hover:border-white/20'
              }`}
            >
               {plan.highlight && (
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-premium-accent text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                   Recomendado
                 </div>
               )}

               <div className="mb-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${
                    plan.highlight ? 'bg-premium-accent/10 text-premium-accent' : 'bg-white/5 text-gray-500'
                  }`}>
                     <plan.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{plan.desc}</p>
               </div>

               <div className="mb-10 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 font-bold">{plan.period}</span>}
               </div>

               <div className="space-y-4 mb-12">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                         plan.highlight ? 'bg-premium-accent/20 text-premium-accent' : 'bg-white/10 text-gray-600'
                       }`}>
                          <Check className="w-3 h-3" />
                       </div>
                       <span className="text-sm text-gray-400 font-medium">{feature}</span>
                    </div>
                  ))}
               </div>

               <button className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-[11px] transition-all ${
                 plan.highlight 
                 ? 'bg-premium-accent text-black hover:bg-premium-accent/90 shadow-lg shadow-premium-accent/20' 
                 : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
               }`}>
                 Seleccionar Plan
               </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-12 text-gray-600">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Pago Seguro SSL</span>
           </div>
           <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Sin Comisiones por Trabajo</span>
           </div>
           <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Impulsá tus Ventas</span>
           </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
