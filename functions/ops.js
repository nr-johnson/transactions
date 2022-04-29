const {ObjectId} = require('mongodb');
let cloudinary = require('cloudinary').v2;

function fileOps() {
    return (req, res, next) => {
        req.getFolder = (path) => {
            return new Promise((resolve, reject) => {
                cloudinary.api.resources({
                    type: 'upload',
                    prefix: path
                }, function(err, result) {
                    if (err) reject(err)
                    else resolve(result)
                })
            })
        }
        req.deleteFolder = (prefix) => {
            return new Promise((resolve, reject) => {
                cloudinary.api.delete_resources_by_prefix(prefix, function(err) {
                    if (err) reject(err)
                    else {
                        cloudinary.api.delete_folder(prefix, function(err, result) {
                            if (err) reject(err)
                            else resolve(result)
                        })
                    }
                })
            })
        }
        req.uploadFile = (path, options) => {
            return new Promise((resolve, reject) => {
                console.log('Uploading File')
                cloudinary.uploader.upload(path, options, function(err, result) {
                    if (err) reject(err)
                    else resolve(result)
                })
            }) 
        }
        req.getFile = (path) => {
            return new Promise((resolve, reject) => {
                cloudinary.api.resource(path, function(err, result) {
                    if (err) reject(err)
                    else resolve(result)
                })
            })
        }
        req.deleteFile = (path) => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.destroy(path, function(err,result) {
                    if (err) reject(err)
                    else {
                        if(result.result != 'ok') reject(result)
                        else resolve(result)
                    }
                })
            })
        }
        next()
    }
}

function dataOps() {
    return (req, res, next) => {
        req.listCollections = (db, data) => {
            return new Promise(resolve => {
                data = data || {}
                resolve(req.mongo.db(db).listCollections(data).toArray())
            })
        }
        // Pulled from another app of mine. May not be needed.
        req.getRandom = (db, col, cond, count) => {
            return new Promise(resolve => {
                resolve(req.mongo.db(db).collection(col).aggregate([{$match: cond}, {$sample: {size: count}}]).toArray())
            })
        }
        // Pulled from another app of mine. May not be needed.
        req.findItem = (db, col, data, index) => {
            return new Promise(resolve => {
                if(index) resolve(req.mongo.db(db).collection(col).find(data).collation(index).limit(1).toArray())
                else resolve(req.mongo.db(db).collection(col).find(data).limit(1).toArray())
            })
        }
        req.addCollection = (db, col) => {
            return new Promise((resolve, reject) => {
                req.mongo.db(db).createCollection(col, (err) => {
                    if (err) reject(err)
                    else resolve()
                })
            })
        }
        req.addItems = (db, col, data) => {
            return new Promise((resolve, reject) => {
                if(data._id) data._id = ObjectId(data._id)
                req.mongo.db(db).collection(col).insertMany(data, function(err, items) {
                    if (err) reject(err)
                    else resolve(items)
                })
            })
        }
        req.updateItem = (db, col, item, data) => {
            return new Promise((resolve, reject) => {
                req.mongo.db(db).collection(col).updateMany(item, {$set: data}, function(err, result) {
                    if (err) reject(err)
                    else resolve(result)
                })
            })
        }
        req.findMany = (db, col, data) => {
            return new Promise(resolve => {
                data = data || {}
                resolve(req.mongo.db(db).collection(col).find(data).toArray())
            })
        }
        req.findCollection = (db, col, data) => {
            return new Promise(resolve => {
                data = data || {}
                resolve(req.mongo.db(db).collection(col).find(data).toArray())
            })
        }
        req.dropCollection = (db, col) => {
            return new Promise((resolve, reject) => {
                req.mongo.db(db).collection(col).drop((err, succ) => {
                    if(err) reject(err)
                    else if(succ) resolve()
                })
            })
        }
        req.deleteItems = (db, col, data) => {
            return new Promise(resolve => {
                resolve(req.mongo.db(db).collection(col).deleteMany(data))
            })
        }

        next()
    }
}

module.exports = { dataOps, fileOps }