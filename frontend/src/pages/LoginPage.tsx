export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col antialiased font-display">
      <header className="fixed top-0 left-0 w-full h-14 flex items-center px-8 glass-nav z-50">
        <div className="flex items-center space-x-6 text-sm font-medium w-full">
          <span className="text-slate-900 font-bold tracking-tight">PERFILES EN DESARROLLO</span>
          <div className="h-4 w-px bg-slate-300"></div>
          <nav className="flex items-center space-x-6 text-slate-500">
            <a className="hover:text-primary transition-colors" href="#">Super-Admin</a>
            <div className="h-3 w-px bg-slate-200"></div>
            <a className="hover:text-primary transition-colors" href="#">Derm</a>
            <div className="h-3 w-px bg-slate-200"></div>
            <a className="hover:text-primary transition-colors" href="#">Vet</a>
            <div className="h-3 w-px bg-slate-200"></div>
            <a className="hover:text-primary transition-colors" href="#">Craft</a>
            <div className="h-3 w-px bg-slate-200"></div>
            <a className="hover:text-primary transition-colors" href="#">Events</a>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex min-h-screen">
        <section className="hidden lg:flex flex-1 navy-master-bg items-center justify-center p-16 relative">
          <div className="hexagonal-grid-3d"></div>
          <div className="crystalline-glow"></div>
          <div className="relative z-10 max-w-xl">
            <h1 className="text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] mb-8">
              Un Sistema.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">Múltiples Mundos.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-lg">
              La plataforma definitiva para gestionar negocios especializados con precisión milimétrica y seguridad de grado militar.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="badge-glass flex items-center px-6 py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide cursor-default">
                <span className="material-symbols-outlined text-brand-blue mr-3 scale-110">verified_user</span>
                AES-256 CLOUD
              </div>
              <div className="badge-glass flex items-center px-6 py-3.5 rounded-2xl text-white text-sm font-bold tracking-wide cursor-default">
                <span className="material-symbols-outlined text-brand-purple mr-3 scale-110">groups</span>
                MULTI-TENANT
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-[460px]">
            <div className="bg-white rounded-[2.5rem]">
              <div className="flex items-center mb-12">
                <div className="bg-primary p-3.5 rounded-2xl shadow-lg shadow-primary/20 mr-5">
                  <span className="material-symbols-outlined text-white text-3xl">shield</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">ALEG SOLUCIONES</h2>
                  <span className="text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase mt-2.5 block">Platform Core Engine</span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Email o Usuario</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                    <input className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-slate-900 placeholder-slate-400" placeholder="nombre@empresa.com" type="text" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wider">Contraseña</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input className="w-full pl-12 pr-4 py-4 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-slate-900 placeholder-slate-400" placeholder="••••••••" type="password" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm py-1">
                  <label className="flex items-center cursor-pointer group">
                    <input className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" type="checkbox" />
                    <span className="ml-2 text-slate-600 font-medium group-hover:text-slate-900 transition-colors">Recordarme</span>
                  </label>
                  <a className="text-primary font-bold hover:text-blue-700 transition-colors" href="#">¿Olvidaste tu clave?</a>
                </div>

                <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl btn-glow text-lg tracking-wide mt-2 h-16" type="submit">
                  Iniciar Sesión
                </button>
              </form>

              <div className="mt-10 text-center">
                <p className="text-slate-500 text-sm">
                  ¿No tienes una cuenta? <a className="text-primary font-bold hover:underline" href="#">Solicitar Acceso</a>
                </p>
              </div>

              <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col items-center">
                <div className="flex items-center gap-2 opacity-30 grayscale mb-2">
                  <span className="text-[10px] font-black text-slate-900 tracking-[0.4em] uppercase">ALEG SOLUCIONES | 2026</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">v4.0.2 Deployment</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
