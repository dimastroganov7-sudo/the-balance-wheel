import { getStore } from '@netlify/blobs'

const STORE_NAME = 'balance-wheel-state'
const DEFAULT_USER_ID = '69d7a4ce59d4646ae0dae714'

const sectors = [
  { id: 'career_business', title: '🧑‍💼 Карьера / Бизнес' },
  { id: 'finance', title: '💰 Финансы' },
  { id: 'health_fitness', title: '🩺 Здоровье и Фитнес' },
  { id: 'family_friends', title: '👨‍👩‍👧‍👦 Семья и Друзья' },
  { id: 'romantic_relations', title: '❤️ Романтические отношения' },
  { id: 'physical_environment', title: '🏠 Физическое окружение' },
  { id: 'rest_entertainment', title: '🎉 Отдых и Развлечения' },
  { id: 'personal_growth', title: '📚 Личностный рост' },
]

function createDefaultSectorMatrix() {
  return {
    results: [],
    strategies: [],
    tactics: [],
    processProjects: [],
    owners: [],
    links: [],
  }
}

function createDefaultState() {
  const sectorState: Record<string, any> = {}
  for (const sector of sectors) {
    sectorState[sector.id] = {
      title: sector.title,
      score: 5,
      matrix: createDefaultSectorMatrix(),
    }
  }

  return {
    version: 1,
    sectors: sectorState,
    influenceLevels: {
      1: '○',
      2: '◔',
      3: '◑',
      4: '◕',
      5: '●',
    },
    personality: {
      anthropometry: {
        heightCm: null,
        weightKg: null,
        chestCm: null,
        waistCm: null,
        hipsCm: null,
        neckCm: null,
        headCm: null,
        armLengthCm: null,
        legLengthCm: null,
        shoulderWidthCm: null,
        bmi: null,
      },
      test: {
        responses: {},
        latestScore: null,
      },
      analysisResults: [],
    },
    processes: {
      categories: ['Регулярно-циклические', 'Нестандартные (адаптивные / редкие)'],
      hierarchyTemplates: [
        {
          id: 'employment',
          name: 'Процесс работа в найме (основная)',
          level: 1,
          dailyMinutes: 480,
          regularity: 'будни',
          category: 'Регулярно-циклические',
        },
        {
          id: 'sleep',
          name: 'Процесс сон',
          level: 1,
          dailyMinutes: 480,
          regularity: 'ежедневно',
          category: 'Регулярно-циклические',
        },
        {
          id: 'sport',
          name: 'Процесс спорт',
          level: 1,
          dailyMinutes: 60,
          regularity: '3 раза в неделю',
          category: 'Регулярно-циклические',
        },
      ],
      items: [],
    },
    tasks: [],
    readWithoutChecklist: [],
    updatedAt: new Date().toISOString(),
  }
}

function getUserId(req: Request) {
  const queryUserId = new URL(req.url).searchParams.get('userId')
  return queryUserId?.trim() || DEFAULT_USER_ID
}

export default async (req: Request) => {
  try {
    const store = getStore(STORE_NAME)
    const key = `user/${getUserId(req)}/state`

    if (req.method === 'GET') {
      const saved = await store.get(key, { type: 'json' })
      if (saved) {
        return Response.json({ ok: true, state: saved }, { headers: { 'cache-control': 'no-store' } })
      }

      const fallback = createDefaultState()
      await store.setJSON(key, fallback)
      return Response.json({ ok: true, state: fallback }, { headers: { 'cache-control': 'no-store' } })
    }

    if (req.method === 'PUT') {
      const body = await req.json().catch(() => null)
      if (!body || typeof body !== 'object') {
        return Response.json(
          { ok: false, error: 'State must be a JSON object.' },
          { status: 400, headers: { 'cache-control': 'no-store' } },
        )
      }

      const nextState = {
        ...createDefaultState(),
        ...body,
        updatedAt: new Date().toISOString(),
      }

      await store.setJSON(key, nextState)
      return Response.json({ ok: true, state: nextState }, { headers: { 'cache-control': 'no-store' } })
    }

    return Response.json(
      { ok: false, error: 'Method not allowed.' },
      { status: 405, headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: 'Failed to handle state request.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: { 'cache-control': 'no-store' } },
    )
  }
}
