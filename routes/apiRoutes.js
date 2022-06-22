const express = require('express')
const router = express.Router()
const { authUser } = require('../functions/authorize')
const formidable = require('formidable')
const { ObjectId } = require('mongodb')
const fs = require('fs')
const http = require('http');

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
                console.log('Single Image')
                if(files.images.size > 0) {
                    const fileName = files.images.originalFilename.substring(0, files.images.originalFilename.length - 4)
                    const image = await req.uploadFile(files.images.filepath, {public_id: `property/transactions/${id}/${files.images.originalFilename}`})
                    console.log(image)
                    fields.images.push({
                        name: files.images.originalFilename,
                        url: image.secure_url,
                        public_id: image.public_id,
                        secure_url: image.secure_url
                    })
                }
            } else if(files.images[0]) {
                console.log('Multiple Image')
                for(let index in files.images) {
                    const fileName = files.images[index].originalFilename.substring(0, files.images[index].originalFilename.length - 4)
                    const image = await req.uploadFile(files.images[index].filepath, {public_id: `property/transactions/${id}/${files.images[index].originalFilename}`})
                    fields.images.push({
                        name: files.images[index].originalFilename,
                        url: image.secure_url,
                        public_id: image.public_id,
                        secure_url: image.secure_url
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
        transactions.reverse()
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

router.get('/download/:id/:index', authUser(), async (req, res) => {
    try {
        const trans = await req.findItem('johnsonProperty', 'finances', {_id: ObjectId(req.params.id)})
        const file = trans[0].images[parseInt(req.params.index)]

        http.get(file.url, (resp) => {
            const path = file.name
            const writeStream = fs.createWriteStream(path);

            resp.pipe(writeStream);

            writeStream.on("finish", () => {
                writeStream.close();
                console.log("Download Completed");
            });
        })

    } catch(err) {
        res.status(500).send(err.message)
    }
    

    // const file = fs.createWriteStream("file.jpg");
    // const request = http.get("http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg", function(response) {
    //     response.pipe(file);
    //     // after download completed close filestream
    //     file.on("finish", () => {
    //         file.close();
    //         console.log("Download Completed");
    //     });
    // });
})

module.exports = router