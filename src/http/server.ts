import { fastify } from 'fastify'
import createPoll from '../http/routes/create-poll'

const app = fastify()

app.register(createPoll)

app.get('/hello', () => {
    return 'Hello, NLW!'
})

app.listen({port: 3333}).then(() => {
    console.log('HTTP Server Running!')})