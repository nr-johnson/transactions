'use-strict'

function authUser() {
    return (req, res, next) => {
        if(!req.session.user) {
            console.log('No user found. Redirecting...')
            res.redirect('/login')
        } else {
            console.log('User authorized.')
            next()
        }
    }
}

module.exports = {authUser}