const AppDataSource = require('./datasource/datasource');
const Person = require('./entity/Person.js');
const Role = require('./entity/Role.js');
const fs = require('fs');
const { marked } = require('marked');
const express = require('express');
const bodyParser = require('body-parser');
const e = require('express');
const app = express();
const port = 4000;

app.use(bodyParser.json());

const personRepository = AppDataSource.getRepository(Person);
const roleRepository = AppDataSource.getRepository(Role);

// 1 List all entries in Person
app.get('/persons', async (req, res) => {
  let persons = await personRepository.find({
    relations: {
      roles: true
    }
  });
  res.send(persons);
});

// 2 Search Person by last_name
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

// 3 Insert a new entry in Person
app.post('/addPerson', async (req, res) => {
  let { first_name, last_name, email } = req.body
  let dbResult = await personRepository.save({
    first_name,
    last_name,
    email
  })
  res.send(dbResult)
});

// 4 Update first_name and last_name using email
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

// 5 Remove entries in People using email
app.delete('/persons/:email', async (req, res) => {
  let person = await personRepository.findOne({
    where: {
      email: req.params.email
    }
  });
  await personRepository.remove(person);
  res.send('Removed');
});

// 6 List all entries in Role
app.get('/roles', async (req, res) => {
  let roles = await roleRepository.find();
  res.send(roles);
});

// 7 Insert a new entry in Role
app.post('/roles', async (req, res) => {
  let { name } = req.body;
  let role = { name };
  let result = await roleRepository.save(role);
  res.send(result);
});  

// 8 Remove entries in Role using Name 
app.delete('/roles/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const role = await roleRepository.findOne({
      where: { name }
    });
    if (!role) {
      return res.status(404).send('Role not found.');
    }
    await roleRepository.remove(role);
    res.send('Role removed successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while deleting the role.');
  }
});

// 9 Vinculate one Person to one Role
app.post('/persons/:email/roles/:name', async (req, res) => {
  const { email, name } = req.params;
  const person = await personRepository.findOne({
    where: { email },
    relations: ['roles']
  });
  const role = await roleRepository.findOne({ where: { name } });
  if (person && role) {
    person.roles = role.name;
    const result = await personRepository.save(person);
    res.send(result);
  } else {
    res.status(404).send('Person or role not found.');
  }
});

// 10 Search all Person with one Role
app.get('/roles/:names/persons', async (req, res) => {
  const roleNames = req.params.names.split(',');
  const persons = await personRepository.find({
    where: {
      roles: {
        name: roleNames
      }
    },
    relations: ['roles']
  });
  res.send(persons);
});

// 11 Get all Roles of one Person F CHECK
app.get('/persons/:email/roles', async (req, res) => {
  const person = await personRepository.findOne({
    where: {
      email: req.params.email
    },
    relations: ['roles']
  });
  if (person) {
    res.send(person.roles);
  } else {
    res.status(404).send('Person not found.');
  }
});

// 12 Remove one Role of one Person 
app.delete('/persons/:email/roles/:name', async (req, res) => {
  const { email, name } = req.params;
  const person = await personRepository.findOne({
    where: {
      email
    },
    relations: ['roles']
  });
  if (person) {
    person.roles = person.roles.filter(role => role.name !== name);
    const result = await personRepository.save(person);
    res.send(result);
  } else {
    res.status(404).send('Person not found.');
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
