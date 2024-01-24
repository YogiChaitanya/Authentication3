const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running at https://yogichaitanyapncjfnjscpxtwms.drops.nxtwave.tech:3000/',
      )
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1
app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body
  const hasedPassword = await bcrypt.hash(request.body.password, 11)
  const checkTheUsername = `SELECT * FROM user WHERE username='${username}';`
  let dbUser = await db.get(checkTheUsername)

  // user exixts in database or not
  if (dbUser === undefined) {
    // check the password length
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      // create new user
      let postNewUserQuery = `
        INSERT INTO 
          user(username,name,password,gender,location)
        VALUES(
        '${username}',
        '${name}',
        '${hasedPassword}',
        '${gender}',
        '${location}');`
      await db.run(postNewUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const addUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(addUserQuery)

  if (dbUser === undefined) {
    // Invalid User
    response.status(400)
    response.send('Invalid user')
  } else {
    // check the user password
    const checkThePassword = await bcrypt.compare(password, dbUser.password)
    if (checkThePassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const checkForUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(checkForUserQuery)

  // First we have to know whether the user exists in the database or not
  if (dbUser === undefined) {
    // user not registered
    response.status(400)
    response.send('User not registered')
  } else {
    // check for password
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      // check length of the new password
      const lengthOfNewPassword = newPassword.length
      if (lengthOfNewPassword < 5) {
        // password is too short
        response.status(400)
        response.send('Password is too short')
      } else {
        // update password
        const encryptedPassword = await bcrypt.hash(newPassword, 11)
        const updatePasswordQuery = `
          UPDATE user
          SET password='${encryptedPassword}'
          WHERE username='${username}';`
        await db.run(updatePasswordQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      // invalid password
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
