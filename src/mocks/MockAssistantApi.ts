import type { AssistantApi } from '../api/DashboardApi'
import type { AssistantReply, AssistantRequest } from '../types/Assistant'
import { MockResource } from './MockResource'

// Answers of the fake assistant. They play the part of what Amazon Bedrock writes on the server
// (like the names in data.ts), so they live here and not in the locale files.
const ANSWERS = {
  es: {
    observed:
      'Que un cuy esté "En observación" quiere decir que se movió o comió distinto de lo normal en los últimos minutos. Todavía no es una alerta: el sistema lo sigue mirando. Ábrelo en su jaula para ver el historial.',
    alert:
      'Una alerta significa que el cambio duró varios minutos. Revisa al cuy en persona y, si ves que no come, respira con dificultad o está decaído, llévalo al veterinario. Luego márcala como revisada en "Alertas".',
    register:
      'Para registrar un cuy: entra a "Jaulas", abre la jaula y toca "Registrar cuy". Elige el color de su marca, sube una foto y guarda.',
    cages: (count: number) =>
      `Tienes ${count} jaula(s). Ábrelas en "Jaulas" para ver el estado de cada cuy, el sonido y el peso.`,
    fallback:
      'Soy Cuchi, una versión de prueba. Puedo explicarte los estados, las alertas y cómo registrar un cuy. ¿Qué quieres saber?',
  },
  en: {
    observed:
      '"Under watch" means a guinea pig moved or ate differently from usual in the last minutes. It is not an alert yet: the system keeps watching. Open it in its cage to see its history.',
    alert:
      'An alert means the change lasted several minutes. Check the guinea pig in person and, if it is not eating, breathing hard or looks weak, take it to a vet. Then mark it as reviewed in "Alerts".',
    register:
      'To register a guinea pig: go to "Cages", open the cage and tap "Register guinea pig". Pick its mark color, add a photo and save.',
    cages: (count: number) =>
      `You have ${count} cage(s). Open them in "Cages" to see each guinea pig, the sound and the weight.`,
    fallback:
      "I'm Cuchi, a test version. I can explain the states, the alerts and how to register a guinea pig. What would you like to know?",
  },
}

export class MockAssistantApi extends MockResource implements AssistantApi {
  ask(body: AssistantRequest): Promise<AssistantReply> {
    const last = body.messages.at(-1)
    if (!last || last.role !== 'USER' || body.messages.length > 12) {
      return this.fail(400, 'bad_request')
    }
    const answers = ANSWERS[body.language]
    const question = last.text.toLowerCase()
    let reply = answers.fallback
    if (/observ|watch/.test(question)) {
      reply = answers.observed
    } else if (/alert|críti|criti/.test(question)) {
      reply = answers.alert
    } else if (/registr|agreg|nuevo|add/.test(question)) {
      reply = answers.register
    } else if (/jaula|cage/.test(question)) {
      reply = answers.cages(this.db.cages.length)
    }
    return this.respond({ reply })
  }
}
