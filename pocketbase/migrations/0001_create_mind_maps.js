migrate(
  (app) => {
    const maps = new Collection({
      name: 'mind_maps',
      type: 'base',
      listRule: "@request.auth.id != '' && owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && owner = @request.auth.id",
      createRule: "@request.auth.id != '' && owner = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && owner = @request.auth.id && (@request.body.owner = '' || @request.body.owner = @request.auth.id)",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true, min: 1, max: 120 },
        { name: 'primary_color', type: 'text', required: true, min: 4, max: 20 },
        { name: 'favorite', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mind_maps_owner_updated ON mind_maps (owner, updated DESC)',
        'CREATE INDEX idx_mind_maps_owner_favorite ON mind_maps (owner, favorite)',
      ],
    })
    app.save(maps)

    const nodes = new Collection({
      name: 'mind_nodes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && owner = @request.auth.id && map.owner = @request.auth.id",
      viewRule:
        "@request.auth.id != '' && owner = @request.auth.id && map.owner = @request.auth.id",
      createRule:
        "@request.auth.id != '' && owner = @request.auth.id && map.owner = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && owner = @request.auth.id && map.owner = @request.auth.id && (@request.body.owner = '' || @request.body.owner = @request.auth.id)",
      deleteRule:
        "@request.auth.id != '' && owner = @request.auth.id && map.owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'map',
          type: 'relation',
          required: true,
          collectionId: maps.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'parent', type: 'text', max: 32 },
        { name: 'text', type: 'text', required: true, min: 1, max: 280 },
        { name: 'x', type: 'number' },
        { name: 'y', type: 'number' },
        { name: 'color', type: 'text', required: true, min: 4, max: 20 },
        {
          name: 'shape',
          type: 'select',
          required: true,
          values: ['rounded', 'pill', 'rectangle'],
          maxSelect: 1,
        },
        { name: 'sort_order', type: 'number', onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mind_nodes_map_sort ON mind_nodes (map, sort_order)',
        'CREATE INDEX idx_mind_nodes_owner ON mind_nodes (owner)',
      ],
    })
    app.save(nodes)
  },
  (app) => {
    const nodes = app.findCollectionByNameOrId('mind_nodes')
    app.delete(nodes)
    const maps = app.findCollectionByNameOrId('mind_maps')
    app.delete(maps)
  },
)
