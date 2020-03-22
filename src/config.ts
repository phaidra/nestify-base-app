export default () => ({
  'env': {
    'port': parseInt(process.env.APP_PORT, 10) || 3000,
  },
  'db': {
    'host':process.env.DATABASE_HOST,
    'db':process.env.DATABASE_NAME,
    'user':process.env.DATABASE_USER,
    'pwd':process.env.DATABASE_PASSWORD,
    'auth':process.env.DATABASE_AUTHSOURCE
  },
  'mongourl': `mongodb://${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`,
/*    () => {
    console.log(process.env.DATABASE_USER, `mongodb://${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`);
    if(process.env.DATABASE_USER == 'none') return `mongodb://${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;
    else return `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}?authSource=${process.env.DATABASE_AUTHSOURCE}`;
  },*/
  'cors': {
    'credentials': true,
    'origin': process.env.APP_CORSORIGINS || '*',
  },
  'auth': {
    'usercol': process.env.AUTH_USERCOL || '_user',
    'secret': process.env.AUTH_SECRET || 'secret',
  },
  'schemas': {
    'dir': './jsonschemas',
  },
  'import': {
    'dir': './import',
    'importcol': 'import',
  },
  'assets': {
    'dir': './asset/uploads/files',
    'thumbs': './asset/uploads/thumbs',
    'IIIFDropZone': '',
  },
  'version': '1',
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