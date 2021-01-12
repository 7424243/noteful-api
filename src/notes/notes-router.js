const express = require('express')
const xss = require('xss')
const NotesService = require('./notes-service')
const path = require('path')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
    id: note.id,
    note_name: xss(note.note_name),
    date_modified: note.date_modified,
    content: xss(note.content),
    folder_id: note.folder_id
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })

module.exports = notesRouter