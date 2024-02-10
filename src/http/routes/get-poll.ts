import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'
import { z } from 'zod'

export default async function getPoll(app: FastifyInstance) {
    app.get('/polls/:pollId', async(request, reply) => {
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollId } = getPollParams.parse(request.params)

        const poll = await prisma.poll.findUnique({
            where: {
                id: pollId,
            }
        })

        return reply 
        .code(200)
        .send({
            poll
        })
    
    })
}