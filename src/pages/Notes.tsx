import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { notesService } from '@/services/notesService';
import type { Note } from '@/types';

const Notes: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // User not authenticated, send to login
  if (!user && !loading) {
    return <Navigate to="/" replace />;
  }

  // Checks for exsisting notes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = notesService.subscribeToUserNotes(user.uid, (userNotes) => {
      setNotes(userNotes);
    });

    return () => unsubscribe();
  }, [user]);

  // Note search
  const getFilteredNotes = () => {
    if (!searchTerm) return notes;
    
    return notes.filter((note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleCreateNote = async () => {
    if (!user || !newNote.title.trim()) return;

    setIsCreating(true);
    
    try {
      // Note creation in Firestore
      await notesService.createNote(user.uid, {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
      });
      
      toast.success('Note created successfully!');
      
      setNewNote({ title: '', content: '' });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Failed to create note. Please try again.');
    }
    
    setIsCreating(false);
  };

  const handleEditNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;

    setIsEditing(true);
    
    try {
      // Update note in Firestore
      await notesService.updateNote(editingNote.id, {
        title: editingNote.title.trim(),
        content: editingNote.content.trim(),
      });
      
      toast.success('Note updated successfully!');
      
      setEditingNote(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to update note. Please try again.');
    }
    
    setIsEditing(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      setIsDeleting(true);
      await notesService.deleteNote(noteId);
      
      toast.success('Note deleted successfully!', {
        description: 'The note has been permanently removed.',
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      
      toast.error('Failed to delete note', {
        description: 'Please try again. Make sure you have a stable internet connection.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (note: Note) => {
    setEditingNote({ ...note });
    setIsEditDialogOpen(true);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Notes</h1>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem disabled>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog 
            open={isCreateDialogOpen} 
            onOpenChange={(open) => {
              if (!open && isCreating) {
                return;
              }
              
              setIsCreateDialogOpen(open);
              
              if (!open) {
                setNewNote({ title: '', content: '' });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" showCloseButton={!isCreating}>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Add a new note to your collection.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <Textarea
                  placeholder="Write your note here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={6}
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateNote}
                  disabled={!newNote.title.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Note'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notes Grid */}

        {getFilteredNotes().length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm ? 'No notes found matching your search.' : 'No notes yet. Create your first note!'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {getFilteredNotes().map((note: Note) => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-col space-y-1 text-xs">
                      <span>Created: {formatTimestamp(note.createdAt)}</span>
                      {note.updatedAt && note.updatedAt !== note.createdAt && (
                        <span>Updated: {formatTimestamp(note.updatedAt)}</span>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {note.content || 'No content'}
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          // Don't close if currently editing a note
          if (!open && isEditing) {
            return;
          }
          
          setIsEditDialogOpen(open);
          
          if (!open) {
            setEditingNote(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]" showCloseButton={!isEditing}>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Make changes to your note.
            </DialogDescription>
          </DialogHeader>
          {editingNote && (
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Note title..."
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              />
              <Textarea
                placeholder="Write your note here..."
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                rows={6}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleEditNote}
              disabled={!editingNote?.title.trim() || isEditing}
            >
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;