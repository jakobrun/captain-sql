import * as faker from 'faker'
import { Client } from 'pg'

const numberOfPersons = 200
const numberOfProducts = 100

const client = new Client({
    database: 'captain_sql_test',
})

function randomNumber(max, from?) {
    return Math.floor(Math.random() * max) + (from || 0)
}

function createArray(n, f) {
    const a: any[] = []
    for (let i = 0; i < n; i++) {
        a.push(f(i))
    }
    return a
}

const innsertArray = (insertSt, array) => () =>
    Promise.all(array.map(row => client.query(insertSt, row)))

const commentColumns = (tableName, comments) => () =>
    Promise.all(
        comments.map(c =>
            client.query(`comment on column ${tableName}.${c[0]} IS '${c[1]}'`)
        )
    )

function createPersons() {
    const persons = createArray(numberOfPersons, i => {
        return [
            i,
            faker.name.findName(),
            faker.address.streetAddress(),
            faker.phone.phoneNumber(),
            faker.date.past(),
        ]
    })
    return client
        .query(
            'create table person (personid decimal(9), name varchar(400), address varchar(400), phone varchar(100), stamp TIMESTAMP, primary key(personid))'
        )
        .then(
            commentColumns('person', [
                ['personid', 'Person id test'],
                ['name', 'Full name'],
                ['address', 'Home address'],
                ['phone', 'Phonenumber'],
                ['stamp', 'Timestamp'],
            ])
        )
        .then(
            innsertArray('insert into person values($1,$2,$3,$4,$5)', persons)
        )
}

function createCompanies() {
    const companies = createArray(50, i => {
        return [
            i,
            faker.company.companyName(),
            faker.company.bs(),
            faker.phone.phoneNumber(),
            faker.date.past(),
        ]
    })
    return client
        .query(
            'create table company (companyid decimal(9), name varchar(400), bs varchar(400), phone varchar(100), stamp TIMESTAMP, primary key(companyid))'
        )
        .then(
            innsertArray(
                'insert into company values($1,$2,$3,$4,$5)',
                companies
            )
        )
}

function createProducts() {
    const products = createArray(numberOfProducts, i => {
        return [
            i,
            faker.lorem.words()[0],
            faker.finance.amount(),
            faker.date.past(),
        ]
    })
    return client
        .query(
            'create table product (productid decimal(9), name varchar(400), price decimal(17), stamp TIMESTAMP, primary key(productid))'
        )
        .then(innsertArray('insert into product values($1,$2,$3,$4)', products))
}

function createOrderItems(orders) {
    let items: any[] = []
    let i = -1
    orders.forEach((_, orderIndex) => {
        items = items.concat(
            createArray(randomNumber(10, 1), () => {
                i++
                return [
                    i,
                    orderIndex,
                    randomNumber(numberOfProducts),
                    randomNumber(10, 1),
                ]
            })
        )
    })
    return client
        .query(
            'create table orderitem (orderitemid decimal(9), orderid decimal(9), productid decimal(9), quantity decimal(9), primary key(orderitemid))'
        )
        .then(innsertArray('insert into orderitem values($1,$2,$3,$4)', items))
}

function createOrders() {
    const orders = createArray(1000, i => {
        return [i, randomNumber(numberOfPersons), faker.date.past()]
    })
    return client
        .query(
            'create table productorder (orderid decimal(9), personid decimal(9), dayOfOrder TIMESTAMP, primary key(orderid))'
        )
        .then(innsertArray('insert into productorder values($1,$2,$3)', orders))
        .then(() => {
            return createOrderItems(orders)
        })
}

function createViews() {
    return client.query(
        `create view TopCustomers as (
                SELECT pe.NAME, sum(i.QUANTITY*p.PRICE) "sum", count(o.orderid) "NumberOfOrders" FROM PERSON pe
                join PRODUCTORDER o on o.PERSONID=pe.PERSONID
                join ORDERITEM i on i.ORDERID=o.ORDERID
                join PRODUCT p on p.PRODUCTID=i.PRODUCTID
                group by pe.NAME
                order by "sum" desc
                limit 20
                )`
    )
}
const run = async () => {
    const dbCreate = new Client({})
    await dbCreate.connect()
    try {
        await dbCreate.query('drop database captain_sql_test')
    } catch (err) {
        console.log('drop err', err.message)
    }
    await dbCreate.query('create database captain_sql_test')
    await dbCreate.end()
    await client.connect()
    await createPersons()
        .then(createCompanies)
        .then(createProducts)
        .then(createOrders)
        .then(createViews)
    await client.end()
}

run().catch(err => {
    console.log('villa', err.stack)
})
