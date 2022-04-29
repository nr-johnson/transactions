const express = require('express')
const router = express.Router()
const { authUser } = require('../functions/authorize')
const formidable = require('formidable')
const { ObjectId } = require('mongodb')

router.post('/add', authUser(), async (req, res) => {
    console.log('Adding Transaction...')
    var form = new formidable.IncomingForm({multiples: true})
    form.parse(req, async function (err, fields, files) {
        try {
            
            const id = new ObjectId()
            fields._id = id
            fields.images = []
            fields.delete = false
            if(files.images.filepath) {
                if(files.images.size > 0) {
                    const image = await req.uploadFile(files.images.filepath, {public_id: `property/transactions/${id}/${files.images.originalFilename}`})
                    fields.images.push({
                        name: files.images.originalFilename,
                        url: image.url,
                        public_id: image.public_id
                    })
                }
            } else if(fields.images[0]) {
                for(let index in files.images) {
                    const image = await req.uploadFile(files.images[index].filepath, {public_id: `property/transactions/${id}/${files.images[index].originalFilename}`})
                    fields.images.push({
                        name: files.images[index].originalFilename,
                        url: image.url,
                        public_id: image.public_id
                    })
                }
            }

            await req.addItems('johnsonProperty', 'finances', [fields])

            res.json({ok: true})
            
        } catch(err) {
            res.json({ok: false, resp: err.message})
        }
	    
    })
})

router.get('/gettransaction/:id', authUser(), async (req, res) => {
    try {
        const transaction = await req.findItem('johnsonProperty', 'finances', {_id: ObjectId(req.params.id)})
        res.json({ok: true, resp: transaction[0]})
    } catch(err) {
        res.json({ok: false, resp: err.message})
    }
    

})

router.post('/delete/:id', authUser(), async (req, res) => {
    try {
        // let item = await req.findItem('johnsonProperty', 'finances', {_id: ObjectId(req.params.id)})
        // console.log(item)
        await req.updateItem('johnsonProperty', 'finances', {_id: ObjectId(req.params.id)}, {delete: true})
        res.status(200).json({ok: true})
    } catch(err) {
        res.status(500).json({ok: false, resp: err.message})
    }
    
})

router.get('/fetch', authUser(), async (req, res) => {
    try {
        const currCount = parseInt(req.query.current)
        const count = parseInt(req.query.get) + currCount

        const transactions = await req.findMany('johnsonProperty', 'finances', {delete: false})
        transactions.sort((a, b) => { return a.date > b.date ? -1 : a.date < b.date ? 1 : 0 });

        let resp = {
            ok: true,
            resp: transactions.slice(currCount, count),
        }
        transactions.length <= count ? resp.limit = true : null

        res.json(resp)
    } catch(err) {
        res.json({ok: false, resp: err.message})
    }
    
})

module.exports = router