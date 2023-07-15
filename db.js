import mongoose from "mongoose";

// db
const mongooseUri = "mongodb://127.0.0.1:27017/traciege"
await mongoose.connect(mongooseUri);

// player
const PlayerSchema = new mongoose.Schema({
    email: {type: String, required: true},
    platform: {type: String, required: true},
    id: {type: String, required: true}
})
export const Player = mongoose.model('Player', PlayerSchema);


