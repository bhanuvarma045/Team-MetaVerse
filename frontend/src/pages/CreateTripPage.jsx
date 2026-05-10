import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCreateTrip, getListTripsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plane } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
const schema = z.object({
    name: z.string().min(1, "Trip name is required"),
    description: z.string().optional(),
    coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    budgetLimit: z.string().optional(),
});
export default function CreateTrip() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const createTrip = useCreateTrip();
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: "", description: "", coverImageUrl: "", startDate: "", endDate: "", budgetLimit: "" },
    });
    const onSubmit = async (data) => {
        try {
            const trip = await createTrip.mutateAsync({
                data: {
                    name: data.name,
                    description: data.description || undefined,
                    coverImageUrl: data.coverImageUrl || undefined,
                    startDate: data.startDate || undefined,
                    endDate: data.endDate || undefined,
                    budgetLimit: data.budgetLimit ? parseFloat(data.budgetLimit) : undefined,
                },
            });
            queryClient.invalidateQueries({ queryKey: getListTripsQueryKey() });
            toast({ title: "Trip created!", description: "Now build your itinerary." });
            setLocation(`/trips/${trip.id}/build`);
        }
        catch {
            toast({ title: "Failed to create trip", variant: "destructive" });
        }
    };
    return (<AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/trips">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4"/>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create a New Trip</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Start planning your next adventure</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plane className="h-5 w-5 text-primary"/>
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem>
                    <FormLabel>Trip Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. European Summer 2025" data-testid="input-trip-name" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

                <FormField control={form.control} name="description" render={({ field }) => (<FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What's this trip about?" rows={3} data-testid="input-description" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-start-date" {...field}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>

                  <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-end-date" {...field}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>)}/>
                </div>

                <FormField control={form.control} name="budgetLimit" render={({ field }) => (<FormItem>
                    <FormLabel>Budget Limit (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="10" placeholder="e.g. 3000" data-testid="input-budget" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

                <FormField control={form.control} name="coverImageUrl" render={({ field }) => (<FormItem>
                    <FormLabel>Cover Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://images.unsplash.com/..." data-testid="input-cover-image" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

                <div className="flex gap-3 pt-2">
                  <Link href="/trips" className="flex-1">
                    <Button variant="outline" className="w-full" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" className="flex-1" disabled={createTrip.isPending} data-testid="button-create-trip">
                    {createTrip.isPending ? "Creating..." : "Create Trip"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>);
}
