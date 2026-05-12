import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Phone, CheckCircle2, ArrowRight, ShieldCheck, BadgeCheck, MapPin, Zap } from 'lucide-react';

const Register = () => {
  const [type, setType] = useState<'client' | 'pro'>('client');

  return (
    <section id="register" className="py-24 relative bg-black">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto glass-premium rounded-[48px] overflow-hidden flex flex-col lg:flex-row min-h-[800px] border-white/5 shadow-[0_0_80px_-15px_rgba(59,130,246,0.1)]">
          
          {/* Left Side: Selection & Value Prop */}
          <div className="w-full lg:w-2/5 p-12 bg-gradient-to-br from-premium-accent/10 to-transparent flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
             <div>
                <h2 className="text-5xl font-black mb-6 leading-tight">Comenzá <br />tu camino.</h2>
                <p className="text-gray-400 mb-12">Unite a la red de servicios más prestigiosa de Argentina.</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => setType('client')}
                    className={`w-full flex items-center gap-4 p-6 rounded-[24px] border transition-all duration-300 ${
                      type === 'client' ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type === 'client' ? 'bg-black text-white' : 'bg-white/10'}`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Soy Cliente</p>
                      <p className={`text-[10px] uppercase font-black tracking-widest ${type === 'client' ? 'text-gray-500' : 'text-gray-500'}`}>Busco Calidad</p>
                    </div>
                    {type === 'client' && <CheckCircle2 className="ml-auto w-5 h-5 text-premium-accent" />}
                  </button>

                  <button 
                    onClick={() => setType('pro')}
                    className={`w-full flex items-center gap-4 p-6 rounded-[24px] border transition-all duration-300 ${
                      type === 'pro' ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type === 'pro' ? 'bg-black text-white' : 'bg-white/10'}`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Soy Profesional</p>
                      <p className={`text-[10px] uppercase font-black tracking-widest ${type === 'pro' ? 'text-gray-500' : 'text-gray-500'}`}>Busco Crecimiento</p>
                    </div>
                    {type === 'pro' && <CheckCircle2 className="ml-auto w-5 h-5 text-premium-accent" />}
                  </button>
                </div>
             </div>

             <div className="mt-12 space-y-4">
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                   <ShieldCheck className="w-4 h-4 text-premium-accent" />
                   Identidad Validada con Renaper
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                   <BadgeCheck className="w-4 h-4 text-premium-accent" />
                   Certificación de Antecedentes
                </div>
             </div>
          </div>

          {/* Right Side: Form */}
          <div className="w-full lg:w-3/5 p-12 bg-black/40">
            <AnimatePresence mode="wait">
              <motion.div
                key={type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="h-full flex flex-col"
              >
                <div className="mb-10">
                  <h3 className="text-3xl font-bold mb-2">
                    {type === 'client' ? 'Crear Perfil Personal' : 'Inscripción Profesional'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {type === 'client' ? 'Ingresá tus datos para contactar profesionales.' : 'Completá tu ficha técnica para ser verificado.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nombre Completo</label>
                    <input type="text" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none transition-colors" placeholder="Ej: Julián Pérez" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Corporativo</label>
                    <input type="email" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none transition-colors" placeholder="julian@ejemplo.com" />
                  </div>
                </div>

                {type === 'pro' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Oficio Principal</label>
                          <select className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none appearance-none">
                             <option className="bg-black">Electricista</option>
                             <option className="bg-black">Plomero</option>
                             <option className="bg-black">Gasista Matriculado</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nº de Matrícula (Opcional)</label>
                          <input type="text" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none" placeholder="M-123456" />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Años de Experiencia</label>
                          <input type="number" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none" placeholder="5" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Zona de Trabajo</label>
                          <div className="relative">
                             <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                             <input type="text" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:border-premium-accent outline-none" placeholder="CABA, GBA Norte..." />
                          </div>
                       </div>
                    </div>

                    <div className="p-6 rounded-[24px] bg-white/5 border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                             <Zap className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                             <p className="text-sm font-bold">Servicio de Urgencias 24/7</p>
                             <p className="text-[10px] text-gray-500 uppercase">Aparecerás en la sección de emergencias</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400">NO</span>
                          <button className="w-12 h-6 bg-white/10 rounded-full p-1 relative flex items-center">
                             <div className="w-4 h-4 bg-white rounded-full" />
                          </button>
                          <span className="text-xs font-bold text-premium-accent">SÍ</span>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Teléfono de Contacto</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                          <input type="tel" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:border-premium-accent outline-none" placeholder="+54 9 11 ..." />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Dirección (Referencia)</label>
                       <input type="text" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none" placeholder="Calle, Altura, Localidad" />
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-10">
                   <button className="w-full py-5 bg-premium-accent text-black rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-premium-accent/90 group">
                     {type === 'client' ? 'Crear mi cuenta' : 'Enviar para Validación'}
                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
