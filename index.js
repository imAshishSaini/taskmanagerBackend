const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const {incomingRequestLogger} = require('./middleware/index')
const userRouter = require('./routes/user')
const taskRouter = require('./routes/task')

dotenv.config()
const app = express()
const cors = require('cors')

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(incomingRequestLogger)

app.use('/api/user', userRouter)
app.use('/api/task', taskRouter)

mongoose.connect(process.env.MONGOOSE_URI_STRING, {})
.then(() => console.log('Connected to database'))
.catch((err) => console.log('Error connecting to database', err))

app.listen(process.env.PORT || 3000, () => console.log('Server started on port', process.env.PORT || 3000))