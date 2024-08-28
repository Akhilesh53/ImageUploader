import mongoose from "mongoose"

let imageSchema = new mongoose.Schema({
    imageUrl: String
})

export default mongoose.model('Image', imageSchema, 'image')