import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto' 
import prisma from '../../lib/prisma'
import { z } from 'zod'
import { redis } from '../../lib/redis'
import { voting } from '../../utils/voting-pub-sub'

//O usuário pode votar em uma enquete específica - ID da Enquete é necessário
//A url tem que ser autoexplicativa
//O usuário está CRIANDO um voto - POST
//O usuário vai votar em UMA opção específica - ID da opção
//O usuário só pode votar uma vez - cookies (cabeçalho) - sessionId sempre que houver um voto
//randomUUID from crypto
//Instalar fastify cookie

export default async function voteOnPoll(app: FastifyInstance) {
    app.post('/polls/:pollId/votes', async(request, reply) => {
        const voteOnPollParams = z.object({
            pollId: z.string().uuid()
        })
        
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid()
        })
        
        const { pollId } = voteOnPollParams.parse(request.params)
        const { pollOptionId } = voteOnPollBody.parse(request.body)
        
        let { sessionId } = request.cookies

        //Validações - Regra de negócio da aplicação (não deve ser no db)
        if(sessionId) {
            //Verificar se o usuário já votou na enquete
            const userPreviousVoteOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    }
                }
            })

            //Verificar se o usuário está trocando de opção
            if(userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId != pollOptionId) {
                //Apagar anterior
                //Criar novo voto
                await prisma.vote.delete({
                    where: {
                        id: userPreviousVoteOnPoll.id,
                    }
                })

                const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)

                voting.publish(pollId, {
                    pollOptionId: userPreviousVoteOnPoll.pollOptionId,
                    votes: Number(votes),
                })

            } else if (userPreviousVoteOnPoll) { //Verificar se o usuário está votando na mesma opção
                return reply.status(400).send({message: 'You already voted on this poll!'})
            }
        }
        
        if(!sessionId) {
            sessionId = randomUUID()
        
            reply.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30, //30 dias
                signed: true,
                httpOnly: true, //Apenas acessível pelo backend
            })
        }

        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId,
            }
        })

        //Criar Ranking com Redis
        const votes = await redis.zincrby(pollId, 1, pollOptionId)

        voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes),
        })

        return reply 
        .code(201)
        .send()
    })
}