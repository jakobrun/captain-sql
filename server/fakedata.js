var Faker = require('Faker'),
  q = require('q');

function createPersons (db) {
  var persons = [], i;
  for (i = 0; i < 200; i++) {
    persons.push([i,
      Faker.Name.findName(),
      Faker.Address.streetAddress(),
      Faker.PhoneNumber.phoneNumber(),
      Faker.Date.past()]);
  }
  return db.update('create table person (personid decimal(9), name varchar(400), address varchar(400), phone varchar(100), stamp TIMESTAMP, primary key(personid))')
    .then(function() {
      return q.all(persons.map(function(row) {
        return db.update('insert into person values(?,?,?,?,?)', row);
      }));
    });
}

function createCompanies (db) {
  var companies = [], i;
  for (i = 0; i < 50; i++) {
    companies.push([i,
      Faker.Company.companyName(),
      Faker.Company.bs(),
      Faker.PhoneNumber.phoneNumber(),
      Faker.Date.past()]);
  }
  return db.update('create table company (companyid decimal(9), name varchar(400), bs varchar(400), phone varchar(100), stamp TIMESTAMP, primary key(companyid))')
    .then(function() {
      return q.all(companies.map(function(row) {
        return db.update('insert into company values(?,?,?,?,?)', row);
      }));
    });  
}

module.exports = function(db) {
  return q.all([createPersons(db), createCompanies(db)]);
};
