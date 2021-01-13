const {expect} = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const {makeNotesArray} = require('./notes.fixtures')
const {makeFoldersArray} = require('./folders.fixtures')

describe('Notes Enpoints', function() {
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


    })
})