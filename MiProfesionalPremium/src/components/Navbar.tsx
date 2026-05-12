import { useState, useEffect } from 'react';
import { Menu, X, Smartphone, LogIn } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#' },
    { name: 'Categorías', href: '#categories' },
    { name: 'Emergencias 24/7', href: '#urgencies', highlight: true },
    { name: 'Profesionales', href: '#map' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
      isScrolled ? 'py-3 bg-black/80 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-transparent'
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-premium-accent to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-premium-accent/20 group-hover:scale-105 transition-transform">
              <span className="text-black font-black text-xl italic tracking-tighter">MP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-['Outfit'] leading-none">MiProfesional</span>
              <span className="text-[10px] text-premium-accent font-bold tracking-[0.2em] uppercase">Premium</span>
            </div>
          </div>
          
          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8 border-l border-white/10 pl-8">
            {navLinks.map((link, idx) => (
              <a 
                key={idx} 
                href={link.href} 
                className={`text-[13px] font-medium transition-colors hover:text-premium-accent ${
                  link.highlight ? 'text-premium-red font-bold' : 'text-gray-400'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Desktop Auth/Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button className="flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-white transition-colors px-4 py-2">
            <Smartphone className="w-4 h-4" />
            Descargar App
          </button>
          <div className="w-px h-4 bg-white/10 mx-2" />
          <button className="flex items-center gap-2 text-[13px] font-medium text-gray-400 hover:text-white transition-colors">
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>
          <button className="btn-premium px-6 py-2.5 bg-white text-black rounded-full font-bold text-[13px] hover:bg-gray-200">
            Registrarse
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="lg:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-premium-dark border-b border-white/10 p-6 space-y-6 animate-in slide-in-from-top duration-300">
           <div className="space-y-4">
             {navLinks.map((link, idx) => (
                <a key={idx} href={link.href} className="block text-lg font-medium text-gray-300">{link.name}</a>
             ))}
           </div>
           <div className="pt-6 border-t border-white/5 space-y-4">
              <button className="w-full py-4 glass rounded-2xl font-bold flex items-center justify-center gap-2">
                <Smartphone className="w-5 h-5" /> Descargar App
              </button>
              <div className="grid grid-cols-2 gap-4">
                 <button className="py-4 border border-white/10 rounded-2xl font-bold">Entrar</button>
                 <button className="py-4 bg-white text-black rounded-2xl font-bold">Registrarse</button>
              </div>
           </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
