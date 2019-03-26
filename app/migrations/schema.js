const bcrypt   = require('bcrypt-nodejs');

const userSchema = mongoose.Schema ({
  local: {
    email: String,
    password: String,
    },
  issuedAt: Date,
  firstName: String,
  lastName: String
});

const listingSchema = mongoose.Schema ({
  headline: {type: String, required },
  address : {
    street: { type: String, required },
    zip: {type: String, required},
    city: {type: String, required},
    state: {type: String, required},
  },
  type: {type: String, required},
  user: {type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  bed: {type: Number, required},
  bath: {type: Number, required},
  footage: {type: Number, required},
  description: {type: String, required},
  issuedAt: Date,
  expiresAt: {type: Date, required},
  deleted: {
    deletedDate: Date,
    is: Boolean
  }
});

const bidSchema = mongoose.Schema ({
  user: {type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  listing: {type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
  },
  amount: {type: Number, required},
  createdAt: {type: Date, required}
})