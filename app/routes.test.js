const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const mongoose = require('mongoose');

const { app, DATABASE_URL } = require('../server.js');


const closeAgent = agent => {
	return new Promise(resolve => agent.close(resolve));
}

const expectRedirect = (path, agent, dest) => (agent ? agent : chai.request(app)).get(path).redirects(0).then(res => {
	expect(res).to.have.status(302);
	expect(res.header.location).to.equal(dest);

	if (agent) return closeAgent(agent);
})

const expectRequest = (path, agent, code, type) => (agent ? agent : chai.request(app)).get(path).redirects(0).then(res => {
	if (code !== null) expect(res).to.have.status(code);
	if (type !== null) expect(res).to.be[type];

	if (agent) return closeAgent(agent);
});

const getFlashMessage = res => {
	expect(res).to.to.html;
	if (res.text.includes('<div class="alert alert-danger">')){
		return res.text.split('<div class="alert alert-danger">')[1].split('</div>')[0];
	}

	return null;
}

const getUser = async (email, password) => {
	if (!password){
		password = email;
	}

	const agent = chai.request.agent(app);
	const loginRes = await agent.post('/login').type('form').send({email, password}).redirects(0);
	if (loginRes.header.location === '/profile'){
		return agent;
	}
	
	return closeAgent(agent)
		.then(() => createUser(email, password))
		.then(() => getUser(email, password));
}

const createUser = (email, password) => {
	email = email.toLowerCase();
	if (!password){
		password = email;
	}

	const user = new app.locals.db.models.User();
	user.local.email = email;
	user.local.password = user.generateHash(password);
	return user.save().then(() => user._id.toString());
}

const createVacation = async (ownerEmail, full=false) => {
	const vacation = await app.locals.db.models.Vacation.create({
		name: '',
		budget: {
				moneyBudget: 0,
				daysBudget: 0,
				moneyUsed: 0,
				daysUsed: 0
		},
		legs: [],
		startDate: 0,
		numDays: 0,
	});

	const owner = await app.locals.db.models.User.findOne({ 'local.email': ownerEmail });
	owner.vacations.push(vacation._id);
	await owner.save();

	return full ? vacation : vacation._id.toString();
}

const createTransportation = () => {
	return app.locals.db.models.Transportation.create({
		destination: "",
		type: "",
		website: "",
		cost: "0",
		booked: "false",
		notes: "",
	}).then(transportation => {
		return transportation.save().then(() => transportation._id.toString()); 
	});
}

const createAccommodation = () => {
	return app.locals.db.models.Accommodation.create({
		city: '',
		cost: 0,
		type: 'Hostel',
		name: '',
		days: 0,
		website: '',
		booked: 'false',
		notes: ''
	}).then(accommodation => {
		return accommodation.save().then(() => accommodation._id.toString());
	})
}


before(async () => {
	await app.locals.db.disconnect();

	const url = DATABASE_URL.split('/').slice(0, -1).join('/') + '/testing';
	app.locals.db = mongoose.connect(url, {
		useNewUrlParser: true
	}, error => error ? console.log(error) : console.log('connected to testing db'));

	return mongoose.connection.dropDatabase();
});

after(() => {
	return app.locals.db.disconnect();
});


describe('/', () => {
	describe('GET', () => {
		it('returns 200 with HTML', () => {
			return expectRequest('/', null, 200, 'html');
		});
	});
});

describe('/signup', () => {
	describe('GET', () => {
		it('returns 200 with HTML', () => {
			return expectRequest('/signup', null, 200, 'html');
		});
	});

	describe('POST', () => {
		it('signs up', () => {
			const agent = chai.request.agent(app);
			return agent.post('/signup').type('form').send({ email: 'signup', password: 'signup' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/create`);
				return closeAgent(agent);
			});
		});

		it('requires email and password', async () => {
			const test = key => chai.request(app).post('/signup').type('form').send({ [key]: `requires ${key}` }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/signup`);
			});
			await test('email');
			await test('password');
		});

		it('only allows one account per email', async () => {
			await createUser('unique_email');

			const agent = chai.request.agent(app);
			return agent.post('/signup').type('form').send({ email: 'unique_email', password: 'password' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/signup`);
				expect(getFlashMessage(res)).to.equal('That email is already taken.');
				return closeAgent(agent);
			});
		});

		it('emails are case insensitive', async () => {
			await createUser('CASE_insensitive');

			const agent = chai.request.agent(app);
			return agent.post('/signup').type('form').send({ email: 'case_insensitive', password: 'password' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/signup`);
				expect(getFlashMessage(res)).to.equal('That email is already taken.');
				return closeAgent(agent);
			});
		});

		it('user is logged in but has no local account');
	});
});

describe('/login', () => {
	describe('GET', () => {
		it('returns 200 with HTML', () => {
			return expectRequest('/login', null, 200, 'html');
		});
	});
	
	describe('POST', () => {
		it('logs in', async () => {
			await createUser('login_post');

			const agent = chai.request.agent(app);
			return agent.post('/login').type('form').send({ email: 'login_post', password: 'login_post' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/profile`);
				return closeAgent(agent);
			});
		});

		it('handles non-existent users', () => {
			const agent = chai.request.agent(app);
			return agent.post('/login').type('form').send({ email: 'non_existent', password: 'non_existent' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/login`);
				expect(getFlashMessage(res)).to.equal('No user found.');
				return closeAgent(agent);
			});
		});

		it('handles invalid passwords', async () => {
			await createUser('invalid_password');

			const agent = chai.request.agent(app);
			return agent.post('/login').type('form').send({ email: 'invalid_password', password: 'wrong' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/login`);
				expect(getFlashMessage(res)).to.equal('Oops! Wrong password.');
				return closeAgent(agent);
			});
		})
	});
});

describe('/logout', () => {
	describe('GET', () => {
		it('logs user out', async () => {
			const agent = await getUser('logout');
			await agent.get('/logout').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});
			return agent.get('/profile').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
				return closeAgent(agent);
			});
		});
	})
});

describe('/unlink/local', () => {
	describe('GET', () => {
		it('does not logout user', async () => {
			const agent = await getUser('unlink_logged_in');
			await agent.get('/unlink/local');
			return expectRequest('/create', agent, 200, 'html');
		});

		it('clears user local information', async () => {
			let agent = await getUser('unlink_logging_out')
			await agent.get('/unlink/local');
			await closeAgent(agent);

			agent = chai.request.agent(app);
			return agent.post('/login').type('form').send({ email: 'unlink_logging_out', password: 'unlink_logging_out' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/login`);
				expect(getFlashMessage(res)).to.equal('No user found.');
				return closeAgent(agent);
			});
		});
	});
});

describe('/connect/local', () => {
	describe('GET', () => {
		it('returns 200 with HTML', () => {
			return expectRequest('/connect/local', null, 200, 'html');
		})
	});
});

describe('/create', () => {
	describe('GET', () => {
		it('returns 200 with HTML when logged in', async () => {
			const agent = await getUser('logged_in');
			return expectRequest('/create', agent, 200, 'html');
		});

		it('redirects to "/" when not logged in', () => {
			return expectRedirect('/create', null, '/');
		});
	});

	describe('POST', () => {
		it('creates a vacation', async () => {
			const agent = await getUser('create');
			return agent.post('/create').type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/profile`);
				return closeAgent(agent);
			});
		});

		it('handles invalid param types', async () => {
			const agent = await getUser('create');
			const test = (key, value, dest='/create') => agent.post('/create').type('form').send({ [key]: value }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}${dest}`);
			});

			await test('name', 5, '/profile');
			await test('calendar', 'abc');
			await test('budget', 'def');
			await test('days', 'ghi');

			return closeAgent(agent);
		});
	});
});

describe('/profile', () => {
	describe('GET', () => {
		it('redirects to "/create" when logged in with no vacations', async () => {
			const agent = await getUser('profile');
			return expectRedirect('/profile', agent, '/create');
		});

		it('returns 200 with HTML when logged in with a Vacation', async () => {
			const agent = await getUser('profile_full');
			await createVacation('profile_full');
			return expectRequest('/profile', agent, 200, 'html');
		});

		it('redirects to "/" when not logged in', () => {
			return expectRedirect('/profile', null, '/');
		});
	})
});

describe('/vacation/:id', () => {
	describe('GET', () => {
		it('returns 200 with HTML when logged in and passed a valid Vacation', async () => {
			const accommodation = await createAccommodation();
			const transportation = await createTransportation();
			const leg = await app.locals.db.models.Leg.create({ accommodation, transportation });

			const agent = await getUser('vacation_get');
			const vacation = await createVacation('vacation_get', true);
			vacation.legs.push(leg._id)
			await vacation.save();

			return expectRequest(`/vacation/${vacation._id.toString()}`, agent, 200, 'html');
		});

		it('redirects to "/" when not logged in', () => {
			return expectRedirect('/profile', null, '/');
		});

		it('redirects to "/profile" when passed an invalid Vacation', async () => {
			const agent = await getUser('vacation_get');
			await expectRedirect('/vacation/notarealid', agent, '/profile');
		});

		it('redirects to "/profile" when passed another users Vacation', async () => {
			const agent = await getUser('vacation_get');
			await createUser('vacation_get_other');
			const id = await createVacation('vacation_get_other');
			return expectRedirect(`/vacation/${id}`, agent, '/profile');
		});
	});
});

describe('/accommodationSubmit', () => {
	describe('POST', () => {
		it('submits an accommodation', async () => {
			const agent = await getUser('accommodation_submit');
			const vacationID = await createVacation('accommodation_submit');
			return agent.post('/accommodationSubmit').type('form').send({ vacationID }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/profile`);
				return closeAgent(agent);
			});
		});

		it('redirects to "/" when not logged in', async () => {
			const vacationID = await createVacation('accommodation_submit');
			return chai.request(app).post('/accommodationSubmit').type('form').send({ vacationID }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});
		});

		it('redirects to "/profile" for other users Vacations', async () => {
			const agent = await getUser('accommodation_submit');
			
			await getUser('accommodation_submit_other');
			const vacationID = await createVacation('accommodation_submit_other');
			return agent.post('/accommodationSubmit').type('form').send({ vacationID }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/profile`);
				return closeAgent(agent);
			});
		});

		it('handles non-existent Vacations', async () => {
			const agent = await getUser('accommodation_submit');
			await agent.post('/accommodationSubmit').type('form').send({ vacationID: 'notarealid' }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/profile`);
			});
			return agent.post('/accommodationSubmit').type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/profile`);
				return closeAgent(agent);
			});
		});

		it('handles invalid param types', async () => {
			const agent = await getUser('accommodation_submit');
			const vacationID = await createVacation('accommodation_submit');
			const test = (key, value) => agent.post('/accommodationSubmit').type('form').send({ vacationID, [key]: value }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/profile`);
			});

			await test('city', 1);
			await test('accommodation_name', );
			await test('website', );
			await test('notes', );

			await test('cost', 'abc');
			await test('days', 'def');

			await test('booked', 'unknown');


			for (const validType of ['Hostel', 'Hotel', 'AirBnB']){
				await test('type', validType);
			}

			await test('type', 'othertype');

			return closeAgent(agent);
		});
	});
});

describe('/updateBudget/:id', () => {
	describe('POST', () => {
		it('works when logged in and redirects back', async () => {
			const agent = await getUser('update_budget');
			const id = await createVacation('update_budget');
			await agent.post(`/updateBudget/${id}`).type('form')
				.set('Referrer', `/randomPage`).send({ id }).redirects(0)
				.then(res => {
					expect(res).to.have.status(302)
					expect(res.header.location).to.equal('/randomPage');

					return closeAgent(agent);
				});
		});

		it('redirects to "/" when not logged in', () => {
			return chai.request(app).post('/updateBudget/notarealid').type('form').set('Referrer', `/randomPage`).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});
		});

		it('redirects back for an invalid Vacation', async () => {
			const agent = await getUser('update_budget');
			await agent.post('/updateBudget/notarealid').type('form').redirects(0).then(res => {
				expect(res).to.redirectTo(`/`);
			});
		});

		it('allows editing of fields', async () => {
			const agent = await getUser('update_budget');
			const id = await createVacation('update_budget');
			return agent.post(`/updateBudget/${id}`).type('form').send({ daysBudget: 1, moneyBudget: 2}).then(res => {
				expect(res).to.have.status(200);
				return closeAgent(agent);
			});
		});

		it('handles invalid param types', async () => {
			const agent = await getUser('update_budget');
			const id = await createVacation('update_budget');

			const test = (key, value) => agent.post(`/updateBudget/${id}`).type('form').send({ [key]: value }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});

			await test('daysBudget', 'abc');
			await test('moneyBudget', 'def');

			return closeAgent(agent);
		});
	});
});

describe('/transportationSubmit/:id', () => {
	describe('POST', () => {
		it('edits a transportation', async () => {
			const agent = await getUser('transportation_submit');
			const id = await createTransportation();
			return agent.post(`/transportationSubmit/${id}`).type('form').send({ transportation_cost: 0 }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
				return closeAgent(agent);
			});
		});

		it('redirects to "/" when not logged in', async () => {
			const id = await createTransportation();
			return chai.request(app).post(`/transportationSubmit/${id}`).type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});
		});

		it('handles non-existent Transportations', async () => {
			const agent = await getUser('transportation_submit');
			return agent.post('/transportationSubmit/notarealid').type('form').send({ transportation_cost: 0 }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
				return closeAgent(agent);
			});
		});

		it('handles invalid param types', async () => {
			const agent = await getUser('transportation_submit');
			const id = await createTransportation();
			const test = (key, value) => agent.post(`/transportationSubmit/${id}`).type('form').send({ transportation_cost: 0, [key]: value }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});

			await test('transportation_destination_city', 1);
			await test('transportation_name', 2);
			await test('transportation_contact', 3);
			await test('transportation_notes', 4);

			await test('days', 'abc');

			await test('transportation_booked', 'unknown');


			for (const validType of ['Plane', 'Train', 'Bus']){
				await test('transportation_type', validType);
			}

			await test('transportation_type', 'othertype');

			return closeAgent(agent);
		});
	});
});

describe('/updateTransportationLeg/:id', () => {
	describe('POST', () => {
		it('updates a transportation', async () => {
			const agent = await getUser('transportation_update');
			const id = await createTransportation();
			return agent.post(`/updateTransportationLeg/${id}`).type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
				return closeAgent(agent);
			});
		});

		it('redirects to "/" when not logged in', async () => {
			const id = await createTransportation();
			return chai.request(app).post(`/updateTransportationLeg/${id}`).type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});
		});

		it('handles non-existent Transportations', async () => {
			const agent = await getUser('transportation_update');
			return agent.post('/updateTransportationLeg/notarealid').type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
				return closeAgent(agent);
			});
		});

		it('handles invalid param types', async () => {
			const agent = await getUser('transportation_update');
			const id = await createTransportation();
			const test = (key, value) => agent.post(`/updateTransportationLeg/${id}`).type('form').send({ [key]: value }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});

			await test('destination_city', 1);
			await test('name', 2);
			await test('contact', 3);
			await test('notes', 4);

			await test('days', 'abc');
			await test('cost', 'def');

			await test('booked', 'unknown');


			for (const validType of ['Plane', 'Train', 'Bus']){
				await test('type', validType);
			}

			await test('type', 'othertype');

			return closeAgent(agent);
		});
	});
});

describe('/updateAccommodationLeg/:id', () => {
	describe('POST', () => {
		it('updates a Accommodation', async () => {
			const agent = await getUser('accommodation_update');
			const id = await createAccommodation();
			return agent.post(`/updateAccommodationLeg/${id}`).type('form').send({city: 'abc', cost: 1 }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
				return closeAgent(agent);
			});
		});

		it('redirects to "/" when not logged in', async () => {
			const id = await createAccommodation();
			return chai.request(app).post(`/updateAccommodationLeg/${id}`).type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});
		});

		it('handles non-existent Accommodations', async () => {
			const agent = await getUser('accommodation_update');
			return agent.post('/updateAccommodationLeg/notarealid').type('form').then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
				return closeAgent(agent);
			});
		});

		it('handles invalid param types', async () => {
			const agent = await getUser('accommodation_update');
			const id = await createAccommodation();
			const test = (key, value) => agent.post(`/updateAccommodationLeg/${id}`).type('form').send({ [key]: value }).then(res => {
				expect(res).to.redirectTo(`http://${res.request.host}/`);
			});

			await test('city', 1);
			await test('name', 2);
			await test('contact', 3);
			await test('notes', 4);

			await test('days', 'abc');
			await test('cost', 'def');

			await test('booked', 'unknown');


			for (const validType of ['Hostel', 'Hotel', 'AirBnB']){
				await test('type', validType);
			}

			await test('type', 'othertype');

			return closeAgent(agent);
		});
	});
});