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
    origin: ['https://10.4.24.253:8080','https://vchc.univie.ac.at', 'https://192.168.0.45:8080'],
    credentials: true,
    exposedHeaders: ['X-Total-Count'],
  },
  'auth': {
    'usercol': process.env.AUTH_USERCOL || '_user',
    'secret': process.env.AUTH_SECRET || 'secret',
  },
  'schemas': {
    'dir': './jsonschemas',
  },
  'ftsearch': {
     'entry': [
       { path: 'name'},
       { path: 'transscription'},
       { path: 'creator.id', target: 'actor' },
       { path: 'material', target: 'descriptor' },
       { path: 'technique', target: 'descriptor' },
       { path: 'classification.descriptor', target: 'descriptor' },
     ],
    'collect': [
      { path: 'name'},
      { path: 'creator.id', target: 'actor' },
      { path: 'place', target: 'descriptor' },
      { path: 'time', target: 'descriptor' },
      { path: 'classification.descriptor', target: 'descriptor' },
      { path: 'description', target: 'descriptor'}
    ]
  },
  'import': {
    'dir': './import',
    'importcol': 'import',
  },
  'assets': {
    'dir': '\\\\w07ds2\\ACDH_Adlib_Kgunivie_Images$\\uploads\\files',
    'thumbs': '\\\\w07ds2\\ACDH_Adlib_Kgunivie_Images$\\uploads\\thumbs',
    'IIIFDropZone': '',
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
