import { fastify } from 'fastify'

const app = fastify()

app.get('/hello', () => {
    return 'Hello, NLW!'
})

app.listen({port: 3333}, () => {
    console.log('HTTP Server Running!')
})