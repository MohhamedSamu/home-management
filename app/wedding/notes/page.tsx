'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { format } from 'date-fns'

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface Folder {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface Note {
  id: string
  folder_id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export default function WeddingNotesPage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: '',
  })

  const userId = getUserId()

  useEffect(() => {
    fetchFolders()
  }, [])

  useEffect(() => {
    if (selectedFolder) {
      fetchNotes(selectedFolder.id)
    } else {
      setNotes([])
      setSelectedNote(null)
    }
  }, [selectedFolder])

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_folders')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotes = async (folderId: string) => {
    try {
      const { data, error } = await supabase
        .from('wedding_notes')
        .select('*')
        .eq('folder_id', folderId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) {
      alert('Por favor ingresa un nombre de carpeta')
      return
    }

    try {
      const { error } = await supabase.from('wedding_folders').insert({
        user_id: userId,
        name: newFolderName.trim(),
      })

      if (error) throw error

      setNewFolderName('')
      setShowFolderForm(false)
      fetchFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Error creando carpeta. Por favor intenta de nuevo.')
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carpeta? Esto eliminará todas las notas dentro.')) return

    try {
      const { error } = await supabase.from('wedding_folders').delete().eq('id', id)
      if (error) throw error
      fetchFolders()
      if (selectedFolder?.id === id) {
        setSelectedFolder(null)
        setNotes([])
        setSelectedNote(null)
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('Error eliminando carpeta. Por favor intenta de nuevo.')
    }
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFolder) return
    if (!noteFormData.title.trim()) {
      alert('Por favor ingresa un título')
      return
    }

    try {
      const { error } = await supabase.from('wedding_notes').insert({
        user_id: userId,
        folder_id: selectedFolder.id,
        title: noteFormData.title.trim(),
        content: noteFormData.content || null,
      })

      if (error) throw error

      setNoteFormData({
        title: '',
        content: '',
      })
      setShowNoteForm(false)
      fetchNotes(selectedFolder.id)
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Error creando nota. Por favor intenta de nuevo.')
    }
  }

  const handleUpdateNote = async () => {
    if (!selectedNote) return

    try {
      const { error } = await supabase
        .from('wedding_notes')
        .update({
          title: noteFormData.title.trim(),
          content: noteFormData.content || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNote.id)

      if (error) throw error

      fetchNotes(selectedNote.folder_id)
      setShowNoteForm(false)
      setSelectedNote(null)
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Error actualizando nota. Por favor intenta de nuevo.')
    }
  }

  const handleDeleteNote = async (id: string, folderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return

    try {
      const { error } = await supabase.from('wedding_notes').delete().eq('id', id)
      if (error) throw error
      fetchNotes(folderId)
      if (selectedNote?.id === id) {
        setSelectedNote(null)
        setShowNoteForm(false)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error eliminando nota. Por favor intenta de nuevo.')
    }
  }

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setNoteFormData({
      title: note.title,
      content: note.content || '',
    })
    setShowNoteForm(true)
  }

  const handleNewNote = () => {
    setSelectedNote(null)
    setNoteFormData({
      title: '',
      content: '',
    })
    setShowNoteForm(true)
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/wedding" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Wedding
          </Link>
          <h1 className="text-4xl font-bold">Wedding Notes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organize your wedding ideas and notes in folders
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Folders Sidebar */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <button
                onClick={() => setShowFolderForm(!showFolderForm)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showFolderForm ? 'Cancel' : '+ New Folder'}
              </button>
            </div>

            {showFolderForm && (
              <form onSubmit={handleCreateFolder} className="mb-4 p-4 border rounded-lg">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                  required
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Folder
                </button>
              </form>
            )}

            <div className="space-y-2">
              {folders.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">No folders yet. Create one to get started.</p>
              ) : (
                folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFolder?.id === folder.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📁</span>
                        <span className="font-semibold">{folder.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder.id)
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes Area */}
          <div className="lg:col-span-2">
            {selectedFolder ? (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">{selectedFolder.name}</h2>
                  <button
                    onClick={handleNewNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + New Note
                  </button>
                </div>

                {showNoteForm && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (selectedNote) {
                        handleUpdateNote()
                      } else {
                        handleCreateNote(e)
                      }
                    }}
                    className="mb-6 p-4 border rounded-lg"
                  >
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={noteFormData.title}
                        onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Note title"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Content</label>
                      <textarea
                        value={noteFormData.content}
                        onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={10}
                        placeholder="Write your notes here... (supports markdown)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        {selectedNote ? 'Update Note' : 'Create Note'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNoteForm(false)
                          setSelectedNote(null)
                          setNoteFormData({ title: '', content: '' })
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      {selectedNote && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(selectedNote.id, selectedNote.folder_id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                      No notes yet. Click "New Note" to create one.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedNote?.id === note.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleSelectNote(note)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                            {note.content && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {note.content}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              Updated: {format(parseLocalDate(note.updated_at.split('T')[0]), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNote(note.id, note.folder_id)
                            }}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 border rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Select a folder from the list to view and create notes, or create a new folder.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}



