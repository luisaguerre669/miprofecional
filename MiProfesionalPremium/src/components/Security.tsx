import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Fingerprint, UserCheck, AlertTriangle, FileSearch } from 'lucide-react';

const securityFeatures = [
  {
    title: "Identidad Validada",
    desc: "Cruzamos datos con Renaper para asegurar que cada profesional sea quien dice ser.",
    icon: UserCheck,
    tag: "Renaper API"
  },
  {
    title: "Antecedentes Penales",
    desc: "Solicitamos certificado de reincidencia actualizado cada 6 meses.",
    icon: FileSearch,
    tag: "Protocolo Policial"
  },
  {
    title: "Cifrado de Datos",
    desc: "Tu información viaja y se almacena bajo estándares bancarios AES-256.",
    icon: Lock,
    tag: "Seguridad SSL"
  },
  {
    title: "Validación Biométrica",
    desc: "Acceso seguro mediante huella o reconocimiento facial en nuestra app.",
    icon: Fingerprint,
    tag: "MFA"
  }
];

const Security = () => {
  return (
    <section id="security" className="py-24 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto glass-premium p-12 lg:p-20 rounded-[60px] border border-white/5 relative overflow-hidden">
           {/* Background Glow */}
           <div className="absolute top-0 left-0 w-full h-full bg-premium-accent/5 pointer-events-none blur-[120px]" />
           
           <div className="grid lg:grid-cols-12 gap-16 items-center relative z-10">
              <div className="lg:col-span-5">
                 <div className="w-16 h-16 bg-premium-accent/10 rounded-[24px] flex items-center justify-center mb-10 border border-premium-accent/20">
                    <ShieldCheck className="w-8 h-8 text-premium-accent" />
                 </div>
                 <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                   Seguridad <br />de <span className="premium-gradient-text">Grado Militar</span>
                 </h2>
                 <p className="text-gray-400 text-lg mb-12 leading-relaxed">
                   Hemos diseñado el ecosistema más seguro para la contratación de servicios locales, minimizando riesgos y garantizando confianza total.
                 </p>
                 
                 <div className="p-8 rounded-[32px] bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4 mb-6">
                       <AlertTriangle className="w-6 h-6 text-amber-500" />
                       <h4 className="font-bold text-white text-lg">Protección Antifraude</h4>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Monitoreamos cada transacción y conversación en tiempo real para detectar comportamientos sospechosos automáticamente.
                    </p>
                 </div>
              </div>

              <div className="lg:col-span-7">
                 <div className="grid sm:grid-cols-2 gap-6">
                    {securityFeatures.map((f, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="p-8 rounded-[32px] bg-black border border-white/5 hover:border-premium-accent/30 transition-all group"
                      >
                         <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-premium-accent/10 transition-colors">
                            <f.icon className="w-6 h-6 text-gray-400 group-hover:text-premium-accent transition-colors" />
                         </div>
                         <h3 className="text-lg font-bold mb-3 text-white">{f.title}</h3>
                         <p className="text-gray-500 text-sm leading-relaxed mb-6">{f.desc}</p>
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-premium-accent/60">{f.tag}</span>
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-16 flex justify-center gap-12 opacity-30 grayscale pointer-events-none">
           {/* Placeholder for security certifications logos */}
           <div className="text-2xl font-black italic">PCI-DSS</div>
           <div className="text-2xl font-black italic">GDPR</div>
           <div className="text-2xl font-black italic">ISO 27001</div>
        </div>
      </div>
    </section>
  );
};

export default Security;
