import { Schema, model } from 'mongoose';

const pictureSchema = Schema({
    title: String,
    description: String,
    imageUrl: String,
})

export default model('Picture', pictureSchema);