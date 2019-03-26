module.exports = function (app, passport) {
    const { User, Leg, Accommodation, Vacation, Transportation } = require('./models/user')(app.locals.db);


    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/profile', isLoggedIn, async function (req, res, next) {
        let user = req.user;
        let accommodationCost = 0;
        let transportationCost = 0;
        let daysCost = 0;

        Vacation.find({ _id: { $in: user.vacations } })
            .populate('legs')
            .then((vacations) => {
                if (!vacations.length){
                    return res.redirect('/create');
                }

                for (let i = 0; i < vacations[0].legs.length; i++) {
                    accommodationCost += vacations[0].legs[i].accommodation.cost;
                    transportationCost += vacations[0].legs[i].transportation.cost;
                    daysCost += vacations[0].legs[i].accommodation.days;
                };
                user.vacations = vacations;
                res.render('profile.ejs', {
                    user: req.user,
                    vacation: vacations,
                    legs: vacations.legs,
                    accommodationCost,
                    transportationCost,
                    daysCost
                });
            })
            .catch(next);


    });

    app.get('/vacation/:id', isLoggedIn, async (req, res, next) => {
        try {

            const vacation = await Vacation.findOne({ _id: req.params.id }).catch(() => null);
            if (!vacation){
                return res.redirect('/profile');
            }

            if (!req.user.vacations.find(vid => vid.toString() === vacation._id.toString())){
                return res.redirect('/profile');
            }

            const legs = await Leg.find({ _id: { $in: vacation.legs } }).populate('accommodation').populate('transportation');
            let accommodationCost = 0;
            let transportationCost = 0;
            let daysCost = 0;
            for (i = 0; i < legs.length; i++) {
                accommodationCost += legs[i].accommodation.cost;
                transportationCost += legs[i].transportation.cost;
                daysCost += legs[i].accommodation.days;
            };

            res.render('vacationdetail.ejs', {
                user: req.user,
                vacation: vacation,
                legs: legs,
                accommodationCost: accommodationCost,
                transportationCost: transportationCost,
                daysCost
            });
        } catch (err) {
            next(err)
        };
    });

    app.get('/create', isLoggedIn, (req, res) => {
        res.render('create.ejs', {
            user: req.user
        });
    });

    app.post('/updateAccommodationLeg/:id', isLoggedIn, (req, res, next) => {

        const AccomEditFields = ["city", "cost", "type", "name", "days", "website", "notes", "booked"];

        let AccomToUpdate = {};


        for (const param of ['cost', 'days']){
            if (req.body[param] !== undefined && isNaN(Number(req.body[param]))){
                return res.redirect('back');
            }
        }

        if (req.body.type !== undefined && !['Hostel', 'Hotel', 'AirBnB'].includes(req.body.type)){
            return res.redirect('back');
        }

        if (req.body.booked !== undefined && !['true, false'].includes(req.body.booked)){
            return res.redirect('back');
        }

        AccomEditFields.forEach(editedFields => {
            if (editedFields in req.body) {
                AccomToUpdate[editedFields] = req.body[editedFields];
            }
        })
        Accommodation.findOne({ _id: req.params.id }).catch(() => null).then(accommodation => {
                if (!accommodation) return;
                return accommodation.update({ $set: AccomToUpdate });
            })
            .then((vaca) => {

                res.redirect('back');

            })
            .catch(next)
    });

    app.post('/updateTransportationLeg/:id', isLoggedIn, (req, res, next) => {
        const TransEditFields = ["destination", "type", "contact", "cost", "notes", "booked"];
        let TransToUpdate = {};

        if (req.body.cost !== undefined && isNaN(Number(req.body.cost))){
            return res.redirect('back');
        }

        if (req.body.type !== undefined && !['Plane', 'Train', 'Bus'].includes(req.body.type)){
            return res.redirect('back');
        }

        if (req.body.booked !== undefined && !['true, false'].includes(req.body.booked)){
            return res.redirect('back');
        }

        TransEditFields.forEach(editedFields => {
            if (editedFields in req.body) {
                TransToUpdate[editedFields] = req.body[editedFields];
            }
        })
        Transportation.findOne({ _id: req.params.id }).catch(() => null).then(transportation => {
                if (!transportation) return;
                return transportation.update({ $set: TransToUpdate });
            })
            .then((vaca) => {
                res.redirect('back');
            })
            .catch(next);
    });

    app.post('/updateBudget/:id', isLoggedIn, (req, res, next) => {
        const budgetEditFields = ["daysBudget", "moneyBudget"];
        let budgetToUpdate = {};

        for (const editedFields of budgetEditFields){
            if (editedFields in req.body) {
                if (isNaN(Number(req.body[editedFields]))){
                    return res.redirect('back');
                }
                budgetToUpdate[editedFields] = req.body[editedFields];
            }
        }

        if (!req.user.vacations.find(vid => vid.toString() === req.params.id.toString())){
            return res.redirect('back');
        }

        Vacation.findOne({ _id: req.params.id }).catch(() => null).then(vacation => {
            if (!vacation) return;
            return vacation.update({ $set: budgetToUpdate });
        })
            .then((vaca) => {
                res.redirect('back');
            }).catch(next)
    });

    app.post('/transportationSubmit/:id', isLoggedIn, (req, res, next) => {
        for (const param of ['transportation_cost', 'days']){
            if (req.body[param] !== undefined && isNaN(Number(req.body[param]))){
                return res.redirect('back');
            }
        }

        if (req.body.transportation_type !== undefined && !['Plane', 'Train', 'Bus'].includes(req.body.transportation_type)){
            return res.redirect('back');
        }

        if (req.body.transportation_booked !== undefined && !['true, false'].includes(req.body.transportation_booked)){
            return res.redirect('back');
        }

        let id = req.params.id;
        const TransToUpdate = {
            destination: req.body.transportation_destination_city,
            type: req.body.transportation_type,
            website: req.body.transportation_contact,
            cost: req.body.transportation_cost,
            booked: req.body.transportation_booked,
            notes: req.body.transportation_notes,
        };
        let days = parseInt(req.body.days, 10)
        Transportation.findOne({ _id: req.params.id }).catch(() => null).then(transportation => {
            if (!transportation) return;
            return transportation.update({ $set: TransToUpdate });
        })
            .then((updated) => {
                res.redirect('back');
            })

            .catch(next);
    });

    app.post('/accommodationSubmit', isLoggedIn, (req, res, next) => {
        for (const param of ['cost', 'days']){
            if (req.body[param] !== undefined && isNaN(Number(req.body[param]))){
                return res.redirect('/profile');
            }
        }

        if (req.body.type !== undefined && !['Hostel', 'Hotel', 'AirBnB'].includes(req.body.type)){
            return res.redirect('/profile');
        }

        if (req.body.booked !== undefined && !['true, false'].includes(req.body.booked)){
            return res.redirect('/profile');
        }

        if (req.body.vacationID === undefined || !req.user.vacations.find(vid => vid.toString() === req.body.vacationID.toString())){
            return res.redirect('/profile');
        }

        let accommodationID;
        let legID;
        const newAccommodation = {
            city: req.body.city,
            cost: req.body.cost,
            type: req.body.type,
            name: req.body.accommodation_name,
            days: req.body.days,
            website: req.body.website,
            booked: req.body.booked,
            notes: req.body.notes
        };
        const newTransportation = {
            destination: "",
            type: "",
            website: "",
            cost: "0",
            booked: "false",
            notes: "",
        };
        let days = parseInt(req.body.days, 10)
        Accommodation.create(newAccommodation)
            .then((accommodation) => {
                return accommodation._id;
            })
            .then((aID) => {
                accommodationID = aID;
                return Transportation.create(newTransportation)
            })
            .then((transportation) => {
                const transportationID = transportation._id;
                return Leg.create({ accommodation: accommodationID, transportation: transportationID })
            })
            .then((leg) => {
                legID = leg._id;
                return Vacation.findOne({ _id: req.body.vacationID })
            })
            .then((vacation) => {
                vacation.legs.push(legID);
                return vacation.save()
            })
            .then((updatedVacation) => {

                res.redirect('/profile');
            })
            .catch(next);
    });

    app.post('/create', isLoggedIn, (req, res, next) => {
        for (const param of ['budget', 'days']){
            if (req.body[param] !== undefined && isNaN(Number(req.body[param]))){
                return res.redirect('/create');
            }
        }

        if (req.body.calendar !== undefined && isNaN(new Date(req.body.calendar || 0).getTime())){
            return res.redirect('/create');
        }

        let vacationID;
        let newVacation = {
            name: req.body.name,
            budget: {
                moneyBudget: req.body.budget,
                daysBudget: req.body.days,
                moneyUsed: 0,
                daysUsed: 0
            },
            legs: [],
            startDate: req.body.calendar,
            numDays: req.body.days,
        };
        Vacation.create(newVacation)
            .then((vacation) => {
                vacationID = vacation._id;

                newVacation = vacation;
                return User.findOne({ _id: req.user._id });
            })
            .then((user) => {

                user.vacations.push(vacationID);
                return user.save();
            })
            .then((savedUser) => {
                res.redirect('/profile');
            })
            .catch(next);
    });


    // LOGOUT ==============================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });


    // AUTHENTICATE ================================================================


    // LOGIN ===============================
    app.get('/login', function (req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/seller_profile',
        failureRedirect: '/login',
        failureFlash: true 
    }));

    // SIGNUP =================================
    app.get('/signup', function (req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/create',
        failureRedirect: '/signup',
        failureFlash: true
    }));



    app.get('/connect/local', function (req, res) {
        res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/connect/local',
        failureFlash: true 
    }));



    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
