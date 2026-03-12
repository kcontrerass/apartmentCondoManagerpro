import Image from 'next/image';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-white dark:bg-slate-950 font-sans">
            {/* Left Box - Dynamic Branding / Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                {/* Optional subtle gradient overlay */}
                <div className="absolute inset-0  via-slate-900/95 to-slate-950/90 z-10 mix-blend-multiply flex flex-col justify-between p-12">
                    <div className="z-20">
                        {/* We can use a stylized generic logo or purely topological element here if no specific logo exists */}
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white ring-1 ring-white/20 mb-6 shadow-2xl">
                            <span className="material-symbols-outlined text-[28px]">apartment</span>
                        </div>
                        <h1 className="text-white text-4xl font-extrabold tracking-tight mb-4">
                            El futuro de la gestión residencial.
                        </h1>
                        <p className="text-slate-300/90 text-lg max-w-sm leading-relaxed">
                            Control total, conectividad inteligente y una experiencia premium para administradores y residentes.
                        </p>
                    </div>
                    <div className="z-20">
                        <p className="text-white/50 text-sm font-medium">© {new Date().getFullYear()} ADESSO-365</p>
                    </div>
                </div>

                {/* Background generic architecture image */}
                <Image
                    src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt="ADESSO-365 Architecture"
                    fill
                    className="object-cover opacity-60 z-0 grayscale-[0.2]"
                    priority
                />
            </div>

            {/* Right Box - Auth Form */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-slate-50 dark:bg-background-dark relative">
                {/* Mobile top band */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-[18px]">apartment</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold tracking-wide">ADESSO-365</span>
                </div>

                <div className="w-full max-w-sm pt-12 pb-12 mt-8 lg:mt-0">
                    <div className="mb-8 hidden lg:block text-center sm:text-left">
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Bienvenido a <span className="text-primary dark:text-primary">ADESSO-365</span>
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Ingresa tus credenciales para acceder a tu panel.
                        </p>
                    </div>
                    <div className="mb-8 lg:hidden text-center">
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Bienvenido a <br />ADESSO-365
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Ingresa tus credenciales para acceder a tu panel.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-background-dark/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-2xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800 backdrop-blur-xl transition-all duration-300">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
