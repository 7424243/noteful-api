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

function makeMaliciousNote() {
    const maliciousNote = {
        id: 911,
        note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        date_modified: new Date().toISOString(),
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        folder_id: 3,
    }
    const expectedNote = {
        ...maliciousNote,
        note_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    }

    return {
        maliciousNote,
        expectedNote,
    }
}

module.exports = {
    makeNotesArray,
    makeMaliciousNote,
}