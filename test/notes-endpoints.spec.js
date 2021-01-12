const {expect} = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')

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
})