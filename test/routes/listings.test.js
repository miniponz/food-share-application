require('dotenv').config();
const request = require('supertest');
const app = require('../../lib/app');
const mongoose = require('mongoose');
const seedData = require('../utils/seed-data');

describe('listings routes', () => {
  beforeAll(() => {
    return mongoose.connect('mongodb://localhost:27017/napple', {
      useCreateIndex: true,
      useFindAndModify: false,
      useNewUrlParser: true
    });
  });

  beforeEach(() => {
    return mongoose.connection.dropDatabase();
  });

  afterAll(() => {
    return mongoose.connection.close();
  });

  const user = {
    username: 'wookie',
    password: 'goobers',
    role: 'User',
    email: 'feet@shoes.com',
    location: {
      address: '1919 NW Quimby St., Portland, Or',
      zip: '97209'
    }
  };

  it('creates a listing after user', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(posted => {
            expect(posted.body).toEqual({
              title: 'carrots',
              user: expect.any(String),
              location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
              category: 'produce',
              dietary: { dairy: true, gluten: true },
              _id: expect.any(String),
              postedDate: expect.any(String),
              expiration: expect.any(String),
              archived: false,
              __v: 0
            });
          });
      });
  });

  it('gets a list of listings', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            return request(app)
              .get('/api/v1/listings')
              .set('Authorization', `Bearer ${createdUser.body.token}`)
              .then(list => {
                expect(list.body).toHaveLength(1);
              });
          });
      });
  });

  it('gets by id', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(listing => {
            return request(app)
              .get(`/api/v1/listings/${listing.body._id}`)
              .set('Authorization', `Bearer ${createdUser.body.token}`)
              .then(listing => {
                expect(listing.body).toEqual({
                  title: 'carrots',
                  user: createdUser.body.user._id,
                  category: 'produce',
                  dietary: { dairy: true, gluten: true },
                  _id: expect.any(String),
                  postedDate: expect.any(String),
                  expiration: expect.any(String),
                  archived: false
                });
              });
          });
      });
  });

  it('patches by id', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(listing => {
            return request(app)
              .patch(`/api/v1/listings/${listing.body._id}`)
              .set('Authorization', `Bearer ${createdUser.body.token}`)
              .send({ title: 'ham', dietary: { dairy: false, gluten: true }, category: 'meat' })
              .then(listing => {
                expect(listing.body).toEqual({
                  title: 'ham',
                  user: createdUser.body.user._id,
                  category: 'meat',
                  dietary: { dairy: false, gluten: true },
                  _id: expect.any(String),
                  postedDate: expect.any(String),
                  expiration: expect.any(String),
                  archived: false
                });
              });
          });
      });
  });

  it('deletes by id', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(listing => {
            return request(app)
              .delete(`/api/v1/listings/${listing.body._id}`)
              .set('Authorization', `Bearer ${createdUser.body.token}`)
              .then(deleted => {
                expect(deleted.body._id).toEqual(listing.body._id);
                expect(deleted.body.archived).toEqual(true);
              });
          });
      });
  });

  it('rejects attempt to patch expiration', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(listing => {
            return request(app)
              .patch(`/api/v1/listings/${listing.body._id}`)
              .set('Authorization', `Bearer ${createdUser.body.token}`)
              .send({ expiration: 'should reject' })
              .then(listing => {
                expect(listing.body.error).toEqual('Cannot adjust expiration date');
              });
          });
      });
  });

  it('gets the listings of a single user', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            return request(app)
              .get(`/api/v1/listings/user/${createdUser.body.user._id}`);
          })
          .then(response => {
            expect(response.body).toHaveLength(1);
            expect(response.body[0].user).toEqual(createdUser.body.user._id);
          });
      });
  });

  it('gets the listings of a specific zipcode', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97200' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(createdListing => {
            return request(app)
              .get(`/api/v1/listings/zip/${createdListing.body.location.zip}`);
          })
          .then(response => {
            expect(response.body).toHaveLength(1);
            expect(response.body[0].location.zip).toEqual('97200');
          });
      });
  });

  it('returns listings n miles from user', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '915 SE 35th Ave., Portland, Or', zip: '97214' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            return request(app)
              .get('/api/v1/listings/close?radiusInMiles=10')
              .set('Authorization', `Bearer ${createdUser.body.token}`)
              .then(res => {
                expect(res.body).toEqual({ 
                  url: expect.any(String),
                  matches: 
                  [{
                    __v: 0,
                    _id: expect.any(String),
                    archived: false,
                    category: 'produce',
                    dietary: { dairy: true, gluten: true },
                    expiration: expect.any(String),
                    location: { 'address': '915 SE 35th Ave., Portland, Or', 'zip': '97214' },
                    postedDate: expect.any(String),
                    title: 'carrots',
                    user: expect.any(String)
                  }]
                });
              });
          });
      });
  });

  it('returns listings n miles from any zipcode', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots',
            user: createdUser.body.user._id,
            location: { address: '915 SE 35th Ave., Portland, Or', zip: '97214' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            const req = { body: { zip: 97215, searchRadius: 5 } };
            return request(app)
              .get(`/api/v1/listings/close/zip?zip=${req.body.zip}&radiusInMiles=${req.body.searchRadius}`)
              .then(res => {
                expect(res.body).toEqual({ 
                  url: expect.any(String),
                  matches: 
                  [{
                    __v: 0,
                    _id: expect.any(String),
                    archived: false,
                    category: 'produce',
                    dietary: { dairy: true, gluten: true },
                    expiration: expect.any(String),
                    location: { 'address': '915 SE 35th Ave., Portland, Or', 'zip': '97214' },
                    postedDate: expect.any(String),
                    title: 'carrots',
                    user: expect.any(String)
                  }]
                });
              });
          });
      });
  });

  it('displays hotzips', () => {
    return seedData()
      .then(() => {
        return request(app)
          .get('/api/v1/listings/hotzips')
          .then(zipResponse => {
            expect(zipResponse.body).toEqual(expect.any(Array));
          });
      });
  });

  it('searches title for keywords', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots and beans',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            return request(app)
              .get('/api/v1/listings/keyword?searchTerm=carrots')
              .then(found => {
                expect(found.body[0].title).toEqual('carrots and beans');
              });
          });
          
      });
  });

  it('searches title for keywords within n distance', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots and beans',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            return request(app)
              .get('/api/v1/listings/keyword/close?searchTerm=carrots&zip=97214&radiusInMiles=5')
              .then(res => {
                expect(res.body.matches[0].title).toEqual('carrots and beans');
                expect(res.body.url).toEqual(expect.any(String));
              });
          });   
      });
  });

  it('searches by dietary restriction', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots and beans',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97209' },
            category: 'produce',
            dietary: { dairy: true, gluten: true, nut: false }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            return request(app)
              .get('/api/v1/listings/dietary?dairy=true&gluten=true')
              .then(res => {
                expect(res.body[0].dietary.gluten).toEqual(true);
              });
          });   
      });
  });
  
  it('searches by dietary restriction in a specific zip', () => {
    return request(app)
      .post('/api/v1/auth/signup')
      .send(user)
      .then(createdUser => {
        return request(app)
          .post('/api/v1/listings')
          .send({
            title: 'carrots and beans',
            user: createdUser.body.user._id,
            location: { address: '1919 NW Quimby St., Portland, Or', zip: '97201' },
            category: 'produce',
            dietary: { dairy: true, gluten: true, nut: false }
          })
          .set('Authorization', `Bearer ${createdUser.body.token}`)
          .then(() => {
            return request(app)
              .get('/api/v1/listings/dietary/close?dairy=true&gluten=true&zip=97201&radiusInMiles=5')
              .then(res => {
                expect(res.body[0].dietary.gluten).toEqual(true);
              });
          });   
      });
  });
});
