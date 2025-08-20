import { Outlet, Link } from "react-router-dom";
import bicepsIcon from "@/assets/biceps-icon.png";

export function Layout() {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center gap-3 p-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <img src={bicepsIcon} alt="Evolution Tracker" className="w-8 h-8 filter brightness-0 invert" />
          </div>
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <div>
              <h1 className="text-lg font-oswald font-bold text-foreground">
                EVOLUTION
              </h1>
              <p className="text-sm text-muted-foreground font-rajdhani">
                TRACKER
              </p>
            </div>
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}