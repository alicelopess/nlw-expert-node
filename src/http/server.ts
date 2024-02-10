import { fastify } from 'fastify'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const app = fastify()

//conexão com o prisma
const prisma = new PrismaClient()

app.get('/hello', () => {
    return 'Hello, NLW!'
})

app.post('/polls', async(request, reply) => {
    const createPollBody = z.object({
        title: z.string()
    })
    
    const { title } = createPollBody.parse(request.body)

    const poll = await prisma.poll.create({
        //dados que você quer inserir
        data: {
            title,
        }
    })

    return reply 
    .code(201)
    .send({
        message: 'Enquete criada com sucesso!',
        pollId: poll.id 
    })

})

app.listen({port: 3333}).then(() => {
    console.log('HTTP Server Running!')})