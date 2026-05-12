import { Globe, MessageCircle, Share2, ExternalLink, Apple, PlayCircle } from 'lucide-react';
import mobileMockup from '../assets/mobile-mockup.png';

const Footer = () => {
  return (
    <footer className="bg-black pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          
          {/* Brand Info */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 bg-premium-accent rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-xl italic">MP</span>
              </div>
              <span className="text-xl font-bold font-['Outfit']">MiProfesional</span>
            </div>
            <p className="text-gray-500 text-[13px] mb-8 max-w-xs leading-relaxed">
              Conectamos personas con profesionales confiables en todo Argentina.
            </p>
            <div className="flex gap-3">
              {[ExternalLink, Globe, MessageCircle, Share2].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-premium-accent hover:text-black transition-all group">
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-inherit" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8">Enlaces útiles</h4>
            <ul className="space-y-4">
              {['Inicio', 'Categorías', 'Profesionales', 'Urgencias 24H', 'Contacto'].map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-500 hover:text-white transition-colors text-[13px]">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8">Para profesionales</h4>
            <ul className="space-y-4">
              {['Registrarse', 'Iniciar sesión', 'Mi perfil', 'Mis servicios'].map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-500 hover:text-white transition-colors text-[13px]">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-8">Ayuda</h4>
            <ul className="space-y-4">
              {['Centro de ayuda', 'Términos y condiciones', 'Política de privacidad', 'Contacto'].map((item, i) => (
                <li key={i}>
                  <a href="#" className="text-gray-500 hover:text-white transition-colors text-[13px]">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* App Download Box */}
          <div className="md:col-span-3 flex flex-col items-start lg:items-end">
             <div className="text-left lg:text-right mb-8">
                <h4 className="text-lg font-bold mb-2">Descargá la App</h4>
                <p className="text-gray-500 text-[13px]">y llevá MiProfesional <br /> a donde vayas</p>
             </div>
             
             <div className="space-y-4 w-full max-w-[180px]">
                <button className="w-full flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                   <PlayCircle className="w-6 h-6 text-premium-accent" />
                   <div className="text-left">
                      <p className="text-[8px] uppercase tracking-widest text-gray-400">Disponible en</p>
                      <p className="text-sm font-bold">Google Play</p>
                   </div>
                </button>
                <button className="w-full flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                   <Apple className="w-6 h-6 text-white" />
                   <div className="text-left">
                      <p className="text-[8px] uppercase tracking-widest text-gray-400">Consíguelo en el</p>
                      <p className="text-sm font-bold">App Store</p>
                   </div>
                </button>
             </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:row justify-center items-center">
          <p className="text-gray-600 text-[11px] font-medium tracking-wider">
            © 2025 MiProfesional. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Background Mockup Decoration */}
      <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-20 pointer-events-none hidden lg:block">
         <img src={mobileMockup} alt="" className="w-full h-full object-contain grayscale" />
      </div>
    </footer>
  );
};

export default Footer;
