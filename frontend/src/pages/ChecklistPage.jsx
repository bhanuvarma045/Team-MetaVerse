import { useState } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListChecklistItems, useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem, getListChecklistItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, Check, RefreshCw, PackageCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const CATEGORIES = ["Clothing", "Documents", "Electronics", "Toiletries", "Medications", "Entertainment", "Other"];
export default function Checklist() {
    const { tripId } = useParams();
    const id = parseInt(tripId ?? "0");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [newItem, setNewItem] = useState("");
    const [newCategory, setNewCategory] = useState("Other");
    const [filterCategory, setFilterCategory] = useState("All");
    const { data: items, isLoading } = useListChecklistItems(id, { query: { enabled: !!id, queryKey: getListChecklistItemsQueryKey(id) } });
    const createItem = useCreateChecklistItem();
    const updateItem = useUpdateChecklistItem();
    const deleteItem = useDeleteChecklistItem();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListChecklistItemsQueryKey(id) });
    const handleAdd = async () => {
        if (!newItem.trim())
            return;
        try {
            await createItem.mutateAsync({ tripId: id, data: { name: newItem.trim(), category: newCategory } });
            invalidate();
            setNewItem("");
            toast({ title: "Item added" });
        }
        catch {
            toast({ title: "Failed to add item", variant: "destructive" });
        }
    };
    const handleToggle = async (itemId, isPacked) => {
        try {
            await updateItem.mutateAsync({ tripId: id, itemId, data: { isPacked: !isPacked } });
            invalidate();
        }
        catch {
            toast({ title: "Failed to update item", variant: "destructive" });
        }
    };
    const handleDelete = async (itemId) => {
        try {
            await deleteItem.mutateAsync({ tripId: id, itemId });
            invalidate();
        }
        catch {
            toast({ title: "Failed to delete item", variant: "destructive" });
        }
    };
    const handleReset = async () => {
        if (!items)
            return;
        const packed = items.filter(i => i.isPacked);
        for (const item of packed) {
            await updateItem.mutateAsync({ tripId: id, itemId: item.id, data: { isPacked: false } });
        }
        invalidate();
        toast({ title: "Checklist reset" });
    };
    const filtered = items?.filter(i => filterCategory === "All" || i.category === filterCategory) ?? [];
    const packedCount = items?.filter(i => i.isPacked).length ?? 0;
    const totalCount = items?.length ?? 0;
    const grouped = CATEGORIES.reduce((acc, cat) => {
        const catItems = filtered.filter(i => i.category === cat);
        if (catItems.length > 0)
            acc[cat] = catItems;
        return acc;
    }, {});
    const otherItems = filtered.filter(i => !CATEGORIES.includes(i.category ?? ""));
    if (otherItems.length > 0 && filterCategory === "All")
        grouped["Other"] = [...(grouped["Other"] ?? []), ...otherItems];
    return (<AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${id}`}>
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4"/></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Packing Checklist</h1>
              <p className="text-muted-foreground text-sm">{packedCount}/{totalCount} items packed</p>
            </div>
          </div>
          {packedCount > 0 && (<Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
              <RefreshCw className="h-3 w-3"/>
              Reset
            </Button>)}
        </div>

        {/* Progress */}
        {totalCount > 0 && (<div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${(packedCount / totalCount) * 100}%` }}/>
            </div>
            <p className="text-xs text-muted-foreground">{Math.round((packedCount / totalCount) * 100)}% complete</p>
          </div>)}

        {/* Add Item */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add an item..." onKeyDown={e => e.key === "Enter" && handleAdd()} data-testid="input-new-item" className="flex-1"/>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-36" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleAdd} disabled={createItem.isPending} data-testid="button-add-item">
                <Plus className="h-4 w-4"/>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["All", ...CATEGORIES].map(cat => (<button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${filterCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
              {cat}
            </button>))}
        </div>

        {isLoading ? (<div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12"/>)}</div>) : totalCount === 0 ? (<Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <PackageCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
              <p className="font-medium mb-1">Your checklist is empty</p>
              <p className="text-sm text-muted-foreground">Add items you need to pack for this trip</p>
            </CardContent>
          </Card>) : (<div className="space-y-4">
            {Object.entries(grouped).map(([cat, catItems]) => (<Card key={cat}>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-3 space-y-1">
                  {catItems.map(item => (<div key={item.id} className="flex items-center gap-3 py-2 group" data-testid={`checklist-item-${item.id}`}>
                      <button onClick={() => handleToggle(item.id, item.isPacked)} className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${item.isPacked ? "bg-primary border-primary" : "border-border hover:border-primary"}`} data-testid={`toggle-item-${item.id}`}>
                        {item.isPacked && <Check className="h-3 w-3 text-white"/>}
                      </button>
                      <span className={`flex-1 text-sm ${item.isPacked ? "line-through text-muted-foreground" : ""}`}>{item.name}</span>
                      <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" data-testid={`delete-item-${item.id}`}>
                        <Trash2 className="h-3.5 w-3.5"/>
                      </button>
                    </div>))}
                </CardContent>
              </Card>))}
          </div>)}
      </div>
    </AppLayout>);
}
