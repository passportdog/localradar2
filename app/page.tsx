import Link from 'next/link';
import { Map, Camera, Layers, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-map-bg via-slate-900 to-intel-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Map className="w-8 h-8 text-intel-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-intel-400 to-intel-200 bg-clip-text text-transparent">
                LocalRadar 2
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/explore"
                className="px-4 py-2 bg-intel-600 hover:bg-intel-500 text-white rounded-lg font-medium transition-colors"
              >
                Launch Intel Map
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-intel-500/10 border border-intel-500/20 text-intel-300 text-sm mb-8">
            <Zap className="w-4 h-4" />
            <span>Now with 3D Building Visualization</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-intel-200 to-intel-400 bg-clip-text text-transparent">
              Deluxe Map Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Real-time Florida traffic camera monitoring with immersive 3D map visualization. 
            Live traffic intelligence for Miami-Dade and beyond.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-intel-600 hover:bg-intel-500 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              <Map className="w-5 h-5" />
              Explore the Map
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-lg transition-all border border-white/10"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Powerful Intelligence Features
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Camera className="w-6 h-6" />}
              title="Live Camera Network"
              description="Access hundreds of real-time traffic cameras across Florida with automatic status monitoring."
            />
            <FeatureCard
              icon={<Layers className="w-6 h-6" />}
              title="3D Building View"
              description="Immersive three-dimensional visualization with realistic building heights and shadows."
            />
            <FeatureCard
              icon={<Map className="w-6 h-6" />}
              title="Smart Clustering"
              description="Intelligent camera clustering that adapts to your zoom level for optimal performance."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Real-time Updates"
              description="Live camera feeds with automatic refresh and status indicators."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure Proxy"
              description="Secure streaming proxy protecting camera sources and ensuring reliable access."
            />
            <FeatureCard
              icon={<Layers className="w-6 h-6" />}
              title="Layer Controls"
              description="Toggle between different map layers including traffic, 3D buildings, and satellite."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <Stat value="500+" label="Live Cameras" />
            <Stat value="3D" label="Building View" />
            <Stat value="&lt;100ms" label="Response Time" />
            <Stat value="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center glass-panel p-12 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-slate-400 mb-8">
            Launch the Deluxe Map Intelligence platform and start monitoring Florida traffic in real-time.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-intel-600 hover:bg-intel-500 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105"
          >
            <Map className="w-5 h-5" />
            Launch Intel Map
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-intel-400" />
            <span className="font-semibold">LocalRadar 2</span>
          </div>
          <p className="text-slate-500 text-sm">
            Data provided by Florida Department of Transportation
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-panel p-6 rounded-xl hover:bg-map-panel/80 transition-colors group">
      <div className="w-12 h-12 rounded-lg bg-intel-500/20 flex items-center justify-center text-intel-400 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-intel-400 mb-1">{value}</div>
      <div className="text-slate-500 text-sm">{label}</div>
    </div>
  );
}
