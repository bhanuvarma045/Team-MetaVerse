import { Link } from "wouter";
import { Map, CreditCard, Share2 } from "lucide-react";
export default function Home() {
    return (<div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <img src={import.meta.env.BASE_URL + "logo.svg"} alt="Traveloop" className="h-8 w-8"/>
            <span className="font-bold text-xl tracking-tight">Traveloop</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              Start Planning
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32 border-b border-border">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=2662&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] dark:opacity-[0.05]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Your personal <span className="text-primary">travel command center</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
                Plan every detail before you leave home. Traveloop is the precise, map-brained tool for serious travelers to build multi-city itineraries and track budgets.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-up" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                  Build Your Itinerary
                </Link>
                <Link href="/community" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                  Explore Public Trips
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">Everything you need for the perfect trip</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Map className="h-6 w-6 text-primary"/>
                </div>
                <h3 className="text-xl font-bold mb-3">Multi-city Itineraries</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Map out complex journeys with multiple stops, activities, and specific schedules. Reorder easily.
                </p>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <CreditCard className="h-6 w-6 text-primary"/>
                </div>
                <h3 className="text-xl font-bold mb-3">Budget Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Set limits and track estimated costs for accommodation, transport, activities, and meals per stop.
                </p>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Share2 className="h-6 w-6 text-primary"/>
                </div>
                <h3 className="text-xl font-bold mb-3">Share & Inspire</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Publish your meticulously planned trips to the community, or clone others' itineraries to start yours.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 text-primary mb-4 md:mb-0">
            <img src={import.meta.env.BASE_URL + "logo.svg"} alt="Traveloop" className="h-6 w-6 grayscale opacity-50"/>
            <span className="font-semibold text-lg text-muted-foreground">Traveloop</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Traveloop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>);
}
