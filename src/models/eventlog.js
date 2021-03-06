var mongoose = require('mongoose');
module.exports = function UserSchema() {
    var schema = new mongoose.Schema({
        provider_id: { type: String, required: false },
        provider_type: { type: String, enum: ['facebook', 'google', 'local'], required: false },
        firstName: String,
        middleName: String,
        displayName: String,
        role: { type: String, enum: ['Admin', 'User'] },
        email: { type: String, required: true },
        active: Boolean,
        password: String,
        createdAt: Date,
        modifiedAt: Date,
        activationLink: String,
        activationLinkExpiredDate: Date,
        activationLinkExpired: Boolean
    });
    schema.index({ email: 1 });
    // schema.pre('save', (doc) => { 
    //     this.createdAt = new Date();
    //     this.modifiedAt = new Date();
    // }, err => {
    //     this.createdAt = new Date();
    //     this.modifiedAt = new Date();
    // });
    schema.pre('update', (doc) => { }, err => {
        this.update({}, { $set: { modifiedAt: new Date() } });
    });

    schema.statics.findByEmail = function (email, cb) {
        user.findOne({ email: email }).then(a => {
            console.log(a);
            cb(null, a);
        }).catch(err => {
            console.log(err);
            cb(err, null);
        });
    }

    schema.statics.GetActive = function (payload) {
        this.find(payload).select({ active: true }).exec()
            .then(docs => docs.map(d => d.toObject())).catch(err => new Error(err));
    }

    schema.statics.GetAll = function (payload, projection) {
        return new Promise((resolve, reject) => {
            this.find(payload, projection, (err, res) => {
                if (err)
                    reject(err);
                else
                    resolve(res.map(d => d.toObject()));
                // .then(docs => docs.map(d => d.toObject())).catch(err => new Error(err));
            });
        });

    }

    schema.statics.userExists = (payload, cb) => {
        // return new Promise((resolve, reject) => {
        //     try{
        //         var count = await user.count({email : email})
        //         resolve({err: null, result: count});
        //     }
        //     catch(err) {
        //         console.log(err);
        //         //cb(err, null);
        //         resolve({err: err, result: null});
        //     }
        // });
        return user.count(payload);
        // .then(a => {
        //     console.log(a);
        //     cb(null,a);
        // }).catch(err => {
        //     console.log(err);
        //     cb(err,null);
        // });
    }
    schema.statics.createUser = (payload, cb) => {
        // return new Promise((resolve,reject) => {
        //     try{
        //         var entity = await user.create(payload);
        //         resolve({err: null, result: entity});
        //     }
        //     catch(err){
        //         resolve({err: err, result: null});
        //     }
        // });
        return payload.save((err) => {
            cb(err, res);
        });
        // .then(a => {
        //     console.log(a);
        //     cb(null,a);
        // }).catch(err => {
        //     console.log(err);
        //     cb(err,null);
        // });
    }

    let user = mongoose.model('User', schema);
    user.collection.drop();
    return user;
}