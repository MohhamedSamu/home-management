'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { format } from 'date-fns'

interface Folder {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface Note {
  id: string
  folder_id: string | null
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export default function WeddingNotesPage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: '',
    folder_id: '',
  })

  const userId = getUserId()

  useEffect(() => {
    fetchFolders()
    fetchNotes()
  }, [])

  useEffect(() => {
    if (selectedFolder && !noteFormData.folder_id) {
      setNoteFormData((prev) => ({ ...prev, folder_id: selectedFolder.id }))
    }
  }, [selectedFolder, noteFormData.folder_id])

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

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
      alert('Error creating folder. Please try again.')
    }
  }

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carpeta? Se eliminarán todas las notas dentro.')) return

    try {
      const { error } = await supabase.from('wedding_folders').delete().eq('id', id)
      if (error) throw error
      fetchFolders()
      if (selectedFolder?.id === id) {
        setSelectedFolder(null)
        setSelectedNote(null)
      }
      fetchNotes()
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('Error deleting folder. Please try again.')
    }
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteFormData.title.trim()) return

    try {
      const { error } = await supabase.from('wedding_notes').insert({
        user_id: userId,
        folder_id: noteFormData.folder_id || null,
        title: noteFormData.title.trim(),
        content: noteFormData.content || null,
      })

      if (error) throw error

      setNoteFormData({
        title: '',
        content: '',
        folder_id: selectedFolder?.id || '',
      })
      setShowNoteForm(false)
      fetchNotes()
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Error creating note. Please try again.')
    }
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote || !noteFormData.title.trim()) return

    try {
      const { error } = await supabase
        .from('wedding_notes')
        .update({
          title: noteFormData.title.trim(),
          content: noteFormData.content || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNote.id)

      if (error) throw error

      setEditingNote(null)
      setNoteFormData({
        title: '',
        content: '',
        folder_id: '',
      })
      setShowNoteForm(false)
      fetchNotes()
      if (selectedNote?.id === editingNote.id) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Error updating note. Please try again.')
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return

    try {
      const { error } = await supabase.from('wedding_notes').delete().eq('id', id)
      if (error) throw error
      fetchNotes()
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error deleting note. Please try again.')
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteFormData({
      title: note.title,
      content: note.content || '',
      folder_id: note.folder_id || '',
    })
    setShowNoteForm(true)
    setSelectedNote(note)
  }

  const filteredNotes = selectedFolder
    ? notes.filter((note) => note.folder_id === selectedFolder.id)
    : notes.filter((note) => !note.folder_id)

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
          <Link href="/boda" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Boda
          </Link>
          <h1 className="text-4xl font-bold">Notas de Boda</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Organiza tus notas en carpetas
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Folders Sidebar */}
          <div>
            <div className="mb-4">
              <button
                onClick={() => setShowFolderForm(!showFolderForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
              >
                {showFolderForm ? 'Cancelar' : '+ Nueva Carpeta'}
              </button>
            </div>

            {showFolderForm && (
              <form onSubmit={handleCreateFolder} className="mb-4 p-4 border rounded-lg">
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                  placeholder="Nombre de la carpeta"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Crear
                </button>
              </form>
            )}

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedFolder(null)
                  setSelectedNote(null)
                }}
                className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  !selectedFolder ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
                }`}
              >
                <span className="font-semibold">Todas las Notas</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  ({notes.length})
                </span>
              </button>

              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedFolder?.id === folder.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedFolder(folder)
                    setSelectedNote(null)
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="font-semibold">{folder.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        ({notes.filter((n) => n.folder_id === folder.id).length})
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFolder(folder.id)
                      }}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes List */}
          <div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setShowNoteForm(!showNoteForm)
                  setEditingNote(null)
                  setNoteFormData({
                    title: '',
                    content: '',
                    folder_id: selectedFolder?.id || '',
                  })
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
              >
                {showNoteForm ? 'Cancelar' : '+ Nueva Nota'}
              </button>
            </div>

            {showNoteForm && (
              <form
                onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
                className="mb-4 p-4 border rounded-lg"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <input
                      type="text"
                      required
                      value={noteFormData.title}
                      onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contenido</label>
                    <textarea
                      value={noteFormData.content}
                      onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={8}
                      placeholder="Escribe tu nota aquí..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingNote ? 'Actualizar' : 'Crear'} Nota
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              <h2 className="text-xl font-semibold mb-4">
                {selectedFolder ? selectedFolder.name : 'Todas las Notas'}
              </h2>
              {filteredNotes.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No hay notas aún.</p>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedNote?.id === note.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedNote(note)
                      handleEditNote(note)
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{note.title}</h3>
                        {note.content && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {note.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {format(new Date(note.updated_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Note Preview/Edit */}
          <div>
            {selectedNote && editingNote && (
              <div className="p-4 border rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">{selectedNote.title}</h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Actualizado: {format(new Date(selectedNote.updated_at), 'MMM dd, yyyy HH:mm')}
                </div>
                {selectedNote.content && (
                  <div className="prose dark:prose-invert whitespace-pre-wrap">
                    {selectedNote.content}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

