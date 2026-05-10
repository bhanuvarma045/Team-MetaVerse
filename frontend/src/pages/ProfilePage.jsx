import { useUser, useAuth } from "@clerk/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useListTrips } from "@workspace/api-client-react";
import { User, Mail, Plane, LogOut, Globe, Calendar } from "lucide-react";
export default function Profile() {
    const { user, isLoaded } = useUser();
    const { signOut } = useAuth();
    const { data: trips } = useListTrips();
    const totalTrips = trips?.length ?? 0;
    const upcomingTrips = trips?.filter(t => t.startDate && t.startDate >= new Date().toISOString().split("T")[0]).length ?? 0;
    const totalSpent = trips?.reduce((sum, t) => sum + t.totalCost, 0) ?? 0;
    return (<AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Profile & Settings</h1>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {user?.imageUrl ? (<img src={user.imageUrl} alt={user.fullName ?? "User"} className="h-16 w-16 rounded-full object-cover border-2 border-border" data-testid="img-avatar"/>) : (<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary"/>
                </div>)}
              <div className="flex-1">
                <h2 className="text-xl font-semibold" data-testid="text-username">{user?.fullName ?? "Traveler"}</h2>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Mail className="h-3.5 w-3.5"/>
                  <span data-testid="text-email">{user?.primaryEmailAddress?.emailAddress}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Trips", value: totalTrips, icon: Plane },
            { label: "Upcoming", value: upcomingTrips, icon: Calendar },
            { label: "Total Spent", value: `$${totalSpent.toFixed(0)}`, icon: Globe },
        ].map((stat) => (<Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2"/>
                <p className="text-2xl font-bold" data-testid={`stat-profile-${stat.label.toLowerCase().replace(" ", "-")}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>))}
        </div>

        {/* Account Actions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Account settings and preferences are managed through your Traveloop account. Use the options below to manage your session.
            </p>
            <Button variant="destructive" onClick={() => signOut()} className="gap-2 w-full sm:w-auto" data-testid="button-sign-out">
              <LogOut className="h-4 w-4"/>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>);
}
