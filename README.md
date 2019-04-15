# The Lazy Traveler

<h3 id="index">Index</h3>
1. <a href="#user-story">User Story</a><br>
2. <a href="#skills">Skills Used</a><br>
3. <a href="#api">API Documentation</a><br>
4. <a href="#links">Links to Github and live site</a>

This site was made so you can create and manage backpacking trips more easily. I was a traveler for many years myself and I understand the balance of planning and flexibility. A "leg" is a stay in a place plus a route to a destination. You'll be creating "legs" to add to a vacation.

![Landing](https://user-images.githubusercontent.com/34799623/56163616-c5d33180-5f9c-11e9-95d1-bcb50909c15e.jpg)

<h3 id="user-story">User Story</h3>

#### Registering / Logging In
As a user, you'll be able to register login information to access your account. If you already have an account, simply login.

#### Creating Your First Vacation
If this is your first time using the site, once you have been authorized, you will be re-directed to the initial vacation creation page to create your first vacation.
This form requires 
* The name of your vacation
* A total budget (in USD)
* Total length of the vacation (in days)
* A calandar selection for when you will be starting your vacation
  
![vacation-form](https://user-images.githubusercontent.com/34799623/56163870-78a38f80-5f9d-11e9-9af5-02e3ac84d98c.jpg)
  
#### Adding Legs
Once you have submitted the inital information for your vacation, you are re-directed to the main page for adding legs. To begin, you must first fill out the initial accommodation information. No particular information is required, as you can easily edit it later, as well as the trouble with knowing every particular down the line.

![add-legs](https://user-images.githubusercontent.com/34799623/56163607-bfdd5080-5f9c-11e9-8f33-93dbca1872f0.jpg)


##### Accomodation Form

* Which location you're staying in (city)
* How long
* Accommodation Type (Hotel, Hostel, AirBnb)
* A total cost for the accommodation
* Accommodation website
* General contact info and notes
* Whether the accommodation has been booked yet or not

#### After Submitting Accommodation Form
Once the form has been submitted, a bar at the top of the page is displayed that shows this "leg". The budget box is also updated.
You then have 3 choices from here. 
  1. Add another accomodation (which inherently creates a new leg)
  2. Add "route" info which represents the transportation to the next destination and is the other component of a full leg.
  3. View your current trip profile with all legs and budget visible.
  
![leg-bar](https://user-images.githubusercontent.com/34799623/56163625-c8ce2200-5f9c-11e9-8ef7-181e2a800e4c.jpg)

#### Adding Transportation Information to an Existing Leg
The visual representation of the leg at the top of the page indicates whether or not transportation information has been added yet. If you click the red box, a new form is displayed that allows for transporation information to be included for the leg.
  
  #### Transportation Form
* Where you are going
* Transportation type (plane, bus, train)
* Total cost of the transportation 
* Transportation website
* Additional notes
* Whether the transportation has been booked or not

#### Viewing Your Vacation Profile
Included on the bar where legs are visually displayed, is a "view legs" button. This takes you to an overview of all legs you have created thus far. This is the page that allows you to edit any existing information included in either accommodation, transportation, or budget. 

![view-legs](https://user-images.githubusercontent.com/34799623/56163637-d388b700-5f9c-11e9-8cbc-1ad487d424e1.jpg)

#### Editing A Leg
You have two choices for initiating an edit. You can either click on the visual boxes at the top, or click anywhere in the component that is currently displaying information. The budget box can only be edited by clicking in the component as there is no visual representation of it at the top of the page. All standard fields are editable.

![edit](https://user-images.githubusercontent.com/34799623/56163610-c2d84100-5f9c-11e9-9913-8cadcbc2bc1b.jpg)

<h2 id="skills">Skills Used</h2>

#### Back End
* Node/Express
* Mongo/Mongoose
* Mocha/Chai
* Passport
* EJS

#### Front End
* Semantic HTML
* CSS Flexbox
* A11Y
* Responsive Mobile-First Design

<h2 id="api">Sample API Call<h2>

#### Submit Transportation Info For A Leg 
Posts json data about a user's transportation information.

#### URL
/transportationSubmit/:id

#### Method:
POST

#### URL Params
Required:
id=[integer]

#### Data Params
* destination
* type
* website
* cost
* booked
* notes

#### Success Response:
Code: 200 
res.redirect("back")


#### Sample Call:
    app.post("/transportationSubmit/:id", isLoggedIn, (req, res, next) => {
      const TransToUpdate = {
        destination: req.body.transportation_destination_city,
        type: req.body.transportation_type,
        website: req.body.transportation_contact,
        cost: req.body.transportation_cost,
        booked: req.body.transportation_booked,
        notes: req.body.transportation_notes
      };
      Transportation.findOne({ _id: req.params.id })
        .catch(() => null)
        .then(transportation => {
          if (!transportation) return;
          return transportation.update({ $set: TransToUpdate });
        })
        .then(() => {
          res.redirect("back");
        })
        .catch(next);
    });
<div id="links">
Github: https://github.com/dukefan5656/Node-Capstone

Live Site: https://the-lazy-traveler.herokuapp.com/
</div>

<a href="#index">Back To Top</a>
