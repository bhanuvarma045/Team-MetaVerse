import { useState } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListNotes, useCreateNote, useUpdateNote, useDeleteNote, getListNotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Edit2, NotebookPen } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
export default function Notes() {
    const { tripId } = useParams();
    const id = parseInt(tripId ?? "0");
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const { data: notes, isLoading } = useListNotes(id, { query: { enabled: !!id, queryKey: getListNotesQueryKey(id) } });
    const createNote = useCreateNote();
    const updateNote = useUpdateNote();
    const deleteNote = useDeleteNote();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListNotesQueryKey(id) });
    const openNew = () => { setEditingNote(null); setTitle(""); setContent(""); setDialogOpen(true); };
    const openEdit = (note) => { setEditingNote(note); setTitle(note.title ?? ""); setContent(note.content); setDialogOpen(true); };
    const handleSave = async () => {
        if (!content.trim())
            return;
        try {
            if (editingNote) {
                await updateNote.mutateAsync({ tripId: id, noteId: editingNote.id, data: { title: title || undefined, content } });
                toast({ title: "Note updated" });
            }
            else {
                await createNote.mutateAsync({ tripId: id, data: { title: title || undefined, content } });
                toast({ title: "Note saved" });
            }
            invalidate();
            setDialogOpen(false);
        }
        catch {
            toast({ title: "Failed to save note", variant: "destructive" });
        }
    };
    const handleDelete = async (noteId) => {
        try {
            await deleteNote.mutateAsync({ tripId: id, noteId });
            invalidate();
            toast({ title: "Note deleted" });
        }
        catch {
            toast({ title: "Failed to delete note", variant: "destructive" });
        }
    };
    return (<AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/trips/${id}`}>
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4"/></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Trip Notes</h1>
              <p className="text-muted-foreground text-sm">{notes?.length ?? 0} note{notes?.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2" data-testid="button-new-note">
            <Plus className="h-4 w-4"/>
            New Note
          </Button>
        </div>

        {isLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full"/>)}</div>) : notes && notes.length > 0 ? (<div className="space-y-3">
            {notes.map((note) => (<Card key={note.id} className="border-border hover:border-primary/30 transition-colors group" data-testid={`note-card-${note.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {note.title && <h3 className="font-semibold mb-1 truncate">{note.title}</h3>}
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(note)} data-testid={`edit-note-${note.id}`}>
                        <Edit2 className="h-3.5 w-3.5"/>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(note.id)} className="text-destructive hover:text-destructive" data-testid={`delete-note-${note.id}`}>
                        <Trash2 className="h-3.5 w-3.5"/>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>))}
          </div>) : (<Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <NotebookPen className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
              <p className="font-medium mb-1">No notes yet</p>
              <p className="text-sm text-muted-foreground mb-4">Jot down hotel check-in times, local contacts, or day-specific reminders</p>
              <Button onClick={openNew}>Write First Note</Button>
            </CardContent>
          </Card>)}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" data-testid="input-note-title"/>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your note here..." rows={8} data-testid="input-note-content"/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!content.trim() || createNote.isPending || updateNote.isPending} data-testid="button-save-note">
              {(createNote.isPending || updateNote.isPending) ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>);
}
