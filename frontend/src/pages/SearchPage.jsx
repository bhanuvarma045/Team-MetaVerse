import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListCities, useSearchActivities, getListCitiesQueryKey, getSearchActivitiesQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, Globe, MapPin, Activity, DollarSign, Clock } from "lucide-react";
import { useLocation } from "wouter";
export default function Search() {
    const [location] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);
    const [cityQuery, setCityQuery] = useState(searchParams.get("q") ?? "");
    const [activityQuery, setActivityQuery] = useState("");
    const [activeTab, setActiveTab] = useState("cities");
    const { data: cities, isLoading: citiesLoading } = useListCities(cityQuery ? { q: cityQuery } : undefined, { query: { queryKey: getListCitiesQueryKey(cityQuery ? { q: cityQuery } : undefined) } });
    const { data: activities, isLoading: activitiesLoading } = useSearchActivities(activityQuery ? { q: activityQuery } : undefined, { query: { queryKey: getSearchActivitiesQueryKey(activityQuery ? { q: activityQuery } : undefined) } });
    return (<AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Search</h1>
          <p className="text-muted-foreground mt-1">Find cities and activities for your trips</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
          {["cities", "activities"].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`} data-testid={`tab-${tab}`}>
              {tab}
            </button>))}
        </div>

        {activeTab === "cities" ? (<div className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input value={cityQuery} onChange={e => setCityQuery(e.target.value)} placeholder="Search cities..." className="pl-10" data-testid="input-city-search"/>
            </div>

            {citiesLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl"/>)}
              </div>) : cities && cities.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cities.map((city) => (<div key={city.id} className="group cursor-pointer" data-testid={`city-result-${city.id}`}>
                    <Card className="border-border hover:border-primary/30 hover:shadow-sm transition-all overflow-hidden">
                      {city.imageUrl ? (<div className="h-28 overflow-hidden">
                          <img src={city.imageUrl} alt={city.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                        </div>) : (<div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Globe className="h-10 w-10 text-primary/30"/>
                        </div>)}
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-sm">{city.name}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3"/>{city.country}
                              {city.region && ` · ${city.region}`}
                            </p>
                          </div>
                          {city.costIndex && (<span className="text-xs text-muted-foreground">${city.costIndex}/day</span>)}
                        </div>
                        {city.description && (<p className="text-xs text-muted-foreground mt-1 line-clamp-2">{city.description}</p>)}
                      </CardContent>
                    </Card>
                  </div>))}
              </div>) : (<div className="text-center py-16 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-30"/>
                <p className="font-medium">No cities found</p>
                <p className="text-sm">Try a different search term</p>
              </div>)}
          </div>) : (<div className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input value={activityQuery} onChange={e => setActivityQuery(e.target.value)} placeholder="Search activities (e.g. museum, tour, beach)..." className="pl-10" data-testid="input-activity-search"/>
            </div>

            {activitiesLoading ? (<div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl"/>)}</div>) : activities && activities.length > 0 ? (<div className="space-y-2">
                {activities.map((act) => (<Card key={act.id} className="border-border hover:border-primary/30 transition-colors" data-testid={`activity-result-${act.id}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      {act.imageUrl ? (<img src={act.imageUrl} alt={act.name} className="h-16 w-20 rounded-lg object-cover flex-shrink-0"/>) : (<div className="h-16 w-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Activity className="h-6 w-6 text-primary/50"/>
                        </div>)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm">{act.name}</h3>
                          <span className="flex-shrink-0 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{act.category}</span>
                        </div>
                        {act.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{act.description}</p>}
                        <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                          {act.estimatedCost != null && (<span className="flex items-center gap-1"><DollarSign className="h-3 w-3"/>${parseFloat(String(act.estimatedCost)).toFixed(0)}</span>)}
                          {act.duration != null && (<span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{act.duration}h</span>)}
                          {act.cityName && <span>{act.cityName}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>))}
              </div>) : (<div className="text-center py-16 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30"/>
                <p className="font-medium">No activities found</p>
                <p className="text-sm">Try searching for sightseeing, food, or adventure</p>
              </div>)}
          </div>)}
      </div>
    </AppLayout>);
}
