const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');


const userSchema = mongoose.Schema({
    local: {
    email: String,
    password: String,
    },
    vacations: [{type: mongoose.Schema.Types.ObjectId,
                 ref: "Vacation"
    }],
},{usePushEach: true});

const vacationSchema = mongoose.Schema({
    name: String,
    budget: {
        moneyBudget: Number,
        daysBudget: Number,
        moneyUsed: Number,
        daysUsed: Number
    },
    startDate: Date,
    numDays: Number,
    legs: [{type: mongoose.Schema.Types.ObjectId, 
        ref: "Leg"}]        
},{usePushEach: true});

const legSchema = mongoose.Schema({
    order: Number,
    accommodation: {type: mongoose.Schema.Types.ObjectId, ref: "Accommodation"},
    transportation: {type: mongoose.Schema.Types.ObjectId, ref: "Transportation"}
});

legSchema.pre('find',function(next){
    this.populate('accommodation');
    this.populate('transportation');
    next();
})

const accommodationSchema = mongoose.Schema({
    city: String,
    cost: Number,
    type: String,
    name: String,
    days: Number,
    website: String,
    booked: Boolean,
    notes: String,
});


const transportationSchema = mongoose.Schema({
    destination: String,
    type: String,
    cost: Number,
    website: String,
    notes: String,
    booked: Boolean
});


userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

const getOrCreate = (db, name, schema) => db.models[name] || db.model(name, schema);

module.exports = db => ({
    User: getOrCreate(db, 'User', userSchema),
    Leg: getOrCreate(db, 'Leg', legSchema),
    Vacation: getOrCreate(db, 'Vacation', vacationSchema),
    Transportation: getOrCreate(db, 'Transportation', transportationSchema),
    Accommodation: getOrCreate(db, 'Accommodation', accommodationSchema)
});

