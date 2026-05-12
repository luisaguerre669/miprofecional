import { Star } from 'lucide-react';

const Reviews = () => {
  const reviews = [
    { name: 'Juan Pérez', date: 'Hace 2 días', text: 'Excelente servicio del electricista Carlos. Llegó puntual y resolvió todo rápido.', rating: 5, color: 'emerald' },
    { name: 'María Sosa', date: 'Hace 1 semana', text: 'Muy conforme con la plomera Ana. Muy profesional y prolija.', rating: 5, color: 'purple' },
    { name: 'Ricardo G.', date: 'Hace 3 días', text: 'El servicio de mudanzas fue impecable. Muy recomendados.', rating: 4, color: 'blue' },
  ];

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Left: Testimonials List */}
          <div className="lg:col-span-8">
             <div className="mb-8">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Lo que dicen nuestros clientes</p>
             </div>
             
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                     <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-premium-accent fill-premium-accent' : 'text-gray-700'}`} />
                        ))}
                     </div>
                     <p className="text-xs text-gray-400 mb-6 leading-relaxed italic">"{rev.text}"</p>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5" />
                        <div>
                           <p className="text-[11px] font-bold">{rev.name}</p>
                           <p className="text-[9px] text-gray-500 uppercase">{rev.date}</p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Right: Leave Review Form */}
          <div className="lg:col-span-4">
             <div className="bg-[#0c0c0e] border border-white/5 rounded-[32px] p-8">
                <h3 className="text-xl font-bold mb-6">Dejá tu reseña</h3>
                <div className="space-y-4">
                   <div className="flex gap-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gray-800 cursor-pointer hover:text-premium-accent transition-colors" />
                      ))}
                   </div>
                   <textarea 
                     placeholder="Contanos tu experiencia..." 
                     className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs h-32 focus:border-premium-accent outline-none"
                   ></textarea>
                   <select className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs focus:border-premium-accent outline-none appearance-none">
                      <option>Seleccioná una categoría</option>
                      <option>Electricista</option>
                      <option>Plomero</option>
                   </select>
                   <button className="w-full py-4 bg-premium-accent text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-premium-accent/90 transition-all">
                     Enviar reseña
                   </button>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Reviews;
