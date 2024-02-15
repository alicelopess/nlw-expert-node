import { FastifyInstance } from 'fastify'
import prisma from '../../lib/prisma'
import { z } from 'zod'
import { redis } from '../../lib/redis'

export default async function getPoll(app: FastifyInstance) {
    app.get('/polls/:pollId', async(request, reply) => {
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollId } = getPollParams.parse(request.params)

        const poll = await prisma.poll.findUnique({
            where: {
                id: pollId,
            },
            include: { //adiciona dados de relacionamentos
                options: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        })

        if(!poll) {
            return reply.status(400).send({message: 'Poll not found!'})
        }

        const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES') //O retorno é um array no formato [opção, qtd, opção, qtd]

        //Transforme o retorno do array
        const votes = result.reduce((object, line, index) => {
            if(index % 2 === 0) {
                const score = result[index + 1]

                Object.assign(object, {[line]: Number(score)})
            }

            return object
        }, {} as Record<string, number>)

        return reply 
        .code(200)
        .send({
            poll: {
                id: poll.id,
                title: poll.title,
                options: poll.options.map(option => {
                    return {
                        id: option.id,
                        title: option.title,
                        score: (option.id in votes) ? votes[option.id] : 0
                    }
                })
            }
        })
    })
}