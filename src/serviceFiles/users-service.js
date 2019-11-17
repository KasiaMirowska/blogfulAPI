const UsersService = {
    getAllUsers: (knex) => {
        return knex.select('*').from('blogful_users');
    },
    insertUser: (knex, newUser) => {
        return knex
            .insert(newUser)
            .into('blogful_users')
            .returning('*')
            .then(rows => {
                return rows[0]
            });
    },
    getUserById: (knex, userId) => {
        return knex.from('blogful_users').select('*').where({id: userId}).first();
    },
    deleteUser: (knex, userId) => {
        return knex.from('blogful_users').select('*').where({id: userId}).delete();
    },
    updateUser: (knex, userId, filedsToUpdate) => {
        return knex.from('blogful_users').where({id: userId}).update(filedsToUpdate)
    }
}
module.exports = UsersService;