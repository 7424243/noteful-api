const {expect} = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const {makeNotesArray, makeMaliciousNote} = require('./notes.fixtures')
const {makeFoldersArray} = require('./folders.fixtures')

describe('Notes Endpoints', function() {
    let db
    //create a knex instance to connect to the test db
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })
    //disconnect from the db so that the tests don't 'hang'
    after('disconnect from db', () => db.destroy())
    //clear any data so that we have a fresh start
    before('clean the table', () => db.raw('TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))
    //clear up table after each test
    afterEach('cleanup', () => db.raw('TRUNCATE noteful_notes, noteful_folders RESTART IDENTITY CASCADE'))

    describe('GET /api/notes', () => {
        //for when the db table is empty
        context('Given no notes', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, [])
            })
        })

        //for when the db table has data
        context('Given there are notes in the database', () => {
            //test data
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()
            //insert the test data
            beforeEach('insert notes', () => {
                return db   
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes)
                    })
            })
            it('GET /api/notes responds with 200 and all of the notes', () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200, testNotes)
            })
        })

        //XSS attack tests
        context('Given an XSS attack note', () => {
            const testFolders = makeFoldersArray()
            const {maliciousNote, expectedNote} = makeMaliciousNote()
            beforeEach('insert malicious note', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(maliciousNote)
                    })
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get('/api/notes')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].note_name).to.eql(expectedNote.note_name)
                        expect(res.body[0].content).to.eql(expectedNote.content)
                    })
            })
        })
    })

    describe(`GET /api/notes/:note_id`, () => {
        context('Given no notes', () => {
            it('Responds with 400', () => {
                const noteId = 123456
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(404, {error: {message: `Note doesn't exist`}})
            })
        })
        context('Given there are notes in the db', () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()
            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes)
                    })
            })
            it('GET /api/notes/:note_id responds with 200 and the specified note', () => {
                const noteId = 2
                const expectedNote = testNotes[noteId - 1]
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .expect(200, expectedNote)
            })
        })
        context('Given an XSS attack note', () => {
            const testFolders = makeFoldersArray()
            const {maliciousNote, expectedNote} = makeMaliciousNote()
            beforeEach('insert malicious note', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(maliciousNote)
                    })
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/notes/${maliciousNote.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.note_name).to.eql(expectedNote.note_name)
                        expect(res.body.content).to.eql(expectedNote.content)
                    })
            })
        })
    })

    describe(`POST /api/notes`, () => {
        it(`creates a note, responding with 201 and the new note`, () => {
            this.retries(3)
            const newNote = {
                note_name: 'Test Note Name',
                content: 'Test Note Content',
                folder_id: 2
            }
            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.note_name).to.eql(newNote.note_name)
                    expect(res.body.content).to.eql(newNote.content)
                    expect(res.body.folder_id).to.eql(newNote.folder_id)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.date_modified).toLocaleString()
                    expect(actual).to.eql(expected)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/notes/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })
        it(`responds with 400 and an error message when the 'note_name' is missing`, () => {
            return supertest(app)
                .post('/api/notes')
                .send({
                    content: 'Test Note Content',
                    folder_id: 2,
                })
                .expect(400, {
                    error: {message: `Missing 'note_name' in request body`}
                })
        })
        it(`responds with 400 and an error message when the 'content' is missing`, () => {
            return supertest(app)
                .post('/api/notes')
                .send({
                    note_name: 'Test Note Name',
                    folder_id: 2,
                })
                .expect(400, {
                    error: {message: `Missing 'content' in request body`}
                })
        })
        it(`responds with 400 and an error message when the 'folder_id' is missing`, () => {
            return supertest(app)
                .post('/api/notes')
                .send({
                    note_name: 'Test Note Name',
                    content: 'Test Note Content',
                })
                .expect(400, {
                    error: {message: `Missing 'folder_id' in request body`}
                })
        })
        it(`removes XSS attack content from response`, () => {
            const {maliciousNote, expectedNote} = makeMaliciousNote()
            return supertest(app)
                .post(`/api/notes`)
                .send(maliciousNote)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedNote.note_name)
                    expect(res.body.content).to.eql(expectedNote.content)
                })
        })
    })

    describe(`DELETE /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                    .delete(`/api/notes/${noteId}`)
                    .expect(404, {error: {message: `Note doesn't exist`}})
            })
        })
        context('Given there are notes in the db', () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()
            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes)
                    })
            })
            it('responds with 204 and removes the note', () => {
                const idToRemove = 2
                const expectedNotes = testNotes.filter(note => note.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/notes/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/notes`)
                            .expect(expectedNotes)
                    })
            })
        })
    })
    describe(`PATCH /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404`, () => {
                const noteId = 123456
                return supertest(app)
                    .patch(`/api/notes/${noteId}`)
                    .expect(404, {error: {message: `Note doesn't exist`}})
            })
        })
        context(`Given there are notes in the database`, () => {
            const testFolders = makeFoldersArray()
            const testNotes = makeNotesArray()
            beforeEach('insert notes', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
                    .then(() => {
                        return db
                            .into('noteful_notes')
                            .insert(testNotes)
                    })
            })
            it(`responds with 204 and updates the note`, () => {
                const idToUpdate = 2
                const updateNote = {
                    note_name: 'Updated Name',
                    content: 'Updated Content...',
                    folder: 1
                }
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send(updateNote)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .expect(expectedNote)
                    })
            })
            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({irrelevantField: 'foo'})
                    .expect(400, {
                         error: {message: `Request body must contain either 'note_name', 'content', or 'folder_id'`}
                    })
            })
            it('responds with 204 when updating only a subet of fields', () => {
                const idToUpdate = 2
                const updateNote = {
                    note_name: 'Updated Name'
                }
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                }
                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .send({
                        ...updateNote,
                        fieldToIgnore: 'Should not be here'
                    })
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .expect(expectedNote)
                    })
            })
        })
    })
})