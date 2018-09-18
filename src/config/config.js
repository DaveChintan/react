var config = {
  DB: {
    REDIS: {
      URL:
        process.env.PRODUCTION ? process.env.PRODUCTION_REDISURL : process.env.DEVELOPMENT_REDISURL
    },
    MONGO: {
      URL:
        process.env.PRODUCTION ? process.env.PRODUCTION_MONGOURL : process.env.DEVELOPMENT_MONGOURL
    }
  },
  PROVIDERS: {
    FACEBOOK: {
      CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
      CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
      REDIRECT_URL: process.env.FACEBOOK_REDIRECT_URI
    },
    GOOGLE: {
      CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      REDIRECT_URL: process.env.GOOGLE_REDIRECT_URI,
      USER_ID: process.env.GOOGLE_USERID,
      PASSWORD: process.env.GOOGLE_PASSWORD
    }
  },
  PORT: process.env.PORT || 8080,
  SMTP_NAME: process.env.SMTP_NAME,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  ENCRYPT_KEY: process.env.ENCRYPT_KEY,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PWD: process.env.SMTP_PWD,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_FROM: process.env.SMTP_FROM
};

// config.db.HOST = 'localhost';
// config.db.PORT = process.env.PORT || 8080;
// config.db.URL = 'mongodb+srv://chintan:DTTCltZjO9TkBFn5@herokucluster-4remq.mongodb.net/test?retryWrites=true'

module.exports = config;
