import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { voting } from '../../utils/voting-pub-sub'

//A requisição de websocket é contínua
//Pub/Sub - Padrão para trabalhar com eventos - Criação de canais (categorização de mensagens)

export default async function pollResults(app: FastifyInstance) {
    app.get('/polls/:pollId/results', { websocket: true }, (connection, request) => {
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        })

        const { pollId } = getPollParams.parse(request.params)

        // Inscrever apenas nas mensagens publicadas no canal com ID da enquete (pollId)
        voting.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message))
        })
    })
}