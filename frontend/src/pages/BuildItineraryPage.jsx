import { useState } from "react";
import { useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetTrip, useCreateStop, useDeleteStop, useCreateActivity, useDeleteActivity, useUpdateActivity, getGetTripQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ArrowLeft, PlusCircle, Trash2, Check, MapPin, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export default function BuildItinerary() {
    const { tripId } = useParams();
    const id = parseInt(tripId ?? "0");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [addStopOpen, setAddStopOpen] = useState(false);
    const [addActivityStop, setAddActivityStop] = useState(null);
    const { data: trip, isLoading } = useGetTrip(id, { query: { enabled: !!id, queryKey: getGetTripQueryKey(id) } });
    const createStop = useCreateStop();
    const deleteStop = useDeleteStop();
    const createActivity = useCreateActivity();
    const deleteActivity = useDeleteActivity();
    const updateActivity = useUpdateActivity();
    const stopForm = useForm({ defaultValues: { cityName: "", country: "", arrivalDate: "", departureDate: "", accommodationName: "", accommodationCost: "", transportCost: "", mealsBudget: "" } });
    const activityForm = useForm({ defaultValues: { name: "", category: "", estimatedCost: "", duration: "", scheduledTime: "" } });
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(id) });
    const handleAddStop = async (data) => {
        try {
            await createStop.mutateAsync({ tripId: id, data: { ...data, accommodationCost: data.accommodationCost ? parseFloat(data.accommodationCost) : undefined, transportCost: data.transportCost ? parseFloat(data.transportCost) : undefined, mealsBudget: data.mealsBudget ? parseFloat(data.mealsBudget) : undefined, orderIndex: trip?.stops?.length ?? 0 } });
            invalidate();
            setAddStopOpen(false);
            stopForm.reset();
            toast({ title: "Stop added!" });
        }
        catch {
            toast({ title: "Failed to add stop", variant: "destructive" });
        }
    };
    const handleDeleteStop = async (stopId) => {
        try {
            await deleteStop.mutateAsync({ tripId: id, stopId });
            invalidate();
            toast({ title: "Stop removed" });
        }
        catch {
            toast({ title: "Failed to remove stop", variant: "destructive" });
        }
    };
    const handleAddActivity = async (data) => {
        if (!addActivityStop)
            return;
        try {
            await createActivity.mutateAsync({ tripId: id, stopId: addActivityStop, data: { ...data, estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : undefined, duration: data.duration ? parseFloat(data.duration) : undefined } });
            invalidate();
            setAddActivityStop(null);
            activityForm.reset();
            toast({ title: "Activity added!" });
        }
        catch {
            toast({ title: "Failed to add activity", variant: "destructive" });
        }
    };
    const handleDeleteActivity = async (stopId, activityId) => {
        try {
            await deleteActivity.mutateAsync({ tripId: id, stopId, activityId });
            invalidate();
        }
        catch {
            toast({ title: "Failed to delete activity", variant: "destructive" });
        }
    };
    const handleToggleActivity = async (stopId, activityId, isCompleted) => {
        try {
            await updateActivity.mutateAsync({ tripId: id, stopId, activityId, data: { isCompleted: !isCompleted } });
            invalidate();
        }
        catch {
            toast({ title: "Failed to update activity", variant: "destructive" });
        }
    };
    if (isLoading) {
        return <AppLayout><div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full"/>)}</div></AppLayout>;
    }
    return (<AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${id}`}>
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4"/></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Build Itinerary</h1>
              <p className="text-muted-foreground text-sm">{trip?.name}</p>
            </div>
          </div>
          <Button onClick={() => setAddStopOpen(true)} className="gap-2" data-testid="button-add-stop">
            <PlusCircle className="h-4 w-4"/>
            Add Stop
          </Button>
        </div>

        {trip?.stops && trip.stops.length > 0 ? (<div className="space-y-4">
            {trip.stops.map((stop, idx) => (<Card key={stop.id} className="border-border" data-testid={`stop-card-${stop.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      <MapPin className="h-4 w-4 text-primary"/>
                      {stop.cityName}
                      {stop.country && <span className="text-sm font-normal text-muted-foreground">— {stop.country}</span>}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setAddActivityStop(stop.id)} className="gap-1" data-testid={`button-add-activity-${stop.id}`}>
                        <Activity className="h-3 w-3"/>
                        Activity
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteStop(stop.id)} className="text-destructive hover:text-destructive" data-testid={`button-delete-stop-${stop.id}`}>
                        <Trash2 className="h-3 w-3"/>
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground pl-8">
                    {stop.arrivalDate && <span>{stop.arrivalDate}{stop.departureDate ? ` → ${stop.departureDate}` : ""}</span>}
                    {stop.accommodationName && <span>Staying: {stop.accommodationName}</span>}
                    <span className="text-primary font-medium">${stop.totalCost?.toFixed(0) ?? 0} est.</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {stop.activities && stop.activities.length > 0 ? (<div className="space-y-2">
                      {stop.activities.map((activity) => (<div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30" data-testid={`activity-item-${activity.id}`}>
                          <button onClick={() => handleToggleActivity(stop.id, activity.id, activity.isCompleted)} className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${activity.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-border"}`} data-testid={`toggle-activity-${activity.id}`}>
                            {activity.isCompleted && <Check className="h-3 w-3 text-white"/>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${activity.isCompleted ? "line-through text-muted-foreground" : ""}`}>{activity.name}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {activity.category && <span>{activity.category}</span>}
                              {activity.estimatedCost && <span>${parseFloat(String(activity.estimatedCost)).toFixed(0)}</span>}
                              {activity.duration && <span>{activity.duration}h</span>}
                              {activity.scheduledTime && <span>{activity.scheduledTime}</span>}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteActivity(stop.id, activity.id)} className="text-destructive hover:text-destructive h-6 w-6 p-0" data-testid={`button-delete-activity-${activity.id}`}>
                            <Trash2 className="h-3 w-3"/>
                          </Button>
                        </div>))}
                    </div>) : (<p className="text-xs text-muted-foreground italic pl-1">No activities yet. Add some to enrich this stop.</p>)}
                </CardContent>
              </Card>))}
          </div>) : (<Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
              <h3 className="font-semibold mb-2">No stops yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first city to start building the itinerary</p>
              <Button onClick={() => setAddStopOpen(true)}>Add First Stop</Button>
            </CardContent>
          </Card>)}
      </div>

      {/* Add Stop Dialog */}
      <Dialog open={addStopOpen} onOpenChange={setAddStopOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add a Stop</DialogTitle></DialogHeader>
          <Form {...stopForm}>
            <form onSubmit={stopForm.handleSubmit(handleAddStop)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={stopForm.control} name="cityName" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>City *</FormLabel><FormControl><Input placeholder="Paris" data-testid="input-city-name" {...field}/></FormControl></FormItem>)}/>
                <FormField control={stopForm.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="France" {...field}/></FormControl></FormItem>)}/>
                <FormField control={stopForm.control} name="accommodationName" render={({ field }) => (<FormItem><FormLabel>Hotel/Accommodation</FormLabel><FormControl><Input placeholder="Hotel name" {...field}/></FormControl></FormItem>)}/>
                <FormField control={stopForm.control} name="arrivalDate" render={({ field }) => (<FormItem><FormLabel>Arrival</FormLabel><FormControl><Input type="date" {...field}/></FormControl></FormItem>)}/>
                <FormField control={stopForm.control} name="departureDate" render={({ field }) => (<FormItem><FormLabel>Departure</FormLabel><FormControl><Input type="date" {...field}/></FormControl></FormItem>)}/>
                <FormField control={stopForm.control} name="accommodationCost" render={({ field }) => (<FormItem><FormLabel>Accommodation $</FormLabel><FormControl><Input type="number" min="0" placeholder="0" {...field}/></FormControl></FormItem>)}/>
                <FormField control={stopForm.control} name="transportCost" render={({ field }) => (<FormItem><FormLabel>Transport $</FormLabel><FormControl><Input type="number" min="0" placeholder="0" {...field}/></FormControl></FormItem>)}/>
                <FormField control={stopForm.control} name="mealsBudget" render={({ field }) => (<FormItem><FormLabel>Meals Budget $</FormLabel><FormControl><Input type="number" min="0" placeholder="0" {...field}/></FormControl></FormItem>)}/>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" type="button" onClick={() => setAddStopOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createStop.isPending} data-testid="button-confirm-add-stop">
                  {createStop.isPending ? "Adding..." : "Add Stop"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={!!addActivityStop} onOpenChange={() => setAddActivityStop(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
          <Form {...activityForm}>
            <form onSubmit={activityForm.handleSubmit(handleAddActivity)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={activityForm.control} name="name" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Activity Name *</FormLabel><FormControl><Input placeholder="Visit Eiffel Tower" data-testid="input-activity-name" {...field}/></FormControl></FormItem>)}/>
                <FormField control={activityForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="Sightseeing" {...field}/></FormControl></FormItem>)}/>
                <FormField control={activityForm.control} name="estimatedCost" render={({ field }) => (<FormItem><FormLabel>Cost $</FormLabel><FormControl><Input type="number" min="0" placeholder="0" {...field}/></FormControl></FormItem>)}/>
                <FormField control={activityForm.control} name="duration" render={({ field }) => (<FormItem><FormLabel>Duration (hrs)</FormLabel><FormControl><Input type="number" min="0" step="0.5" placeholder="2" {...field}/></FormControl></FormItem>)}/>
                <FormField control={activityForm.control} name="scheduledTime" render={({ field }) => (<FormItem><FormLabel>Time</FormLabel><FormControl><Input placeholder="10:00 AM" {...field}/></FormControl></FormItem>)}/>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" type="button" onClick={() => setAddActivityStop(null)}>Cancel</Button>
                <Button type="submit" disabled={createActivity.isPending} data-testid="button-confirm-add-activity">
                  {createActivity.isPending ? "Adding..." : "Add Activity"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>);
}
