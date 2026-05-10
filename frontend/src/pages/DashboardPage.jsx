import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDashboardSummary, useGetPopularCities } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, MapPin, Wallet, Plane, Globe } from "lucide-react";
import { format } from "date-fns";
export default function Dashboard() {
    const { user } = useUser();
    const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
    const { data: popularCities, isLoading: citiesLoading } = useGetPopularCities();
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12)
            return "Good morning";
        if (h < 17)
            return "Good afternoon";
        return "Good evening";
    };
    return (<AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="dashboard-greeting">
              {greeting()}, {user?.firstName ?? "traveler"}
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your trips.</p>
          </div>
          <Link href="/trips/new">
            <Button className="gap-2" data-testid="button-plan-trip">
              <PlusCircle className="h-4 w-4"/>
              Plan New Trip
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Trips", value: summary?.totalTrips, icon: Plane, color: "text-primary" },
            { label: "Upcoming", value: summary?.upcomingTrips, icon: MapPin, color: "text-emerald-600" },
            { label: "Cities Visited", value: summary?.citiesVisited, icon: Globe, color: "text-amber-600" },
            { label: "Total Budget", value: summary ? `$${summary.totalBudget.toFixed(0)}` : null, icon: Wallet, color: "text-violet-600" },
        ].map((stat) => (<Card key={stat.label} className="border-border">
              <CardContent className="p-4">
                {summaryLoading ? (<Skeleton className="h-14 w-full"/>) : (<div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(" ", "-")}`}>
                        {stat.value ?? 0}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <stat.icon className="h-4 w-4"/>
                    </div>
                  </div>)}
              </CardContent>
            </Card>))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Trips */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Trips</h2>
              <Link href="/trips" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {summaryLoading ? (<div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl"/>)}
              </div>) : summary?.recentTrips && summary.recentTrips.length > 0 ? (<div className="space-y-3">
                {summary.recentTrips.map((trip) => (<Link key={trip.id} href={`/trips/${trip.id}`}>
                    <Card className="border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer" data-testid={`card-trip-${trip.id}`}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Plane className="h-5 w-5 text-primary"/>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{trip.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {trip.startDate ? format(new Date(trip.startDate), "MMM d, yyyy") : "No date set"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${trip.status === "upcoming" ? "bg-emerald-100 text-emerald-700" :
                    trip.status === "planning" ? "bg-blue-100 text-blue-700" :
                        trip.status === "past" ? "bg-gray-100 text-gray-700" :
                            "bg-amber-100 text-amber-700"}`}>
                            {trip.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>))}
              </div>) : (<Card className="border-dashed border-border">
                <CardContent className="p-8 text-center">
                  <Plane className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
                  <p className="font-medium mb-1">No trips yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Start planning your first adventure</p>
                  <Link href="/trips/new">
                    <Button size="sm">Plan a Trip</Button>
                  </Link>
                </CardContent>
              </Card>)}
          </div>

          {/* Popular Cities */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Popular Destinations</h2>
            {citiesLoading ? (<div className="space-y-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl"/>)}
              </div>) : (<div className="space-y-2">
                {popularCities?.slice(0, 6).map((city) => (<Link key={city.id} href={`/search?q=${city.name}`}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer" data-testid={`city-${city.id}`}>
                      {city.imageUrl ? (<img src={city.imageUrl} alt={city.name} className="h-10 w-14 rounded-lg object-cover"/>) : (<div className="h-10 w-14 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Globe className="h-4 w-4 text-primary"/>
                        </div>)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{city.name}</p>
                        <p className="text-xs text-muted-foreground">{city.country}</p>
                      </div>
                      {city.costIndex && (<span className="text-xs text-muted-foreground">${city.costIndex}/day</span>)}
                    </div>
                  </Link>))}
              </div>)}
          </div>
        </div>
      </div>
    </AppLayout>);
}
