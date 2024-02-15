import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto' 
import prisma from '../../lib/prisma'
import { z } from 'zod'

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

        return reply 
        .code(201)
        .send()
    
    })
}