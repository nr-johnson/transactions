require('dotenv').config()

const connectMongo = require('./functions/connectMongo')
const cloudinary = require('cloudinary')
const express = require('express')
const path = require('path');
const { authUser } = require('./functions/authorize')
const session = require('express-session')
const bodyParser = require('body-parser')
const ops = require('./functions/ops')
let MongoStore = require('connect-mongo');

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_KEY, 
    api_secret: process.env.CLOUD_SECRET
});

const app = express()

const apiRoute = require('./routes/apiRoutes')
const loginRoute = require('./routes/login')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(connectMongo(process.env.MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true}))
app.use(ops.dataOps(), ops.fileOps())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'max',
  saveUninitialized: false,
  resave: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),  
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', authUser(), async (req, res) => {
    const transactions = await req.findMany('johnsonProperty', 'finances', {delete: false})
    transactions.sort((a, b) => { return a.date > b.date ? -1 : a.date < b.date ? 1 : 0 });
    res.render('index', {
      transactions: transactions
    })
})

app.use('/api', apiRoute)
app.use('/login', loginRoute)

// Server ---
const http = require('http')
const PORT = process.env.PORT || 5000
app.set('port', PORT)

const server = http.createServer(app)

server.listen(PORT, () => console.log(`Running on Port ${PORT}`))
