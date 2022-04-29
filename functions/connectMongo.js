// Modified from the express-monogo-req module
'use strict'

const client = require('mongodb').MongoClient

module.exports = (url, ops) => {
    if(typeof url != 'string') throw new TypeError('Mongo url expexted to be string.')

    ops = ops || {}

    let connection

    return function mongoConnect(req, res, next) {
        if(!connection) connection = client.connect(url, ops)

        connection.then(db => {
            req.mongo = db
            next()
        }).catch(err => {
            connection = undefined
            next(err)
        })
    }
}