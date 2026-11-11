migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let user

    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'vyujiminomo@gmail.com')
    } catch (_) {
      user = new Record(users)
      user.setEmail('vyujiminomo@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Visitante')
      app.save(user)
    }

    const userId = user.getString('id')
    const existing = app.findRecordsByFilter(
      'mind_maps',
      "owner = '" + userId + "' && title = 'Plano de estudos'",
      '',
      1,
      0,
    )
    if (existing.length > 0) return

    const maps = app.findCollectionByNameOrId('mind_maps')
    const map = new Record(maps)
    map.set('owner', userId)
    map.set('title', 'Plano de estudos')
    map.set('primary_color', '#5B5BD6')
    map.set('favorite', true)
    app.save(map)

    const nodes = app.findCollectionByNameOrId('mind_nodes')
    const mapId = map.getString('id')
    const created = {}
    const items = [
      {
        key: 'root',
        parent: '',
        text: 'Plano de estudos',
        x: 1100,
        y: 700,
        color: '#5B5BD6',
        shape: 'rounded',
      },
      {
        key: 'goals',
        parent: 'root',
        text: 'Objetivos',
        x: 720,
        y: 430,
        color: '#0EA5E9',
        shape: 'pill',
      },
      {
        key: 'routine',
        parent: 'root',
        text: 'Rotina semanal',
        x: 1480,
        y: 430,
        color: '#F05A8A',
        shape: 'rounded',
      },
      {
        key: 'materials',
        parent: 'root',
        text: 'Materiais',
        x: 720,
        y: 930,
        color: '#14B8A6',
        shape: 'rectangle',
      },
      {
        key: 'review',
        parent: 'root',
        text: 'Revisão',
        x: 1480,
        y: 930,
        color: '#F59E0B',
        shape: 'pill',
      },
      {
        key: 'goal1',
        parent: 'goals',
        text: 'Concluir o projeto',
        x: 390,
        y: 330,
        color: '#0EA5E9',
        shape: 'rounded',
      },
      {
        key: 'goal2',
        parent: 'goals',
        text: 'Ler 12 livros',
        x: 390,
        y: 510,
        color: '#0EA5E9',
        shape: 'rounded',
      },
      {
        key: 'routine1',
        parent: 'routine',
        text: 'Foco pela manhã',
        x: 1810,
        y: 350,
        color: '#F05A8A',
        shape: 'rounded',
      },
      {
        key: 'routine2',
        parent: 'routine',
        text: 'Revisar à noite',
        x: 1810,
        y: 520,
        color: '#F05A8A',
        shape: 'rounded',
      },
    ]

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const node = new Record(nodes)
      node.set('owner', userId)
      node.set('map', mapId)
      node.set('parent', item.parent ? created[item.parent] : '')
      node.set('text', item.text)
      node.set('x', item.x)
      node.set('y', item.y)
      node.set('color', item.color)
      node.set('shape', item.shape)
      node.set('sort_order', i)
      app.save(node)
      created[item.key] = node.getString('id')
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'vyujiminomo@gmail.com')
      const maps = app.findRecordsByFilter(
        'mind_maps',
        "owner = '" + user.getString('id') + "' && title = 'Plano de estudos'",
        '',
        50,
        0,
      )
      for (let i = 0; i < maps.length; i++) app.delete(maps[i])
    } catch (_) {}
  },
)
