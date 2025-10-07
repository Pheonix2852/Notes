import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Note, CreateNoteData, UpdateNoteData } from '../types';

const NOTES_COLLECTION = 'notes';

export const notesService = {
  // Create new note
  createNote: async (userId: string, noteData: CreateNoteData): Promise<string> => {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
        ...noteData,
        userId,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note');
    }
  },

  // Update existing note
  updateNote: async (noteId: string, updateData: UpdateNoteData): Promise<void> => {
    try {
      const noteRef = doc(db, NOTES_COLLECTION, noteId);
      await updateDoc(noteRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }
  },

  // Delete note
  deleteNote: async (noteId: string): Promise<void> => {
    try {
      const noteRef = doc(db, NOTES_COLLECTION, noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  },

  // Get all notes for the current user
  subscribeToUserNotes: (userId: string, callback: (notes: Note[]) => void) => {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
      // "querySnapshot" => real-time snapshot of the query results.Contains all documents matching the query
      const notes: Note[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notes.push({
        id: docSnap.id,
        title: data.title,
        content: data.content,
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        });
      });
        
        // Sort notes by time
        notes.sort((a, b) => {
          const getTime = (timestamp: any) => timestamp?.toMillis ? timestamp.toMillis() : 0;
          const aTime = getTime(a.updatedAt) || getTime(a.createdAt);
          const bTime = getTime(b.updatedAt) || getTime(b.createdAt);
          return bTime - aTime;
        });
        
        callback(notes);
      },
      (error) => {
        console.error('Error fetching notes:', error);
      }
    );
  },
};