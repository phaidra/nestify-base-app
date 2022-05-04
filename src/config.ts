export default () => ({
  'env': {
    'port': parseInt(process.env.APP_PORT, 10) || 3000,
  },
  'assets': {
    'dir': process.env.ASSETS_DIR,
    'thumbs': process.env.ASSETS_THUMBS,
  },
  'schemas': {
    'dir': process.env.SCHEMAS_DIR,
  },
  'mongourl': `mongodb://${process.env.DATABASE_USER}${process.env.DATABASE_USER ? ':' : ''}${process.env.DATABASE_PASSWORD}${process.env.DATABASE_USER ? '@' : ''}${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}${process.env.DATABASE_AUTHSOURCE ? '?authSource=' : ""}${process.env.DATABASE_AUTHSOURCE}`,
  'cors': {
    'origin': JSON.parse(process.env.CORS_ORIGINS),
    'exposedHeaders': JSON.parse(process.env.CORS_HEADERS),
  },
  'auth': {
    'usercol': process.env.AUTH_USERCOL || '_user',
    'secret': process.env.AUTH_SECRET || 'secret',
  },
  'version': 1,
  'meta': {
    'title': 'Mongoose Nestify',
    'description': '',
    'copyright-software': 'MIT License',
    'copyright-data': 'CC BY 2.0',
    'authors-software': [
      '',
    ],
    'authors-data': [
      '',
    ],
  },
});
