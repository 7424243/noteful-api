function makeNotesArray() {
    return [
        {
            id: 1,
            note_name: 'Note 1',
            date_modified: '2029-01-22T16:28:32.615Z',
            content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
            folder_id: 3,
        },
        {
            id: 2,
            note_name: 'Note 2',
            date_modified: '2100-05-22T16:28:32.615Z',
            content: 'Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?',
            folder_id: 1,
        },
        {
            id: 3,
            note_name: 'Note 3',
            date_modified: '1919-12-22T16:28:32.615Z',
            content: 'Possimus, voluptate?',
            folder_id: 2
        },
        {
            id: 4,
            note_name: 'Note 4',
            date_modified: '1919-12-22T16:28:32.615Z',
            content: 'Earum molestiae accusamus veniam consectetur tempora, corporis obcaecati ad nisi asperiores tenetur, autem magnam.',
            folder_id: 3,
        },
    ]
}

module.exports = {
    makeNotesArray,
}