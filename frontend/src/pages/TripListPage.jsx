import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListTrips, useDeleteTrip, getListTripsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Plane, MapPin, DollarSign, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
export default function Trips() {
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteId, setDeleteId] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
    const { data: trips, isLoading } = useListTrips(params);
    const deleteTrip = useDeleteTrip();
    const handleDelete = async () => {
        if (!deleteId)
            return;
        try {
            await deleteTrip.mutateAsync({ tripId: deleteId });
            queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
            toast({ title: "Trip deleted" });
        }
        catch {
            toast({ title: "Failed to delete trip", variant: "destructive" });
        }
        finally {
            setDeleteId(null);
        }
    };
    const filters = [
        { label: "All", value: "all" },
        { label: "Upcoming", value: "upcoming" },
        { label: "Planning", value: "planning" },
        { label: "Past", value: "past" },
    ];
    return (<AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Trips</h1>
            <p className="text-muted-foreground mt-1">{trips?.length ?? 0} trip{trips?.length !== 1 ? "s" : ""} total</p>
          </div>
          <Link href="/trips/new">
            <Button className="gap-2" data-testid="button-new-trip">
              <PlusCircle className="h-4 w-4"/>
              New Trip
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (<button key={f.value} onClick={() => setStatusFilter(f.value)} data-testid={`filter-${f.value}`} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
              {f.label}
            </button>))}
        </div>

        {isLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl"/>)}
          </div>) : trips && trips.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {trips.map((trip) => (<Card key={trip.id} className="border-border hover:border-primary/30 hover:shadow-md transition-all group overflow-hidden" data-testid={`card-trip-${trip.id}`}>
                {trip.coverImageUrl ? (<div className="h-36 overflow-hidden">
                    <img src={trip.coverImageUrl} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  </div>) : (<div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Plane className="h-12 w-12 text-primary/30"/>
                  </div>)}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold truncate flex-1 mr-2">{trip.name}</h3>
                    <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${trip.status === "upcoming" ? "bg-emerald-100 text-emerald-700" :
                    trip.status === "planning" ? "bg-blue-100 text-blue-700" :
                        trip.status === "past" ? "bg-gray-100 text-gray-700" :
                            "bg-amber-100 text-amber-700"}`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3"/>
                      {trip.stopCount} {trip.stopCount === 1 ? "stop" : "stops"}
                    </span>
                    {trip.startDate && (<span>{format(new Date(trip.startDate), "MMM d")}{trip.endDate ? ` – ${format(new Date(trip.endDate), "MMM d, yyyy")}` : ""}</span>)}
                    {trip.totalCost > 0 && (<span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3"/>
                        {trip.totalCost.toFixed(0)}
                      </span>)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/trips/${trip.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1" data-testid={`button-view-${trip.id}`}>
                        <Eye className="h-3 w-3"/>
                        View
                      </Button>
                    </Link>
                    <Link href={`/trips/${trip.id}/build`}>
                      <Button variant="outline" size="sm" className="gap-1" data-testid={`button-edit-${trip.id}`}>
                        <Edit className="h-3 w-3"/>
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => setDeleteId(trip.id)} data-testid={`button-delete-${trip.id}`}>
                      <Trash2 className="h-3 w-3"/>
                    </Button>
                  </div>
                </CardContent>
              </Card>))}
          </div>) : (<Card className="border-dashed">
            <CardContent className="p-16 text-center">
              <Plane className="h-14 w-14 text-muted-foreground mx-auto mb-4"/>
              <h3 className="text-lg font-semibold mb-2">No trips found</h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter !== "all" ? `No ${statusFilter} trips. Try a different filter.` : "Start building your first adventure."}
              </p>
              <Link href="/trips/new">
                <Button>Plan Your First Trip</Button>
              </Link>
            </CardContent>
          </Card>)}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the trip and all its stops, activities, notes, and checklist items.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>);
}
