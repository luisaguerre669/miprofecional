import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  LayoutDashboard, 
  CreditCard, 
  Search,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

const AdminPreview = () => {
  return (
    <section className="py-24 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
           <p className="text-[11px] font-bold text-premium-accent uppercase tracking-[0.3em] mb-4">Backoffice Profesional</p>
           <h2 className="text-4xl md:text-5xl font-bold mb-4">Panel de Control Privado</h2>
           <p className="text-gray-500 max-w-xl mx-auto italic">Interfaz de administración para validación de matrículas, moderación y control de suscripciones.</p>
        </div>

        <div className="glass-premium rounded-[48px] border border-white/5 overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[700px]">
           
           {/* Sidebar */}
           <div className="w-full lg:w-64 bg-black/40 border-r border-white/5 p-8 flex flex-col gap-2">
              <div className="flex items-center gap-3 p-3 bg-premium-accent/10 text-premium-accent rounded-xl mb-8">
                 <LayoutDashboard className="w-5 h-5" />
                 <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
              </div>
              {[
                { name: 'Validaciones', icon: ShieldCheck, count: '12' },
                { name: 'Usuarios', icon: Users },
                { name: 'Reportes', icon: AlertTriangle, count: '3' },
                { name: 'Suscripciones', icon: CreditCard },
                { name: 'Contenido', icon: FileText },
                { name: 'Ajustes', icon: Settings },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-gray-500 hover:text-white transition-colors cursor-pointer group">
                   <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 group-hover:text-premium-accent" />
                      <span className="text-[13px] font-medium">{item.name}</span>
                   </div>
                   {item.count && (
                      <span className="bg-premium-accent text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{item.count}</span>
                   )}
                </div>
              ))}
           </div>

           {/* Main Content */}
           <div className="flex-1 bg-black/20 p-10 overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-bold">Validación de Profesionales</h3>
                 <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="text" placeholder="Buscar profesional..." className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs" />
                 </div>
              </div>

              {/* Table Preview */}
              <div className="space-y-4">
                 {[
                   { name: 'Roberto Gómez', prof: 'Gasista Matriculado', doc: 'Matrícula M-1242', status: 'Pendiente' },
                   { name: 'Ana Silveira', prof: 'Enfermera Profesional', doc: 'Título Universitario', status: 'Revisar' },
                   { name: 'Carlos Díaz', prof: 'Electricista', doc: 'DNI Frontal/Dorso', status: 'Validado' },
                 ].map((row, idx) => (
                   <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-6 glass rounded-3xl border-white/5"
                   >
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-gray-800" />
                         <div>
                            <p className="text-sm font-bold">{row.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{row.prof}</p>
                         </div>
                      </div>
                      <div className="hidden md:block">
                         <p className="text-xs text-gray-400 font-mono">{row.doc}</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                           row.status === 'Validado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                         }`}>
                           {row.status}
                         </span>
                         <div className="flex gap-2">
                            <button className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-500 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                            <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><XCircle className="w-4 h-4" /></button>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>

              {/* Real Stats Area */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                 {[
                   { label: 'Nuevos Registros', val: '24' },
                   { label: 'Denuncias', val: '2' },
                   { label: 'Suscripciones Pro', val: '452' },
                   { label: 'Categorías', val: '24' },
                 ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                       <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">{stat.label}</p>
                       <p className="text-2xl font-black">{stat.val}</p>
                    </div>
                 ))}
              </div>
           </div>

        </div>
      </div>
    </section>
  );
};

export default AdminPreview;
