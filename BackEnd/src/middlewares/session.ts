import sess from 'express-session'

export const session = () => sess({
  secret: 'essok',
  cookie: { maxAge: 60000 },
  resave: false,
  saveUninitialized: false
})
