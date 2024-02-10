import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'
import { z } from 'zod'

export default async function createPoll(app: FastifyInstance) {
    app.post('/polls', async(request, reply) => {
        const createPollBody = z.object({
            title: z.string(),
            options: z.array(z.string()) //['', '', ''] - array de strings
        })
        
        const { title, options } = createPollBody.parse(request.body)
    
        const poll = await prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: { //Crie várias opções ao mesmo tempo que cria a enquete - relacionamento
                        data: options.map(option => {
                            return {title: option}
                        })
                    }
                }
            }
        })
    
        return reply 
        .code(201)
        .send({
            message: 'Enquete criada com sucesso!',
            pollId: poll.id 
        })
    
    })
}