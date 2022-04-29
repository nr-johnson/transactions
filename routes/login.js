const express = require('express')
const router = express.Router()
const formidable = require('formidable')
const hash = require('password-hash')

router.get('/', async (req, res) => {
    if(req.session.user) {
        console.log('User session found.')
        const ip = req.header('x-forwarded-for') || req.connection.remoteAddress
        const session = await req.findItem('johnsonProperty', 'sessions', {ip: ip})
        if(session[0]) {
            console.log('DB Session found. Redirecting...')
            res.redirect('/')
        } else {
            console.log('DB Session not found.')
            await req.deleteItems('johnsonProperty', 'sessions', {ip: ip})
            req.session.user = null
            res.render('login')
        }
    } else {
        console.log('No user found.')
        res.render('login')
    }
})

router.post('/', async (req, res) => {
    var form = new formidable.IncomingForm()
    form.parse(req, async function (err, fields, files) {
        if(fields.password == process.env.PASSWORD) {
            const ip = req.header('x-forwarded-for') || req.connection.remoteAddress
            let key = Math.floor(100000 + Math.random() * 900000).toString()
            let session = await req.findItem('johnsonProperty', 'sessions', {ip: ip})
            
            req.session.user = {
                ip: ip,
                key: key
            }

            if(session[0]) {
                session[0].ip = ip
                session[0].key = hash.generate(key)
                console.log('Updating Session')
                await req.updateItem('johnsonProperty', 'sessions', {ip: ip}, session[0])
            } else {
                session = {
                    ip: ip,
                    key: hash.generate(key)
                }
                console.log('Creating Session')
                await req.addItems('johnsonProperty', 'sessions', [session])
            }
            res.send({ok: true})
        } else {
            res.send({ok: false, resp: 'Invalid Credentials.'})
        }
    })
})

router.post('/logout', async (req, res) => {
    console.log('Logging user out.')
    const ip = req.header('x-forwarded-for') || req.connection.remoteAddress
    req.session.user = null
    await req.deleteItems('johnsonProperty', 'sessions', {ip: ip})
    res.redirect('/login')
})

module.exports = router