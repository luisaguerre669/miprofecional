import { Mail, FileText, ChevronRight, Send, MessageSquare } from 'lucide-react';

const faqs = [
  { q: '¿Cómo verifican a los profesionales?', a: 'Realizamos una validación de identidad mediante Renaper y solicitamos certificados de antecedentes y matrículas vigentes.' },
  { q: '¿Tienen garantía los trabajos realizados?', a: 'Cada profesional ofrece su propia garantía, la cual queda registrada en el presupuesto aceptado a través de la plataforma.' },
  { q: '¿Cómo puedo pagar los servicios?', a: 'Podés pagar de forma segura con tarjeta de crédito, débito o transferencia a través de nuestra pasarela de pagos integrada.' },
];

const Support = () => {
  return (
    <section id="support" className="py-24 bg-black">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20">
          
          {/* FAQ Area */}
          <div>
            <p className="text-[11px] font-bold text-premium-accent uppercase tracking-[0.3em] mb-4">Centro de Ayuda</p>
            <h2 className="text-4xl font-bold mb-8">Preguntas Frecuentes</h2>
            
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="glass p-6 rounded-[24px] border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-200">{faq.q}</h4>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-premium-accent transition-all" />
                  </div>
                  <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center gap-6">
               <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <FileText className="w-4 h-4" />
                  Términos y Condiciones
               </div>
               <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <MessageSquare className="w-4 h-4" />
                  Política de Privacidad
               </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-premium p-10 rounded-[48px] border-white/5">
             <div className="mb-8">
                <div className="w-12 h-12 bg-premium-accent/10 rounded-2xl flex items-center justify-center mb-6">
                   <Mail className="w-6 h-6 text-premium-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Soporte Técnico</h3>
                <p className="text-sm text-gray-500">Completá el formulario y te responderemos por email en menos de 24hs.</p>
             </div>

             <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="Nombre" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none" />
                   <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none" />
                </div>
                <select className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-premium-accent outline-none appearance-none">
                   <option>Motivo de consulta</option>
                   <option>Problemas con mi cuenta</option>
                   <option>Fallo en el pago</option>
                   <option>Reportar profesional</option>
                   <option>Otro</option>
                </select>
                <textarea placeholder="Tu mensaje..." className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm h-32 focus:border-premium-accent outline-none" />
                
                <button className="w-full py-4 bg-premium-accent text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-premium-accent/90">
                  <Send className="w-4 h-4" />
                  Enviar Consulta
                </button>
             </form>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Support;
