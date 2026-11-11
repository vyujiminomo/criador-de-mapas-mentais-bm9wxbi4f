migrate(
  (app) => {
    const collection = new Collection({
      name: 'drawings',
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
        { name: 'title', type: 'text', required: true },
        { name: 'favorite', type: 'bool' },
        { name: 'strokes', type: 'json', maxSize: 10485760 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_drawings_owner_updated ON drawings (owner, updated DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('drawings')
    app.delete(collection)
  },
)
