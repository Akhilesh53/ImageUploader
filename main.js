import express from "express"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import dotenv from "dotenv"
import ImageSchema from "./models/image.schema.js"
import multer from "multer"
import methodeOverride from "method-override"
import imageSchema from "./models/image.schema.js"
import path from "path"

dotenv.config()

const port = process.env.PORT || 5000

let app = express()

mongoose.connect(process.env.MONGO_URI, {
    autoCreate: true,
    autoIndex: true
}).then(() => {
    console.log('Connected to MongoDB')
}).catch((err) => {
    console.log(err)
})

app.set('view engine', 'ejs')
app.set('views', './views')

app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodeOverride("_method"))

let storage = multer.diskStorage({
    destination: "/Users/b0272559_1/Documents/ImageUploader/public/images",
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkfileType(file, cb)
    }
})


function checkfileType(file, cb) {
    let fileTypes = /jpeg|jpg|png|gif/
    let extname = fileTypes.test(path.extname(file.originalname).toLocaleLowerCase())

    if(extname) {
        return cb(null, true)
    }else{
        cb('Error: Please upload Images only')
    }
}

app.get('/', (req, res) => {
    ImageSchema.find({})
        .then((images) => {
            res.render('index', { images: images })
        })
        .catch((err) => {
            return console.log(err)
        })
})

//upload the image
app.get('/upload', (req, res) => {
    res.render('upload')
})

app.get('/uploadsingle', (req, res) => {
    res.redirect('/')
})

app.post('/uploadsingle', upload.single('singleImage'), (req, res) => {
    let imageFile = req.file
    if (!imageFile) {
        return console.log('Please upload an image')
    }

    let url = imageFile.path;

    // find of url already exists or not
    imageSchema.findOne({ imageUrl: url })
        .then((image) => {
            if (image) {
                console.log('Image already exists')
                return res.redirect('/')
            }

            imageSchema.create({
                imageUrl: url
            }).then((image) => {
                console.log('Image uploaded successfully to DB')
                res.redirect('/')
            }).catch((err) => {
                console.log(err)
                res.redirect('/upload')
            })
        })
        .catch((err) => {
            console.log(err)
        })
})


app.post('/uploadmultiple', upload.array('multipleImages', 10), (req, res) => {
    let files = req.files
    if (!files) {
        return console.log('Please upload an image')
    }

    if (files.length > 10) {
        return console.log('You can only upload 10 images at a time')
    }

    let urls = files.map(file => file.path)
    imageSchema.insertMany(urls.map(url => ({ imageUrl: url })))
        .then(() => {
            console.log('Images uploaded successfully to DB')
            res.redirect('/')
        })
        .catch((err) => {
            console.log(err)
        })
})


app.delete('/delete/:id', (req, res) => {
    let id = req.params.id
    imageSchema.findByIdAndDelete(id)
        .then(() => {
            console.log('Image deleted successfully')
            res.redirect('/')
        })
        .catch((err) => {
            console.log(err)
        })
})


app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})