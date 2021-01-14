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
            connection: process.env.TEST_DATABASE_URL,
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

    describe(`GET /api/folders/folder_id`, () => {
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

    describe('POST /api/folders', () => {
        it(`creates a folder, responding with 201 and the new folder`, () => {
            const newFolder = {
                folder_name: 'Test Folder'
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.folder_name).to.eql(newFolder.folder_name)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/folders/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })
        it(`it responds with 400 and an error message when the 'folder_name' is missing`, () => {
            return supertest(app)
                .post('/api/folders')
                .send()
                .expect(400, {
                    error: {message: `Missing 'folder_name' in request body`}
                })
        })
        it('removes XSS attack content from response', () => {
            const {maliciousFolder, expectedFolder} = makeMaliciousFolder()
            return supertest(app)
                .post(`/api/folders`)
                .send(maliciousFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.folder_name).to.eql(expectedFolder.folder_name)
                })
        })
    })

    describe(`DELETE /api/folders/:folder_id`, () => {
        context('Given no folders', () => {
            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(404, {error: {message: `Folder doesn't exist`}})
            })
        })
        context('Given there are folds in the database', () => {
            const testFolders = makeFoldersArray()
            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })
            it(`responds with 204 and removes the folder`, () => {
                const idToRemove = 2
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/folders`)
                            .expect(expectedFolders)
                    })
            })
        })
    })

    describe(`PATCH /api/folders/:folder_id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
                const folderId = 12345
                return supertest(app)
                    .patch(`/api/folders/${folderId}`)
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
            it(`responds with 204 and updates the folder`, () => {
                const idToUpdate = 2
                const updateFolder = {
                    folder_name: 'Updated Name'
                }
                const expectedFolder = {
                    ...testFolders[idToUpdate - 1],
                    ...updateFolder
                }
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send(updateFolder)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .expect(expectedFolder)
                    })
            })
            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({irrelevantField: 'Foo'})
                    .expect(400, {
                        error: {message: `Request body must contain 'folder_name'`}
                    })
            })
        })
    })

})