'use-strict'

function authUser() {
    return (req, res, next) => {
        if(!req.session.user) {
            console.log('No user found. Redirecting...')
            res.redirect('/login')
        } else {
            next()
        }
    }
}

module.exports = {authUser}