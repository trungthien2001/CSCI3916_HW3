
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

//mongoose.connect(process.env.DB, { useNewUrlParser: true });
try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

//movies Schema
var MoviesSchema = new Schema({
    title: { type: String, required: true, index: { unique: true }},
    releaseYear: { type: String, required: true},
    genre: {type:String,required:true,enum:['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western'] },
    actors: {type: Array, required: true}
});
module.exports = mongoose.model('Movies', MoviesSchema);
