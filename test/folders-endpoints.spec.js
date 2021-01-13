const {expect} = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const foldersRouter = require('../src/folders/folders-router')
const {makeFoldersArray, makeMaliciousFolder} = require('./folders.fixtures')

describe('Folders endpoints', function() {
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

    describe('GET /api/folders', () => {
        context('Given no folders', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })
        })
        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()
            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
            it('GET /api/folders responds with 200 and all of the notes', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })
        context('Given an XSS attack folder', () => {
            const {maliciousFolder, expectedFolder} = makeMaliciousFolder()
            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(maliciousFolder)
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].folder_name).to.eql(expectedFolder.folder_name)
                    })
            })
        })
    })

    describe.only(`GET /api/folders/folder_id`, () => {
        context(`Given no folders`, () => {
            it('responds with 400', () => {
                const folderId = 123456
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, {error: {message: `Folder doesn't exist`}})
            })
        })
        context(`Given there are folders in the database`, () => {
            const testFolders = makeFoldersArray()
            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
            it('GET /api/folders:folder_id responds with 200 and the specified folder', () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId - 1]
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })
        context('Given an XSS attack folder', () => {
            const {maliciousFolder, expectedFolder} = makeMaliciousFolder()
            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(maliciousFolder)
            })
            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/folders/${maliciousFolder.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.folder_name).to.eql(expectedFolder.folder_name)
                    })
            })
        })
    })

})