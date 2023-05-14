const AppDataSource = require('./datasource/datasource');
const Person = require('./entity/Person.js');
const Role = require('./entity/Role.js');
const fs = require('fs');
const { marked } = require('marked');
const express = require('express');
const bodyParser = require('body-parser');
const e = require('express');
const app = express();
const port = 3000;

app.use(bodyParser.json());

const personRepository = AppDataSource.getRepository(Person);
const roleRepository = AppDataSource.getRepository(Role);

// List all entries in Person
app.get('/persons', async (req, res) => {
  let persons = await personRepository.find({
    relations: {
      roles: true
    }
  });
  res.send(persons);
});

// Search Person by last_name
app.get('/persons/:last_name', async (req, res) => {
  let persons = await personRepository.find({
    where: {
      last_name: req.params.last_name
    },
    relations: {
      roles: true
    }
  });
  res.send(persons);
});

// Insert a new entry in Person
app.post('/addPerson', async (req, res) => {
  let { first_name, last_name, email } = req.body
  let dbResult = await personRepository.save({
    first_name,
    last_name,
    email
  })
  res.send(dbResult)
});

// Update first_name and last_name using email
app.patch('/persons/:email', async (req, res) => {
  let person = await personRepository.findOne({
    where: {
      email: req.params.email
    }
  });
  person.first_name = req.body.first_name || person.first_name;
  person.last_name = req.body.last_name || person.last_name;
  let result = await personRepository.save(person);
  res.send(result);
});

// Remove entries in People using email
app.delete('/persons/:email', async (req, res) => {
  let person = await personRepository.findOne({
    where: {
      email: req.params.email
    }
  });
  await personRepository.remove(person);
  res.send('Removed');
});

// List all entries in Role
app.get('/roles', async (req, res) => {
  let roles = await roleRepository.find();
  res.send(roles);
});

// Insert a new entry in Role
app.post('/roles', async (req, res) => {
  let role = new Role();
  role.name = req.body.name;
  let result = await roleRepository.save(role);
  res.send(result);
});

// Remove entries in Role using Name
app.delete('/roles/:name', async (req, res) => {
  let role = await roleRepository.findOne({
    where: {
      name: req.params.name
    }
  });
  await roleRepository.remove(role);
  res.send('Removed');
});

// Vinculate one Person to one Role
app.post('/persons/:person_id/roles/:role_id', async (req, res) => {
  let person = await personRepository.findOne(req.params.person_id, {
    relations: ['roles']
  });
  let role = await roleRepository.findOne(req.params.role_id);
  person.roles.push(role);
  let result = await personRepository.save(person);
  res.send(result);
});

// Search all Person with one Role
app.get('/roles/:role_id/persons', async (req, res) => {
  let persons = await personRepository.find({
    where: {
      roles: {
        id: req.params.role_id
      }
    },
    relations: ['roles']
  });
  res.send(persons)})
