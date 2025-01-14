import express from 'express'
import logger from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import contactRouter from './routes/api/contacts.js'
import authRouter from './routes/api/auth.js'


dotenv.config()

const app = express()

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

app.use(logger(formatsLogger))
app.use(cors())
app.use(express.json())


app.use('/api/contacts', contactRouter)

app.use('/api/auth', authRouter)
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message })
})

export default app