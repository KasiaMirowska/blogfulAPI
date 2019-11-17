const CommentsService = {
    getAllComments: (knex) => {
        console.log('HERE?')
        return knex.select('*').from('blogful_comments');
    },
    getById: (knex, comment_id) => {
        return knex.from('blogful_comments').select('*').where({id: comment_id}).first();
    },
    insertComment: (knex, newComment) => {
        return knex
            .insert(newComment)
            .into('blogful_comments')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteComment: (knex, idToDelete) => {
        return knex.from('blogful_comments').where({id: idToDelete}).delete();
    },
    updateComment: (knex, idToUpdate, fieldsToUpdate) => {
        return knex.from('blogful_comments').where('id: idToUpdate').insert(fieldsToUpdate)
    }
};
module.exports = CommentsService;