var faker = require('faker'),
  q = require('q'),
  numberOfPersons = 200,
  numberOfProducts = 100;

function randomNumber(max, from) {
  return Math.floor(Math.random() * max) + (from || 0);
}

function createArray(n, f) {
  var a = [],
    i;
  for (i = 0; i < n; i++) {
    a.push(f(i));
  }
  return a;
}


module.exports = function(db) {
  function innsertArray(insertSt, array) {
    return function() {
      return q.all(array.map(function(row) {
        return db.update(insertSt, row);
      }));
    };
  }

  function commentColumns (tableName, comments) {
    return function () {
      return q.all(comments.map(function (c) {
        return db.update("comment on column " + tableName + "." + c[0] + " IS '" + c[1] + "'");
      }));
    };
  }

  function createPersons() {
    var persons = createArray(numberOfPersons, function(i) {
      return [i,
        faker.name.findName(),
        faker.address.streetAddress(),
        faker.phone.phoneNumber(),
        faker.date.past()
      ];
    });
    return db.update('create table person (personid decimal(9), name varchar(400), address varchar(400), phone varchar(100), stamp TIMESTAMP, primary key(personid))')
      .then(commentColumns('person', [
          ['personid', 'Person id test'],
          ['name', 'Full name'],
          ['address', 'Home address'],
          ['phone', 'Phonenumber'],
          ['stamp', 'Timestamp']
        ]))
      .then(innsertArray('insert into person values(?,?,?,?,?)', persons));
  }

  function createCompanies() {
    var companies = createArray(50, function(i) {
      return [i,
        faker.company.companyName(),
        faker.company.bs(),
        faker.phone.phoneNumber(),
        faker.date.past()
      ];
    });
    return db.update('create table company (companyid decimal(9), name varchar(400), bs varchar(400), phone varchar(100), stamp TIMESTAMP, primary key(companyid))')
      .then(innsertArray('insert into company values(?,?,?,?,?)', companies));
  }

  function createProducts () {
    var products = createArray(numberOfProducts, function (i) {
      return [i,
        faker.lorem.words()[0],
        faker.finance.amount(),
        faker.date.past()
      ];
    });
    return db.update('create table product (productid decimal(9), name varchar(400), price decimal(17), stamp TIMESTAMP, primary key(productid))')
      .then(innsertArray('insert into product values(?,?,?,?)', products));
  }

  function createOrders() {
    var orders = createArray(1000, function(i) {
      return [i,
        randomNumber(numberOfPersons),
        faker.date.past()
      ];
    });
    return db.update('create table productorder (orderid decimal(9), personid decimal(9), dayOfOrder TIMESTAMP, primary key(orderid))')
      .then(innsertArray('insert into productorder values(?,?,?)', orders))
      .then(function () {
        return createOrderItems(orders);
      });
  }

  function createOrderItems (orders) {
    var items = [], i = -1;
    orders.forEach(function (order, orderIndex) {
      items = items.concat(createArray(randomNumber(10, 1), function () {
        i++;
        return [i,
          orderIndex,
          randomNumber(numberOfProducts),
          randomNumber(10, 1)
        ];
      }));
    });
    return db.update('create table orderitem (orderitemid decimal(9), orderid decimal(9), productid decimal(9), quantity decimal(9), primary key(orderitemid))')
      .then(innsertArray('insert into orderitem values(?,?,?,?)', items));
  }

  return createPersons()
    .then(createCompanies)
    .then(createProducts)
    .then(createOrders);
};
