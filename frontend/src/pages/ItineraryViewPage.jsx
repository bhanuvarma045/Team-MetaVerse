import { useState } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetTrip, useShareTrip, getGetTripQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, MapPin, Calendar, DollarSign, Share2, List, Grid3x3, CheckSquare, NotebookPen, Wallet, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
export default function TripDetail() {
    const { tripId } = useParams();
    const id = parseInt(tripId ?? "0");
    const [viewMode, setViewMode] = useState("list");
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: trip, isLoading } = useGetTrip(id, { query: { enabled: !!id, queryKey: getGetTripQueryKey(id) } });
    const shareTrip = useShareTrip();
    const handleShare = async () => {
        if (!trip)
            return;
        try {
            await shareTrip.mutateAsync({ tripId: id, data: { isPublic: !trip.isPublic } });
            queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(id) });
            toast({ title: trip.isPublic ? "Trip made private" : "Trip is now public!" });
        }
        catch {
            toast({ title: "Failed to update sharing", variant: "destructive" });
        }
    };
    const handleCopyLink = () => {
        if (!trip?.shareToken)
            return;
        const url = `${window.location.origin}/community/${trip.shareToken}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link copied to clipboard!" });
    };
    if (isLoading) {
        return (<AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64"/>
          <Skeleton className="h-48 w-full rounded-2xl"/>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl"/>)}
          </div>
        </div>
      </AppLayout>);
    }
    if (!trip) {
        return (<AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Trip not found</p>
          <Link href="/trips"><Button variant="outline" className="mt-4">Back to Trips</Button></Link>
        </div>
      </AppLayout>);
    }
    return (<AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/trips">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4"/></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-trip-name">{trip.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={trip.status === "upcoming" ? "default" : "secondary"}>{trip.status}</Badge>
                {trip.isPublic && <Badge variant="outline" className="text-emerald-600 border-emerald-200">Public</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/trips/${id}/build`}>
              <Button variant="outline" size="sm" className="gap-1"><Edit className="h-3 w-3"/>Edit</Button>
            </Link>
            <Link href={`/trips/${id}/budget`}>
              <Button variant="outline" size="sm" className="gap-1"><Wallet className="h-3 w-3"/>Budget</Button>
            </Link>
            <Link href={`/trips/${id}/checklist`}>
              <Button variant="outline" size="sm" className="gap-1"><CheckSquare className="h-3 w-3"/>Checklist</Button>
            </Link>
            <Link href={`/trips/${id}/notes`}>
              <Button variant="outline" size="sm" className="gap-1"><NotebookPen className="h-3 w-3"/>Notes</Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleShare}>
              <Share2 className="h-3 w-3"/>
              {trip.isPublic ? "Make Private" : "Share"}
            </Button>
            {trip.isPublic && trip.shareToken && (<Button variant="outline" size="sm" className="gap-1" onClick={handleCopyLink}>
                {copied ? <Check className="h-3 w-3 text-green-600"/> : <Copy className="h-3 w-3"/>}
                Copy Link
              </Button>)}
          </div>
        </div>

        {/* Trip Cover */}
        {trip.coverImageUrl && (<div className="h-48 rounded-2xl overflow-hidden">
            <img src={trip.coverImageUrl} alt={trip.name} className="w-full h-full object-cover"/>
          </div>)}

        {/* Trip Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {(trip.startDate || trip.endDate) && (<span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4"/>
              {trip.startDate ? format(new Date(trip.startDate), "MMM d, yyyy") : "?"}
              {trip.endDate && ` → ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
            </span>)}
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4"/>
            {trip.stops?.length ?? 0} stops
          </span>
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4"/>
            ${trip.totalCost?.toFixed(0) ?? 0} estimated
            {trip.budgetLimit && ` / $${parseFloat(String(trip.budgetLimit)).toFixed(0)} budget`}
          </span>
        </div>

        {trip.description && (<p className="text-muted-foreground">{trip.description}</p>)}

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Itinerary</h2>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"}`} data-testid="toggle-list">
              <List className="h-4 w-4"/>
            </button>
            <button onClick={() => setViewMode("calendar")} className={`p-1.5 rounded-md transition-colors ${viewMode === "calendar" ? "bg-background shadow-sm" : "hover:bg-background/50"}`} data-testid="toggle-calendar">
              <Grid3x3 className="h-4 w-4"/>
            </button>
          </div>
        </div>

        {/* Stops */}
        {trip.stops && trip.stops.length > 0 ? (<div className="space-y-4">
            {trip.stops.map((stop, idx) => (<div key={stop.id} className="relative pl-8" data-testid={`stop-${stop.id}`}>
                <div className="absolute left-0 top-4 flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold z-10">
                    {idx + 1}
                  </div>
                  {idx < (trip.stops?.length ?? 0) - 1 && (<div className="w-0.5 bg-border flex-1 mt-1" style={{ height: "100%" }}/>)}
                </div>
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base">{stop.cityName}</h3>
                        {stop.country && <p className="text-xs text-muted-foreground">{stop.country}</p>}
                        {(stop.arrivalDate || stop.departureDate) && (<p className="text-xs text-muted-foreground mt-0.5">
                            {stop.arrivalDate ? format(new Date(stop.arrivalDate), "MMM d") : "?"} – {stop.departureDate ? format(new Date(stop.departureDate), "MMM d") : "?"}
                          </p>)}
                      </div>
                      <span className="text-sm font-medium text-primary">${stop.totalCost?.toFixed(0) ?? 0}</span>
                    </div>

                    {stop.activities && stop.activities.length > 0 && (<div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Activities</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stop.activities.map((activity) => (<div key={activity.id} className={`flex items-center gap-2 p-2 rounded-lg border ${activity.isCompleted ? "bg-muted/40 border-border" : "bg-background border-border"}`} data-testid={`activity-${activity.id}`}>
                              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${activity.isCompleted ? "bg-emerald-500" : "bg-primary"}`}/>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${activity.isCompleted ? "line-through text-muted-foreground" : ""}`}>{activity.name}</p>
                                {activity.estimatedCost && (<p className="text-xs text-muted-foreground">${parseFloat(String(activity.estimatedCost)).toFixed(0)}</p>)}
                              </div>
                            </div>))}
                        </div>
                      </div>)}
                  </CardContent>
                </Card>
              </div>))}
          </div>) : (<Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
              <p className="font-medium mb-1">No stops yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add cities and activities to build your itinerary</p>
              <Link href={`/trips/${id}/build`}>
                <Button>Build Itinerary</Button>
              </Link>
            </CardContent>
          </Card>)}
      </div>
    </AppLayout>);
}
