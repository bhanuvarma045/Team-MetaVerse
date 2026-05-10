import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListPublicTrips, useCopyPublicTrip, getListPublicTripsQueryKey, getListTripsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, DollarSign, Users, Calendar, Copy } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
export default function Community() {
    const [query, setQuery] = useState("");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [copyingId, setCopyingId] = useState(null);
    const { data: trips, isLoading } = useListPublicTrips(query ? { q: query } : undefined, { query: { queryKey: getListPublicTripsQueryKey(query ? { q: query } : undefined) } });
    const copyTrip = useCopyPublicTrip();
    const handleCopy = async (shareToken, tripId) => {
        setCopyingId(tripId);
        try {
            await copyTrip.mutateAsync({ shareToken });
            queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
            toast({ title: "Trip copied to your trips!" });
        }
        catch {
            toast({ title: "Failed to copy trip", variant: "destructive" });
        }
        finally {
            setCopyingId(null);
        }
    };
    return (<AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Community Trips</h1>
          <p className="text-muted-foreground mt-1">Explore and get inspired by other travelers' itineraries</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search public trips..." className="pl-10" data-testid="input-community-search"/>
        </div>

        {isLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-2xl"/>)}
          </div>) : trips && trips.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {trips.map((trip) => (<Card key={trip.id} className="border-border hover:border-primary/30 hover:shadow-md transition-all overflow-hidden group" data-testid={`community-trip-${trip.id}`}>
                {trip.coverImageUrl ? (<div className="h-40 overflow-hidden">
                    <img src={trip.coverImageUrl} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  </div>) : (<div className="h-40 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                    <Users className="h-12 w-12 text-primary/20"/>
                  </div>)}
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-1">{trip.name}</h3>
                  {trip.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{trip.description}</p>}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{trip.stopCount} stops</span>
                    {(trip.startDate || trip.endDate) && (<span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3"/>
                        {trip.startDate ? format(new Date(trip.startDate), "MMM yyyy") : "?"}
                      </span>)}
                    {trip.totalCost > 0 && (<span className="flex items-center gap-1"><DollarSign className="h-3 w-3"/>${trip.totalCost.toFixed(0)}</span>)}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/community/${trip.shareToken}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-community-trip-${trip.id}`}>
                        View Trip
                      </Button>
                    </Link>
                    <Button size="sm" className="gap-1" onClick={() => handleCopy(trip.shareToken, trip.id)} disabled={copyingId === trip.id} data-testid={`button-copy-trip-${trip.id}`}>
                      <Copy className="h-3 w-3"/>
                      {copyingId === trip.id ? "Copying..." : "Copy"}
                    </Button>
                  </div>
                </CardContent>
              </Card>))}
          </div>) : (<div className="text-center py-20 text-muted-foreground">
            <Users className="h-14 w-14 mx-auto mb-4 opacity-20"/>
            <h3 className="text-lg font-semibold mb-2">No public trips yet</h3>
            <p className="text-sm mb-4">Be the first to share your itinerary with the community</p>
            <Link href="/trips">
              <Button>Share a Trip</Button>
            </Link>
          </div>)}
      </div>
    </AppLayout>);
}
