//var mongoose = require('mongoose');
module.exports = function UserSchema(mongoose) {
    var schema = new mongoose.Schema({
        //id: { tpye: String, required: true },
        firstName: String,
        middleName: String,
        lastName: String,
        role: { type: String, enum: ['Admin', 'User'] },
        email: { type: String, required: true },
        active: Boolean,
        password: String,
        createdAt: Date,
        modifiedAt: Date,
    });
    schema.index({ email: 1 });
    schema.pre('save', (doc) => { }, err => {
        // this.createdAt = new Date();
        // this.modifiedAt = new Date();
    });
    schema.pre('update', (doc) => { }, err => {
        //this.update({}, { $set: { modifiedAt: new Date() } });
    });
    let user = mongoose.model('User', schema);
    return user;
}