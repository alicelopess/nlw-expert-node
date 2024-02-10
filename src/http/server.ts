import { fastify } from 'fastify'
import createPoll from '../http/routes/create-poll'
import getPoll from './routes/get-poll'

const app = fastify()

app.register(createPoll)
app.register(getPoll)

app.get('/hello', () => {
    return 'Hello, NLW!'
})

app.listen({port: 3333}).then(() => {
    console.log('HTTP Server Running!')})