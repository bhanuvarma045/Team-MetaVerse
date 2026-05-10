import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetTripBudget, useGetTrip, useUpdateTripBudget, getGetTripBudgetQueryKey, getGetTripQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertTriangle, DollarSign, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
const COLORS = ["hsl(220,80%,40%)", "hsl(180,60%,40%)", "hsl(40,80%,50%)", "hsl(280,60%,40%)"];
export default function Budget() {
    const { tripId } = useParams();
    const id = parseInt(tripId ?? "0");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [newBudget, setNewBudget] = useState("");
    const [editing, setEditing] = useState(false);
    const { data: budget, isLoading } = useGetTripBudget(id, { query: { enabled: !!id, queryKey: getGetTripBudgetQueryKey(id) } });
    const { data: trip } = useGetTrip(id, { query: { enabled: !!id, queryKey: getGetTripQueryKey(id) } });
    const updateBudget = useUpdateTripBudget();
    const handleUpdateBudget = async () => {
        if (!newBudget)
            return;
        try {
            await updateBudget.mutateAsync({ tripId: id, data: { budgetLimit: parseFloat(newBudget) } });
            queryClient.invalidateQueries({ queryKey: getGetTripBudgetQueryKey(id) });
            queryClient.invalidateQueries({ queryKey: getGetTripQueryKey(id) });
            setEditing(false);
            setNewBudget("");
            toast({ title: "Budget updated!" });
        }
        catch {
            toast({ title: "Failed to update budget", variant: "destructive" });
        }
    };
    if (isLoading) {
        return <AppLayout><div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full"/>)}</div></AppLayout>;
    }
    const pieData = budget ? [
        { name: "Accommodation", value: budget.byCategory.accommodation },
        { name: "Transport", value: budget.byCategory.transport },
        { name: "Activities", value: budget.byCategory.activities },
        { name: "Meals", value: budget.byCategory.meals },
    ].filter(d => d.value > 0) : [];
    const barData = budget?.byStop.map(s => ({
        name: s.cityName,
        Accommodation: s.accommodation,
        Transport: s.transport,
        Activities: s.activities,
        Meals: s.meals,
    })) ?? [];
    return (<AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${id}`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4"/></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Budget & Cost Breakdown</h1>
            <p className="text-muted-foreground text-sm">{trip?.name}</p>
          </div>
        </div>

        {budget?.isOverBudget && (<div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive" data-testid="alert-over-budget">
            <AlertTriangle className="h-5 w-5 flex-shrink-0"/>
            <div>
              <p className="font-semibold">Over Budget!</p>
              <p className="text-sm opacity-90">Estimated cost exceeds your budget by ${(budget.totalEstimated - (budget.budgetLimit ?? 0)).toFixed(0)}</p>
            </div>
          </div>)}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Estimated", value: `$${budget?.totalEstimated.toFixed(0) ?? 0}`, icon: DollarSign },
            { label: "Budget Limit", value: budget?.budgetLimit ? `$${budget.budgetLimit.toFixed(0)}` : "Not set", icon: TrendingDown },
            { label: "Avg Per Day", value: `$${budget?.avgPerDay.toFixed(0) ?? 0}`, icon: DollarSign },
            { label: "Days", value: budget?.daysCount ?? 0, icon: DollarSign },
        ].map((stat) => (<Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold" data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>{stat.value}</p>
              </CardContent>
            </Card>))}
        </div>

        {/* Budget Edit */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">Set Budget Limit</p>
              {!editing ? (<Button size="sm" variant="outline" onClick={() => { setEditing(true); setNewBudget(String(budget?.budgetLimit ?? "")); }}>Edit</Button>) : (<div className="flex gap-2">
                  <Input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} className="w-32" placeholder="Amount" data-testid="input-budget-limit"/>
                  <Button size="sm" onClick={handleUpdateBudget} disabled={updateBudget.isPending}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>)}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          {pieData.length > 0 && (<Card>
              <CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v).toFixed(0)}`}/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>)}

          {/* Bar Chart */}
          {barData.length > 0 && (<Card>
              <CardHeader><CardTitle className="text-base">By Stop</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }}/>
                    <YAxis tick={{ fontSize: 11 }}/>
                    <Tooltip formatter={(v) => `$${Number(v).toFixed(0)}`}/>
                    <Legend iconSize={10}/>
                    {["Accommodation", "Transport", "Activities", "Meals"].map((key, i) => (<Bar key={key} dataKey={key} stackId="a" fill={COLORS[i]}/>))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>)}
        </div>

        {/* Per-Stop Table */}
        {budget && budget.byStop.length > 0 && (<Card>
            <CardHeader><CardTitle className="text-base">Stop-by-Stop Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["City", "Accommodation", "Transport", "Activities", "Meals", "Total"].map(h => (<th key={h} className="py-2 px-3 text-left text-xs text-muted-foreground font-medium">{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {budget.byStop.map((s) => (<tr key={s.stopId} className="border-b border-border/50 hover:bg-muted/30" data-testid={`budget-row-${s.stopId}`}>
                        <td className="py-2 px-3 font-medium">{s.cityName}</td>
                        <td className="py-2 px-3">${s.accommodation.toFixed(0)}</td>
                        <td className="py-2 px-3">${s.transport.toFixed(0)}</td>
                        <td className="py-2 px-3">${s.activities.toFixed(0)}</td>
                        <td className="py-2 px-3">${s.meals.toFixed(0)}</td>
                        <td className="py-2 px-3 font-semibold text-primary">${s.total.toFixed(0)}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </AppLayout>);
}
