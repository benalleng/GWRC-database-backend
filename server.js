require('dotenv').config();
const { PORT = 4000, DATABASE_URL, PRIVATE_KEY, PRIVATE_KEY_ID } = process.env;
const admin = require("firebase-admin");
const { getAuth } = require('firebase-admin/auth')
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const logger = require('morgan');
const cors = require('cors');

admin.initializeApp({
  credential: admin.credential.cert(
    {
        "type": "service_account",
        "project_id": "gwrc-database",
        "pivate_key_id": PRIVATE_KEY_ID,
        "private_key": PRIVATE_KEY.replace('/n', ''),
        "client_email": "firebase-adminsdk-8fd35@gwrc-database.iam.gserviceaccount.com",
        "client_id": "104366579085758409343",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-8fd35%40gwrc-database.iam.gserviceaccount.com"
      }
      
  )
});

mongoose.connect(DATABASE_URL);
mongoose.connection
    .on('open', () => console.log('You are connected to mongoose'))
    .on('close', () => console.log('You are disconnected from mongoose'))
    .on('error', (error) => console.log(error.message));

const peopleSchema = new mongoose.Schema({
    name: { required: true, type: String },
    title: { required: true, type: String },
    image: {type: String,
        default: 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png'
    },
    organization: String,
    email: String,
    phoneNumber: String,
    relationship: String,
    COC: Boolean,
    notes: String,
    createdByUserId: String,
}, {timestamps: true});

const grantsSchema = new mongoose.Schema({
    name: { required: true, type: String },
    organization: {required: true, type: String },
    description: {required: true, type: String },
    dateDue: {required: true, type: Date},
    dateOpen: Date,
    applied: Boolean,
    url: String,
    createdByUserId: String,
}, {timestamps: true});

const resourceSchema = new mongoose.Schema({
    name: {required: true, type: String },
    description: {required: true, type: String },
    url: String,
    createdByUserId: String,
}, {timestamps: true});

const People = mongoose.model('People', peopleSchema);
const Grants = mongoose.model('Grants', grantsSchema);
const Resources = mongoose.model('Resources', resourceSchema);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(logger('dev'));
app.use(cors());

app.use(async function(req, res, next) {
    const token = req.get('Authorization');
    try {
        if(token) {
            const user = await getAuth(). verifyIdToken(token.replace('Bearer ', ''));
            req.user = user;
        } else {
            req.user = null;
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: 'bad request' })
    }
    next();
});

function isAuthenticated(req, res, next) {
    if(!req.user) return res.status(401).json({error: 'You must be logged in first'})
    next();
}

// ICRUD

app.get('/api/people', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await People.find({
}));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});      
    }
});    

app.get('/api/grants', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await Grants.find({
}));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});      
    }
});    

app.get('/api/resources', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await Resources.find({
}));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});      
    }
});    

app.put('/api/people/:id', isAuthenticated, async (req, res) => {
    try {
        req.body.COC = !!req.body.COC
        res.status(200).json(await People.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.put('/api/grants/:id', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await Grants.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.put('/api/resources/:id', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await Resources.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.post('/api/people', isAuthenticated, async (req, res) => {
    try {
        req.body.createdByUserId = req.user.uid
        req.body.COC = !! req.body.COC;
        // console.log(req.user)
        res.status(201).json(await People.create(req.body));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.post('/api/grants', isAuthenticated, async (req, res) => {
    try {
        req.body.createdByUserId = req.user.uid
        // console.log(req.user)
        res.status(201).json(await Grants.create(req.body));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.post('/api/resources', isAuthenticated, async (req, res) => {
    try {
        req.body.createdByUserId = req.user.uid
        res.status(201).json(await Resources.create(req.body));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.delete('/api/people/:id', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await People.findByIdAndDelete(
            req.params.id
        ));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.delete('/api/grants/:id', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await Grants.findByIdAndDelete(
            req.params.id
        ));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.delete('/api/resources/:id', isAuthenticated, async (req, res) => {
    try {
        res.status(200).json(await Resources.findByIdAndDelete(
            req.params.id
        ));
    } catch (error) {
        console.log(error);
        res.status(400).json({'error': 'bad request'});
    }
});

app.listen(PORT, () => console.log(`Express is listening on PORT: ${PORT}`));